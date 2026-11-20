import type { Hospital, Department } from '../types/hospital';
import type { RoleTemplate, RoleId } from '../types/roles';
import type { Employee } from '../types/employee';
import type { RoleRequest } from '../types/roleRequest';
import type { Patient, VitalSign } from '../types/patient';
import type { Appointment, ConsultationRecord, LabOrder, RadiologyOrder } from '../types/clinical';
import type { Bed, Ward, Admission } from '../types/admission';
import type { Medicine, PharmacyDispense } from '../types/pharmacy';
import type { Invoice, HospitalExpense } from '../types/billing';
import type { GeneralInventoryItem, PurchaseOrder } from '../types/inventory';
import type { AttendanceRecord, LeaveRequest, PayrollRecord } from '../types/hr';
import type { AmbulanceTrip, HousekeepingTask, SecurityEntry, MaintenanceRequest } from '../types/support';
import type { HospitalNotification, AuditLog } from '../types/audit';
import { INITIAL_ROLE_TEMPLATES } from '../constants/roleTemplates';

// Default Multi-Hospital Seed
export const DEFAULT_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-001',
    name: 'Upstage Multi-Speciality Hospital',
    tagline: 'Advanced Clinical Care & Research Institute',
    code: 'UPH-01',
    address: '42 Healthway Boulevard, Medical Enclave',
    city: 'New Delhi',
    phone: '+91 11 4982 7000',
    email: 'contact@upstagehospital.org',
    ownerId: 'emp-owner-01',
    ownerName: 'Dr. Rajeshwar Sharma, MD (CEO)',
    createdAt: '2026-01-15T09:00:00Z',
    activeModules: [
      'opd', 'ipd', 'emergency', 'doctor_clinical', 'nursing', 'pharmacy',
      'laboratory', 'radiology', 'billing', 'accounts', 'inventory', 'hr_payroll',
      'ambulance', 'housekeeping', 'security', 'maintenance'
    ],
    settings: {
      currency: '₹',
      taxRate: 5.0,
      opdConsultationValidityDays: 7,
      emergencyContact: '+91 11 4982 7999',
      operatingHours: '24 Hours Emergency & IPD / 08:00 - 20:00 OPD'
    }
  },
  {
    id: 'hosp-002',
    name: 'Upstage City Clinic & Diagnostic Center',
    tagline: 'Outpatient Care & Preventive Health',
    code: 'UPH-02',
    address: '88 South Park Avenue',
    city: 'Mumbai',
    phone: '+91 22 2841 5500',
    email: 'mumbai@upstagehospital.org',
    ownerId: 'emp-owner-02',
    ownerName: 'Dr. Ananya Roy, MS',
    createdAt: '2026-03-01T10:00:00Z',
    activeModules: ['opd', 'doctor_clinical', 'pharmacy', 'laboratory', 'billing'],
    settings: {
      currency: '₹',
      taxRate: 5.0,
      opdConsultationValidityDays: 5,
      emergencyContact: '+91 22 2841 5599',
      operatingHours: '08:00 - 20:00 Mon-Sat'
    }
  }
];

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-gm', hospitalId: 'hosp-001', name: 'General Medicine', code: 'MED', category: 'clinical', headDoctorName: 'Dr. Rajeshwar Sharma', isActive: true, operatingHours: '24/7', description: 'Internal medicine and primary care' },
  { id: 'dept-cardio', hospitalId: 'hosp-001', name: 'Cardiology', code: 'CARD', category: 'clinical', headDoctorName: 'Dr. Vikram Malhotra', isActive: true, operatingHours: '09:00 - 18:00', description: 'Cardiovascular diagnostics and interventions' },
  { id: 'dept-ortho', hospitalId: 'hosp-001', name: 'Orthopaedics', code: 'ORTH', category: 'clinical', headDoctorName: 'Dr. Sunita Patel', isActive: true, operatingHours: '09:00 - 17:00', description: 'Joint replacement, trauma and bone health' },
  { id: 'dept-ped', hospitalId: 'hosp-001', name: 'Paediatrics', code: 'PED', category: 'clinical', headDoctorName: 'Dr. Arvind Rao', isActive: true, operatingHours: '08:00 - 20:00', description: 'Child care, immunization and neonatal' },
  { id: 'dept-emg', hospitalId: 'hosp-001', name: 'Emergency & Trauma', code: 'EMG', category: 'clinical', headDoctorName: 'Dr. Siddharth Sen', isActive: true, operatingHours: '24/7', description: 'Immediate resuscitation and critical emergency' },
  { id: 'dept-lab', hospitalId: 'hosp-001', name: 'Laboratory & Pathology', code: 'LAB', category: 'diagnostic', isActive: true, operatingHours: '24/7', description: 'Hematology, biochemistry and microbiological tests' },
  { id: 'dept-rad', hospitalId: 'hosp-001', name: 'Radiology & Imaging', code: 'RAD', category: 'diagnostic', isActive: true, operatingHours: '24/7', description: 'Digital X-ray, Ultrasound, CT and MRI' },
  { id: 'dept-pharm', hospitalId: 'hosp-001', name: 'Pharmacy Services', code: 'PHARM', category: 'support', isActive: true, operatingHours: '24/7', description: 'Inpatient and outpatient medicine dispensing' },
  { id: 'dept-admin', hospitalId: 'hosp-001', name: 'Hospital Administration', code: 'ADM', category: 'administrative', isActive: true, operatingHours: '09:00 - 18:00', description: 'Executive management and staff operations' }
];

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-owner-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-001',
    name: 'Dr. Rajeshwar Sharma',
    email: 'owner@upstagehospital.org',
    phone: '+91 98200 11001',
    departmentId: 'dept-gm',
    departmentName: 'General Medicine',
    designation: 'Chief Medical Director & Hospital CEO',
    primaryRole: 'owner',
    additionalRoles: ['doctor'],
    qualification: 'MD, FACP (Harvard Medical)',
    licenseNumber: 'MCI-DEL-24819',
    specialization: 'Internal Medicine & Critical Care',
    consultationFee: 1200,
    status: 'active',
    joiningDate: '2024-01-01',
    gender: 'Male',
    employmentType: 'Full-time',
    salaryDetails: { basic: 120000, allowances: 30000, deductions: 10000, net: 140000 },
    attendanceStatus: 'present'
  },
  {
    id: 'emp-admin-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-002',
    name: 'Pooja Deshmukh',
    email: 'admin@upstagehospital.org',
    phone: '+91 98200 11002',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Chief Operating Officer / Hospital Admin',
    primaryRole: 'admin',
    additionalRoles: [],
    qualification: 'MHA (Healthcare Administration)',
    status: 'active',
    joiningDate: '2024-02-15',
    gender: 'Female',
    employmentType: 'Full-time',
    salaryDetails: { basic: 85000, allowances: 20000, deductions: 7000, net: 98000 },
    attendanceStatus: 'present'
  },
  {
    id: 'emp-hr-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-003',
    name: 'Kavita Nambiar',
    email: 'hr@upstagehospital.org',
    phone: '+91 98200 11003',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Head of Human Resources',
    primaryRole: 'hr_manager',
    additionalRoles: [],
    qualification: 'MBA - Human Resource Management',
    status: 'active',
    joiningDate: '2024-03-01',
    gender: 'Female',
    employmentType: 'Full-time',
    salaryDetails: { basic: 65000, allowances: 15000, deductions: 5000, net: 75000 },
    attendanceStatus: 'present'
  },
  {
    id: 'emp-doc-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-101',
    name: 'Dr. Vikram Malhotra',
    email: 'doctor@upstagehospital.org',
    phone: '+91 98200 11004',
    departmentId: 'dept-cardio',
    departmentName: 'Cardiology',
    designation: 'Senior Consultant Cardiologist',
    primaryRole: 'doctor',
    additionalRoles: [],
    qualification: 'DM (Cardiology), MD, MBBS',
    licenseNumber: 'MCI-DEL-39102',
    specialization: 'Interventional Cardiology',
    consultationFee: 1500,
    status: 'active',
    joiningDate: '2024-04-10',
    gender: 'Male',
    employmentType: 'Full-time',
    salaryDetails: { basic: 150000, allowances: 35000, deductions: 15000, net: 170000 },
    attendanceStatus: 'present'
  },
  {
    id: 'emp-pending-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-402',
    name: 'Dr. Siddharth Verma',
    email: 'siddharth.verma@gmail.com',
    phone: '+91 98111 44556',
    address: 'B-12 Greater Kailash I, New Delhi',
    dob: '1986-07-19',
    gender: 'Male',
    departmentId: 'dept-cardio',
    departmentName: 'Cardiology',
    designation: 'Associate Cardiologist',
    primaryRole: 'doctor',
    additionalRoles: [],
    qualification: 'MD (Cardiology), MBBS',
    licenseNumber: 'MCI-DEL-44192',
    status: 'pending_approval',
    joiningDate: '2026-12-01',
    employmentType: 'Full-time',
    salaryDetails: {
      basic: 130000,
      allowances: 25000,
      deductions: 10000,
      net: 145000
    },
    approvalDetails: {
      submittedBy: {
        id: 'emp-hr-01',
        name: 'Kavita Nambiar',
        role: 'hr_manager'
      },
      submittedAt: '2026-11-20T10:30:00Z',
      status: 'pending'
    }
  },
  {
    id: 'emp-nurse-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-201',
    name: 'Sister Mary Fernandez',
    email: 'nurse@upstagehospital.org',
    phone: '+91 98200 11005',
    departmentId: 'dept-gm',
    departmentName: 'General Medicine',
    designation: 'Head Nursing Superintendent',
    primaryRole: 'nurse',
    additionalRoles: [],
    qualification: 'B.Sc. Nursing, Critical Care Cert.',
    licenseNumber: 'INC-RN-88190',
    status: 'active',
    joiningDate: '2024-04-15',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-rec-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-301',
    name: 'Kumar Varma',
    email: 'reception@upstagehospital.org',
    phone: '+91 98200 11006',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Front Office Executive',
    primaryRole: 'receptionist',
    additionalRoles: ['billing_staff'], // Kumar has Receptionist + Approved Additional Role Billing Staff!
    qualification: 'B.Com, Front Office Diploma',
    status: 'active',
    joiningDate: '2024-05-01',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-bill-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-302',
    name: 'Rohan Mehra',
    email: 'billing@upstagehospital.org',
    phone: '+91 98200 11007',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Senior Billing Officer',
    primaryRole: 'billing_staff',
    additionalRoles: [],
    qualification: 'B.Com, Tally Certified',
    status: 'active',
    joiningDate: '2024-05-15',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-pharm-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-401',
    name: 'Suresh Singhania',
    email: 'pharmacy@upstagehospital.org',
    phone: '+91 98200 11008',
    departmentId: 'dept-pharm',
    departmentName: 'Pharmacy Services',
    designation: 'Chief Pharmacist',
    primaryRole: 'pharmacist',
    additionalRoles: [],
    qualification: 'M.Pharm (Pharmacology)',
    licenseNumber: 'PCI-DEL-55910',
    status: 'active',
    joiningDate: '2024-06-01',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-lab-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-501',
    name: 'Anjali Nair',
    email: 'lab@upstagehospital.org',
    phone: '+91 98200 11009',
    departmentId: 'dept-lab',
    departmentName: 'Laboratory & Pathology',
    designation: 'Senior Medical Lab Technologist',
    primaryRole: 'lab_technician',
    additionalRoles: [],
    qualification: 'M.Sc. Medical Lab Technology',
    status: 'active',
    joiningDate: '2024-06-15',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-rad-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-601',
    name: 'Deepak Joshi',
    email: 'radiology@upstagehospital.org',
    phone: '+91 98200 11010',
    departmentId: 'dept-rad',
    departmentName: 'Radiology & Imaging',
    designation: 'Lead Radiologic Technologist',
    primaryRole: 'radiologist',
    additionalRoles: [],
    qualification: 'B.Sc. Medical Imaging Technology',
    status: 'active',
    joiningDate: '2024-07-01',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-ward-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-701',
    name: 'Ravi Shankar',
    email: 'ward@upstagehospital.org',
    phone: '+91 98200 11011',
    departmentId: 'dept-gm',
    departmentName: 'General Medicine',
    designation: 'Inpatient Ward Coordinator',
    primaryRole: 'ward_incharge',
    additionalRoles: [],
    qualification: 'Diploma in Hospital Operations',
    status: 'active',
    joiningDate: '2024-07-15',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-store-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-801',
    name: 'Manoj Tiwari',
    email: 'store@upstagehospital.org',
    phone: '+91 98200 11012',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Central Inventory Manager',
    primaryRole: 'store_manager',
    additionalRoles: [],
    qualification: 'Diploma in Supply Chain Management',
    status: 'active',
    joiningDate: '2024-08-01',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-acc-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-802',
    name: 'Sanjay Agarwal',
    email: 'accounts@upstagehospital.org',
    phone: '+91 98200 11013',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Senior Accountant & Auditor',
    primaryRole: 'accountant',
    additionalRoles: [],
    qualification: 'CA Inter, M.Com',
    status: 'active',
    joiningDate: '2024-08-15',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-amb-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-901',
    name: 'Harpreet Singh',
    email: 'ambulance@upstagehospital.org',
    phone: '+91 98200 11014',
    departmentId: 'dept-emg',
    departmentName: 'Emergency & Trauma',
    designation: 'Emergency Ambulance Pilot',
    primaryRole: 'ambulance_driver',
    additionalRoles: [],
    qualification: 'Commercial Heavy Badge, Basic Life Support (BLS)',
    status: 'active',
    joiningDate: '2024-09-01',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-hk-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-902',
    name: 'Geeta Devi',
    email: 'housekeeping@upstagehospital.org',
    phone: '+91 98200 11015',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Sanitation & Hygiene Supervisor',
    primaryRole: 'housekeeping',
    additionalRoles: [],
    qualification: 'Certificate in Infection Control',
    status: 'active',
    joiningDate: '2024-09-15',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-sec-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-903',
    name: 'Balwant Chauhan',
    email: 'security@upstagehospital.org',
    phone: '+91 98200 11016',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Chief Security Officer',
    primaryRole: 'security',
    additionalRoles: [],
    qualification: 'Ex-Defence Corps',
    status: 'active',
    joiningDate: '2024-10-01',
    attendanceStatus: 'present'
  },
  {
    id: 'emp-maint-01',
    hospitalId: 'hosp-001',
    employeeCode: 'EMP-904',
    name: 'Ashok Varma',
    email: 'maintenance@upstagehospital.org',
    phone: '+91 98200 11017',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
    designation: 'Biomedical & Facilities Engineer',
    primaryRole: 'maintenance',
    additionalRoles: [],
    qualification: 'B.Tech Biomedical Engineering',
    status: 'active',
    joiningDate: '2024-10-15',
    attendanceStatus: 'present'
  }
];

