import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import type { Firestore, Unsubscribe } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

// ============================================================================
// KADAI POS FIREBASE CONFIGURATION (scaner-billing)
// ============================================================================
export const KADAI_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCWpL_KZPGeYUZ5pLiDzx-X6Vi0Q5J8xRI",
  authDomain: "scaner-billing.firebaseapp.com",
  projectId: "scaner-billing",
  storageBucket: "scaner-billing.firebasestorage.app",
  messagingSenderId: "207862672282",
  appId: "1:207862672282:web:1d5d5529b31148ac1ae823",
};

// Secondary Firebase app instance for Kadai POS
let kadaiApp: FirebaseApp | null = null;
let kadaiDb: Firestore | null = null;

export function getKadaiPosDb(): Firestore {
  if (kadaiDb) return kadaiDb;
  try {
    const existingApps = getApps();
    const existing = existingApps.find((a) => a.name === "kadai-pos-app");
    if (existing) {
      kadaiApp = existing;
    } else {
      kadaiApp = initializeApp(KADAI_FIREBASE_CONFIG, "kadai-pos-app");
    }
    kadaiDb = getFirestore(kadaiApp);
    return kadaiDb;
  } catch (err) {
    console.warn("Initializing secondary Kadai POS Firebase app failed, fallback to hospital DB:", err);
    return getFirebaseDb();
  }
}

// ============================================================================
// DATA TYPES FOR KADAI POS INTEGRATION
// ============================================================================
export interface PosConnection {
  hospitalId: string;
  posUserId: string;
  shopName: string;
  shopType: 'Medical' | 'Pharmacy';
  ownerUid: string;
  connectedAt: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncedAt?: string;
  syncedCounts?: {
    medicines: number;
    labTests: number;
    rooms: number;
  };
}

export interface PosMedicine {
  id: string;
  name: string;
  genericName?: string;
  category: string; // Tablet, Syrup, Injection, Capsule, etc.
  sellingPrice: number;
  mrp?: number;
  currentStock: number;
  unit: string;
  dosage?: string;
  minStockAlert?: number;
  expiryDate?: string;
  batchNumber?: string;
  ownerUid?: string;
}

export interface PosLabTest {
  id: string;
  testName: string;
  category: string; // Blood Tests, Biochemistry, Urine Tests, etc.
  price: number;
  sampleType?: string;
  estimatedHours?: number;
  referenceRange?: string;
  unit?: string;
  isActive: boolean;
  ownerUid?: string;
}

export interface PosRoom {
  id: string;
  roomName: string;
  category: string; // General Ward, Semi-Private, Deluxe, ICU, etc.
  roomType: string;
  isAc: boolean;
  dailyCharge: number;
  totalBeds: number;
  availableBeds: number;
  floor?: string;
  speciality?: string;
  isActive: boolean;
  ownerUid?: string;
}

// In-Memory cache for connected POS inventory (starts empty for production)
let cachedMedicines: PosMedicine[] = [];
let cachedLabTests: PosLabTest[] = [];
let cachedRooms: PosRoom[] = [];

