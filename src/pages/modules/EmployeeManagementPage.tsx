import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../types/employee';
import type { RoleId } from '../../types/roles';
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
  Edit2
} from 'lucide-react';

export const EmployeeManagementPage: React.FC = () => {
  const { employees, departments, submitEmployeeRequest, updateEmployee } = useHospital();
  const { activeRole, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'add' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedProfileEmployee, setSelectedProfileEmployee] = useState<Employee | null>(null);

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
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const basic = parseFloat(editBasic) || 0;
    const allowances = parseFloat(editAllowances) || 0;
    const deductions = parseFloat(editDeductions) || 0;
    const net = Math.max(0, basic + allowances - deductions);

    updateEmployee(editingEmployee.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      mobile: editPhone.trim(),
      designation: editDesignation.trim(),
      address: editAddress.trim(),
      employmentType: editEmploymentType,
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

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState(generateNewEmpCode());
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
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

  const handlePrimaryRoleChange = (newRole: RoleId) => {
    setFormPrimaryRole(newRole);
    setFormAdditionalRoles(prev => prev.filter(r => r !== newRole));
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

  // Allowed primary employee roles (Owner and Admin are strictly protected!)
  const ALLOWED_EMPLOYEE_ROLES: { id: RoleId; label: string; group: string }[] = [
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
    { id: 'housekeeping', label: 'Housekeeping Staff', group: 'Support' },
    { id: 'security', label: 'Security Officer', group: 'Support' },
    { id: 'maintenance', label: 'Maintenance / Biomedical Tech', group: 'Support' }
  ];

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMobile.trim() || !formCode.trim()) return;

    const selectedDept = departments.find(d => d.id === formDeptId);
    const basic = parseFloat(formBasicSalary) || 0;
    const allowances = parseFloat(formAllowances) || 0;
    const deductions = parseFloat(formDeductions) || 0;
    const net = Math.max(0, basic + allowances - deductions);

    const res = submitEmployeeRequest({
      employeeCode: formCode.trim().toUpperCase(),
      name: formName.trim(),
      phone: formMobile.trim(),
      mobile: formMobile.trim(),
      email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '.')}@upstagehospital.org`,
      address: formAddress.trim() || 'Medical Enclave, New Delhi',
      dob: formDob,
      gender: formGender,
      departmentId: formDeptId,
      departmentName: selectedDept?.name || 'General Medicine',
      designation: formDesignation.trim(),
      joiningDate: formJoiningDate,
      employmentType: formEmploymentType,
      primaryRole: formPrimaryRole,
      requestedAdditionalRoles: formAdditionalRoles,
      additionalRoles: [],
      qualification: formQualification.trim() || 'Graduate Professional',
      licenseNumber: formLicense.trim() || undefined,
      salaryDetails: {
        basic,
        allowances,
        deductions,
        net
      }
    });

    if (res.success) {
      // Reset form
      setFormName('');
      setFormMobile('');
      setFormEmail('');
      setFormAddress('');
      setFormQualification('');
      setFormLicense('');
      setFormAdditionalRoles([]);
      setFormCode(generateNewEmpCode());
      setActiveTab('pending');
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('add')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-5 border-t border-slate-100 mt-5 scrollbar-none">
          {[
            { id: 'all', label: 'All Employees', icon: Users, badge: employees.length },
            { id: 'add', label: 'Add Employee', icon: UserPlus },
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* VIEW: ADD EMPLOYEE FORM */}
      {activeTab === 'add' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              HR Registration Form — Submit for Hospital Admin Approval
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Employees submitted by HR are saved with status <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Pending Approval</span>. 
              Only after Hospital Admin approves will the account activate and become available in Attendance.
            </p>
          </div>

          <form onSubmit={handleAddEmployeeSubmit} className="space-y-6">
            {/* Section 1: Basic Identity */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Personal & Identity Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Dr. Siddharth Verma"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID * (Unique)</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. EMP-202"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number * (Deduplication Check)</label>
                  <input
                    type="tel"
                    required
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="e.g. +91 98111 22334"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. employee@hospital.org"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Lotus Enclave, New Delhi"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Section 2: Department, Role & Employment */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Department, Role & Employment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Role *</label>
                  <select
                    value={formPrimaryRole}
                    onChange={(e) => handlePrimaryRoleChange(e.target.value as RoleId)}
                    className="w-full text-xs p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/40 font-semibold text-slate-900 outline-none"
                  >
                    {ALLOWED_EMPLOYEE_ROLES.map(r => (
                      <option key={r.id} value={r.id}>{r.label} ({r.group})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Owner & Admin roles are protected and cannot be assigned by HR.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Senior Consultant"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Additional Roles Multi-Selection (Checkboxes) */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Additional Roles (Optional)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Select multiple roles if this employee will handle multiple hospital duties (e.g. Doctor + Billing Staff).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {formAdditionalRoles.length} Additional Selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                  {ALLOWED_EMPLOYEE_ROLES.filter(r => r.id !== formPrimaryRole).map(role => {
                    const isChecked = formAdditionalRoles.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAdditionalRole(role.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="truncate">
                          <div className="truncate">{role.label}</div>
                          <span className="text-[9px] text-slate-400 font-normal">{role.group}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Selected Roles Summary */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Role Summary:</span>
                  
                  {/* Primary Role Chip */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Primary: {ALLOWED_EMPLOYEE_ROLES.find(r => r.id === formPrimaryRole)?.label || formPrimaryRole}
                  </span>

                  {/* Additional Role Chips */}
                  {formAdditionalRoles.map(roleId => {
                    const rObj = ALLOWED_EMPLOYEE_ROLES.find(r => r.id === roleId);
                    return (
                      <span
                        key={roleId}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300"
                      >
                        <span>+{rObj?.label || roleId}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAdditionalRole(roleId)}
                          className="hover:text-rose-600 ml-0.5 font-bold"
                          title="Remove additional role"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}

                  {formAdditionalRoles.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">
                      No additional roles selected. Single role employee.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={formJoiningDate}
                    onChange={(e) => setFormJoiningDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={formEmploymentType}
                    onChange={(e) => setFormEmploymentType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Probation">Probation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Professional License / Reg No (Optional)</label>
                  <input
                    type="text"
                    value={formLicense}
                    onChange={(e) => setFormLicense(e.target.value)}
                    placeholder="e.g. MCI-DEL-44129"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Salary Breakdown */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Monthly Salary Breakdown (₹ INR)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formBasicSalary}
                    onChange={(e) => setFormBasicSalary(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allowances (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formAllowances}
                    onChange={(e) => setFormAllowances(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deductions (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formDeductions}
                    onChange={(e) => setFormDeductions(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                  />
                </div>

                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 flex flex-col justify-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Calculated Net Pay</div>
                  <div className="text-base font-extrabold text-emerald-700">₹{calculatedNetSalary.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Notice & Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Submitted by HR: <strong>{currentUser?.name || 'Kavita Nambiar'}</strong>. Awaiting Admin verification.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Submit for Admin Approval
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW: EMPLOYEE LIST / PENDING / APPROVED / REJECTED */
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

          {/* Employee Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role & Dept</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4">Monthly Salary</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
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
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedProfileEmployee(emp)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Profile</span>
                              </button>
                              <button
                                onClick={() => handleStartEdit(emp)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-800 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
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
      )}

      {/* EMPLOYEE PROFILE MODAL */}
      {selectedProfileEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-lg flex items-center justify-center">
                  {selectedProfileEmployee.name.replace('Dr. ', '').replace('Sister ', '').charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedProfileEmployee.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedProfileEmployee.employeeCode} • {selectedProfileEmployee.designation}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProfileEmployee(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Role Pill */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Role</span>
                <span className="text-xs font-bold text-slate-800 capitalize">{selectedProfileEmployee.primaryRole.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                <span className={`text-xs font-bold capitalize ${
                  selectedProfileEmployee.status === 'active' ? 'text-emerald-700' :
                  selectedProfileEmployee.status === 'pending_approval' ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {selectedProfileEmployee.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
                <span className="text-xs font-bold text-slate-800">{selectedProfileEmployee.departmentName}</span>
              </div>
            </div>

            {/* Assigned Roles Breakdown */}
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned & Requested Roles</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 capitalize">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Primary: {selectedProfileEmployee.primaryRole.replace('_', ' ')}
                </span>

                {selectedProfileEmployee.additionalRoles?.map(r => (
                  <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 capitalize">
                    <span>+{r.replace('_', ' ')} (Active)</span>
                  </span>
                ))}

                {selectedProfileEmployee.requestedAdditionalRoles?.map(r => (
                  <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 capitalize">
                    <span>⏳ {r.replace('_', ' ')} (Pending Review)</span>
                  </span>
                ))}
              </div>

              {selectedProfileEmployee.rejectedAdditionalRoles && selectedProfileEmployee.rejectedAdditionalRoles.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 block">Rejected Additional Roles:</span>
                  {selectedProfileEmployee.rejectedAdditionalRoles.map(rej => (
                    <div key={rej.role} className="text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                      <strong>{rej.role.replace('_', ' ')}</strong>: {rej.reason || 'Not approved by Hospital Admin'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Mobile Number</div>
                <div className="text-slate-800 font-medium mt-0.5">{selectedProfileEmployee.phone}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Email Address</div>
                <div className="text-slate-800 font-medium mt-0.5 truncate">{selectedProfileEmployee.email || 'None'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Joining Date</div>
                <div className="text-slate-800 font-medium mt-0.5">{selectedProfileEmployee.joiningDate}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Employment Type</div>
                <div className="text-slate-800 font-medium mt-0.5">{selectedProfileEmployee.employmentType || 'Full-time'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Address</div>
                <div className="text-slate-800 font-medium mt-0.5">{selectedProfileEmployee.address || 'Medical Enclave, New Delhi'}</div>
              </div>
            </div>

            {/* Salary Breakdown Card */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Monthly Compensation</div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="text-slate-500 text-[10px]">Basic</div>
                  <div className="font-bold text-slate-800">₹{(selectedProfileEmployee.salaryDetails?.basic || 50000).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Allowances</div>
                  <div className="font-bold text-slate-800">₹{(selectedProfileEmployee.salaryDetails?.allowances || 10000).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Deductions</div>
                  <div className="font-bold text-rose-700">-₹{(selectedProfileEmployee.salaryDetails?.deductions || 4000).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-emerald-800 text-[10px] font-bold">Net Pay</div>
                  <div className="font-extrabold text-emerald-800">₹{(selectedProfileEmployee.salaryDetails?.net || 56000).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Approval Details or Rejection Reason if any */}
            {selectedProfileEmployee.approvalDetails && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-700">Approval Workflow Audit</div>
                <div className="text-[11px] text-slate-500">
                  Submitted by: <span className="font-semibold text-slate-800">{selectedProfileEmployee.approvalDetails.submittedBy.name}</span> on {new Date(selectedProfileEmployee.approvalDetails.submittedAt).toLocaleDateString()}
                </div>
                {selectedProfileEmployee.approvalDetails.reviewedBy && (
                  <div className="text-[11px] text-slate-500">
                    Reviewed by: <span className="font-semibold text-slate-800">{selectedProfileEmployee.approvalDetails.reviewedBy.name}</span> on {selectedProfileEmployee.approvalDetails.reviewedAt ? new Date(selectedProfileEmployee.approvalDetails.reviewedAt).toLocaleDateString() : 'N/A'}
                  </div>
                )}
                {selectedProfileEmployee.approvalDetails.rejectionReason && (
                  <div className="text-[11px] text-rose-700 font-medium">
                    Rejection Reason: {selectedProfileEmployee.approvalDetails.rejectionReason}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleStartEdit(selectedProfileEmployee);
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl inline-flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Staff Details</span>
              </button>
              <button
                onClick={() => setSelectedProfileEmployee(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};