export const DEFAULT_ROLE_REQUESTS: RoleRequest[] = [
  {
    id: 'req-001',
    hospitalId: 'hosp-001',
    employeeId: 'emp-rec-01',
    employeeName: 'Kumar Varma',
    employeeCode: 'EMP-301',
    currentPrimaryRole: 'receptionist',
    requestedRole: 'billing_staff',
    reason: 'Front desk coverage during evening cashier shift and OPD billing overload.',
    requestedBy: {
      id: 'emp-hr-01',
      name: 'Kavita Nambiar',
      role: 'hr_manager'
    },
    status: 'approved',
    reviewedBy: {
      id: 'emp-admin-01',
      name: 'Pooja Deshmukh (Admin)'
    },
    createdAt: '2026-11-10T09:30:00Z',
    reviewedAt: '2026-11-10T11:00:00Z'
  },
  {
    id: 'req-002',
    hospitalId: 'hosp-001',
    employeeId: 'emp-nurse-01',
    employeeName: 'Sister Mary Fernandez',
    employeeCode: 'EMP-201',
    currentPrimaryRole: 'nurse',
    requestedRole: 'ward_incharge',
    reason: 'Promoted to supervise evening bed turnarounds and ward nurse coordination.',
    requestedBy: {
      id: 'emp-hr-01',
      name: 'Kavita Nambiar',
      role: 'hr_manager'
    },
    status: 'pending',
    createdAt: '2026-11-19T14:15:00Z'
  },
  {
    id: 'req-003',
    hospitalId: 'hosp-001',
    employeeId: 'emp-bill-01',
    employeeName: 'Rohan Mehra',
    employeeCode: 'EMP-302',
    currentPrimaryRole: 'billing_staff',
    requestedRole: 'accountant',
    reason: 'Assisting finance head with monthly cash reconciliations.',
    requestedBy: {
      id: 'emp-bill-01',
      name: 'Rohan Mehra',
      role: 'billing_staff'
    },
    status: 'pending',
    createdAt: '2026-11-19T16:00:00Z'
  }
];

