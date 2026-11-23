export type AppointmentStatus =
  | 'scheduled'
  | 'requested'
  | 'waiting'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  hospitalId: string;
  tokenNumber: number;
  tokenFormatted?: string; // e.g. OP-101
  bookingSource?: 'online' | 'walk_in';
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;
  type: 'general' | 'follow_up' | 'emergency' | 'telehealth';
  status: AppointmentStatus;
  chiefComplaint: string;
  problemDescription?: string;
  bookedAt: string;
  consultationFee: number;
  isFeePaid: boolean;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  dosage: string; // e.g. 1 Tab Oral BD
  frequency?: string; // e.g. 1-0-1 (morning-afternoon-night)
  duration?: string; // e.g. 5 days
  durationDays?: number;
  timing?: 'before_food' | 'after_food' | 'with_food' | 'as_needed';
  instructions?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  posMedicineId?: string;
  isDispensed?: boolean;
}

export interface AdmissionRecommendation {
  isVip: boolean;
  reason?: string;
  notes: string;
  status: 'pending' | 'allocated' | 'rejected';
}

export interface ConsultationRecord {
  id: string;
  hospitalId: string;
  appointmentId: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  consultedAt: string;
  symptoms?: string[];
  chiefComplaints?: string;
  clinicalFindings: string;
  provisionalDiagnosis: string;
  finalDiagnosis?: string;
  prescriptions: PrescriptionItem[];
  labTestsOrdered?: string[];
  labOrdersList?: {
    testId: string;
    testName: string;
    category: string;
    sampleType?: string;
    price: number;
  }[];
  radiologyTestsOrdered?: string[];
  radiologyOrdered?: string[];
  treatmentPlan: string;
  followUpDate?: string;
  clinicalNotes?: string;
  consultationFee?: number;
  procedureFee?: number;
  procedureDescription?: string;
  admissionRequest?: AdmissionRecommendation;
  status: 'draft' | 'completed';
}

export interface LabOrder {
  id: string;
  hospitalId: string;
  orderNumber: string; // e.g. LAB-2026-0045
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  testCategory: string;
  testName: string;
  sampleType: string;
  sampleStatus: 'pending' | 'pending_collection' | 'collected' | 'in_process' | 'completed' | 'verified' | 'cancelled';
  collectedAt?: string;
  collectedBy?: string;
  resultValue?: string;
  referenceRange: string;
  unit: string;
  isAbnormal?: boolean;
  remarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  reportUrl?: string;
  cost: number;
  isBilled: boolean;
  orderedAt: string;
  testId?: string;
}

export interface RadiologyOrder {
  id: string;
  hospitalId: string;
  orderNumber: string; // e.g. RAD-2026-012
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorId: string;
  doctorName: string;
  modality: 'X-Ray' | 'CT Scan' | 'MRI' | 'Ultrasound' | 'ECG';
  bodyPart: string;
  clinicalIndication: string;
  status: 'requested' | 'scheduled' | 'in_progress' | 'reported' | 'verified';
  technicianName?: string;
  findings?: string;
  impression?: string;
  radiologistName?: string;
  verifiedAt?: string;
  scanImageUrl?: string;
  cost: number;
  isBilled: boolean;
  orderedAt: string;
}