// ============================================================================
// VERIFY AND CONNECT KADAI POS USER
// ============================================================================
export async function verifyAndConnectKadaiPosUser(
  hospitalId: string,
  posUserId: string
): Promise<{ success: boolean; connection?: PosConnection; error?: string }> {
  try {
    const trimmedId = (posUserId || "").trim();
    if (!trimmedId) {
      return { success: false, error: "Please enter a valid Kadai POS User ID." };
    }

    const posDb = getKadaiPosDb();
    let ownerUid = "";
    let shopName = "Kadai Medicals & Multi-Speciality Pharmacy";
    let shopType: 'Medical' | 'Pharmacy' = "Medical";

    // 1. Check if user exists in Kadai POS Firestore (users collection)
    try {
      const usersRef = collection(posDb, "users");
      // Search by username
      const qUser = query(usersRef, where("username", "==", trimmedId));
      const snapUser = await getDocs(qUser);

      if (!snapUser.empty) {
        const userDoc = snapUser.docs[0];
        const data = userDoc.data();
        ownerUid = userDoc.id;
        shopName = data.shopName || data.businessName || data.name || "Kadai Medicals";
        shopType = (data.shopType || "Medical") as 'Medical' | 'Pharmacy';
      } else {
        // Search by userId field
        const qUserId = query(usersRef, where("userId", "==", trimmedId));
        const snapUserId = await getDocs(qUserId);
        if (!snapUserId.empty) {
          const userDoc = snapUserId.docs[0];
          const data = userDoc.data();
          ownerUid = userDoc.id;
          shopName = data.shopName || data.businessName || data.name || "Kadai Medicals";
          shopType = (data.shopType || "Medical") as 'Medical' | 'Pharmacy';
        } else {
          // Direct document ID match
          const directDoc = await getDoc(doc(posDb, "users", trimmedId));
          if (directDoc.exists()) {
            const data = directDoc.data();
            ownerUid = directDoc.id;
            shopName = data.shopName || data.businessName || data.name || "Kadai Medicals";
            shopType = (data.shopType || "Medical") as 'Medical' | 'Pharmacy';
          }
        }
      }
    } catch (e) {
      console.warn("Could not query live Kadai POS users collection:", e);
    }

    // Strictly enforce real POS account verification
    if (!ownerUid) {
      return {
        success: false,
        error: `Kadai POS account "${trimmedId}" could not be verified in Kadai POS Cloud. Please verify your shop account in Kadai WebApp.`
      };
    }

    // Query real initial catalog counts
    let medCount = 0;
    let labCount = 0;
    let roomCount = 0;
    try {
      const medSnap = await getDocs(collection(posDb, "users", ownerUid, "inventory"));
      medCount = medSnap.size;
      const labSnap = await getDocs(collection(posDb, "users", ownerUid, "lab_tests"));
      labCount = labSnap.size;
      const roomSnap = await getDocs(collection(posDb, "users", ownerUid, "pharmacy_rooms"));
      roomCount = roomSnap.size;
    } catch (e) {
      console.warn("Could not query initial item counts:", e);
    }

    // Build real connection object
    const connection: PosConnection = {
      hospitalId,
      posUserId: trimmedId,
      shopName,
      shopType,
      ownerUid,
      connectedAt: new Date().toISOString(),
      status: "connected",
      lastSyncedAt: new Date().toISOString(),
      syncedCounts: {
        medicines: medCount,
        labTests: labCount,
        rooms: roomCount,
      },
    };

    // Save connection under hospital settings in Hospital Cloud DB
    try {
      const connRef = doc(getFirebaseDb(), "hospitals", hospitalId, "settings", "kadaiPosConnection");
      await setDoc(connRef, {
        ...connection,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Could not save to Cloud Firestore hospital settings:", e);
    }

    // Persist in localStorage
    localStorage.setItem(`pos_conn_${hospitalId}`, JSON.stringify(connection));

    return { success: true, connection };
  } catch (err: any) {
    console.error("Error verifying Kadai POS user:", err);
    return { success: false, error: err.message || "Failed to connect Kadai POS account." };
  }
}

// ============================================================================
// DISCONNECT KADAI POS
// ============================================================================
export async function disconnectKadaiPos(hospitalId: string): Promise<boolean> {
  try {
    cachedMedicines = [];
    cachedLabTests = [];
    cachedRooms = [];

    try {
      const connRef = doc(getFirebaseDb(), "hospitals", hospitalId, "settings", "kadaiPosConnection");
      await setDoc(connRef, {
        status: "disconnected",
        disconnectedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Could not update remote settings disconnect status:", e);
    }

    localStorage.removeItem(`pos_conn_${hospitalId}`);
    return true;
  } catch (e) {
    console.error("Error disconnecting POS:", e);
    return false;
  }
}

// ============================================================================
// GET STORED POS CONNECTION
// ============================================================================
export async function getStoredPosConnection(hospitalId: string): Promise<PosConnection | null> {
  try {
    const connRef = doc(getFirebaseDb(), "hospitals", hospitalId, "settings", "kadaiPosConnection");
    const snap = await getDoc(connRef);
    if (snap.exists()) {
      const data = snap.data() as PosConnection;
      if (data.status === "connected") {
        localStorage.setItem(`pos_conn_${hospitalId}`, JSON.stringify(data));
        return data;
      }
      return null;
    }

    const raw = localStorage.getItem(`pos_conn_${hospitalId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.status === "connected") return parsed;
    }
  } catch (e) {
    console.warn("Error reading stored POS connection:", e);
  }

  // Return null when disconnected - no fake fallback account
  return null;
}

// ============================================================================
// REAL-TIME CATALOG LISTENERS
// ============================================================================
export function subscribeToPosMedicines(
  ownerUid: string,
  onData: (medicines: PosMedicine[]) => void
): Unsubscribe {
  if (!ownerUid) {
    cachedMedicines = [];
    onData([]);
    return () => {};
  }

  const posDb = getKadaiPosDb();

  try {
    const invCol = collection(posDb, "users", ownerUid, "inventory");
    return onSnapshot(
      invCol,
      (snapshot) => {
        const list: PosMedicine[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name || d.productName || "Unknown Medicine",
            genericName: d.genericName || "",
            category: d.category || "General",
            sellingPrice: parseFloat(d.sellingPrice || d.price || "0"),
            mrp: parseFloat(d.mrp || d.sellingPrice || "0"),
            currentStock: parseInt(d.quantity || d.stock || "0", 10),
            unit: d.unit || "unit",
            dosage: d.dosage || "",
            minStockAlert: parseInt(d.minStockAlert || "10", 10),
            batchNumber: d.batchNumber || "",
            expiryDate: d.expiryDate || "",
            ownerUid,
          };
        });
        cachedMedicines = list;
        onData(list);
      },
      (err) => {
        console.warn("POS medicines snapshot error:", err.message);
        cachedMedicines = [];
        onData([]);
      }
    );
  } catch (e) {
    console.warn("Exception in subscribeToPosMedicines:", e);
    cachedMedicines = [];
    onData([]);
    return () => {};
  }
}

export function subscribeToPosLabTests(
  ownerUid: string,
  onData: (tests: PosLabTest[]) => void
): Unsubscribe {
  if (!ownerUid) {
    cachedLabTests = [];
    onData([]);
    return () => {};
  }

  const posDb = getKadaiPosDb();

  try {
    const labCol = collection(posDb, "users", ownerUid, "lab_tests");
    return onSnapshot(
      labCol,
      (snapshot) => {
        const list: PosLabTest[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            testName: d.testName || d.name || "Lab Test",
            category: d.category || "General",
            price: parseFloat(d.price || d.testPrice || "0"),
            sampleType: d.sampleType || "Blood",
            estimatedHours: parseInt(d.estimatedHours || "4", 10),
            referenceRange: d.referenceRange || "",
            unit: d.unit || "Report",
            isActive: d.isActive !== false,
            ownerUid,
          };
        });
        cachedLabTests = list;
        onData(list);
      },
      (err) => {
        console.warn("POS lab tests snapshot error:", err.message);
        cachedLabTests = [];
        onData([]);
      }
    );
  } catch (e) {
    console.warn("Exception in subscribeToPosLabTests:", e);
    cachedLabTests = [];
    onData([]);
    return () => {};
  }
}

export function subscribeToPosRooms(
  ownerUid: string,
  onData: (rooms: PosRoom[]) => void
): Unsubscribe {
  if (!ownerUid) {
    cachedRooms = [];
    onData([]);
    return () => {};
  }

  const posDb = getKadaiPosDb();

  try {
    const roomCol = collection(posDb, "users", ownerUid, "pharmacy_rooms");
    return onSnapshot(
      roomCol,
      (snapshot) => {
        const list: PosRoom[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            roomName: d.roomName || d.name || "Room",
            category: d.category || "General Ward",
            roomType: d.roomType || "Standard",
            isAc: d.isAc === true || d.ac === true,
            dailyCharge: parseFloat(d.dailyCharge || d.charge || "0"),
            totalBeds: parseInt(d.totalBeds || "1", 10),
            availableBeds: parseInt(d.availableBeds || d.totalBeds || "1", 10),
            floor: d.floor || "",
            speciality: d.speciality || "General",
            isActive: d.isActive !== false,
            ownerUid,
          };
        });
        cachedRooms = list;
        onData(list);
      },
      (err) => {
        console.warn("POS rooms snapshot error:", err.message);
        cachedRooms = [];
        onData([]);
      }
    );
  } catch (e) {
    console.warn("Exception in subscribeToPosRooms:", e);
    cachedRooms = [];
    onData([]);
    return () => {};
  }
}

// ============================================================================
// ATOMIC STOCK DEDUCTION TRANSACTION ON DISPENSE
// Strictly enforces currentStock >= reqQty and prevents negative inventory
// ============================================================================
export async function dispenseMedicineAtomic(
  ownerUid: string,
  medicineId: string,
  quantityToDeduct: number,
  dispenseAudit: {
    hospitalId: string;
    patientId: string;
    patientName: string;
    patientUhid: string;
    pharmacistName: string;
  }
): Promise<{ success: boolean; newStock: number; error?: string }> {
  const posDb = getKadaiPosDb();

  try {
    const medDocRef = doc(posDb, "users", ownerUid, "inventory", medicineId);

    const result = await runTransaction(posDb, async (transaction) => {
      const medDoc = await transaction.get(medDocRef);

      if (!medDoc.exists()) {
        throw new Error(`Medicine ${medicineId} not found in connected Kadai POS inventory.`);
      }

      const data = medDoc.data();
      const currentStock = parseInt(data.quantity || data.currentStock || data.stock || "0", 10);

      if (currentStock < quantityToDeduct) {
        throw new Error(`Insufficient stock for ${data.name || medicineId}. Available: ${currentStock}, Requested: ${quantityToDeduct}`);
      }

      const updatedStock = currentStock - quantityToDeduct;
      transaction.update(medDocRef, {
        quantity: updatedStock,
        currentStock: updatedStock,
        stock: updatedStock,
        lastDeductedAt: serverTimestamp(),
      });

      return { newStock: updatedStock };
    });

    // Update in-memory cache
    const match = cachedMedicines.find((m) => m.id === medicineId);
    if (match) {
      match.currentStock = result.newStock;
    }

    return { success: true, newStock: result.newStock };
  } catch (err: any) {
    console.error("Atomic dispense failed in Kadai POS Firestore:", err);
    return {
      success: false,
      newStock: 0,
      error: err.message || "Failed to deduct stock atomically from Kadai POS.",
    };
  }
}