export const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    hospitalId: 'hosp-001',
    uhid: 'UPH-2026-00101',
    name: 'Amitabh Sen',
    age: 58,
    gender: 'Male',
    dob: '1968-05-12',
    phone: '+91 98111 22334',
    email: 'amitabh.sen@example.com',
    address: 'Flat 402, Lotus Greens, Sector 78, Noida',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Sunita Sen (Wife)',
      relationship: 'Spouse',
      phone: '+91 98111 22335'
    },
    allergies: ['Penicillin', 'Sulfa Drugs'],
    chronicConditions: ['Type 2 Diabetes Mellitus', 'Hypertension'],
    medicalHistorySummary: 'Known diabetic for 8 years on Metformin. History of angioplasty in 2021.',
    registeredAt: '2026-02-10T10:00:00Z',
    lastVisitAt: '2026-11-19T11:00:00Z',
    status: 'IP'
  },
  {
    id: 'pat-002',
    hospitalId: 'hosp-001',
    uhid: 'UPH-2026-00102',
    name: 'Priyanka Chopra',
    age: 34,
    gender: 'Female',
    dob: '1992-08-24',
    phone: '+91 97222 33445',
    email: 'priyanka.c@example.com',
    address: '14 Parkview Heights, GK-2, New Delhi',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Rohit Chopra',
      relationship: 'Brother',
      phone: '+91 97222 33449'
    },
    allergies: ['Aspirin'],
    chronicConditions: ['Hypothyroidism'],
    medicalHistorySummary: 'Thyronorm 50mcg daily. Complaining of palpitations and acute fatigue.',
    registeredAt: '2026-04-12T14:30:00Z',
    lastVisitAt: '2026-11-20T09:15:00Z',
    status: 'OP'
  },
  {
    id: 'pat-003',
    hospitalId: 'hosp-001',
    uhid: 'UPH-2026-00103',
    name: 'Master Aarav Sharma',
    age: 7,
    gender: 'Male',
    dob: '2019-11-03',
    phone: '+91 99333 44556',
    address: 'B-12 Vasundhara Enclave, Delhi',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Meena Sharma',
      relationship: 'Mother',
      phone: '+91 99333 44556'
    },
    allergies: [],
    chronicConditions: ['Mild Asthma'],
    medicalHistorySummary: 'Recurrent wheezing with seasonal cold.',
    registeredAt: '2026-08-01T11:00:00Z',
    lastVisitAt: '2026-11-18T16:00:00Z',
    status: 'Discharged'
  }
];

export const DEFAULT_VITALS: VitalSign[] = [
  {
    id: 'vit-001',
    hospitalId: 'hosp-001',
    patientId: 'pat-001',
    uhid: 'UPH-2026-00101',
    recordedAt: '2026-11-20T08:30:00Z',
    recordedBy: {
      id: 'emp-nurse-01',
      name: 'Sister Mary Fernandez',
      role: 'nurse'
    },
    bloodPressureSystolic: 138,
    bloodPressureDiastolic: 88,
    heartRatePulse: 78,
    temperature: 98.6,
    spo2: 97,
    respiratoryRate: 18,
    bloodGlucose: 142,
    weightKg: 74,
    heightCm: 172,
    bmi: 25.0,
    notes: 'Morning round vitals stable. Patient resting comfortably in Bed GW-01.'
  },
  {
    id: 'vit-002',
    hospitalId: 'hosp-001',
    patientId: 'pat-002',
    uhid: 'UPH-2026-00102',
    recordedAt: '2026-11-20T09:20:00Z',
    recordedBy: {
      id: 'emp-nurse-01',
      name: 'Sister Mary Fernandez',
      role: 'nurse'
    },
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 76,
    heartRatePulse: 84,
    temperature: 98.4,
    spo2: 99,
    respiratoryRate: 16,
    bloodGlucose: 96,
    weightKg: 58,
    heightCm: 164,
    bmi: 21.6,
    notes: 'OPD pre-consultation vitals recorded.'
  }
];

