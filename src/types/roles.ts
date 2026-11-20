export type RoleGroup = 'Management' | 'Medical Team' | 'Front Office & Operations' | 'Support Services';

export type RoleId =
  // Group 1 - Management
  | 'owner'
  | 'admin'
  | 'hr_manager'
  // Group 2 - Medical Team
  | 'doctor'
  | 'nurse'
  | 'lab_technician'
  | 'pharmacist'
  // Group 3 - Front Office & Operations
  | 'receptionist'
  | 'billing_staff'
  | 'ward_incharge'
  | 'store_manager'
  // Group 4 - Support Services
  | 'accountant'
  | 'radiologist'
  | 'ambulance_driver'
  | 'housekeeping'
  | 'security'
  | 'maintenance';

export interface RoleTemplate {
  id: RoleId;
  name: string;
  group: RoleGroup;
  isMandatory: boolean; // only owner & admin are true
  isActiveForHospital: boolean; // hospital admin can toggle optional roles
  description: string;
  defaultPermissions: string[];
  icon: string;
  badgeColor: string;
}

export interface EmployeeRoleAssignment {
  primaryRole: RoleId;
  additionalRoles: RoleId[]; // only approved roles are active here
  pendingRoleRequests: RoleId[];
}

export type PermissionCode =
  // Patients
  | 'patients.view'
  | 'patients.create'
  | 'patients.edit'
  | 'patients.delete'
  // Appointments & OPD
  | 'appointments.view'
  | 'appointments.create'
  | 'appointments.manage'
  // Clinical
  | 'consultation.view'
  | 'consultation.create'
  | 'prescriptions.view'
  | 'prescriptions.create'
  | 'vitals.record'
  | 'nursing.notes'
  // IP & Wards
  | 'admissions.view'
  | 'admissions.manage'
  | 'beds.allocate'
  | 'beds.transfer'
  // Diagnostics
  | 'lab.view'
  | 'lab.manage'
  | 'radiology.view'
  | 'radiology.manage'
  // Pharmacy
  | 'pharmacy.view'
  | 'pharmacy.dispense'
  | 'pharmacy.inventory'
  // Billing & Finance
  | 'billing.view'
  | 'billing.create'
  | 'billing.refund'
  | 'accounts.manage'
  | 'expenses.record'
  // HR & Staff
  | 'employees.view'
  | 'employees.manage'
  | 'attendance.view'
  | 'attendance.mark'
  | 'payroll.view'
  | 'payroll.manage'
  // Operations & Support
  | 'inventory.manage'
  | 'ambulance.dispatch'
  | 'housekeeping.manage'
  | 'security.manage'
  | 'maintenance.manage'
  // Administration & Governance
  | 'roles.manage'
  | 'role_requests.approve'
  | 'hospital.settings'
  | 'audit.view'
  | 'reports.view';
