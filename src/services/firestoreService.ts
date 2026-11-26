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
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db, getFirebaseDb } from './firebase';
import type { Employee } from '../types/employee';
import type { RoleRequest } from '../types/roleRequest';
import type { Patient, VitalSign } from '../types/patient';
import type { Appointment, ConsultationRecord, LabOrder, RadiologyOrder, PrescriptionItem } from '../types/clinical';
import type { Ward, Bed, Admission, AdmissionRequest } from '../types/admission';
import type { Medicine, PharmacyDispense } from '../types/pharmacy';
import type { Invoice, HospitalExpense, BillItem } from '../types/billing';
import type { AttendanceRecord, PayrollRecord } from '../types/hr';
import type { HospitalNotification, AuditLog } from '../types/audit';
import type { Department } from '../types/hospital';
import type { RoleId } from '../types/roles';
import type { NurseTask, NurseAvailabilityStatus } from '../types/nurse';
import { dispenseMedicineAtomic } from './posIntegrationService';
import {
  DEFAULT_DEPARTMENTS
} from './storageService';
import {
  formatEmployeeLoginId,
  ROLE_TWO_LETTER_CODES
} from '../utils/employeeIdGenerator';

// Helper to recursively remove all keys with undefined values to prevent Firestore updateDoc/setDoc exceptions
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => (typeof item === 'object' && item !== null ? removeUndefinedFields(item) : item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !(val instanceof Date) && typeof (val as any).toMillis !== 'function') {
        cleaned[key] = removeUndefinedFields(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned as T;
}

export class FirestoreHospitalService {
  // Generic collection reference helper
  public getColRef(hospitalId: string, colName: string) {
    return collection(getFirebaseDb(), 'hospitals', hospitalId, colName);
  }

  public getDocRef(hospitalId: string, colName: string, docId: string) {
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

  // Generic document writer with undefined sanitization
  public async setDocument<T extends Record<string, any>>(
    hospitalId: string,
    collectionName: string,
    docId: string,
    data: T
  ): Promise<void> {
    const docRef = this.getDocRef(hospitalId, collectionName, docId);
    const sanitized = removeUndefinedFields(data);
    await setDoc(docRef, {
      ...sanitized,
      id: docId,
      hospitalId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // Generic document updater with undefined sanitization
  public async updateDocument(
    hospitalId: string,
    collectionName: string,
    docId: string,
    updates: Record<string, any>
  ): Promise<void> {
    const docRef = this.getDocRef(hospitalId, collectionName, docId);
    const sanitized = removeUndefinedFields(updates);
    await updateDoc(docRef, {
      ...sanitized,
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

  // Check and initialize clean hospital configuration in Firestore
  public async initializeHospitalInFirestore(
    hospitalId: string,
    hospitalName: string,
    ownerUid: string
  ): Promise<void> {
    try {
      const hospRef = doc(getFirebaseDb(), 'hospitals', hospitalId);
      const hospSnap = await getDoc(hospRef);
      if (!hospSnap.exists()) {
        await setDoc(hospRef, {
          hospitalId,
          hospitalName,
          ownerUid,
          code: `UPH-${String(Math.floor(Math.random() * 90 + 10))}`,
          city: 'New Delhi',
          phone: '+91 11 4050 9900',
          email: 'admin@upstagehospital.org',
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }

      // Initialize standard department configuration if empty
      const deptCol = this.getColRef(hospitalId, 'departments');
      const deptSnap = await getDocs(query(deptCol, limit(1)));
      if (deptSnap.empty) {
        const batch = writeBatch(getFirebaseDb());
        DEFAULT_DEPARTMENTS.forEach(dept => {
          const ref = doc(getFirebaseDb(), 'hospitals', hospitalId, 'departments', dept.id);
          batch.set(ref, { ...dept, hospitalId });
        });
        await batch.commit();
      }
    } catch (error) {
      console.warn('Firestore hospital initialization warning:', error);
    }
  }

  // ============================================================================
  // PHASE 2: RECEPTIONIST APPOINTMENT MANAGEMENT
  // ============================================================================

  public async submitOnlineAppointment(
    hospitalId: string,
    appointmentData: {
      patientName: string;
      mobile: string;
      age: number;
      gender: 'Male' | 'Female' | 'Other';
      preferredDoctorId: string;
      preferredDoctorName: string;
      departmentId?: string;
      departmentName?: string;
      preferredDate: string;
      problemDescription: string;
      preferredTimeSlot?: string;
    }
  ): Promise<{ appointment: Appointment; patient: Patient }> {
    // 1. Check or match existing patient by phone
    const patCol = this.getColRef(hospitalId, 'patients');
    const patQuery = query(patCol, where('phone', '==', appointmentData.mobile.trim()));
    const patSnap = await getDocs(patQuery);

    let patient: Patient;
    if (!patSnap.empty) {
      patient = { ...patSnap.docs[0].data(), id: patSnap.docs[0].id } as Patient;
    } else {
      const newUhid = `UPH-P${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const newPatId = `pat-${Date.now()}`;
      patient = {
        id: newPatId,
        hospitalId,
        uhid: newUhid,
        name: appointmentData.patientName.trim(),
        age: Number(appointmentData.age) || 30,
        gender: appointmentData.gender,
        dob: `${new Date().getFullYear() - (appointmentData.age || 30)}-01-01`,
        phone: appointmentData.mobile.trim(),
        address: 'Online Registration',
        bloodGroup: 'B+',
        emergencyContact: {
          name: appointmentData.patientName.trim(),
          relationship: 'Self',
          phone: appointmentData.mobile.trim()
        },
        allergies: [],
        chronicConditions: [],
        registeredAt: new Date().toISOString(),
        status: 'OP'
      };
      await this.setDocument(hospitalId, 'patients', newPatId, patient);
    }

    // 2. Create online appointment request
    const aptId = `apt-onl-${Date.now()}`;
    const tokenNum = Math.floor(100 + Math.random() * 900);
    const appointment: Appointment = {
      id: aptId,
      hospitalId,
      tokenNumber: tokenNum,
      tokenFormatted: `OP-${tokenNum}`,
      bookingSource: 'online',
      patientId: patient.id,
      patientName: patient.name,
      patientUhid: patient.uhid,
      patientPhone: patient.phone,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId: appointmentData.preferredDoctorId,
      doctorName: appointmentData.preferredDoctorName,
      departmentId: appointmentData.departmentId || 'dept-gen-med',
      departmentName: appointmentData.departmentName || 'General Medicine',
      appointmentDate: appointmentData.preferredDate,
      timeSlot: appointmentData.preferredTimeSlot || '10:00 AM',
      type: 'general',
      status: 'requested',
      chiefComplaint: appointmentData.problemDescription,
      problemDescription: appointmentData.problemDescription,
      bookedAt: new Date().toISOString(),
      consultationFee: 500,
      isFeePaid: false
    };

    await this.setDocument(hospitalId, 'appointments', aptId, appointment);
    return { appointment, patient };
  }

  public async confirmOnlineAppointment(
    hospitalId: string,
    appointmentId: string,
    tokenNumber?: number
  ): Promise<Appointment> {
    const aptRef = this.getDocRef(hospitalId, 'appointments', appointmentId);
    const aptSnap = await getDoc(aptRef);
    if (!aptSnap.exists()) throw new Error('Appointment not found');

    const apt = aptSnap.data() as Appointment;
    const finalToken = tokenNumber || apt.tokenNumber || Math.floor(100 + Math.random() * 900);
    const updates: Partial<Appointment> = {
      status: 'waiting',
      tokenNumber: finalToken,
      tokenFormatted: `OP-${finalToken}`,
      isFeePaid: true
    };

    await this.updateDocument(hospitalId, 'appointments', appointmentId, updates);
    return { ...apt, ...updates };
  }

  public async registerWalkInAppointment(
    hospitalId: string,
    data: {
      patientName: string;
      phone: string;
      age: number;
      gender: 'Male' | 'Female' | 'Other';
      doctorId: string;
      doctorName: string;
      departmentId?: string;
      departmentName?: string;
      chiefComplaint: string;
      appointmentDate?: string;
      consultationFee?: number;
      isFeePaid?: boolean;
    }
  ): Promise<{ appointment: Appointment; patient: Patient }> {
    // 1. Patient check / create
    const patCol = this.getColRef(hospitalId, 'patients');
    const patQuery = query(patCol, where('phone', '==', data.phone.trim()));
    const patSnap = await getDocs(patQuery);

    let patient: Patient;
    if (!patSnap.empty) {
      patient = { ...patSnap.docs[0].data(), id: patSnap.docs[0].id } as Patient;
    } else {
      const newUhid = `UPH-P${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const newPatId = `pat-${Date.now()}`;
      patient = {
        id: newPatId,
        hospitalId,
        uhid: newUhid,
        name: data.patientName.trim(),
        age: Number(data.age) || 30,
        gender: data.gender,
        dob: `${new Date().getFullYear() - (data.age || 30)}-01-01`,
        phone: data.phone.trim(),
        address: 'Walk-in Desk',
        bloodGroup: 'B+',
        emergencyContact: {
          name: data.patientName.trim(),
          relationship: 'Self',
          phone: data.phone.trim()
        },
        allergies: [],
        chronicConditions: [],
        registeredAt: new Date().toISOString(),
        status: 'OP'
      };
      await this.setDocument(hospitalId, 'patients', newPatId, patient);
    }

    // 2. Duplicate appointment check for same patient on same date
    const targetDate = data.appointmentDate || new Date().toISOString().split('T')[0];
    const aptCol = this.getColRef(hospitalId, 'appointments');
    const duplicateQuery = query(
      aptCol,
      where('patientId', '==', patient.id),
      where('appointmentDate', '==', targetDate),
      where('status', 'in', ['waiting', 'scheduled', 'in_consultation'])
    );
    const duplicateSnap = await getDocs(duplicateQuery);
    if (!duplicateSnap.empty) {
      const existing = { ...duplicateSnap.docs[0].data(), id: duplicateSnap.docs[0].id } as Appointment;
      return { appointment: existing, patient };
    }

    // 3. Issue Token and create Walk-in Appointment
    const tokenNum = Math.floor(100 + Math.random() * 900);
    const aptId = `apt-wlk-${Date.now()}`;
    const appointment: Appointment = {
      id: aptId,
      hospitalId,
      tokenNumber: tokenNum,
      tokenFormatted: `OP-${tokenNum}`,
      bookingSource: 'walk_in',
      patientId: patient.id,
      patientName: patient.name,
      patientUhid: patient.uhid,
      patientPhone: patient.phone,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      departmentId: data.departmentId || 'dept-gen-med',
      departmentName: data.departmentName || 'General Medicine',
      appointmentDate: targetDate,
      timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'general',
      status: 'waiting',
      chiefComplaint: data.chiefComplaint.trim() || 'General Consultation',
      bookedAt: new Date().toISOString(),
      consultationFee: typeof data.consultationFee === 'number' ? data.consultationFee : 500,
      isFeePaid: data.isFeePaid !== undefined ? Boolean(data.isFeePaid) : true
    };

    await this.setDocument(hospitalId, 'appointments', aptId, appointment);
    return { appointment, patient };
  }

  // ============================================================================
  // PHASE 3: DOCTOR CONSULTATION & UNIFIED ORDER DISPATCH
  // Prescribing medicines strictly does NOT deduct stock here
  // ============================================================================

  public async completeClinicalConsultationWorkflow(
    hospitalId: string,
    data: {
      appointmentId: string;
      patientId: string;
      patientName: string;
      patientUhid: string;
      patientAge?: number;
      patientGender?: string;
      doctorId: string;
      doctorName: string;
      departmentId?: string;
      symptoms?: string[];
      clinicalObservations?: string;
      diagnosis: string;
      notes?: string;
      consultationFee: number;
      procedureFee?: number;
      procedureDescription?: string;
      prescriptions: PrescriptionItem[];
      labTests: {
        testId: string;
        testName: string;
        category: string;
        sampleType?: string;
        price: number;
      }[];
      admissionRecommendation?: {
        isVip: boolean;
        notes: string;
        reason?: string;
      };
    }
  ): Promise<{ consultationId: string; invoiceId: string }> {
    const consultationId = `cons-${data.appointmentId}`;

    // 1. Idempotency Check: Don't duplicate if already submitted
    const consRef = this.getDocRef(hospitalId, 'consultations', consultationId);
    const consSnap = await getDoc(consRef);
    if (consSnap.exists()) {
      return { consultationId, invoiceId: `inv-${data.patientId}` };
    }

    const batch = writeBatch(getFirebaseDb());

    // 2. Save Consultation Document (Strict conditional construction - NO undefined values)
    const consultationRecord: Record<string, any> = {
      id: consultationId,
      hospitalId,
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      patientUhid: data.patientUhid,
      patientName: data.patientName,
      patientAge: data.patientAge ?? 35,
      patientGender: data.patientGender || 'Male',
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      departmentId: data.departmentId || 'dept-gen-med',
      consultedAt: new Date().toISOString(),
      symptoms: data.symptoms || [],
      clinicalFindings: data.clinicalObservations || '',
      provisionalDiagnosis: data.diagnosis || 'Under Evaluation',
      prescriptions: (data.prescriptions || []).map(p => {
        const item: Record<string, any> = {
          medicineId: p.medicineId || p.posMedicineId || 'med-01',
          medicineName: p.medicineName || 'Medicine',
          dosage: p.dosage || '1 Tab Oral',
          quantity: p.quantity ?? 1,
          unitPrice: p.unitPrice ?? 0,
          totalPrice: (p.unitPrice ?? 0) * (p.quantity ?? 1),
          instructions: p.instructions || 'After meals',
          isDispensed: false
        };
        if (p.posMedicineId) item.posMedicineId = p.posMedicineId;
        if (p.genericName) item.genericName = p.genericName;
        if (p.frequency) item.frequency = p.frequency;
        if (p.duration) item.duration = p.duration;
        if (p.durationDays) item.durationDays = p.durationDays;
        return item;
      }),
      labOrdersList: (data.labTests || []).map(t => ({
        testId: t.testId || `lab-${Date.now()}`,
        testName: t.testName || 'Diagnostic Test',
        category: t.category || 'General',
        sampleType: t.sampleType || 'Whole Blood',
        price: t.price ?? 0
      })),
      treatmentPlan: data.notes || '',
      clinicalNotes: data.notes || '',
      consultationFee: data.consultationFee ?? 500,
      status: 'completed'
    };

    if (data.procedureFee !== undefined && data.procedureFee !== null && data.procedureFee > 0) {
      consultationRecord.procedureFee = data.procedureFee;
    }
    if (data.procedureDescription && data.procedureDescription.trim()) {
      consultationRecord.procedureDescription = data.procedureDescription.trim();
    }

    // Only attach admissionRequest if doctor explicitly recommended admission
    if (data.admissionRecommendation) {
      consultationRecord.admissionRequest = {
        isVip: Boolean(data.admissionRecommendation.isVip),
        reason: data.admissionRecommendation.reason || data.diagnosis || 'Inpatient Evaluation',
        notes: data.admissionRecommendation.notes || '',
        status: 'pending'
      };
    }

    batch.set(consRef, { ...consultationRecord, createdAt: serverTimestamp() });

    // 3. Update Appointment to completed
    const aptRef = this.getDocRef(hospitalId, 'appointments', data.appointmentId);
    batch.update(aptRef, { status: 'completed', updatedAt: serverTimestamp() });

    // 4. Save Prescriptions queue (Queue ONLY, NO STOCK DEDUCTION AT THIS STAGE)
    if (data.prescriptions && data.prescriptions.length > 0) {
      const rxDocId = `rx-${data.appointmentId}`;
      const rxRef = this.getDocRef(hospitalId, 'prescriptions', rxDocId);
      batch.set(rxRef, {
        id: rxDocId,
        hospitalId,
        appointmentId: data.appointmentId,
        consultationId,
        patientId: data.patientId,
        patientName: data.patientName,
        patientUhid: data.patientUhid,
        doctorName: data.doctorName,
        items: data.prescriptions.map(p => ({
          ...p,
          isDispensed: false
        })),
        status: 'Queued',
        prescribedAt: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    }

    // 5. Create Lab Orders
    if (data.labTests && data.labTests.length > 0) {
      data.labTests.forEach((t, idx) => {
        const labId = `lab-${data.appointmentId}-${idx + 1}`;
        const labRef = this.getDocRef(hospitalId, 'labOrders', labId);
        const orderNumber = `LAB-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}-${idx + 1}`;
        const labOrder: Record<string, any> = {
          id: labId,
          hospitalId,
          orderNumber,
          testId: t.testId || `lab-${idx + 1}`,
          patientId: data.patientId,
          patientName: data.patientName,
          patientUhid: data.patientUhid,
          patientAge: data.patientAge ?? 35,
          patientGender: data.patientGender || 'Male',
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          testCategory: t.category || 'General',
          testName: t.testName,
          sampleType: t.sampleType || 'Whole Blood',
          sampleStatus: 'pending',
          referenceRange: 'Normal',
          unit: 'Report',
          cost: t.price ?? 0,
          isBilled: false,
          orderedAt: new Date().toISOString(),
          resultValue: '',
          remarks: '',
          isAbnormal: false
        };
        batch.set(labRef, { ...labOrder, createdAt: serverTimestamp() });
      });
    }

    // 6. Forward Inpatient Admission Request (if selected)
    if (data.admissionRecommendation) {
      const admReqId = `adm-req-${data.appointmentId}`;
      const admReqRef = this.getDocRef(hospitalId, 'admissionRequests', admReqId);
      const admissionReq: Record<string, any> = {
        id: admReqId,
        hospitalId,
        consultationId,
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        patientUhid: data.patientUhid,
        patientAge: data.patientAge ?? 35,
        patientGender: data.patientGender || 'Male',
        doctorName: data.doctorName || 'Consultant Doctor',
        isVip: Boolean(data.admissionRecommendation.isVip),
        priority: data.admissionRecommendation.isVip ? 'VIP' : 'Normal',
        notes: data.admissionRecommendation.notes || '',
        reason: data.admissionRecommendation.reason || data.diagnosis || 'Clinical evaluation',
        status: 'pending',
        requestedAt: new Date().toISOString()
      };
      batch.set(admReqRef, { ...admissionReq, createdAt: serverTimestamp() });
    }

    await batch.commit();

    // 7. Initialize / Sync Unified Patient Invoice with Doctor Consultation Fees
    const lineItems: BillItem[] = [
      {
        id: `fee-consult-${data.appointmentId}`,
        description: `Doctor Consultation (${data.doctorName})`,
        category: 'Consultation',
        quantity: 1,
        unitPrice: data.consultationFee,
        total: data.consultationFee,
        department: 'doctor',
        referenceId: consultationId
      }
    ];

    if (data.procedureFee && data.procedureFee > 0) {
      lineItems.push({
        id: `fee-proc-${data.appointmentId}`,
        description: data.procedureDescription || 'Clinical Procedure / Diagnostics Charge',
        category: 'Procedure',
        quantity: 1,
        unitPrice: data.procedureFee,
        total: data.procedureFee,
        department: 'doctor',
        referenceId: consultationId
      });
    }

    const invoice = await this.getOrCreateActiveInvoice(
      hospitalId,
      data.patientId,
      data.patientName,
      data.patientUhid,
      lineItems,
      data.doctorName
    );

    return { consultationId, invoiceId: invoice.id };
  }

  // ============================================================================
  // PHASE 4: PHARMACY WORKFLOW & ATOMIC DISPENSE
  // ============================================================================

  public async dispensePrescriptionAtomic(
    hospitalId: string,
    posOwnerUid: string,
    data: {
      prescriptionId: string;
      patientId: string;
      patientName: string;
      patientUhid: string;
      doctorName: string;
      pharmacistName: string;
      itemsToDispense: {
        medicineId: string;
        posMedicineId?: string;
        medicineName: string;
        quantity: number;
        unitPrice: number;
        batchNumber?: string;
      }[];
    }
  ): Promise<{ success: boolean; dispensedItems: BillItem[]; error?: string }> {
    try {
      const dispensedItems: BillItem[] = [];

      // 1. Deduct stock atomically in Kadai POS for each medicine
      for (const item of data.itemsToDispense) {
        const targetId = item.posMedicineId || item.medicineId;
        const deductResult = await dispenseMedicineAtomic(
          posOwnerUid,
          targetId,
          item.quantity,
          {
            hospitalId,
            patientId: data.patientId,
            patientName: data.patientName,
            patientUhid: data.patientUhid,
            pharmacistName: data.pharmacistName
          }
        );

        if (!deductResult.success) {
          throw new Error(deductResult.error || `Failed to deduct stock for ${item.medicineName}`);
        }

        const totalCost = item.unitPrice * item.quantity;
        dispensedItems.push({
          id: `bill-med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: `Rx: ${item.medicineName} (Qty: ${item.quantity})`,
          category: 'Pharmacy',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: totalCost,
          department: 'pharmacy',
          referenceId: data.prescriptionId
        });
      }

      // 2. Mark prescription as Dispensed
      if (data.prescriptionId) {
        const rxRef = this.getDocRef(hospitalId, 'prescriptions', data.prescriptionId);
        await updateDoc(rxRef, {
          status: 'Dispensed',
          dispensedAt: new Date().toISOString(),
          dispensedBy: data.pharmacistName
        }).catch(err => console.warn('Could not update prescription doc:', err));
      }

      // 3. Sync dispensed line items to the patient's active invoice
      for (const billItem of dispensedItems) {
        await this.addInvoiceLineItem(hospitalId, data.patientId, billItem, {
          name: data.patientName,
          uhid: data.patientUhid
        });
      }

      return { success: true, dispensedItems };
    } catch (err: any) {
      console.error('Dispense failed:', err);
      return { success: false, dispensedItems: [], error: err.message };
    }
  }

  // ============================================================================
  // PHASE 5: LABORATORY STATUS & BILLING SYNCHRONIZATION
  // ============================================================================

  public async updateLabOrderStatus(
    hospitalId: string,
    orderId: string,
    newStatus: LabOrder['sampleStatus'],
    details?: {
      resultValue?: string;
      isAbnormal?: boolean;
      remarks?: string;
      verifiedBy?: string;
      collectedBy?: string;
    }
  ): Promise<void> {
    const labRef = this.getDocRef(hospitalId, 'labOrders', orderId);
    const snap = await getDoc(labRef);
    if (!snap.exists()) return;

    const order = snap.data() as LabOrder;

    // Safe conditional object construction - never emit undefined
    const updates: Record<string, any> = {
      sampleStatus: newStatus
    };

    // 1. resultValue: only set if explicitly provided in details
    if (details?.resultValue !== undefined && details.resultValue !== null) {
      updates.resultValue = details.resultValue;
    }

    // 2. isAbnormal: only set if explicitly provided in details
    if (details?.isAbnormal !== undefined && details.isAbnormal !== null) {
      updates.isAbnormal = Boolean(details.isAbnormal);
    }

    // 3. remarks: only set if explicitly provided in details
    if (details?.remarks !== undefined && details.remarks !== null) {
      updates.remarks = details.remarks;
    }

    // 4. verifiedBy: only set if explicitly provided in details
    if (details?.verifiedBy !== undefined && details.verifiedBy !== null && details.verifiedBy !== '') {
      updates.verifiedBy = details.verifiedBy;
    }

    // 5. verifiedAt & default verifiedBy on verification transition
    if (newStatus === 'verified') {
      updates.verifiedAt = new Date().toISOString();
      if (!updates.verifiedBy && !order.verifiedBy) {
        updates.verifiedBy = details?.verifiedBy || 'Dr. Pathologist';
      }
    }

    // 6. collectedAt & collectedBy on specimen collection transition
    if (newStatus === 'collected' && !order.collectedAt) {
      updates.collectedAt = new Date().toISOString();
      if (details?.collectedBy) {
        updates.collectedBy = details.collectedBy;
      }
    }

    await this.updateDocument(hospitalId, 'labOrders', orderId, updates);

    // Billing synchronization:
    // When completed: post lab fee to active patient bill (idempotent: only if not already billed)
    if (newStatus === 'completed' && !order.isBilled) {
      const lineItem: BillItem = {
        id: `bill-lab-${order.id}`,
        description: `Diagnostic Lab: ${order.testName}`,
        category: 'Lab Test',
        quantity: 1,
        unitPrice: order.cost || 0,
        total: order.cost || 0,
        department: 'laboratory',
        referenceId: order.id
      };
      await this.addInvoiceLineItem(hospitalId, order.patientId, lineItem, {
        name: order.patientName,
        uhid: order.patientUhid
      });
      await this.updateDocument(hospitalId, 'labOrders', orderId, { isBilled: true });
    }

    // When cancelled: remove test line item from active patient bill (₹0 charge)
    if (newStatus === 'cancelled') {
      if (order.isBilled) {
        await this.removeInvoiceLineItemByReference(hospitalId, order.patientId, order.id);
      }
      await this.updateDocument(hospitalId, 'labOrders', orderId, { isBilled: false });
    }
  }

  // ============================================================================
  // PHASE 6: WARD ADMISSIONS, BED DOUBLE-BOOKING & DISCHARGE BILLING
  // ============================================================================

  public async allocateBedToAdmissionRequest(
    hospitalId: string,
    requestId: string,
    bedId: string
  ): Promise<{ success: boolean; admissionId?: string; error?: string }> {
    const bedRef = this.getDocRef(hospitalId, 'beds', bedId);
    const bedSnap = await getDoc(bedRef);
    if (!bedSnap.exists()) return { success: false, error: 'Bed not found' };

    const bed = bedSnap.data() as Bed;
    if (bed.status === 'occupied') {
      return { success: false, error: `Bed ${bed.bedNumber} is already occupied. Double-booking prevented.` };
    }

    const reqRef = this.getDocRef(hospitalId, 'admissionRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) return { success: false, error: 'Admission request not found' };

    const req = reqSnap.data() as AdmissionRequest;
    const admissionId = `adm-${Date.now()}`;
    const admissionNumber = `IP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const admission: Admission = {
      id: admissionId,
      hospitalId,
      admissionNumber,
      patientId: req.patientId,
      patientName: req.patientName,
      patientUhid: req.patientUhid,
      admittingDoctorId: req.doctorName,
      admittingDoctorName: req.doctorName,
      wardId: bed.wardId,
      wardName: bed.wardName,
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      admissionDate: new Date().toISOString(),
      admissionReason: req.notes || req.reason || 'Doctor Admission Recommendation',
      admittingDiagnosis: req.reason || 'Under Evaluation',
      advanceDepositPaid: 0,
      status: 'active'
    };

    const batch = writeBatch(getFirebaseDb());

    // 1. Mark bed occupied
    batch.update(bedRef, {
      status: 'occupied',
      currentPatientId: req.patientId,
      currentPatientName: req.patientName,
      currentPatientUhid: req.patientUhid,
      admissionId,
      updatedAt: serverTimestamp()
    });

    // 2. Save Admission document
    const admDocRef = this.getDocRef(hospitalId, 'admissions', admissionId);
    batch.set(admDocRef, { ...admission, createdAt: serverTimestamp() });

    // 3. Mark request allocated
    batch.update(reqRef, {
      status: 'allocated',
      allocatedBedId: bed.id,
      allocatedBedNumber: bed.bedNumber,
      allocatedWardName: bed.wardName,
      allocatedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return { success: true, admissionId };
  }

  public async dischargePatientFromBed(
    hospitalId: string,
    admissionId: string,
    dischargeSummary?: Admission['dischargeSummary']
  ): Promise<{ success: boolean; roomCharges: number; totalDays: number; error?: string }> {
    const admRef = this.getDocRef(hospitalId, 'admissions', admissionId);
    const admSnap = await getDoc(admRef);
    if (!admSnap.exists()) return { success: false, roomCharges: 0, totalDays: 0, error: 'Admission not found' };

    const admission = admSnap.data() as Admission;
    const bedRef = this.getDocRef(hospitalId, 'beds', admission.bedId);
    const bedSnap = await getDoc(bedRef);
    const dailyRate = bedSnap.exists() ? (bedSnap.data() as Bed).dailyRate || 1000 : 1000;

    // Calculate days
    const admTime = new Date(admission.admissionDate).getTime();
    const nowTime = Date.now();
    const diffDays = Math.max(1, Math.ceil((nowTime - admTime) / (1000 * 60 * 60 * 24)));
    const roomCharges = diffDays * dailyRate;

    const batch = writeBatch(getFirebaseDb());

    // 1. Mark admission discharged
    batch.update(admRef, {
      status: 'discharged',
      dischargeDate: new Date().toISOString(),
      dischargeSummary: dischargeSummary || {
        conditionAtDischarge: 'Stable and Ambulatory',
        finalDiagnosis: admission.admittingDiagnosis,
        medicationsAdvised: 'Follow prescribed medications',
        followUpInstructions: 'Review in OPD in 7 days',
        dischargedByDoctorName: admission.admittingDoctorName
      },
      updatedAt: serverTimestamp()
    });

    // 2. Mark bed available / cleaning
    batch.update(bedRef, {
      status: 'cleaning',
      currentPatientId: '',
      currentPatientName: '',
      currentPatientUhid: '',
      admissionId: '',
      lastCleanedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    // 3. Post room charges to patient's active bill
    const lineItem: BillItem = {
      id: `bill-room-${admission.id}`,
      description: `Inpatient Stay: ${admission.wardName} (Bed ${admission.bedNumber}) - ${diffDays} day(s) @ ₹${dailyRate}/day`,
      category: 'Bed Charges',
      quantity: diffDays,
      unitPrice: dailyRate,
      total: roomCharges,
      department: 'ward',
      referenceId: admission.id
    };

    await this.addInvoiceLineItem(hospitalId, admission.patientId, lineItem, {
      name: admission.patientName,
      uhid: admission.patientUhid
    });

    return { success: true, roomCharges, totalDays: diffDays };
  }

  // ============================================================================
  // PHASE 7: UNIFIED PATIENT INVOICING & PAYMENT SETTLEMENT
  // Consolidates Doctor, Pharmacy, Lab, and Ward charges under one bill
  // ============================================================================

  public async getOrCreateActiveInvoice(
    hospitalId: string,
    patientId: string,
    patientName: string,
    patientUhid: string,
    initialItems: BillItem[] = [],
    staffName = 'Reception / Desk Staff'
  ): Promise<Invoice> {
    const billsCol = this.getColRef(hospitalId, 'bills');
    const q = query(
      billsCol,
      where('patientId', '==', patientId),
      where('paymentStatus', 'in', ['unpaid', 'partial'])
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const activeBill = { ...snap.docs[0].data(), id: snap.docs[0].id } as Invoice;
      if (initialItems.length > 0) {
        let updatedItems = [...activeBill.items];
        for (const it of initialItems) {
          const exists = updatedItems.some(i => i.id === it.id || (i.referenceId && i.referenceId === it.referenceId));
          if (!exists) {
            updatedItems.push(it);
          }
        }
        const subtotal = updatedItems.reduce((acc, cur) => acc + cur.total, 0);
        const taxAmount = Math.round(subtotal * 0.05);
        const totalAmount = subtotal + taxAmount - (activeBill.discountAmount || 0);
        const balanceDue = Math.max(0, totalAmount - (activeBill.amountPaid || 0));

        await this.updateDocument(hospitalId, 'bills', activeBill.id, {
          items: updatedItems,
          subtotal,
          taxAmount,
          totalAmount,
          balanceDue
        });
        return {
          ...activeBill,
          items: updatedItems,
          subtotal,
          taxAmount,
          totalAmount,
          balanceDue
        };
      }
      return activeBill;
    }

    // Create new unified invoice
    const invId = `inv-${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const subtotal = initialItems.reduce((acc, cur) => acc + cur.total, 0);
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + taxAmount;

    const newInvoice: Invoice = {
      id: invId,
      hospitalId,
      invoiceNumber,
      invoiceType: 'Consolidated',
      patientId,
      patientName,
      patientUhid,
      patientPhone: '',
      items: initialItems,
      subtotal,
      discountAmount: 0,
      taxAmount,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      createdAt: new Date().toISOString(),
      createdByStaffName: staffName,
      status: 'active'
    };

    await this.setDocument(hospitalId, 'bills', invId, newInvoice);
    return newInvoice;
  }

  public async addInvoiceLineItem(
    hospitalId: string,
    patientId: string,
    item: BillItem,
    patientInfo?: { name: string; uhid: string }
  ): Promise<Invoice> {
    const invoice = await this.getOrCreateActiveInvoice(
      hospitalId,
      patientId,
      patientInfo?.name || 'Patient',
      patientInfo?.uhid || 'UHID-NEW'
    );

    const existingItems = invoice.items || [];
    const itemIndex = existingItems.findIndex(i => i.id === item.id || (i.referenceId && i.referenceId === item.referenceId));

    let updatedItems: BillItem[];
    if (itemIndex >= 0) {
      updatedItems = [...existingItems];
      updatedItems[itemIndex] = item;
    } else {
      updatedItems = [...existingItems, item];
    }

    const subtotal = updatedItems.reduce((acc, cur) => acc + cur.total, 0);
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + taxAmount - (invoice.discountAmount || 0);
    const balanceDue = Math.max(0, totalAmount - (invoice.amountPaid || 0));
    const paymentStatus: Invoice['paymentStatus'] = balanceDue <= 0 ? 'paid' : (invoice.amountPaid > 0 ? 'partial' : 'unpaid');

    await this.updateDocument(hospitalId, 'bills', invoice.id, {
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue,
      paymentStatus
    });

    return {
      ...invoice,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue,
      paymentStatus
    };
  }

  public async removeInvoiceLineItemByReference(
    hospitalId: string,
    patientId: string,
    referenceId: string
  ): Promise<void> {
    const billsCol = this.getColRef(hospitalId, 'bills');
    const q = query(
      billsCol,
      where('patientId', '==', patientId),
      where('paymentStatus', 'in', ['unpaid', 'partial'])
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const invoice = { ...snap.docs[0].data(), id: snap.docs[0].id } as Invoice;
    const updatedItems = invoice.items.filter(i => i.referenceId !== referenceId && i.id !== referenceId);

    const subtotal = updatedItems.reduce((acc, cur) => acc + cur.total, 0);
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + taxAmount - (invoice.discountAmount || 0);
    const balanceDue = Math.max(0, totalAmount - (invoice.amountPaid || 0));
    const paymentStatus: Invoice['paymentStatus'] = balanceDue <= 0 ? 'paid' : (invoice.amountPaid > 0 ? 'partial' : 'unpaid');

    await this.updateDocument(hospitalId, 'bills', invoice.id, {
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue,
      paymentStatus
    });
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

  // ============================================================================
  // NURSE HELP & GLOBAL TASK ASSIGNMENT WORKFLOW
  // ============================================================================

  // 1. Create a new nurse assistance request
  public async requestNurseTask(
    hospitalId: string,
    data: Omit<NurseTask, 'id' | 'hospitalId' | 'taskId' | 'status' | 'createdAt'>
  ): Promise<{ success: boolean; taskId: string; error?: string }> {
    try {
      const taskId = `ntask-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      
      const newTask: NurseTask = {
        ...data,
        id: taskId,
        taskId,
        hospitalId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await this.setDocument(hospitalId, 'nurseTasks', taskId, newTask);

      // Create in-app notification for the assigned nurse
      const notifId = `notif-${Date.now()}`;
      await this.setDocument(hospitalId, 'notifications', notifId, {
        id: notifId,
        hospitalId,
        targetEmployeeId: data.nurseStaffId,
        title: `Nurse Help Request: ${data.taskType}`,
        message: `${data.requestedByName} (${data.requestedByRole}) requested ${data.priority === 'urgent' ? 'URGENT ' : ''}assistance: ${data.description.slice(0, 100)}`,
        type: data.priority === 'urgent' ? 'urgent' : 'task_assignment',
        isRead: false,
        createdAt: new Date().toISOString()
      }).catch(err => console.warn('Could not post nurse task notification:', err));

      return { success: true, taskId };
    } catch (err: any) {
      console.error('requestNurseTask failed:', err);
      return { success: false, taskId: '', error: err.message };
    }
  }

  // 2. Accept nurse task with transaction concurrency protection
  public async acceptNurseTask(
    hospitalId: string,
    taskId: string,
    nurseStaffId: string
  ): Promise<{ success: boolean; error?: string }> {
    const dbInstance = getFirebaseDb();
    const taskRef = this.getDocRef(hospitalId, 'nurseTasks', taskId);
    const nurseRef = this.getDocRef(hospitalId, 'employees', nurseStaffId);

    try {
      await runTransaction(dbInstance, async (transaction) => {
        const taskDoc = await transaction.get(taskRef);
        if (!taskDoc.exists()) {
          throw new Error('Nurse task request not found.');
        }

        const taskData = taskDoc.data() as NurseTask;
        if (taskData.status !== 'pending') {
          throw new Error(`This task has already been ${taskData.status}.`);
        }

        if (taskData.nurseStaffId !== nurseStaffId) {
          throw new Error('This task was not assigned to you.');
        }

        const nurseDoc = await transaction.get(nurseRef);
        if (!nurseDoc.exists()) {
          throw new Error('Nurse employee record not found.');
        }

        const nurseData = nurseDoc.data() as Employee;
        if (nurseData.status !== 'active') {
          throw new Error('Nurse account is not active.');
        }

        if (nurseData.availabilityStatus === 'busy') {
          throw new Error('You are currently marked as Busy on another active assignment.');
        }

        const now = new Date().toISOString();

        // Atomically update task
        transaction.update(taskRef, {
          status: 'accepted',
          acceptedAt: now,
          updatedAt: serverTimestamp()
        });

        // Atomically set global nurse availability to BUSY
        transaction.update(nurseRef, {
          availabilityStatus: 'busy',
          activeTaskId: taskId,
          lastAvailabilityUpdate: now,
          updatedAt: serverTimestamp()
        });
      });

      return { success: true };
    } catch (err: any) {
      console.warn('acceptNurseTask transaction failed:', err);
      return { success: false, error: err.message || 'Failed to accept task.' };
    }
  }

  // 3. Start accepted nurse task (In Progress)
  public async startNurseTask(
    hospitalId: string,
    taskId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      await this.updateDocument(hospitalId, 'nurseTasks', taskId, {
        status: 'in_progress',
        startedAt: now
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // 4. Complete nurse task and release nurse to Available
  public async completeNurseTask(
    hospitalId: string,
    taskId: string,
    nurseStaffId: string,
    completionNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    const dbInstance = getFirebaseDb();
    const taskRef = this.getDocRef(hospitalId, 'nurseTasks', taskId);
    const nurseRef = this.getDocRef(hospitalId, 'employees', nurseStaffId);

    try {
      const now = new Date().toISOString();

      // Read task to get requester details
      const taskDoc = await getDoc(taskRef);
      const taskData = taskDoc.exists() ? (taskDoc.data() as NurseTask) : null;

      await runTransaction(dbInstance, async (transaction) => {
        // Mark task completed
        transaction.update(taskRef, {
          status: 'completed',
          completedAt: now,
          completionNotes: completionNotes.trim() || 'Task completed successfully.',
          updatedAt: serverTimestamp()
        });

        // Release nurse back to AVAILABLE
        transaction.update(nurseRef, {
          availabilityStatus: 'available',
          activeTaskId: null,
          lastAvailabilityUpdate: now,
          updatedAt: serverTimestamp()
        });
      });

      // Notify requester that the task is completed
      if (taskData?.requestedByStaffId) {
        const notifId = `notif-${Date.now()}`;
        await this.setDocument(hospitalId, 'notifications', notifId, {
          id: notifId,
          hospitalId,
          targetEmployeeId: taskData.requestedByStaffId,
          title: `Task Completed: ${taskData.taskType}`,
          message: `${taskData.nurseName} has completed the assigned assistance request${taskData.patientName ? ` for ${taskData.patientName}` : ''}. Notes: ${completionNotes || 'Completed'}`,
          type: 'general',
          isRead: false,
          createdAt: now
        }).catch(err => console.warn(err));
      }

      return { success: true };
    } catch (err: any) {
      console.error('completeNurseTask error:', err);
      return { success: false, error: err.message };
    }
  }

  // 5. Reject nurse task with reason
  public async rejectNurseTask(
    hospitalId: string,
    taskId: string,
    nurseStaffId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; error?: string }> {
    const dbInstance = getFirebaseDb();
    const taskRef = this.getDocRef(hospitalId, 'nurseTasks', taskId);
    const nurseRef = this.getDocRef(hospitalId, 'employees', nurseStaffId);

    try {
      const now = new Date().toISOString();
      const taskDoc = await getDoc(taskRef);
      const taskData = taskDoc.exists() ? (taskDoc.data() as NurseTask) : null;

      await runTransaction(dbInstance, async (transaction) => {
        transaction.update(taskRef, {
          status: 'rejected',
          rejectionReason: rejectionReason.trim() || 'Nurse unavailable to take this task.',
          updatedAt: serverTimestamp()
        });

        // If nurse was busy on this task, release to available
        const nurseDoc = await transaction.get(nurseRef);
        if (nurseDoc.exists()) {
          const nData = nurseDoc.data() as Employee;
          if (nData.activeTaskId === taskId) {
            transaction.update(nurseRef, {
              availabilityStatus: 'available',
              activeTaskId: null,
              lastAvailabilityUpdate: now,
              updatedAt: serverTimestamp()
            });
          }
        }
      });

      // Notify requester of rejection
      if (taskData?.requestedByStaffId) {
        const notifId = `notif-${Date.now()}`;
        await this.setDocument(hospitalId, 'notifications', notifId, {
          id: notifId,
          hospitalId,
          targetEmployeeId: taskData.requestedByStaffId,
          title: `Request Declined: ${taskData.taskType}`,
          message: `${taskData.nurseName} declined the assistance request. Reason: ${rejectionReason || 'Unavailable'}`,
          type: 'alert',
          isRead: false,
          createdAt: now
        }).catch(err => console.warn(err));
      }

      return { success: true };
    } catch (err: any) {
      console.error('rejectNurseTask error:', err);
      return { success: false, error: err.message };
    }
  }

  // 6. Cancel nurse task
  public async cancelNurseTask(
    hospitalId: string,
    taskId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      const taskDoc = await getDoc(this.getDocRef(hospitalId, 'nurseTasks', taskId));
      if (!taskDoc.exists()) return { success: false, error: 'Task not found.' };

      const task = taskDoc.data() as NurseTask;
      await this.updateDocument(hospitalId, 'nurseTasks', taskId, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });

      // If nurse was busy on this task, release back to available
      if (task.status === 'accepted' || task.status === 'in_progress') {
        await this.updateDocument(hospitalId, 'employees', task.nurseStaffId, {
          availabilityStatus: 'available',
          activeTaskId: null,
          lastAvailabilityUpdate: now
        }).catch(err => console.warn(err));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // 7. Update nurse availability manually (Available / Busy / Offline)
  public async setNurseAvailability(
    hospitalId: string,
    nurseStaffId: string,
    status: 'available' | 'busy' | 'offline'
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.updateDocument(hospitalId, 'employees', nurseStaffId, {
      availabilityStatus: status,
      lastAvailabilityUpdate: now
    });
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

  // Generate next unique, collision-free Employee Login ID using Firestore transaction
  public async getNextEmployeeLoginId(
    hospitalId: string,
    hospitalName: string,
    role: RoleId,
    year?: number
  ): Promise<string> {
    const dbInstance = getFirebaseDb();
    const currentYear = year || new Date().getFullYear();
    const roleCode = ROLE_TWO_LETTER_CODES[role] || 'ST';
    const counterKey = `${currentYear}_${roleCode}`;
    const counterRef = doc(dbInstance, 'hospitals', hospitalId, 'counters', 'staff_login_counters');

    const generatedId = await runTransaction(dbInstance, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let currentSeq = 0;
      if (counterSnap.exists()) {
        const data = counterSnap.data();
        currentSeq = Number(data[counterKey]) || 0;
      }

      let candidateSeq = currentSeq + 1;
      let candidateId = formatEmployeeLoginId(hospitalName, role, candidateSeq, currentYear);

      // Verify no collisions in employees collection
      const empCol = collection(dbInstance, 'hospitals', hospitalId, 'employees');
      const q = query(empCol, where('employeeLoginId', '==', candidateId));
      const qSnap = await getDocs(q);

      let isCollision = !qSnap.empty;
      while (isCollision) {
        candidateSeq++;
        candidateId = formatEmployeeLoginId(hospitalName, role, candidateSeq, currentYear);
        const nextQ = query(empCol, where('employeeLoginId', '==', candidateId));
        const nextSnap = await getDocs(nextQ);
        if (nextSnap.empty) {
          isCollision = false;
        }
      }

      transaction.set(counterRef, {
        [counterKey]: candidateSeq,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return candidateId;
    });

    return generatedId;
  }

  // Safe migration / backfill for existing hospital employees without an employeeLoginId
  public async backfillEmployeeLoginIds(
    hospitalId: string,
    hospitalName: string
  ): Promise<void> {
    try {
      const dbInstance = getFirebaseDb();
      const empCol = collection(dbInstance, 'hospitals', hospitalId, 'employees');
      const snap = await getDocs(empCol);
      if (snap.empty) return;

      const roleCounters: Record<string, number> = {};

      for (const d of snap.docs) {
        const emp = d.data() as Employee;
        if (!emp.employeeLoginId) {
          const role = emp.primaryRole || 'doctor';
          const year = emp.joiningDate ? new Date(emp.joiningDate).getFullYear() : new Date().getFullYear();
          const roleCode = ROLE_TWO_LETTER_CODES[role] || 'ST';
          const key = `${year}_${roleCode}`;
          const current = (roleCounters[key] || 0) + 1;
          roleCounters[key] = current;

          const newLoginId = formatEmployeeLoginId(hospitalName, role, current, year);
          await updateDoc(d.ref, {
            employeeLoginId: newLoginId,
            updatedAt: serverTimestamp()
          }).catch(err => console.warn('Employee login ID backfill warning:', err));
        }
      }
    } catch (err) {
      console.warn('backfillEmployeeLoginIds error:', err);
    }
  }
}

export const firestoreService = new FirestoreHospitalService();