export const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    hospitalId: 'hosp-001',
    tokenNumber: 1,
    patientId: 'pat-002',
    patientName: 'Priyanka Chopra',
    patientUhid: 'UPH-2026-00102',
    patientPhone: '+91 97222 33445',
    doctorId: 'emp-doc-01',
    doctorName: 'Dr. Vikram Malhotra',
    departmentId: 'dept-cardio',
    departmentName: 'Cardiology',
    appointmentDate: '2026-11-20',
    timeSlot: '09:30 AM',
    type: 'general',
    status: 'in_consultation',
    chiefComplaint: 'Chest tightness upon mild exertion and fatigue for 3 days.',
    bookedAt: '2026-11-19T18:00:00Z',
    consultationFee: 1500,
    isFeePaid: true
  },
  {
    id: 'apt-002',
    hospitalId: 'hosp-001',
    tokenNumber: 2,
    patientId: 'pat-003',
    patientName: 'Master Aarav Sharma',
    patientUhid: 'UPH-2026-00103',
    patientPhone: '+91 99333 44556',
    doctorId: 'emp-owner-01',
    doctorName: 'Dr. Rajeshwar Sharma',
    departmentId: 'dept-gm',
    departmentName: 'General Medicine',
    appointmentDate: '2026-11-20',
    timeSlot: '10:00 AM',
    type: 'follow_up',
    status: 'checked_in',
    chiefComplaint: 'Follow-up for seasonal asthma inhaler review.',
    bookedAt: '2026-11-19T19:30:00Z',
    consultationFee: 1200,
    isFeePaid: true
  },
  {
    id: 'apt-003',
    hospitalId: 'hosp-001',
    tokenNumber: 3,
    patientId: 'pat-001',
    patientName: 'Amitabh Sen',
    patientUhid: 'UPH-2026-00101',
    patientPhone: '+91 98111 22334',
    doctorId: 'emp-doc-01',
    doctorName: 'Dr. Vikram Malhotra',
    departmentId: 'dept-cardio',
    departmentName: 'Cardiology',
    appointmentDate: '2026-11-20',
    timeSlot: '11:30 AM',
    type: 'general',
    status: 'scheduled',
    chiefComplaint: 'Inpatient cardiology morning review round.',
    bookedAt: '2026-11-20T08:00:00Z',
    consultationFee: 1500,
    isFeePaid: true
  }
];

export const DEFAULT_WARDS: Ward[] = [
  { id: 'ward-01', hospitalId: 'hosp-001', name: 'General Ward Male (Floor 2)', type: 'General Ward', floor: '2nd Floor', inchargeStaffName: 'Ravi Shankar', totalBeds: 12, availableBeds: 8 },
  { id: 'ward-02', hospitalId: 'hosp-001', name: 'General Ward Female (Floor 2)', type: 'General Ward', floor: '2nd Floor', inchargeStaffName: 'Sister Mary Fernandez', totalBeds: 12, availableBeds: 9 },
  { id: 'ward-03', hospitalId: 'hosp-001', name: 'Intensive Care Unit (ICU)', type: 'ICU', floor: '3rd Floor', inchargeStaffName: 'Sister Mary Fernandez', totalBeds: 8, availableBeds: 4 },
  { id: 'ward-04', hospitalId: 'hosp-001', name: 'Deluxe Private Rooms', type: 'Private Deluxe', floor: '4th Floor', inchargeStaffName: 'Ravi Shankar', totalBeds: 6, availableBeds: 5 }
];

export const DEFAULT_BEDS: Bed[] = [
  { id: 'bed-gw-01', hospitalId: 'hosp-001', bedNumber: 'GW-01', wardId: 'ward-01', wardName: 'General Ward Male (Floor 2)', wardType: 'General Ward', floor: '2nd Floor', dailyRate: 1500, status: 'occupied', currentPatientId: 'pat-001', currentPatientName: 'Amitabh Sen', currentPatientUhid: 'UPH-2026-00101', admissionId: 'adm-001' },
  { id: 'bed-gw-02', hospitalId: 'hosp-001', bedNumber: 'GW-02', wardId: 'ward-01', wardName: 'General Ward Male (Floor 2)', wardType: 'General Ward', floor: '2nd Floor', dailyRate: 1500, status: 'available' },
  { id: 'bed-gw-03', hospitalId: 'hosp-001', bedNumber: 'GW-03', wardId: 'ward-01', wardName: 'General Ward Male (Floor 2)', wardType: 'General Ward', floor: '2nd Floor', dailyRate: 1500, status: 'cleaning' },
  { id: 'bed-gw-04', hospitalId: 'hosp-001', bedNumber: 'GW-04', wardId: 'ward-01', wardName: 'General Ward Male (Floor 2)', wardType: 'General Ward', floor: '2nd Floor', dailyRate: 1500, status: 'maintenance' },
  { id: 'bed-icu-01', hospitalId: 'hosp-001', bedNumber: 'ICU-01', wardId: 'ward-03', wardName: 'Intensive Care Unit (ICU)', wardType: 'ICU', floor: '3rd Floor', dailyRate: 7500, status: 'available' },
  { id: 'bed-icu-02', hospitalId: 'hosp-001', bedNumber: 'ICU-02', wardId: 'ward-03', wardName: 'Intensive Care Unit (ICU)', wardType: 'ICU', floor: '3rd Floor', dailyRate: 7500, status: 'available' },
  { id: 'bed-dlx-01', hospitalId: 'hosp-001', bedNumber: 'DLX-401', wardId: 'ward-04', wardName: 'Deluxe Private Rooms', wardType: 'Private Deluxe', floor: '4th Floor', dailyRate: 5000, status: 'available' }
];

export const DEFAULT_ADMISSIONS: Admission[] = [
  {
    id: 'adm-001',
    hospitalId: 'hosp-001',
    admissionNumber: 'IP-2026-0104',
    patientId: 'pat-001',
    patientName: 'Amitabh Sen',
    patientUhid: 'UPH-2026-00101',
    admittingDoctorId: 'emp-doc-01',
    admittingDoctorName: 'Dr. Vikram Malhotra',
    wardId: 'ward-01',
    wardName: 'General Ward Male (Floor 2)',
    bedId: 'bed-gw-01',
    bedNumber: 'GW-01',
    admissionDate: '2026-11-18T14:00:00Z',
    admissionReason: 'Acute coronary syndrome evaluation and observation',
    admittingDiagnosis: 'Unstable Angina / Post-angioplasty surveillance',
    assignedNurseName: 'Sister Mary Fernandez',
    advanceDepositPaid: 25000,
    status: 'active'
  }
];

