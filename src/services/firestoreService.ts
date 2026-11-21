import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db, getFirebaseDb } from './firebase';
import type { Employee } from '../types/employee';
import type { RoleRequest } from '../types/roleRequest';
import type { Patient, VitalSign } from '../types/patient';
import type { Appointment, ConsultationRecord, LabOrder, RadiologyOrder } from '../types/clinical';
import type { Ward, Bed, Admission } from '../types/admission';
import type { Medicine } from '../types/pharmacy';
import type { Invoice, HospitalExpense } from '../types/billing';
import type { AttendanceRecord, PayrollRecord } from '../types/hr';
import type { HospitalNotification, AuditLog } from '../types/audit';
import type { Department } from '../types/hospital';
import type { RoleId } from '../types/roles';
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_EMPLOYEES,
  DEFAULT_PATIENTS,
  DEFAULT_VITALS,
  DEFAULT_APPOINTMENTS,
  DEFAULT_WARDS,
  DEFAULT_BEDS,
  DEFAULT_MEDICINES,
  DEFAULT_LAB_ORDERS,
  DEFAULT_RADIOLOGY_ORDERS,
  DEFAULT_EXPENSES,
  DEFAULT_INVOICES,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_AUDIT_LOGS,
  DEFAULT_ATTENDANCE,
  DEFAULT_PAYROLL,
  DEFAULT_ROLE_REQUESTS
} from './storageService';

export class FirestoreHospitalService {
  // Generic collection reference helper
  private getColRef(hospitalId: string, colName: string) {
    return collection(getFirebaseDb(), 'hospitals', hospitalId, colName);
  }

  private getDocRef(hospitalId: string, colName: string, docId: string) {
    return doc(getFirebaseDb(), 'hospitals', hospitalId, colName, docId);
  }

