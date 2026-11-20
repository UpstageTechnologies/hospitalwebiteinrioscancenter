import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, getFirebaseAuth, getFirebaseDb } from './firebase';
import { firestoreService } from './firestoreService';
import type { UserProfileDoc, HospitalDocument } from '../types/auth';
import type { RoleId } from '../types/roles';
import type { Employee } from '../types/employee';
import type { Hospital } from '../types/hospital';
import { DEFAULT_HOSPITALS, DEFAULT_EMPLOYEES } from './storageService';

export const STANDARD_STAFF_ACCOUNTS: Record<string, { email: string; name: string; role: RoleId; empId: string; dept: string; designation: string }> = {
  owner: {
    email: 'owner@upstagehospital.org',
    name: 'Dr. Rajeshwar Sharma',
    role: 'owner',
    empId: 'emp-owner-01',
    dept: 'General Medicine',
    designation: 'Chief Medical Director & Hospital CEO'
  },
  admin: {
    email: 'admin@upstagehospital.org',
    name: 'Pooja Deshmukh',
    role: 'admin',
    empId: 'emp-admin-01',
    dept: 'Hospital Administration',
    designation: 'Chief Operating Officer / Hospital Admin'
  },
  hr_manager: {
    email: 'hr@upstagehospital.org',
    name: 'Kavita Nambiar',
    role: 'hr_manager',
    empId: 'emp-hr-01',
    dept: 'Hospital Administration',
    designation: 'Head of Human Resources'
  },
  doctor: {
    email: 'doctor@upstagehospital.org',
    name: 'Dr. Siddharth Sen',
    role: 'doctor',
    empId: 'emp-doc-01',
    dept: 'General Medicine',
    designation: 'Senior Consultant Physician'
  },
  receptionist: {
    email: 'reception@upstagehospital.org',
    name: 'Kumar Varma',
    role: 'receptionist',
    empId: 'emp-rec-01',
    dept: 'Hospital Administration',
    designation: 'Front Office Executive'
  },
  billing_staff: {
    email: 'billing@upstagehospital.org',
    name: 'Rohan Mehra',
    role: 'billing_staff',
    empId: 'emp-bill-01',
    dept: 'Hospital Administration',
    designation: 'Senior Billing Officer'
  },
  nurse: {
    email: 'nurse@upstagehospital.org',
    name: 'Sister Mary Fernandez',
    role: 'nurse',
    empId: 'emp-nurse-01',
    dept: 'General Medicine',
    designation: 'Nursing Supervisor'
  },
  pharmacist: {
    email: 'pharmacist@upstagehospital.org',
    name: 'Suresh Singhania',
    role: 'pharmacist',
    empId: 'emp-pharm-01',
    dept: 'Pharmacy Services',
    designation: 'Chief Pharmacist'
  },
  lab_technician: {
    email: 'lab@upstagehospital.org',
    name: 'Anjali Nair',
    role: 'lab_technician',
    empId: 'emp-lab-01',
    dept: 'Laboratory & Pathology',
    designation: 'Senior Medical Lab Technologist'
  }
};

