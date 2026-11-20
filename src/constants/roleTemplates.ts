import type { RoleTemplate, RoleId } from '../types/roles';

export const INITIAL_ROLE_TEMPLATES: Record<RoleId, RoleTemplate> = {
  // GROUP 1 - MANAGEMENT
  owner: {
    id: 'owner',
    name: 'Hospital Owner / CEO',
    group: 'Management',
    isMandatory: true,
    isActiveForHospital: true,
    description: 'Supreme hospital authority with access to hospital governance, executive analytics, revenue, financial audit, and institutional settings.',
    defaultPermissions: [
      'patients.view', 'patients.create', 'patients.edit', 'patients.delete',
      'appointments.view', 'appointments.create', 'appointments.manage',
      'consultation.view', 'prescriptions.view',
      'admissions.view', 'admissions.manage', 'beds.allocate', 'beds.transfer',
      'lab.view', 'radiology.view', 'pharmacy.view',
      'billing.view', 'billing.create', 'billing.refund', 'accounts.manage', 'expenses.record',
      'employees.view', 'employees.manage', 'attendance.view', 'payroll.view', 'payroll.manage',
      'inventory.manage', 'ambulance.dispatch', 'housekeeping.manage', 'security.manage', 'maintenance.manage',
      'roles.manage', 'role_requests.approve', 'hospital.settings', 'audit.view', 'reports.view'
    ],
    icon: 'Crown',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  admin: {
    id: 'admin',
    name: 'Hospital Admin',
    group: 'Management',
    isMandatory: true,
    isActiveForHospital: true,
    description: 'Operational administrator managing departments, staff, bed allocations, dynamic role approvals, and daily hospital workflows.',
    defaultPermissions: [
      'patients.view', 'patients.create', 'patients.edit',
      'appointments.view', 'appointments.create', 'appointments.manage',
      'consultation.view', 'prescriptions.view',
      'admissions.view', 'admissions.manage', 'beds.allocate', 'beds.transfer',
      'lab.view', 'radiology.view', 'pharmacy.view',
      'billing.view', 'billing.create',
      'employees.view', 'employees.manage', 'attendance.view', 'attendance.mark',
      'inventory.manage', 'roles.manage', 'role_requests.approve',
      'audit.view', 'reports.view'
    ],
    icon: 'ShieldCheck',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  hr_manager: {
    id: 'hr_manager',
    name: 'HR Manager',
    group: 'Management',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Manages staff recruitment, employee directory, biometric attendance synchronization, leave requests, shift rosters, and payroll.',
    defaultPermissions: [
      'employees.view', 'employees.manage',
      'attendance.view', 'attendance.mark',
      'payroll.view', 'payroll.manage',
      'reports.view'
    ],
    icon: 'Users',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  },

  // GROUP 2 - MEDICAL TEAM
  doctor: {
    id: 'doctor',
    name: 'Doctor / Physician',
    group: 'Medical Team',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Clinical practitioner performing OPD consultations, recording diagnoses, electronic prescriptions, ordering diagnostic lab & imaging tests.',
    defaultPermissions: [
      'patients.view', 'patients.create', 'patients.edit',
      'appointments.view', 'consultation.view', 'consultation.create',
      'prescriptions.view', 'prescriptions.create',
      'lab.view', 'radiology.view',
      'admissions.view'
    ],
    icon: 'Stethoscope',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  nurse: {
    id: 'nurse',
    name: 'Nurse / Nursing Supervisor',
    group: 'Medical Team',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Inpatient care monitoring, vital signs recording (BP, Pulse, Temp, SpO2, Glucose), medication administration checklist, and shift handover.',
    defaultPermissions: [
      'patients.view', 'admissions.view',
      'vitals.record', 'nursing.notes',
      'prescriptions.view', 'beds.allocate'
    ],
    icon: 'HeartPulse',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  lab_technician: {
    id: 'lab_technician',
    name: 'Laboratory Technician',
    group: 'Medical Team',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Processes pathology, haematology & biochemistry test requests, sample collection tracking, result entry with biological reference ranges, and report verification.',
    defaultPermissions: [
      'patients.view', 'lab.view', 'lab.manage'
    ],
    icon: 'Microscope',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  pharmacist: {
    id: 'pharmacist',
    name: 'Pharmacist',
    group: 'Medical Team',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Dispenses doctor prescriptions, manages batch inventory, expiry dates, FEFO protocol, low-stock thresholds, and pharmacy sales billing.',
    defaultPermissions: [
      'patients.view', 'prescriptions.view',
      'pharmacy.view', 'pharmacy.dispense', 'pharmacy.inventory',
      'billing.create'
    ],
    icon: 'Pill',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },

  // GROUP 3 - FRONT OFFICE & OPERATIONS
  receptionist: {
    id: 'receptionist',
    name: 'Receptionist / Front Desk',
    group: 'Front Office & Operations',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'First point of patient contact, walk-in registration, UHID deduplication search, OPD token generation, doctor scheduling, and check-in queues.',
    defaultPermissions: [
      'patients.view', 'patients.create', 'patients.edit',
      'appointments.view', 'appointments.create', 'appointments.manage',
      'admissions.view'
    ],
    icon: 'Calendar',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300'
  },
  billing_staff: {
    id: 'billing_staff',
    name: 'Billing & Cashier',
    group: 'Front Office & Operations',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Prepares OPD, IPD, lab and procedure invoices, records payments (Cash, UPI, Card, Insurance/TPA claims), and prints official tax receipts.',
    defaultPermissions: [
      'patients.view', 'billing.view', 'billing.create',
      'appointments.view', 'admissions.view'
    ],
    icon: 'Receipt',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  ward_incharge: {
    id: 'ward_incharge',
    name: 'Ward In-charge',
    group: 'Front Office & Operations',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Supervises ward floors, bed real-time availability, patient room allocations, inter-ward transfers, cleaning status, and discharge clearance.',
    defaultPermissions: [
      'patients.view', 'admissions.view', 'admissions.manage',
      'beds.allocate', 'beds.transfer', 'housekeeping.manage'
    ],
    icon: 'Bed',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300'
  },
  store_manager: {
    id: 'store_manager',
    name: 'Store & General Inventory Manager',
    group: 'Front Office & Operations',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Procures and manages hospital consumable supplies, surgical disposables, PPE kits, linens, purchase orders, and vendor goods received.',
    defaultPermissions: [
      'inventory.manage'
    ],
    icon: 'Package',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },

  // GROUP 4 - SUPPORT SERVICES
  accountant: {
    id: 'accountant',
    name: 'Accountant / Financial Officer',
    group: 'Support Services',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Manages hospital accounts, daily collection reconciliation, vendor disbursements, operational expense vouchers, bank deposits, and profit & loss records.',
    defaultPermissions: [
      'billing.view', 'accounts.manage', 'expenses.record',
      'payroll.view', 'reports.view'
    ],
    icon: 'DollarSign',
    badgeColor: 'bg-green-100 text-green-800 border-green-300'
  },
  radiologist: {
    id: 'radiologist',
    name: 'Radiology Technician',
    group: 'Support Services',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Operates diagnostic imaging equipment (X-Ray, CT, Ultrasound, MRI), schedules scans, attaches DICOM/imaging reports, and submits findings for doctor review.',
    defaultPermissions: [
      'patients.view', 'radiology.view', 'radiology.manage'
    ],
    icon: 'Activity',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-300'
  },
  ambulance_driver: {
    id: 'ambulance_driver',
    name: 'Ambulance / Emergency Driver',
    group: 'Support Services',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Receives emergency 108 dispatches, manages patient pickup/drop navigation, vehicle status readiness, and emergency hospital arrival transit.',
    defaultPermissions: [
      'ambulance.dispatch'
    ],
    icon: 'Truck',
    badgeColor: 'bg-red-100 text-red-800 border-red-300'
  },
  housekeeping: {
    id: 'housekeeping',
    name: 'Housekeeping & Sanitization',
    group: 'Support Services',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Conducts terminal ward disinfection, bed preparation for new admissions, biomedical waste clearance, and routine facility hygiene verification.',
    defaultPermissions: [
      'housekeeping.manage'
    ],
    icon: 'Sparkles',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  security: {
    id: 'security',
    name: 'Security Officer',
    group: 'Support Services',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Maintains main gate visitor registry, patient attendant entry passes, night curfew verification, parking control, and incident logging.',
    defaultPermissions: [
      'security.manage'
    ],
    icon: 'Shield',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300'
  },
  maintenance: {
    id: 'maintenance',
    name: 'Biomedical & Facility Maintenance',
    group: 'Support Services',
    isMandatory: false,
    isActiveForHospital: true,
    description: 'Repairs hospital electrical grids, medical oxygen lines, HVAC temperature controls, biomedical machines, and resolves department service tickets.',
    defaultPermissions: [
      'maintenance.manage'
    ],
    icon: 'Wrench',
    badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300'
  }
};