  // Subscribe to real-time changes in any hospital subcollection
  public subscribeToCollection<T>(
    hospitalId: string,
    collectionName: string,
    onData: (data: T[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const colRef = this.getColRef(hospitalId, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id
        })) as T[];
        onData(items);
      },
      (err) => {
        console.warn(`Firestore onSnapshot warning for ${collectionName}:`, err);
        if (onError) onError(err);
      }
    );
  }

  // Generic document writer
  public async setDocument<T extends Record<string, any>>(
    hospitalId: string,
    collectionName: string,
    docId: string,
    data: T
  ): Promise<void> {
    const docRef = this.getDocRef(hospitalId, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      id: docId,
      hospitalId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // Generic document updater
  public async updateDocument(
    hospitalId: string,
    collectionName: string,
    docId: string,
    updates: Record<string, any>
  ): Promise<void> {
    const docRef = this.getDocRef(hospitalId, collectionName, docId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Generic document deleter
  public async deleteDocument(
    hospitalId: string,
    collectionName: string,
    docId: string
  ): Promise<void> {
    const docRef = this.getDocRef(hospitalId, collectionName, docId);
    await deleteDoc(docRef);
  }

  // Check and seed initial hospital data in Firestore if empty
  public async initializeHospitalInFirestore(
    hospitalId: string,
    hospitalName: string,
    ownerUid: string
  ): Promise<void> {
    try {
      // 1. Ensure hospital document exists in hospitals/{hospitalId}
      const hospRef = doc(getFirebaseDb(), 'hospitals', hospitalId);
      const hospSnap = await getDoc(hospRef);
      if (!hospSnap.exists()) {
        await setDoc(hospRef, {
          hospitalId,
          hospitalName,
          ownerUid,
          code: 'UPH-01',
          city: 'New Delhi',
          phone: '+91 11 4050 9900',
          email: 'admin@upstagehospital.org',
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }

      // ONLY seed dummy demo collections if this is the demo hospital 'hosp-001'!
      // Original users' hospitals must remain clean without mock/demo records.
      if (hospitalId !== 'hosp-001') {
        return;
      }

      // 2. Check if employees already exist
      const empCol = this.getColRef(hospitalId, 'employees');
      const empSnap = await getDocs(query(empCol, limit(1)));
      if (!empSnap.empty) {
        return; // Already initialized
      }

      // 3. Batch seed initial records
      const batch = writeBatch(getFirebaseDb());

      // Seed Departments
      DEFAULT_DEPARTMENTS.forEach(dept => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'departments', dept.id);
        batch.set(ref, { ...dept, hospitalId });
      });

      // Seed Employees
      DEFAULT_EMPLOYEES.forEach(emp => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'employees', emp.id);
        batch.set(ref, { ...emp, hospitalId });
      });

      // Seed Role Requests
      DEFAULT_ROLE_REQUESTS.forEach(req => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'roleRequests', req.id);
        batch.set(ref, { ...req, hospitalId });
      });

      // Seed Patients
      DEFAULT_PATIENTS.forEach(pat => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'patients', pat.id);
        batch.set(ref, { ...pat, hospitalId });
      });

      // Seed Wards & Beds
      DEFAULT_WARDS.forEach(w => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'wards', w.id);
        batch.set(ref, { ...w, hospitalId });
      });

      DEFAULT_BEDS.forEach(b => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'beds', b.id);
        batch.set(ref, { ...b, hospitalId });
      });

      // Seed Medicines
      DEFAULT_MEDICINES.forEach(m => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'medicines', m.id);
        batch.set(ref, { ...m, hospitalId });
      });

      // Seed Appointments
      DEFAULT_APPOINTMENTS.forEach(apt => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'appointments', apt.id);
        batch.set(ref, { ...apt, hospitalId });
      });

      // Seed Invoices / Bills
      DEFAULT_INVOICES.forEach(inv => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'bills', inv.id);
        batch.set(ref, { ...inv, hospitalId });
      });

      // Seed Attendance
      DEFAULT_ATTENDANCE.forEach(att => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'attendance', att.id);
        batch.set(ref, { ...att, hospitalId });
      });

      // Seed Payroll
      DEFAULT_PAYROLL.forEach(pay => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'payroll', pay.id);
        batch.set(ref, { ...pay, hospitalId });
      });

      // Seed Notifications & Audit
      DEFAULT_NOTIFICATIONS.forEach(notif => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'notifications', notif.id);
        batch.set(ref, { ...notif, hospitalId });
      });

      DEFAULT_AUDIT_LOGS.forEach(log => {
        const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'auditLogs', log.id);
        batch.set(ref, { ...log, hospitalId });
      });

      await batch.commit();
      console.log(`Hospital ${hospitalId} successfully seeded in Cloud Firestore.`);
    } catch (error) {
      console.warn('Firestore initialization error (proceeding with optimistic local fallback):', error);
    }
  }

  // CLINICAL CONSULTATION WITH ATOMIC BATCH WRITE
  public async saveConsultationAtomic(
    hospitalId: string,
    consultation: ConsultationRecord,
    labOrders: LabOrder[],
    radiologyOrders: RadiologyOrder[],
    invoice: Invoice
  ): Promise<void> {
    const batch = writeBatch(getFirebaseDb());

    // 1. Consultation document
    const consRef = this.getDocRef(hospitalId, 'consultations', consultation.id);
    batch.set(consRef, { ...consultation, hospitalId, createdAt: serverTimestamp() });

    // 2. Update Appointment to completed
    const aptRef = this.getDocRef(hospitalId, 'appointments', consultation.appointmentId);
    batch.update(aptRef, { status: 'completed', updatedAt: serverTimestamp() });

    // 3. Lab Orders
    labOrders.forEach(lab => {
      const labRef = this.getDocRef(hospitalId, 'labOrders', lab.id);
      batch.set(labRef, { ...lab, hospitalId });
    });

    // 4. Radiology Orders
    radiologyOrders.forEach(rad => {
      const radRef = this.getDocRef(hospitalId, 'radiologyOrders', rad.id);
      batch.set(radRef, { ...rad, hospitalId });
    });

    // 5. Bill / Invoice
    const billRef = this.getDocRef(hospitalId, 'bills', invoice.id);
    batch.set(billRef, { ...invoice, hospitalId });

    await batch.commit();
  }

  // INVOICE PAYMENT RECORDING WITH AUDIT & PAYMENT RECEIPT
  public async recordInvoicePayment(
    hospitalId: string,
    invoiceId: string,
    amount: number,
    paymentMethod: Invoice['paymentMethod'],
    transactionRef?: string
  ): Promise<void> {
    const billRef = this.getDocRef(hospitalId, 'bills', invoiceId);
    const billSnap = await getDoc(billRef);
    if (!billSnap.exists()) return;

    const currentBill = billSnap.data() as Invoice;
    const newPaid = (currentBill.amountPaid || 0) + amount;
    const newBalance = Math.max(0, currentBill.totalAmount - newPaid);
    const newStatus: Invoice['paymentStatus'] = newBalance <= 0 ? 'paid' : 'partial';
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const batch = writeBatch(getFirebaseDb());

    // Update bill
    batch.update(billRef, {
      amountPaid: newPaid,
      balanceDue: newBalance,
      paymentStatus: newStatus,
      paymentMethod,
      transactionRef: transactionRef || currentBill.transactionRef || '',
      receiptNumber,
      updatedAt: serverTimestamp()
    });

    // Record in payments subcollection
    const paymentId = `pay-${Date.now()}`;
    const paymentRef = this.getDocRef(hospitalId, 'payments', paymentId);
    batch.set(paymentRef, {
      id: paymentId,
      hospitalId,
      billId: invoiceId,
      invoiceNumber: currentBill.invoiceNumber,
      patientId: currentBill.patientId,
      patientName: currentBill.patientName,
      patientUhid: currentBill.patientUhid,
      amount,
      paymentMethod,
      transactionRef: transactionRef || '',
      receiptNumber,
      paidAt: new Date().toISOString(),
      createdAt: serverTimestamp()
    });

    await batch.commit();
  }

  // AUDIT LOGGER
  public async logAudit(
    hospitalId: string,
    log: Omit<AuditLog, 'id' | 'timestamp'>
  ): Promise<void> {
    const logId = `aud-${Date.now()}`;
    const logRef = this.getDocRef(hospitalId, 'auditLogs', logId);
    await setDoc(logRef, {
      ...log,
      id: logId,
      hospitalId,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
  }
}

export const firestoreService = new FirestoreHospitalService();