export const DEFAULT_MEDICINES: Medicine[] = [
  {
    id: 'med-001',
    hospitalId: 'hosp-001',
    code: 'MED-ATRV-20',
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin Calcium',
    category: 'Tablet',
    manufacturer: 'Sun Pharma',
    unit: 'Strips of 10',
    minStockAlertLevel: 50,
    currentStock: 180,
    batches: [
      { batchNumber: 'ATV-26A', expiryDate: '2027-08-31', quantity: 180, purchasePricePerUnit: 65, sellingPricePerUnit: 110, mrp: 120 }
    ]
  },
  {
    id: 'med-002',
    hospitalId: 'hosp-001',
    code: 'MED-PCM-650',
    name: 'Dolo 650mg',
    genericName: 'Paracetamol',
    category: 'Tablet',
    manufacturer: 'Micro Labs',
    unit: 'Strips of 15',
    minStockAlertLevel: 100,
    currentStock: 350,
    batches: [
      { batchNumber: 'DLO-25J', expiryDate: '2028-01-31', quantity: 350, purchasePricePerUnit: 20, sellingPricePerUnit: 35, mrp: 38 }
    ]
  },
  {
    id: 'med-003',
    hospitalId: 'hosp-001',
    code: 'MED-AMX-500',
    name: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin + Clavulanic Acid',
    category: 'Tablet',
    manufacturer: 'GSK',
    unit: 'Strips of 10',
    minStockAlertLevel: 30,
    currentStock: 75,
    batches: [
      { batchNumber: 'AUG-26C', expiryDate: '2027-04-30', quantity: 75, purchasePricePerUnit: 140, sellingPricePerUnit: 210, mrp: 225 }
    ]
  },
  {
    id: 'med-004',
    hospitalId: 'hosp-001',
    code: 'MED-PAN-40',
    name: 'Pan 40mg',
    genericName: 'Pantoprazole Sodium',
    category: 'Tablet',
    manufacturer: 'Alkem Laboratories',
    unit: 'Strips of 10',
    minStockAlertLevel: 40,
    currentStock: 15, // Low stock trigger!
    batches: [
      { batchNumber: 'PAN-25F', expiryDate: '2026-12-31', quantity: 15, purchasePricePerUnit: 70, sellingPricePerUnit: 125, mrp: 135 }
    ]
  }
];

export const DEFAULT_LAB_ORDERS: LabOrder[] = [
  {
    id: 'lab-001',
    hospitalId: 'hosp-001',
    orderNumber: 'LAB-2026-0041',
    patientId: 'pat-001',
    patientName: 'Amitabh Sen',
    patientUhid: 'UPH-2026-00101',
    patientAge: 58,
    patientGender: 'Male',
    doctorId: 'emp-doc-01',
    doctorName: 'Dr. Vikram Malhotra',
    testCategory: 'Biochemistry',
    testName: 'Lipid Profile Full Panel',
    sampleType: 'Serum',
    sampleStatus: 'completed',
    collectedAt: '2026-11-19T08:30:00Z',
    collectedBy: 'Anjali Nair',
    resultValue: 'Total Cholesterol: 234, HDL: 38, LDL: 154, Triglycerides: 210',
    referenceRange: 'Total Cholesterol: <200 mg/dL, LDL: <100 mg/dL',
    unit: 'mg/dL',
    isAbnormal: true,
    remarks: 'Elevated LDL and Serum Triglycerides. Statin therapy advised.',
    verifiedBy: 'Dr. R. K. Varma (Pathologist)',
    verifiedAt: '2026-11-19T14:00:00Z',
    cost: 850,
    isBilled: true,
    orderedAt: '2026-11-18T15:00:00Z'
  },
  {
    id: 'lab-002',
    hospitalId: 'hosp-001',
    orderNumber: 'LAB-2026-0042',
    patientId: 'pat-002',
    patientName: 'Priyanka Chopra',
    patientUhid: 'UPH-2026-00102',
    patientAge: 34,
    patientGender: 'Female',
    doctorId: 'emp-doc-01',
    doctorName: 'Dr. Vikram Malhotra',
    testCategory: 'Biochemistry',
    testName: 'Thyroid Stimulating Hormone (TSH, Ultra)',
    sampleType: 'Serum',
    sampleStatus: 'in_process',
    collectedAt: '2026-11-20T09:35:00Z',
    collectedBy: 'Anjali Nair',
    referenceRange: '0.40 - 4.50',
    unit: 'uIU/mL',
    cost: 450,
    isBilled: true,
    orderedAt: '2026-11-20T09:30:00Z'
  }
];

export const DEFAULT_RADIOLOGY_ORDERS: RadiologyOrder[] = [
  {
    id: 'rad-001',
    hospitalId: 'hosp-001',
    orderNumber: 'RAD-2026-0012',
    patientId: 'pat-001',
    patientName: 'Amitabh Sen',
    patientUhid: 'UPH-2026-00101',
    doctorId: 'emp-doc-01',
    doctorName: 'Dr. Rajesh Sharma',
    modality: 'X-Ray',
    bodyPart: 'Chest PA View',
    clinicalIndication: 'Chronic productive cough, suspected lower respiratory consolidation',
    status: 'reported',
    technicianName: 'Deepak Joshi',
    findings: 'Bilateral lung fields clear. Costophrenic angles sharp. Normal cardiothoracic ratio. No focal consolidation or pleural effusion.',
    impression: 'Normal study. No active cardiopulmonary pathology.',
    radiologistName: 'Dr. K. N. Rao (Consultant Radiologist)',
    verifiedAt: '2026-11-19T16:30:00Z',
    cost: 750,
    isBilled: true,
    orderedAt: '2026-11-19T11:00:00Z'
  },
  {
    id: 'rad-002',
    hospitalId: 'hosp-001',
    orderNumber: 'RAD-2026-0013',
    patientId: 'pat-002',
    patientName: 'Priyanka Chopra',
    patientUhid: 'UPH-2026-00102',
    doctorId: 'emp-doc-01',
    doctorName: 'Dr. Rajesh Sharma',
    modality: 'Ultrasound',
    bodyPart: 'Whole Abdomen & Pelvis',
    clinicalIndication: 'Right hypochondriac pain, rule out cholelithiasis',
    status: 'scheduled',
    technicianName: 'Deepak Joshi',
    cost: 1600,
    isBilled: true,
    orderedAt: '2026-11-20T10:15:00Z'
  },
  {
    id: 'rad-003',
    hospitalId: 'hosp-001',
    orderNumber: 'RAD-2026-0014',
    patientId: 'pat-003',
    patientName: 'Rahul Verma',
    patientUhid: 'UPH-2026-00103',
    doctorId: 'emp-doc-02',
    doctorName: 'Dr. Priya Patel',
    modality: 'CT Scan',
    bodyPart: 'NCCT Head / Brain',
    clinicalIndication: 'Severe acute headache, rule out intracranial bleed',
    status: 'in_progress',
    technicianName: 'Deepak Joshi',
    cost: 3500,
    isBilled: true,
    orderedAt: '2026-11-20T11:00:00Z'
  }
];

