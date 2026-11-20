export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  hospitalId: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;
  type: 'general' | 'follow_up' | 'emergency' | 'telehealth';
  status: AppointmentStatus;
  chiefComplaint: string;
  bookedAt: string;
  consultationFee: number;
  isFeePaid: boolean;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  dosage: string; // e.g. 500mg
  frequency: string; // e.g. 1-0-1 (morning-afternoon-night)
  duration: string; // e.g. 5 days
  timing: 'before_food' | 'after_food' | 'with_food' | 'as_needed';
  instructions: string;
}

export interface ConsultationRecord {
  id: string;
  hospitalId: string;
  appointmentId: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  consultedAt: string;
  symptoms: string[];
  clinicalFindings: string;
  provisionalDiagnosis: string;
  finalDiagnosis?: string;
  prescriptions: PrescriptionItem[];
  labTestsOrdered?: string[];
  radiologyTestsOrdered?: string[];
  radiologyOrdered?: string[];
  treatmentPlan: string;
  followUpDate?: string;
  clinicalNotes?: string;
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
  testCategory: 'Haematology' | 'Biochemistry' | 'Microbiology' | 'Pathology' | 'Serology';
  testName: string;
  sampleType: 'Whole Blood' | 'Serum' | 'Urine' | 'Sputum' | 'Swab';
  sampleStatus: 'pending_collection' | 'collected' | 'in_process' | 'completed' | 'verified';
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
