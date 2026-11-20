export interface Patient {
  id: string;
  hospitalId: string;
  uhid: string; // Unique Hospital Identification Number, e.g. UPH-P2026-001
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  phone: string;
  email?: string;
  address: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: string[];
  chronicConditions: string[];
  medicalHistorySummary?: string;
  photoUrl?: string;
  registeredAt: string;
  lastVisitAt?: string;
  status: 'OP' | 'IP' | 'Discharged';
}

export interface VitalSign {
  id: string;
  hospitalId: string;
  patientId: string;
  uhid: string;
  recordedAt: string;
  recordedBy: {
    id: string;
    name: string;
    role: string;
  };
  bloodPressureSystolic: number; // mmHg
  bloodPressureDiastolic: number; // mmHg
  heartRatePulse: number; // bpm
  temperature: number; // °F
  spo2: number; // %
  respiratoryRate: number; // breaths/min
  bloodGlucose?: number; // mg/dL
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  notes?: string;
}
