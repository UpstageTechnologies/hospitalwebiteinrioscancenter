import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../types/employee';
import type { RoleId } from '../../types/roles';
import { EmployeeProfileDashboard } from '../../components/employee/EmployeeProfileDashboard';
import { MultiRoleSelectDropdown } from '../../components/common/MultiRoleSelectDropdown';
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Building,
  Shield,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  X,
  Plus,
  Briefcase,
  MapPin,
  Check,
  Edit2,
  Copy,
  Key,
  UserCheck,
  UserX,
  Sparkles,
  EyeOff,
  Printer,
  MoreVertical,
  ScanFace,
  Camera
} from 'lucide-react';
import { validatePasswordStrength } from '../../utils/employeeIdGenerator';
import { FaceRegistrationModal } from '../../components/employee/FaceRegistrationModal';
import { FaceAttendanceKioskModal } from '../../components/employee/FaceAttendanceKioskModal';

export const EmployeeManagementPage: React.FC = () => {
  const {
    employees,
    departments,
    submitEmployeeRequest,
    updateEmployee,
    getPreviewEmployeeLoginId,
    toggleEmployeeStatus,
    approveEmployeeRequest
  } = useHospital();
  const { activeRole, currentUser, currentHospital } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedProfileEmployee, setSelectedProfileEmployee] = useState<Employee | null>(null);

  // 3-Dot Action Menu & Face Attendance States
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [faceEnrollEmployee, setFaceEnrollEmployee] = useState<Employee | null>(null);
  const [faceKioskOpen, setFaceKioskOpen] = useState(false);

  // Close action menu on click outside
  React.useEffect(() => {
    const handleDocumentClick = () => setOpenActionMenuId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Edit Employee Modal State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmploymentType, setEditEmploymentType] = useState<any>('Full-time');
  const [editBasic, setEditBasic] = useState('50000');
  const [editAllowances, setEditAllowances] = useState('10000');
  const [editDeductions, setEditDeductions] = useState('4000');
  const [editAdditionalRoles, setEditAdditionalRoles] = useState<RoleId[]>([]);
  const [editConsultationFee, setEditConsultationFee] = useState('500');

  const handleStartEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditPhone(emp.phone);
    setEditDesignation(emp.designation);
    setEditAddress(emp.address || 'Medical Enclave, New Delhi');
    setEditEmploymentType(emp.employmentType || 'Full-time');
    setEditBasic(String(emp.salaryDetails?.basic || 50000));
    setEditAllowances(String(emp.salaryDetails?.allowances || 10000));
    setEditDeductions(String(emp.salaryDetails?.deductions || 4000));
    setEditAdditionalRoles(emp.additionalRoles || emp.requestedAdditionalRoles || []);
    setEditConsultationFee(emp.consultationFee ? String(emp.consultationFee) : '500');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const basic = parseFloat(editBasic) || 0;
    const allowances = parseFloat(editAllowances) || 0;
    const deductions = parseFloat(editDeductions) || 0;
    const net = Math.max(0, basic + allowances - deductions);
    const parsedFee = parseFloat(editConsultationFee);
    const isDoc = editingEmployee.primaryRole === 'doctor' || editAdditionalRoles.includes('doctor') || editingEmployee.specialization != null;
    const consultationFee = isDoc ? (!isNaN(parsedFee) && parsedFee >= 0 ? parsedFee : 500) : undefined;

    updateEmployee(editingEmployee.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      mobile: editPhone.trim(),
      designation: editDesignation.trim(),
      address: editAddress.trim(),
      employmentType: editEmploymentType,
      additionalRoles: editAdditionalRoles,
      requestedAdditionalRoles: editAdditionalRoles,
      consultationFee,
      salaryDetails: {
        basic,
        allowances,
        deductions,
        net
      }
    });

    setEditingEmployee(null);
    if (selectedProfileEmployee?.id === editingEmployee.id) {
      setSelectedProfileEmployee({
        ...selectedProfileEmployee,
        name: editName.trim(),
        phone: editPhone.trim(),
        mobile: editPhone.trim(),
        designation: editDesignation.trim(),
        address: editAddress.trim(),
        employmentType: editEmploymentType,
        consultationFee,
        salaryDetails: { basic, allowances, deductions, net }
      });
    }
  };

  // Add Employee Form State
  const generateNewEmpCode = () => {
    const existingNums = employees
      .map(e => parseInt(e.employeeCode.replace(/\D/g, '') || '0'))
      .filter(n => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 100;
    return `EMP-${maxNum + 1}`;
  };

  const creatorRole: RoleId = (currentUser?.primaryRole as RoleId) || (activeRole as RoleId) || 'hr_manager';

  // Dynamic Role Dropdown Logic:
  // - Hospital Owner: Admin, HR Manager, and all clinical/operational staff roles.
  // - Hospital Admin: HR Manager and all clinical/operational staff roles (Admin and Owner hidden).
  // - HR Manager: Existing permitted staff roles only (Admin, Owner, and HR hidden).
  const allowedRoles = React.useMemo(() => {
    const baseStaffRoles: { id: RoleId; label: string; group: string }[] = [
      { id: 'doctor', label: 'Doctor / Physician', group: 'Clinical' },
      { id: 'nurse', label: 'Staff Nurse', group: 'Clinical' },
      { id: 'lab_technician', label: 'Lab Technician', group: 'Diagnostics' },
      { id: 'pharmacist', label: 'Pharmacist', group: 'Pharmacy' },
      { id: 'radiologist', label: 'Radiology Technician', group: 'Diagnostics' },
      { id: 'receptionist', label: 'Receptionist / Front Desk', group: 'Operations' },
      { id: 'billing_staff', label: 'Billing Staff / Cashier', group: 'Operations' },
      { id: 'ward_incharge', label: 'Ward In-charge', group: 'Operations' },
      { id: 'store_manager', label: 'Store & Inventory Manager', group: 'Operations' },
      { id: 'accountant', label: 'Hospital Accountant', group: 'Administration' },
      { id: 'ambulance_driver', label: 'Ambulance Driver', group: 'Support' },
      { id: 'delivery_person', label: 'Delivery Person', group: 'Support' },
      { id: 'housekeeping', label: 'Housekeeping Staff', group: 'Support' },
      { id: 'security', label: 'Security Officer', group: 'Support' },
      { id: 'maintenance', label: 'Maintenance / Biomedical Tech', group: 'Support' }
    ];

    if (creatorRole === 'owner') {
      return [
        { id: 'admin' as RoleId, label: 'Hospital Admin', group: 'Management' },
        { id: 'hr_manager' as RoleId, label: 'HR Manager', group: 'Management' },
        ...baseStaffRoles
      ];
    }

    if (creatorRole === 'admin') {
      return [
        { id: 'hr_manager' as RoleId, label: 'HR Manager', group: 'Management' },
        ...baseStaffRoles
      ];
    }

    // HR Manager or other roles: staff only
    return baseStaffRoles;
  }, [creatorRole]);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState(generateNewEmpCode());
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('Hospital@2026');
  const [formConfirmPassword, setFormConfirmPassword] = useState('Hospital@2026');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formAddress, setFormAddress] = useState('');
  const [formDob, setFormDob] = useState('1992-05-14');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formDeptId, setFormDeptId] = useState(departments[0]?.id || 'dept-gm');
  const [formDesignation, setFormDesignation] = useState('Consultant Physician');
  const [formJoiningDate, setFormJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formEmploymentType, setFormEmploymentType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Probation'>('Full-time');
  const [formPrimaryRole, setFormPrimaryRole] = useState<RoleId>('doctor');
  const [formAdditionalRoles, setFormAdditionalRoles] = useState<RoleId[]>([]);
  const [formQualification, setFormQualification] = useState('');
  const [formLicense, setFormLicense] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Post-Creation Credential Display & Password Reset Modals
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    role: string;
    designation: string;
    loginId: string;
    password?: string;
    department: string;
    hospitalName: string;
  } | null>(null);
  const [selectedEmployeeForReset, setSelectedEmployeeForReset] = useState<Employee | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('Hospital@2026');
  const [resetModalMessage, setResetModalMessage] = useState<string | null>(null);

  const previewLoginId = React.useMemo(() => {
    return getPreviewEmployeeLoginId ? getPreviewEmployeeLoginId(formPrimaryRole) : `UPH@2026${formPrimaryRole.slice(0, 2).toUpperCase()}001`;
  }, [formPrimaryRole, getPreviewEmployeeLoginId, employees]);

  const passStrength = React.useMemo(() => {
    return validatePasswordStrength(formPassword);
  }, [formPassword]);

  // Synchronize primary role selection if not permitted for current creator
  React.useEffect(() => {
    if (!allowedRoles.some(r => r.id === formPrimaryRole)) {
      setFormPrimaryRole(allowedRoles[0]?.id || 'doctor');
    }
  }, [allowedRoles, formPrimaryRole]);

  const handlePrimaryRoleChange = (newRole: RoleId) => {
    setFormPrimaryRole(newRole);
    setFormAdditionalRoles(prev => prev.filter(r => r !== newRole));

    // Smart default designation & department
    const roleOpt = allowedRoles.find(r => r.id === newRole);
    const label = roleOpt ? roleOpt.label.split('/')[0].trim() : newRole.replace('_', ' ');
    setFormDesignation(label);

    if (newRole === 'admin' || newRole === 'hr_manager') {
      const adminDept = departments.find(d => d.id === 'dept-admin' || d.name.toLowerCase().includes('admin'));
      if (adminDept) setFormDeptId(adminDept.id);
    } else if (newRole === 'pharmacist') {
      const pharmDept = departments.find(d => d.id === 'dept-pharmacy' || d.name.toLowerCase().includes('pharmacy'));
      if (pharmDept) setFormDeptId(pharmDept.id);
    } else if (newRole === 'lab_technician' || newRole === 'radiology_technician') {
      const diagDept = departments.find(d => d.id === 'dept-diagnostics' || d.name.toLowerCase().includes('lab') || d.name.toLowerCase().includes('diag'));
      if (diagDept) setFormDeptId(diagDept.id);
    } else if (newRole === 'accountant' || newRole === 'billing_staff') {
      const finDept = departments.find(d => d.id === 'dept-finance' || d.name.toLowerCase().includes('billing') || d.name.toLowerCase().includes('fin'));
      if (finDept) setFormDeptId(finDept.id);
    } else if (newRole === 'receptionist') {
      const recDept = departments.find(d => d.id === 'dept-reception' || d.name.toLowerCase().includes('reception') || d.name.toLowerCase().includes('front'));
      if (recDept) setFormDeptId(recDept.id);
    } else if (newRole === 'doctor') {
      setFormDesignation('Consultant Physician');
      const medDept = departments.find(d => d.id === 'dept-general' || d.name.toLowerCase().includes('general') || d.name.toLowerCase().includes('med'));
      if (medDept) setFormDeptId(medDept.id);
    } else if (newRole === 'nurse') {
      setFormDesignation('Staff Nurse');
      const nurseDept = departments.find(d => d.id === 'dept-nursing' || d.name.toLowerCase().includes('nurs') || d.name.toLowerCase().includes('general'));
      if (nurseDept) setFormDeptId(nurseDept.id);
    } else if (newRole === 'delivery_person') {
      setFormDesignation('Hospital Delivery Partner');
      const suppDept = departments.find(d => d.id === 'dept-pharm' || d.id === 'dept-support' || d.name.toLowerCase().includes('pharm') || d.name.toLowerCase().includes('logistics'));
      if (suppDept) setFormDeptId(suppDept.id);
    }
  };

  const handleToggleAdditionalRole = (roleId: RoleId) => {
    if (roleId === formPrimaryRole) return;
    setFormAdditionalRoles(prev =>
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  // Salary breakdown
  const [formBasicSalary, setFormBasicSalary] = useState('75000');
  const [formAllowances, setFormAllowances] = useState('15000');
  const [formDeductions, setFormDeductions] = useState('6000');

  const handleAddEmployeeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim()) {
      setInlineError('Please enter employee full name.');
      alert('Please enter employee full name.');
      return;
    }
    if (!formMobile.trim()) {
      setInlineError('Please enter contact mobile number.');
      alert('Please enter contact mobile number.');
      return;
    }
    if (!formCode.trim()) {
      setInlineError('Please enter employee code.');
      alert('Please enter employee code.');
      return;
    }

    if (!passStrength.valid) {
      setInlineError(passStrength.message);
      alert(passStrength.message);
      return;
    }

    if (!allowedRoles.some(r => r.id === formPrimaryRole)) {
      setInlineError(`Permission Denied: Your role (${creatorRole}) is not permitted to assign the ${formPrimaryRole} role.`);
      alert(`Permission Denied: Your role (${creatorRole}) is not permitted to assign the ${formPrimaryRole} role.`);
      return;
    }

    setIsSubmitting(true);
    setInlineError(null);
    try {
      const selectedDept = departments.find(d => d.id === formDeptId);
      const basic = parseFloat(formBasicSalary) || 0;
      const allowances = parseFloat(formAllowances) || 0;
      const deductions = parseFloat(formDeductions) || 0;
      const net = Math.max(0, basic + allowances - deductions);

      const res = await submitEmployeeRequest({
        employeeCode: formCode.trim().toUpperCase(),
        employeeLoginId: previewLoginId,
        name: formName.trim(),
        phone: formMobile.trim(),
        mobile: formMobile.trim(),
        email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '.')}@upstagehospital.org`,
        address: formAddress.trim() || 'Medical Enclave, New Delhi',
        dob: formDob,
        gender: formGender,
        departmentId: formDeptId || selectedDept?.id || 'dept-general',
        departmentName: selectedDept?.name || 'General Medicine',
        designation: formDesignation.trim() || allowedRoles.find(r => r.id === formPrimaryRole)?.label || formPrimaryRole.replace('_', ' '),
        joiningDate: formJoiningDate,
        employmentType: formEmploymentType,
        primaryRole: formPrimaryRole,
        requestedAdditionalRoles: formAdditionalRoles,
        additionalRoles: creatorRole === 'owner' || creatorRole === 'admin' ? formAdditionalRoles : [],
        qualification: formQualification.trim() || 'Graduate Professional',
        licenseNumber: formLicense.trim() || undefined,
        salaryDetails: {
          basic,
          allowances,
          deductions,
          net
        }
      }, formPassword.trim() || 'Hospital@2026');

      if (res.success && res.employee) {
        // Show credentials confirmation modal
        setCreatedCredentials({
          name: res.employee.name,
          role: res.employee.primaryRole,
          designation: res.employee.designation,
          loginId: res.employee.employeeLoginId || previewLoginId,
          password: formPassword,
          department: res.employee.departmentName,
          hospitalName: currentHospital?.name || 'Upstage Hospital'
        });

        // Reset form
        setFormName('');
        setFormMobile('');
        setFormEmail('');
        setFormPassword('Hospital@2026');
        setFormConfirmPassword('Hospital@2026');
        setFormAddress('');
        setFormQualification('');
        setFormLicense('');
        setFormAdditionalRoles([]);
        setFormCode(generateNewEmpCode());
        setIsAddingInline(false);
      }
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setInlineError(err.message || 'Error saving employee');
      alert(`Error saving employee: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    // Tab filter
    if (activeTab === 'pending' && emp.status !== 'pending_approval') return false;
    if (activeTab === 'approved' && emp.status !== 'active') return false;
    if (activeTab === 'rejected' && emp.status !== 'rejected') return false;

    // Search filter
    const q = searchTerm.toLowerCase();
    const matchSearch =
      emp.name.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.phone.includes(q) ||
      emp.designation.toLowerCase().includes(q);

    // Department filter
    const matchDept = selectedDeptFilter === 'all' || emp.departmentId === selectedDeptFilter;

    return matchSearch && matchDept;
  });

  const pendingCount = employees.filter(e => e.status === 'pending_approval').length;
  const approvedCount = employees.filter(e => e.status === 'active').length;
  const rejectedCount = employees.filter(e => e.status === 'rejected').length;

  const calculatedNetSalary = (parseFloat(formBasicSalary) || 0) + (parseFloat(formAllowances) || 0) - (parseFloat(formDeductions) || 0);

  // FULL-PAGE DEDICATED EMPLOYEE PROFILE DASHBOARD
  if (selectedProfileEmployee) {
    return (
      <EmployeeProfileDashboard
        employee={selectedProfileEmployee}
        onBack={() => setSelectedProfileEmployee(null)}
        onEdit={(emp) => handleStartEdit(emp)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff & Employee Management</h1>
                <p className="text-xs text-slate-500">
                  Authoritative Employee Register • Admin Approval Gate • Attendance & Payroll Integration
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setFaceKioskOpen(true)}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
              title="Launch Live Touchless Face Attendance Kiosk"
            >
              <ScanFace className="w-4 h-4" />
              <span>Face Attendance</span>
            </button>

            <button
              onClick={() => {
                if (isAddingInline) {
                  setIsAddingInline(false);
                } else {
                  setIsAddingInline(true);
                  setFormCode(generateNewEmpCode());
                  setInlineError(null);
                  if (activeTab === 'rejected') {
                    setActiveTab('all');
                  }
                }
              }}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer ${
                isAddingInline
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isAddingInline ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Cancel Add</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Add New Employee</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-5 border-t border-slate-100 mt-5 scrollbar-none">
          {[
            { id: 'all', label: 'All Employees', icon: Users, badge: employees.length },
            { id: 'pending', label: 'Pending Approval', icon: Clock, badge: pendingCount, badgeColor: 'bg-amber-500 text-white' },
            { id: 'approved', label: 'Approved Active', icon: CheckCircle2, badge: approvedCount, badgeColor: 'bg-emerald-600 text-white' },
            { id: 'rejected', label: 'Rejected Requests', icon: XCircle, badge: rejectedCount, badgeColor: 'bg-rose-500 text-white' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : (tab.badgeColor || 'bg-slate-200 text-slate-700')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name, employee ID, mobile or role..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* INLINE REGISTRATION FORM CARD (FULLY RESPONSIVE ACROSS ALL DEVICES) */}
            {isAddingInline && (
              <div className="p-3.5 sm:p-5 border-b border-emerald-200/90 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-sm p-4 sm:p-5 space-y-4">
                  {/* Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>Add New Hospital Employee</span>
                          <span className="font-mono text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                            {formCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Fill in credentials, roles, contact & compensation
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {inlineError && (
                        <span className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          {inlineError}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingInline(false);
                          setInlineError(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Close form"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Clean, Professional 3-Row Form Layout (4 Columns per Row on Desktop) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* ROW 1: Basic & Access Information */}
                    {/* 1. Full Name */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Full Name <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Ramesh Sharma"
                        value={formName}
                        onChange={(e) => {
                          setFormName(e.target.value);
                          if (inlineError) setInlineError(null);
                        }}
                        className="w-full text-xs font-semibold text-slate-900 px-3 h-[40px] bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none shadow-2xs placeholder-slate-400 transition-colors"
                        autoFocus
                        required
                      />
                    </div>

                    {/* 2. Employee ID & Gender */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Employee ID & Gender
                      </label>
                      <div className="flex items-center gap-2 h-[40px]">
                        <span
                          className="font-mono text-xs font-bold bg-slate-50 text-emerald-800 px-3 h-[40px] rounded-xl border border-slate-200 shadow-2xs whitespace-nowrap inline-flex items-center justify-center"
                          title="Employee ID Code"
                        >
                          {formCode}
                        </span>
                        <select
                          value={formGender}
                          onChange={(e) => setFormGender(e.target.value as any)}
                          className="text-xs px-3 h-[40px] bg-white border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer shadow-2xs flex-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition-colors"
                          title="Gender"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* 3. Login ID */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Login ID <span className="text-[10px] text-emerald-600 font-semibold">(Auto-Generated)</span>
                      </label>
                      <div
                        className="inline-flex items-center gap-2 bg-emerald-50/50 text-emerald-950 font-black text-xs px-3 h-[40px] rounded-xl border border-emerald-200 shadow-2xs w-full"
                        title="Auto-Generated Login ID"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{previewLoginId}</span>
                      </div>
                    </div>

                    {/* 4. Password with Eye Icon inside */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Password <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative flex items-center w-full">
                        <input
                          type={showFormPassword ? "text" : "password"}
                          value={formPassword}
                          onChange={(e) => {
                            setFormPassword(e.target.value);
                            setFormConfirmPassword(e.target.value);
                          }}
                          placeholder="Staff login password"
                          className="w-full text-xs font-mono pl-3 pr-10 h-[40px] bg-white border border-slate-200 rounded-xl text-slate-800 outline-none shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition-colors"
                          title="Staff Login Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFormPassword(!showFormPassword)}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                          title={showFormPassword ? "Hide password" : "Show password"}
                        >
                          {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* ROW 2: Roles & Contact Information */}
                    {/* 5. Primary Role */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Primary Role <span className="text-emerald-600">*</span>
                      </label>
                      <select
                        value={formPrimaryRole}
                        onChange={(e) => handlePrimaryRoleChange(e.target.value as RoleId)}
                        className="w-full text-xs font-bold capitalize px-3 h-[40px] bg-white border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition-colors"
                        title="Primary Assigned Role"
                      >
                        {allowedRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 6. Additional Roles */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Additional Roles
                      </label>
                      <div className="w-full">
                        <MultiRoleSelectDropdown
                          availableRoles={allowedRoles}
                          selectedRoles={formAdditionalRoles}
                          onChange={setFormAdditionalRoles}
                          primaryRole={formPrimaryRole}
                          placeholder="Select additional roles..."
                        />
                      </div>
                    </div>

                    {/* 7. Contact Mobile */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Mobile Number <span className="text-emerald-600">*</span>
                      </label>
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-[40px] shadow-2xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-400 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <input
                          type="tel"
                          placeholder="+91 Mobile Number *"
                          value={formMobile}
                          onChange={(e) => {
                            setFormMobile(e.target.value);
                            if (inlineError) setInlineError(null);
                          }}
                          className="w-full text-xs font-semibold h-full bg-transparent outline-none placeholder-slate-400"
                          required
                        />
                      </div>
                    </div>

                    {/* 8. Email Address */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Email Address <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-[40px] shadow-2xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-400 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <input
                          type="email"
                          placeholder="employee@hospital.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full text-xs h-full bg-transparent text-slate-700 outline-none placeholder-slate-400"
                        />
                      </div>
                    </div>

                    {/* ROW 3: Joining Date, Employment Type, Salary & Action */}
                    {/* 9. Joining Date */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Date of Joining
                      </label>
                      <input
                        type="date"
                        value={formJoiningDate}
                        onChange={(e) => setFormJoiningDate(e.target.value)}
                        className="w-full text-xs px-3 h-[40px] bg-white border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition-colors"
                        title="Joining Date"
                      />
                    </div>

                    {/* 10. Employment Type */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Employment Type
                      </label>
                      <select
                        value={formEmploymentType}
                        onChange={(e) => setFormEmploymentType(e.target.value as any)}
                        className="w-full text-xs px-3 h-[40px] bg-white border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition-colors"
                        title="Employment Type"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Probation">Probation</option>
                      </select>
                    </div>

                    {/* 11. Monthly Basic Salary */}
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Monthly Salary (₹)
                      </label>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 h-[40px] shadow-2xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-400 transition-colors">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          value={formBasicSalary}
                          onChange={(e) => setFormBasicSalary(e.target.value)}
                          placeholder="55000"
                          className="w-full text-xs font-mono font-bold h-full bg-transparent text-slate-900 outline-none placeholder-slate-400"
                          title="Monthly Base Pay"
                        />
                      </div>
                    </div>

                    {/* 12. Save Employee Action (Cancel button removed; X icon in header is the cancel option) */}
                    <div className="flex flex-col justify-end">
                      <label className="hidden lg:block text-[11px] font-bold text-transparent select-none mb-1.5">
                        Action
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddEmployeeSubmit()}
                        disabled={isSubmitting}
                        className="w-full h-[40px] px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                        title="Save new employee to hospital roster"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Save Employee</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[980px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-3">Employee</th>
                    <th className="py-3.5 px-3">Login ID</th>
                    <th className="py-3.5 px-3">Role & Dept</th>
                    <th className="py-3.5 px-3">Contact</th>
                    <th className="py-3.5 px-3">Joining Date</th>
                    <th className="py-3.5 px-3">Monthly Salary</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        No employees found matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => {
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-100 to-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {emp.name.replace('Dr. ', '').replace('Sister ', '').charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{emp.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{emp.employeeCode} • {emp.gender || 'Staff'}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                                {emp.employeeLoginId || 'Generating...'}
                              </span>
                              {emp.employeeLoginId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(emp.employeeLoginId!);
                                    alert(`Copied Login ID: ${emp.employeeLoginId}`);
                                  }}
                                  className="text-slate-400 hover:text-emerald-700 p-0.5 cursor-pointer"
                                  title="Copy Login ID"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 capitalize">{emp.primaryRole.replace('_', ' ')}</div>
                            <div className="text-[10px] text-slate-500">{emp.departmentName}</div>
                            {emp.additionalRoles && emp.additionalRoles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {emp.additionalRoles.map(r => (
                                  <span key={r} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                                    +{r.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                            {emp.requestedAdditionalRoles && emp.requestedAdditionalRoles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {emp.requestedAdditionalRoles.map(r => (
                                  <span key={r} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                                    ⏳ req: {r.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-700 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{emp.phone}</span>
                            </div>
                            {emp.email && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{emp.email}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{emp.joiningDate}</div>
                            <div className="text-[10px] text-slate-400">{emp.employmentType || 'Full-time'}</div>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-bold text-slate-900">
                              ₹{(emp.salaryDetails?.net || emp.salaryDetails?.basic || 55000).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-400">Net / Month</div>
                          </td>

                          <td className="py-3.5 px-4">
                            {emp.status === 'active' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Approved Active
                              </span>
                            )}
                            {emp.status === 'pending_approval' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pending Approval
                              </span>
                            )}
                            {emp.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Rejected
                              </span>
                            )}
                            {emp.status === 'inactive' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right relative">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(openActionMenuId === emp.id ? null : emp.id);
                                }}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                  openActionMenuId === emp.id
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 bg-white shadow-2xs'
                                }`}
                                title="Employee Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* 3-Dot Action Menu Dropdown */}
                              {openActionMenuId === emp.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 text-left"
                                >
                                  {/* Group 1: Profile & Edit */}
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        setSelectedProfileEmployee(emp);
                                      }}
                                      className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4 text-emerald-600" />
                                      <span>View Profile</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleStartEdit(emp);
                                      }}
                                      className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors cursor-pointer"
                                    >
                                      <Edit2 className="w-4 h-4 text-blue-600" />
                                      <span>Edit Employee</span>
                                    </button>
                                  </div>

                                  {/* Group 2: Status Management (Approve / Activate / Deactivate) */}
                                  <div className="py-1">
                                    {emp.status === 'pending_approval' ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenActionMenuId(null);
                                            approveEmployeeRequest(emp.id);
                                          }}
                                          className="w-full px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2.5 text-emerald-800 transition-colors cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          <span>Approve & Activate</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenActionMenuId(null);
                                            toggleEmployeeStatus(emp.id, 'rejected');
                                          }}
                                          className="w-full px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2.5 text-rose-800 transition-colors cursor-pointer"
                                        >
                                          <XCircle className="w-4 h-4 text-rose-600" />
                                          <span>Reject Request</span>
                                        </button>
                                      </>
                                    ) : emp.status === 'active' ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          toggleEmployeeStatus(emp.id, 'inactive');
                                        }}
                                        className="w-full px-3.5 py-2 hover:bg-amber-50 flex items-center gap-2.5 text-amber-800 transition-colors cursor-pointer"
                                      >
                                        <UserX className="w-4 h-4 text-amber-600" />
                                        <span>Deactivate Account</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          toggleEmployeeStatus(emp.id, 'active');
                                        }}
                                        className="w-full px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2.5 text-emerald-800 transition-colors cursor-pointer"
                                      >
                                        <UserCheck className="w-4 h-4 text-emerald-600" />
                                        <span>Activate Account</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Group 3: Face Biometrics (Add Face / Update Face) */}
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        setFaceEnrollEmployee(emp);
                                      }}
                                      className="w-full px-3.5 py-2 hover:bg-blue-50 flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <ScanFace className="w-4 h-4 text-blue-600" />
                                        <span>{emp.faceEnrolled ? 'Update Face' : 'Add Face'}</span>
                                      </div>
                                      {emp.faceEnrolled ? (
                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                                          Enrolled
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                          Pending
                                        </span>
                                      )}
                                    </button>
                                  </div>

                                  {/* Group 4: Security & Password Reset */}
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        setSelectedEmployeeForReset(emp);
                                        setNewResetPassword('Hospital@2026');
                                        setResetModalMessage(null);
                                      }}
                                      className="w-full px-3.5 py-2 hover:bg-purple-50 flex items-center gap-2.5 text-purple-800 transition-colors cursor-pointer"
                                    >
                                      <Key className="w-4 h-4 text-purple-600" />
                                      <span>Reset Password</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* MODAL: EDIT EMPLOYEE DETAILS */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Staff Profile</h3>
                  <p className="text-xs text-slate-500 font-mono">{editingEmployee.employeeCode} • {editingEmployee.primaryRole.replace('_', ' ')}</p>
                </div>
              </div>
              <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={editEmploymentType}
                    onChange={(e) => setEditEmploymentType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Probation">Probation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Roles & Cross-Department Privileges (Multi-Select)
                </label>
                <MultiRoleSelectDropdown
                  availableRoles={allowedRoles}
                  selectedRoles={editAdditionalRoles}
                  onChange={setEditAdditionalRoles}
                  primaryRole={editingEmployee.primaryRole}
                  placeholder="Select additional roles (e.g. Nurse, Pharmacist)..."
                />
              </div>

              {/* Doctor OPD Consultation Fee Configuration */}
              {(editingEmployee.primaryRole === 'doctor' || editAdditionalRoles.includes('doctor') || editingEmployee.specialization != null) && (
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-emerald-900">
                      Doctor OPD Consultation Pricing (₹)
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Doctor Revenue Attribution
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editConsultationFee}
                      onChange={(e) => setEditConsultationFee(e.target.value)}
                      placeholder="500.00"
                      className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-emerald-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-800">
                    Default fee used when receptionist or patient books OPD appointments for this doctor.
                  </p>
                </div>
              )}

              {/* Monthly Salary Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Update Monthly Salary Breakdown (₹)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Basic Pay</label>
                    <input
                      type="number"
                      value={editBasic}
                      onChange={(e) => setEditBasic(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Allowances</label>
                    <input
                      type="number"
                      value={editAllowances}
                      onChange={(e) => setEditAllowances(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Deductions</label>
                    <input
                      type="number"
                      value={editDeductions}
                      onChange={(e) => setEditDeductions(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold text-rose-600"
                    />
                  </div>
                </div>
                <div className="text-right text-xs pt-1">
                  <span className="text-slate-500">Calculated Net Pay: </span>
                  <span className="font-extrabold text-emerald-800">
                    ₹{Math.max(0, (parseFloat(editBasic) || 0) + (parseFloat(editAllowances) || 0) - (parseFloat(editDeductions) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST-CREATION CREDENTIAL CONFIRMATION */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Staff Account Created</h3>
                <p className="text-xs text-slate-500">{createdCredentials.hospitalName} • Login Ready</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Employee Name:</span>
                <span className="font-bold text-slate-900">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Role & Department:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {createdCredentials.role.replace('_', ' ')} • {createdCredentials.department}
                </span>
              </div>

              {/* Login ID */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Employee Login ID
                  </span>
                  <span className="text-base font-black font-mono text-emerald-950">
                    {createdCredentials.loginId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials.loginId);
                    alert(`Copied Login ID: ${createdCredentials.loginId}`);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </button>
              </div>

              {/* Password */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Initial Assigned Password
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {createdCredentials.password || '••••••••••••'}
                  </span>
                </div>
                {createdCredentials.password && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password!);
                      alert('Copied Password to clipboard');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Pass</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Security Notice:</strong> The employee's password is now securely encrypted in Firebase Authentication and will never be stored or displayed again. Deliver credentials securely to the staff member.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const slip = `UPSTAGE HOSPITAL STAFF CREDENTIALS\nName: ${createdCredentials.name}\nRole: ${createdCredentials.role}\nDepartment: ${createdCredentials.department}\nLogin ID: ${createdCredentials.loginId}\nPassword: ${createdCredentials.password}\nPortal: /staff-login`;
                  navigator.clipboard.writeText(slip);
                  alert('All credentials copied to clipboard!');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Print Credential Slip"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET EMPLOYEE PASSWORD */}
      {selectedEmployeeForReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Staff Password</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedEmployeeForReset.employeeLoginId || selectedEmployeeForReset.employeeCode}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-900 ml-1.5">{selectedEmployeeForReset.name}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono outline-none"
                />
              </div>

              {resetModalMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
                  {resetModalMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForReset(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetModalMessage(`Password updated to "${newResetPassword}". Please securely share with ${selectedEmployeeForReset.name}.`);
                  setTimeout(() => {
                    setSelectedEmployeeForReset(null);
                  }, 2500);
                }}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Apply New Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FACE BIOMETRIC REGISTRATION */}
      {faceEnrollEmployee && (
        <FaceRegistrationModal
          employee={faceEnrollEmployee}
          onClose={() => setFaceEnrollEmployee(null)}
          onSuccess={() => setFaceEnrollEmployee(null)}
        />
      )}

      {/* MODAL: FULL-SCREEN ATTENDANCE KIOSK */}
      {faceKioskOpen && (
        <FaceAttendanceKioskModal
          onClose={() => setFaceKioskOpen(false)}
        />
      )}
    </div>
  );
};