export const DEFAULT_EXPENSES: HospitalExpense[] = [
  {
    id: 'exp-001',
    hospitalId: 'hosp-001',
    expenseNumber: 'EXP-2026-0101',
    category: 'Pharmacy Restock',
    description: 'Bulk Procurement - Emergency Cardiac & Antibiotic Stock (Cipla / Sun Pharma)',
    amount: 145000,
    paidTo: 'Apex Medico Distributors Pvt Ltd',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-11-15',
    recordedByStaffName: 'Sanjay Agarwal (Accountant)',
    voucherNumber: 'VCH-9921'
  },
  {
    id: 'exp-002',
    hospitalId: 'hosp-001',
    expenseNumber: 'EXP-2026-0102',
    category: 'Medical Supplies',
    description: 'Medical Liquid Oxygen Refill - Cryogenic Tank Unit 1',
    amount: 58000,
    paidTo: 'Inox Air Products Ltd',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-11-18',
    recordedByStaffName: 'Sanjay Agarwal (Accountant)',
    voucherNumber: 'VCH-9922'
  },
  {
    id: 'exp-003',
    hospitalId: 'hosp-001',
    expenseNumber: 'EXP-2026-0103',
    category: 'Equipment Maintenance',
    description: 'Annual Maintenance Contract (AMC) - GE Healthcare 128-Slice CT Scanner',
    amount: 85000,
    paidTo: 'GE Healthcare South Asia Ltd',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-11-19',
    recordedByStaffName: 'Sanjay Agarwal (Accountant)',
    voucherNumber: 'VCH-9923'
  },
  {
    id: 'exp-004',
    hospitalId: 'hosp-001',
    expenseNumber: 'EXP-2026-0104',
    category: 'Utilities',
    description: 'High-Tension Commercial Electricity Bill & Generator Diesel Fuel',
    amount: 112000,
    paidTo: 'BSES Rajdhani Power Ltd',
    paymentMethod: 'upi',
    paymentDate: '2026-11-20',
    recordedByStaffName: 'Sanjay Agarwal (Accountant)',
    voucherNumber: 'VCH-9924'
  }
];

export const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    hospitalId: 'hosp-001',
    invoiceNumber: 'INV-2026-0881',
    invoiceType: 'OPD',
    patientId: 'pat-002',
    patientName: 'Priyanka Chopra',
    patientUhid: 'UPH-2026-00102',
    patientPhone: '+91 97222 33445',
    items: [
      { id: 'item-1', description: 'Consultation Fee - Dr. Vikram Malhotra (Cardiology)', category: 'Consultation', quantity: 1, unitPrice: 1500, total: 1500 },
      { id: 'item-2', description: 'Thyroid Panel TSH (Ultra)', category: 'Lab Test', quantity: 1, unitPrice: 450, total: 450 }
    ],
    subtotal: 1950,
    discountAmount: 0,
    taxAmount: 97.5,
    totalAmount: 2047.5,
    amountPaid: 2047.5,
    balanceDue: 0,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    transactionRef: 'UPI/2611200921/8892',
    createdAt: '2026-11-20T09:25:00Z',
    createdByStaffName: 'Rohan Mehra',
    receiptNumber: 'RCP-2026-0881'
  },
  {
    id: 'inv-002',
    hospitalId: 'hosp-001',
    invoiceNumber: 'INV-2026-0882',
    invoiceType: 'IPD',
    patientId: 'pat-001',
    patientName: 'Amitabh Sen',
    patientUhid: 'UPH-2026-00101',
    patientPhone: '+91 98111 22334',
    items: [
      { id: 'item-1', description: 'Bed Charges - General Ward Male (2 Nights @ ₹1,500)', category: 'Bed Charges', quantity: 2, unitPrice: 1500, total: 3000 },
      { id: 'item-2', description: 'Doctor Daily Inpatient Round (2 Visits)', category: 'Consultation', quantity: 2, unitPrice: 1000, total: 2000 },
      { id: 'item-3', description: 'Lipid Profile Panel (Diagnostic)', category: 'Lab Test', quantity: 1, unitPrice: 850, total: 850 },
      { id: 'item-4', description: 'Nursing & Monitoring Charges', category: 'Nursing', quantity: 2, unitPrice: 500, total: 1000 }
    ],
    subtotal: 6850,
    discountAmount: 0,
    taxAmount: 342.5,
    totalAmount: 7192.5,
    amountPaid: 25000, // Covered by advance deposit
    balanceDue: -17807.5, // Advance balance remaining
    paymentStatus: 'paid',
    paymentMethod: 'insurance',
    insuranceClaim: {
      tpaName: 'Star Health & Allied Insurance',
      policyNumber: 'POL-SH-992819',
      claimAmount: 7192.5,
      claimStatus: 'submitted'
    },
    createdAt: '2026-11-20T10:00:00Z',
    createdByStaffName: 'Rohan Mehra'
  }
];