export class AuthService {
  // 1. Sign In With Email & Password
  public async signIn(email: string, pass: string): Promise<{ user: FirebaseUser; profile: UserProfileDoc }> {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), pass);
    const profile = await this.getOrCreateUserProfile(cred.user);
    return { user: cred.user, profile };
  }

  // 2. Register New Hospital Owner & Initialize Hospital Architecture
  public async registerHospitalOwner(params: {
    hospitalName: string;
    ownerName: string;
    email: string;
    pass: string;
    phone: string;
    city: string;
  }): Promise<{ user: FirebaseUser; hospital: HospitalDocument; profile: UserProfileDoc }> {
    // A. Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), params.email.trim(), params.pass);
    const uid = cred.user.uid;

    // B. Generate unique hospital ID
    const hospitalId = `hosp-${Date.now().toString(36)}`;
    const hospitalCode = `UPH-${String(Math.floor(Math.random() * 90 + 10))}`;

    // C. Write to hospitals/{hospitalId}
    const hospitalDoc: HospitalDocument = {
      hospitalId,
      hospitalName: params.hospitalName.trim(),
      ownerUid: uid,
      code: hospitalCode,
      city: params.city.trim() || 'New Delhi',
      phone: params.phone.trim(),
      email: params.email.trim(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    await setDoc(doc(getFirebaseDb(), 'hospitals', hospitalId), {
      ...hospitalDoc,
      createdAtServer: serverTimestamp()
    });

    // D. Write to users/{uid}
    const profileDoc: UserProfileDoc = {
      uid,
      name: params.ownerName.trim(),
      email: params.email.trim(),
      hospitalId,
      role: 'owner',
      status: 'active',
      employeeId: 'emp-owner-01',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(getFirebaseDb(), 'users', uid), {
      ...profileDoc,
      createdAtServer: serverTimestamp()
    });

    // E. Initialize hospital subcollections in Firestore
    await firestoreService.initializeHospitalInFirestore(hospitalId, params.hospitalName, uid);

    return { user: cred.user, hospital: hospitalDoc, profile: profileDoc };
  }

  // 3. Quick Real Firebase Auth Sign In for Testing / Staff Login
  public async signInQuickStaff(roleKey: string): Promise<{ user: FirebaseUser; profile: UserProfileDoc }> {
    const config = STANDARD_STAFF_ACCOUNTS[roleKey] || STANDARD_STAFF_ACCOUNTS.owner;
    const defaultPassword = 'HospitalPassword@2026';
    const hospitalId = 'hosp-001';

    try {
      // Try regular sign in
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), config.email, defaultPassword);
      const profile = await this.getOrCreateUserProfile(cred.user, config, hospitalId);
      return { user: cred.user, profile };
    } catch (err: any) {
      // If user doesn't exist yet in Firebase Auth, automatically create it!
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-email'
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), config.email, defaultPassword);
          const profile = await this.getOrCreateUserProfile(cred.user, config, hospitalId);
          return { user: cred.user, profile };
        } catch (createErr: any) {
          // If already exists or error, try sign in again or throw
          if (createErr.code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(getFirebaseAuth(), config.email, defaultPassword);
            const profile = await this.getOrCreateUserProfile(cred.user, config, hospitalId);
            return { user: cred.user, profile };
          }
          throw createErr;
        }
      }
      throw err;
    }
  }

  // 4. Get or Create User Profile in users/{uid}
  public async getOrCreateUserProfile(
    firebaseUser: FirebaseUser,
    fallbackStaff?: typeof STANDARD_STAFF_ACCOUNTS[string],
    fallbackHospitalId: string = 'hosp-001'
  ): Promise<UserProfileDoc> {
    const userRef = doc(getFirebaseDb(), 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      return snap.data() as UserProfileDoc;
    }

    // Determine matching staff from default pool or fallback
    const email = firebaseUser.email || '';
    const staffMatch = Object.values(STANDARD_STAFF_ACCOUNTS).find(s => s.email.toLowerCase() === email.toLowerCase()) || fallbackStaff;

    const newProfile: UserProfileDoc = {
      uid: firebaseUser.uid,
      name: staffMatch?.name || firebaseUser.displayName || 'Hospital Staff',
      email: firebaseUser.email || '',
      hospitalId: fallbackHospitalId,
      role: staffMatch?.role || 'doctor',
      status: 'active',
      employeeId: staffMatch?.empId || 'emp-doc-01',
      createdAt: new Date().toISOString()
    };

    await setDoc(userRef, {
      ...newProfile,
      createdAtServer: serverTimestamp()
    }, { merge: true });

    return newProfile;
  }

  // 5. Get Hospital Meta Document
  public async getHospital(hospitalId: string): Promise<Hospital> {
    try {
      const snap = await getDoc(doc(getFirebaseDb(), 'hospitals', hospitalId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: hospitalId,
          name: data.hospitalName || data.name || 'Upstage Multi-Speciality Hospital',
          code: data.code || 'UPH-01',
          city: data.city || 'New Delhi',
          phone: data.phone || '+91 11 4050 9900',
          email: data.email || 'admin@upstagehospital.org',
          tagline: data.tagline || 'Excellence in Tertiary Patient Care',
          address: data.address || 'Medical Enclave, New Delhi',
          ownerId: data.ownerUid || 'emp-owner-01',
          ownerName: data.ownerName || 'Dr. Rajeshwar Sharma',
          createdAt: data.createdAt || new Date().toISOString(),
          activeModules: data.activeModules || ['opd', 'ipd', 'pharmacy', 'laboratory', 'radiology', 'billing'],
          settings: data.settings || {
            currency: '₹',
            taxRate: 5.0,
            opdConsultationValidityDays: 7,
            emergencyContact: '+91 11 4050 9999',
            operatingHours: '24/7 Tertiary Care'
          }
        };
      }
    } catch (e) {
      console.warn('Could not fetch hospital from Firestore:', e);
    }
    return DEFAULT_HOSPITALS[0];
  }

  // 6. Sign Out
  public async signOut(): Promise<void> {
    await signOut(getFirebaseAuth());
  }
}

export const authService = new AuthService();