export const DEFAULT_NOTIFICATIONS: HospitalNotification[] = [
  {
    id: 'notif-001',
    hospitalId: 'hosp-001',
    targetRole: 'admin',
    title: 'New Role Request Pending Approval',
    message: 'Sister Mary Fernandez requested additional role: Ward In-charge. Review required.',
    category: 'role_request',
    priority: 'high',
    isRead: false,
    createdAt: '2026-11-19T14:15:00Z'
  },
  {
    id: 'notif-002',
    hospitalId: 'hosp-001',
    targetRole: 'doctor',
    title: 'Lab Report Verified',
    message: 'Lipid Profile for Amitabh Sen (UPH-2026-00101) is ready with abnormal findings.',
    category: 'clinical',
    priority: 'normal',
    isRead: false,
    createdAt: '2026-11-19T14:05:00Z'
  },
  {
    id: 'notif-003',
    hospitalId: 'hosp-001',
    targetRole: 'pharmacist',
    title: 'Low Stock Alert: Pan 40mg',
    message: 'Only 15 strips remaining. Minimum threshold is 40 strips.',
    category: 'pharmacy',
    priority: 'high',
    isRead: false,
    createdAt: '2026-11-20T08:00:00Z'
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    hospitalId: 'hosp-001',
    actorId: 'emp-admin-01',
    actorName: 'Pooja Deshmukh',
    actorRole: 'admin',
    action: 'ROLE_REQUEST_APPROVED',
    module: 'Role Management',
    details: 'Approved additional role Billing Staff for Receptionist Kumar Varma (EMP-301).',
    timestamp: '2026-11-10T11:00:00Z'
  },
  {
    id: 'aud-002',
    hospitalId: 'hosp-001',
    actorId: 'emp-doc-01',
    actorName: 'Dr. Vikram Malhotra',
    actorRole: 'doctor',
    action: 'IPD_ADMISSION_ORDERED',
    module: 'IP Management',
    details: 'Admitted patient Amitabh Sen (UPH-2026-00101) to General Ward Bed GW-01.',
    timestamp: '2026-11-18T14:00:00Z'
  },
  {
    id: 'aud-003',
    hospitalId: 'hosp-001',
    actorId: 'emp-bill-01',
    actorName: 'Rohan Mehra',
    actorRole: 'billing_staff',
    action: 'PAYMENT_RECEIVED',
    module: 'Billing',
    details: 'Received ₹2,047.50 via UPI for Invoice INV-2026-0881 from Priyanka Chopra.',
    timestamp: '2026-11-20T09:25:00Z'
  }
];

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-001',
    hospitalId: 'hosp-001',
    employeeId: 'emp-owner-01',
    employeeCode: 'EMP-001',
    employeeName: 'Dr. Rajeshwar Sharma',
    departmentName: 'General Medicine',
    designation: 'Chief Medical Director & Hospital CEO',
    date: '2026-11-20',
    checkInTime: '08:30 AM',
    checkOutTime: '05:30 PM',
    status: 'present',
    workHours: 9.0,
    syncWithBiometric: true
  },
  {
    id: 'att-002',
    hospitalId: 'hosp-001',
    employeeId: 'emp-admin-01',
    employeeCode: 'EMP-002',
    employeeName: 'Pooja Deshmukh',
    departmentName: 'Hospital Administration',
    designation: 'Chief Operating Officer / Hospital Admin',
    date: '2026-11-20',
    checkInTime: '08:45 AM',
    checkOutTime: '05:45 PM',
    status: 'present',
    workHours: 9.0,
    syncWithBiometric: true
  },
  {
    id: 'att-003',
    hospitalId: 'hosp-001',
    employeeId: 'emp-hr-01',
    employeeCode: 'EMP-003',
    employeeName: 'Kavita Nambiar',
    departmentName: 'Hospital Administration',
    designation: 'Head of Human Resources',
    date: '2026-11-20',
    checkInTime: '09:00 AM',
    checkOutTime: '06:00 PM',
    status: 'present',
    workHours: 9.0,
    syncWithBiometric: true
  },
  {
    id: 'att-004',
    hospitalId: 'hosp-001',
    employeeId: 'emp-doc-01',
    employeeCode: 'EMP-101',
    employeeName: 'Dr. Vikram Malhotra',
    departmentName: 'Cardiology',
    designation: 'Senior Consultant Cardiologist',
    date: '2026-11-20',
    checkInTime: '09:10 AM',
    status: 'present',
    workHours: 8.0,
    syncWithBiometric: true
  },
  {
    id: 'att-005',
    hospitalId: 'hosp-001',
    employeeId: 'emp-nurse-01',
    employeeCode: 'EMP-201',
    employeeName: 'Sister Mary Fernandez',
    departmentName: 'General Medicine',
    designation: 'Head Nursing Superintendent',
    date: '2026-11-20',
    checkInTime: '07:00 AM',
    checkOutTime: '03:00 PM',
    status: 'present',
    workHours: 8.0,
    syncWithBiometric: true
  },
  {
    id: 'att-006',
    hospitalId: 'hosp-001',
    employeeId: 'emp-rec-01',
    employeeCode: 'EMP-301',
    employeeName: 'Kumar Varma',
    departmentName: 'Hospital Administration',
    designation: 'Front Office Executive',
    date: '2026-11-20',
    checkInTime: '08:55 AM',
    checkOutTime: '05:30 PM',
    status: 'present',
    workHours: 8.5,
    syncWithBiometric: true
  },
  {
    id: 'att-007',
    hospitalId: 'hosp-001',
    employeeId: 'emp-bill-01',
    employeeCode: 'EMP-302',
    employeeName: 'Rohan Mehra',
    departmentName: 'Hospital Administration',
    designation: 'Senior Billing Officer',
    date: '2026-11-20',
    checkInTime: '09:05 AM',
    checkOutTime: '05:30 PM',
    status: 'present',
    workHours: 8.4,
    syncWithBiometric: true
  },
  {
    id: 'att-008',
    hospitalId: 'hosp-001',
    employeeId: 'emp-pharm-01',
    employeeCode: 'EMP-401',
    employeeName: 'Suresh Singhania',
    departmentName: 'Pharmacy Services',
    designation: 'Chief Pharmacist',
    date: '2026-11-20',
    checkInTime: '09:20 AM',
    status: 'late',
    workHours: 7.6,
    syncWithBiometric: true
  },
  {
    id: 'att-009',
    hospitalId: 'hosp-001',
    employeeId: 'emp-lab-01',
    employeeCode: 'EMP-501',
    employeeName: 'Anjali Nair',
    departmentName: 'Laboratory & Pathology',
    designation: 'Senior Medical Lab Technologist',
    date: '2026-11-20',
    checkInTime: '08:00 AM',
    checkOutTime: '04:00 PM',
    status: 'present',
    workHours: 8.0,
    syncWithBiometric: true
  }
];

export const DEFAULT_PAYROLL: PayrollRecord[] = [
  {
    id: 'pay-001',
    hospitalId: 'hosp-001',
    payrollMonth: '2026-11',
    employeeId: 'emp-owner-01',
    employeeCode: 'EMP-001',
    employeeName: 'Dr. Rajeshwar Sharma',
    department: 'General Medicine',
    designation: 'Chief Medical Director & Hospital CEO',
    joiningDate: '2024-01-01',
    basicSalary: 120000,
    allowances: 30000,
    grossSalary: 150000,
    totalWorkingDays: 26,
    presentDays: 25,
    leaveDays: 1,
    absentDays: 0,
    unpaidDeductions: 0,
    taxDeductions: 10000,
    otherDeductions: 0,
    totalDeductions: 10000,
    netPayable: 140000,
    paymentStatus: 'paid',
    paymentDate: '2026-11-01',
    paymentReference: 'SAL-NEFT-889101'
  },
  {
    id: 'pay-002',
    hospitalId: 'hosp-001',
    payrollMonth: '2026-11',
    employeeId: 'emp-admin-01',
    employeeCode: 'EMP-002',
    employeeName: 'Pooja Deshmukh',
    department: 'Hospital Administration',
    designation: 'Chief Operating Officer / Hospital Admin',
    joiningDate: '2024-02-15',
    basicSalary: 85000,
    allowances: 20000,
    grossSalary: 105000,
    totalWorkingDays: 26,
    presentDays: 26,
    leaveDays: 0,
    absentDays: 0,
    unpaidDeductions: 0,
    taxDeductions: 7000,
    otherDeductions: 0,
    totalDeductions: 7000,
    netPayable: 98000,
    paymentStatus: 'paid',
    paymentDate: '2026-11-01',
    paymentReference: 'SAL-NEFT-889102'
  },
  {
    id: 'pay-003',
    hospitalId: 'hosp-001',
    payrollMonth: '2026-11',
    employeeId: 'emp-hr-01',
    employeeCode: 'EMP-003',
    employeeName: 'Kavita Nambiar',
    department: 'Hospital Administration',
    designation: 'Head of Human Resources',
    joiningDate: '2024-03-01',
    basicSalary: 65000,
    allowances: 15000,
    grossSalary: 80000,
    totalWorkingDays: 26,
    presentDays: 25,
    leaveDays: 1,
    absentDays: 0,
    unpaidDeductions: 0,
    taxDeductions: 5000,
    otherDeductions: 0,
    totalDeductions: 5000,
    netPayable: 75000,
    paymentStatus: 'paid',
    paymentDate: '2026-11-01',
    paymentReference: 'SAL-NEFT-889103'
  },
  {
    id: 'pay-004',
    hospitalId: 'hosp-001',
    payrollMonth: '2026-11',
    employeeId: 'emp-doc-01',
    employeeCode: 'EMP-101',
    employeeName: 'Dr. Vikram Malhotra',
    department: 'Cardiology',
    designation: 'Senior Consultant Cardiologist',
    joiningDate: '2024-04-10',
    basicSalary: 150000,
    allowances: 35000,
    grossSalary: 185000,
    totalWorkingDays: 26,
    presentDays: 24,
    leaveDays: 1,
    absentDays: 1,
    unpaidDeductions: 5769,
    taxDeductions: 15000,
    otherDeductions: 0,
    totalDeductions: 20769,
    netPayable: 164231,
    paymentStatus: 'processed'
  },
  {
    id: 'pay-005',
    hospitalId: 'hosp-001',
    payrollMonth: '2026-11',
    employeeId: 'emp-nurse-01',
    employeeCode: 'EMP-201',
    employeeName: 'Sister Mary Fernandez',
    department: 'General Medicine',
    designation: 'Head Nursing Superintendent',
    joiningDate: '2024-04-15',
    basicSalary: 48000,
    allowances: 12000,
    grossSalary: 60000,
    totalWorkingDays: 26,
    presentDays: 26,
    leaveDays: 0,
    absentDays: 0,
    unpaidDeductions: 0,
    taxDeductions: 4000,
    otherDeductions: 0,
    totalDeductions: 4000,
    netPayable: 56000,
    paymentStatus: 'processed'
  }
];

// In-Memory & LocalStorage Service with Hospital Tenancy Isolation
class HospitalStorageService {
  private getStorageKey(hospitalId: string, collection: string): string {
    return `upstage_${hospitalId}_${collection}`;
  }

  // Generic Get with Fallback
  public getCollection<T>(hospitalId: string, collection: string, defaultValue: T[]): T[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey(hospitalId, collection));
      if (!stored) {
        this.saveCollection(hospitalId, collection, defaultValue);
        return defaultValue;
      }
      let parsed = JSON.parse(stored) as T[];
      if (defaultValue && defaultValue.length > 0 && Array.isArray(parsed)) {
        if (parsed.length === 0) {
          this.saveCollection(hospitalId, collection, defaultValue);
          return defaultValue;
        }
        // Merge missing default items by id
        const existingIds = new Set(parsed.map((p: any) => p?.id).filter(Boolean));
        const missing = defaultValue.filter((d: any) => d?.id && !existingIds.has(d.id));
        if (missing.length > 0) {
          parsed = [...parsed, ...missing];
          this.saveCollection(hospitalId, collection, parsed);
        }
      }
      return parsed;
    } catch {
      return defaultValue;
    }
  }

  // Generic Save
  public saveCollection<T>(hospitalId: string, collection: string, items: T[]): void {
    try {
      localStorage.setItem(this.getStorageKey(hospitalId, collection), JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // Initializing Hospital Data
  public initHospital(hospitalId: string): void {
    if (!localStorage.getItem(this.getStorageKey(hospitalId, 'initialized'))) {
      this.saveCollection(hospitalId, 'departments', DEFAULT_DEPARTMENTS.filter(d => d.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'employees', DEFAULT_EMPLOYEES.filter(e => e.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'roleRequests', DEFAULT_ROLE_REQUESTS.filter(r => r.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'patients', DEFAULT_PATIENTS.filter(p => p.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'vitals', DEFAULT_VITALS.filter(v => v.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'appointments', DEFAULT_APPOINTMENTS.filter(a => a.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'wards', DEFAULT_WARDS.filter(w => w.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'beds', DEFAULT_BEDS.filter(b => b.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'admissions', DEFAULT_ADMISSIONS.filter(a => a.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'medicines', DEFAULT_MEDICINES.filter(m => m.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'labOrders', DEFAULT_LAB_ORDERS.filter(l => l.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'radiologyOrders', DEFAULT_RADIOLOGY_ORDERS.filter(r => r.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'expenses', DEFAULT_EXPENSES.filter(ex => ex.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'invoices', DEFAULT_INVOICES.filter(i => i.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'notifications', DEFAULT_NOTIFICATIONS.filter(n => n.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'auditLogs', DEFAULT_AUDIT_LOGS.filter(a => a.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'attendance', DEFAULT_ATTENDANCE.filter(a => a.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      this.saveCollection(hospitalId, 'payroll', DEFAULT_PAYROLL.filter(p => p.hospitalId === hospitalId || hospitalId === 'hosp-001'));
      localStorage.setItem(this.getStorageKey(hospitalId, 'initialized'), 'true');
    }
  }

  // Audit Logger
  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getCollection<AuditLog>(log.hospitalId, 'auditLogs', DEFAULT_AUDIT_LOGS);
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.saveCollection(log.hospitalId, 'auditLogs', logs.slice(0, 200));
  }

  // Reset to initial clean state
  public resetHospitalData(hospitalId: string): void {
    const keys = [
      'initialized', 'departments', 'employees', 'roleRequests', 'patients',
      'vitals', 'appointments', 'consultations', 'wards', 'beds', 'admissions',
      'medicines', 'labOrders', 'radiologyOrders', 'expenses', 'invoices',
      'notifications', 'auditLogs', 'attendance', 'payroll'
    ];
    keys.forEach(k => localStorage.removeItem(this.getStorageKey(hospitalId, k)));
    this.initHospital(hospitalId);
  }
}

export const storageService = new HospitalStorageService();
