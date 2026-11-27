import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../types/employee';
import type { RoleId } from '../../types/roles';
import type { RoleRequest } from '../../types/roleRequest';
import { NurseHelpDialog } from '../../components/nurse/NurseHelpDialog';
import { DeliveryTrackingView } from '../../components/delivery/DeliveryTrackingView';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  X,
  CreditCard,
  Briefcase,
  Eye,
  Check,
  Search,
  UserCheck,
  UserX,
  ShieldCheck,
  PlusCircle,
  MinusCircle,
  RotateCcw,
  HeartPulse,
  Truck
} from 'lucide-react';

export const AdminApprovalsPage: React.FC = () => {
  const {
    employees,
    roleRequests,
    roleTemplates,
    approveEmployeeRequest,
    rejectEmployeeRequest,
    approveRoleRequest,
    rejectRoleRequest
  } = useHospital();
  const { currentUser, activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending_employees' | 'staff_role_requests' | 'history' | 'deliveries'>('pending_employees');
  
  // Modals state
  const [rejectModalEmployee, setRejectModalEmployee] = useState<Employee | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [inspectEmployee, setInspectEmployee] = useState<Employee | null>(null);

  // Review Roles Modal State for Multi-Role Employee Approval
  const [reviewRolesEmployee, setReviewRolesEmployee] = useState<Employee | null>(null);
  const [selectedApprovedRoles, setSelectedApprovedRoles] = useState<RoleId[]>([]);
  const [roleRejectionNotes, setRoleRejectionNotes] = useState<string>('');

  // Reject Role Request Modal State
  const [rejectModalRoleRequest, setRejectModalRoleRequest] = useState<RoleRequest | null>(null);
  const [roleRequestRejectionReason, setRoleRequestRejectionReason] = useState('');

  // Nurse Help Dialog State
  const [nurseHelpOpen, setNurseHelpOpen] = useState(false);

  const pendingEmployees = employees.filter(e => e.status === 'pending_approval');
  const pendingRoleRequests = roleRequests.filter(r => r.status === 'pending');
  
  const historicalEmployees = employees.filter(
    e => (e.status === 'active' || e.status === 'rejected') && e.approvalDetails?.reviewedBy
  );
  const historicalRoleRequests = roleRequests.filter(
    r => (r.status === 'approved' || r.status === 'rejected') && r.reviewedBy
  );

  const isAuthorizedAdmin = activeRole === 'admin' || activeRole === 'owner';

  // 1-Click quick approve employee (approves all requested roles)
  const handleQuickApproveEmployee = (emp: Employee) => {
    approveEmployeeRequest(emp.id, emp.requestedAdditionalRoles || emp.additionalRoles || []);
  };

  // Open modal to selectively review and approve/reject individual additional roles
  const handleOpenReviewRoles = (emp: Employee) => {
    setReviewRolesEmployee(emp);
    setSelectedApprovedRoles(emp.requestedAdditionalRoles || emp.additionalRoles || []);
    setRoleRejectionNotes('Unselected roles not authorized for this staff assignment.');
  };

  const handleToggleApprovedRole = (role: RoleId) => {
    setSelectedApprovedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleConfirmReviewRoles = () => {
    if (!reviewRolesEmployee) return;

    const requestedRoles = reviewRolesEmployee.requestedAdditionalRoles || reviewRolesEmployee.additionalRoles || [];
    const unselectedRoles = requestedRoles.filter(r => !selectedApprovedRoles.includes(r));
    const rejectedPayload = unselectedRoles.map(r => ({
      role: r,
      reason: roleRejectionNotes.trim() || 'Role rejected during Admin registration review'
    }));

    approveEmployeeRequest(reviewRolesEmployee.id, selectedApprovedRoles, rejectedPayload);
    setReviewRolesEmployee(null);
  };

  const handleOpenRejectEmployee = (emp: Employee) => {
    setRejectModalEmployee(emp);
    setRejectionReason('Role verification incomplete or documents missing');
  };

  const handleConfirmRejectEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalEmployee || !rejectionReason.trim()) return;

    rejectEmployeeRequest(rejectModalEmployee.id, rejectionReason.trim());
    setRejectModalEmployee(null);
    setRejectionReason('');
  };

  const handleOpenRejectRoleRequest = (req: RoleRequest) => {
    setRejectModalRoleRequest(req);
    setRoleRequestRejectionReason('Role capacity currently full or request does not match current department staffing.');
  };

  const handleConfirmRejectRoleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalRoleRequest || !roleRequestRejectionReason.trim()) return;

    rejectRoleRequest(rejectModalRoleRequest.id, roleRequestRejectionReason.trim());
    setRejectModalRoleRequest(null);
    setRoleRequestRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Governance & Approvals</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  {pendingEmployees.length + pendingRoleRequests.length} Total Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff Registrations • Multi-Role Review & Selective Activation • Role Addition & Deactivation Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNurseHelpOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Request nurse assistance"
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Nurse Help</span>
            </button>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Authorized Admin: <strong className="text-slate-900">{currentUser?.name || 'Administrator'}</strong>
            </span>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 pt-5 border-t border-slate-100 mt-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending_employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'pending_employees'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Employee Registrations</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'pending_employees' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {pendingEmployees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('staff_role_requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'staff_role_requests'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff Role Changes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'staff_role_requests' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {pendingRoleRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Decision History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-200 text-slate-700">
              {historicalEmployees.length + historicalRoleRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('deliveries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'deliveries'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Live Delivery Tracking</span>
          </button>
        </div>
      </div>

      {/* Security Notice for Non-Admins */}
      {!isAuthorizedAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            You are logged in as <strong>{activeRole.replace('_', ' ')}</strong>. Only Hospital Admin or Hospital Owner accounts have authority to Accept or Reject employee registrations and role assignments.
          </span>
        </div>
      )}


      {/* TAB 1: PENDING EMPLOYEE REGISTRATIONS */}
      {activeTab === 'pending_employees' && (
        <div className="space-y-4">
          {pendingEmployees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-90" />
              <h3 className="text-sm font-bold text-slate-800">All Employee Registrations are Reviewed</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No pending employee registrations from HR. When HR submits a new employee, it will appear here for role review and activation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingEmployees.map(emp => {
                const submittedBy = emp.approvalDetails?.submittedBy?.name || 'Kavita Nambiar (HR)';
                const submittedAt = emp.approvalDetails?.submittedAt
                  ? new Date(emp.approvalDetails.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Today';

                const requestedAddRoles = emp.requestedAdditionalRoles || emp.additionalRoles || [];

                return (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-300 p-6 shadow-xs transition-all space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-base flex-shrink-0">
                          {emp.name.replace('Dr. ', '').charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{emp.name}</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Pending Admin Action
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            ID: <strong className="text-slate-800">{emp.employeeCode}</strong> • {emp.designation} • {emp.departmentName}
                          </div>
                        </div>
                      </div>

                      <div className="text-left lg:text-right">
                        <div className="text-[11px] text-slate-400">Submitted by HR</div>
                        <div className="text-xs font-semibold text-slate-700">{submittedBy}</div>
                        <div className="text-[10px] text-slate-400">{submittedAt}</div>
                      </div>
                    </div>

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Primary Role (Required)</div>
                        <div className="font-bold text-emerald-800 capitalize mt-0.5">{emp.primaryRole.replace('_', ' ')}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Mobile & Contact</div>
                        <div className="font-medium text-slate-800 mt-0.5">{emp.phone}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Joining Date</div>
                        <div className="font-medium text-slate-800 mt-0.5">{emp.joiningDate} ({emp.employmentType || 'Full-time'})</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Monthly Compensation</div>
                        <div className="font-bold text-slate-800 mt-0.5">₹{(emp.salaryDetails?.net || 65000).toLocaleString('en-IN')} / mo</div>
                      </div>
                    </div>

                    {/* Requested Roles Section */}
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider">
                          Requested Roles Review ({1 + requestedAddRoles.length} Total Roles)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Admin can review & selectively approve or reject individual roles.
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Primary role */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Primary: {emp.primaryRole.replace('_', ' ')} (Active upon approval)
                        </span>

                        {/* Additional roles */}
                        {requestedAddRoles.map(role => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300 capitalize"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                            +{role.replace('_', ' ')} (Requested Additional Role)
                          </span>
                        ))}

                        {requestedAddRoles.length === 0 && (
                          <span className="text-xs text-slate-500 italic">
                            No additional roles requested. Single role employee.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                      <button
                        onClick={() => setInspectEmployee(emp)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inspect Full Profile</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
                        <button
                          disabled={!isAuthorizedAdmin}
                          onClick={() => handleOpenRejectEmployee(emp)}
                          className="flex-1 sm:flex-initial text-center justify-center px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Reject Registration</span>
                        </button>

                        {requestedAddRoles.length > 0 ? (
                          <>
                            <button
                              disabled={!isAuthorizedAdmin}
                              onClick={() => handleOpenReviewRoles(emp)}
                              className="flex-1 sm:flex-initial text-center justify-center px-4 py-2 text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-4 h-4 text-blue-700" />
                              <span>Selectively Review Roles...</span>
                            </button>

                            <button
                              disabled={!isAuthorizedAdmin}
                              onClick={() => handleQuickApproveEmployee(emp)}
                              className="w-full sm:w-auto text-center justify-center px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>Approve All Roles & Activate</span>
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={!isAuthorizedAdmin}
                            onClick={() => handleQuickApproveEmployee(emp)}
                            className="flex-1 sm:flex-initial text-center justify-center px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Accept & Activate Employee</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* TAB 2: STAFF ROLE REQUESTS (Additions and Deactivations) */}
      {activeTab === 'staff_role_requests' && (
        <div className="space-y-4">
          {pendingRoleRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-90" />
              <h3 className="text-sm font-bold text-slate-800">No Pending Staff Role Requests</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Staff members can submit role requests (to add or remove additional roles) from their "My Roles" workspace. When submitted, they appear here for Admin review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingRoleRequests.map(req => {
                const isRemoval = req.requestType === 'remove';
                const formattedDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Today';

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-6 shadow-xs transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isRemoval ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {isRemoval ? <MinusCircle className="w-5 h-5 text-rose-600" /> : <PlusCircle className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{req.employeeName}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isRemoval
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}>
                              {isRemoval ? 'Role Deactivation Request' : 'Additional Role Request'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            ID: <strong className="text-slate-800">{req.employeeCode}</strong> • Primary Role: <span className="capitalize">{req.currentPrimaryRole.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right text-[11px] text-slate-400">
                        <span>Requested on</span>
                        <div className="font-semibold text-slate-700">{formattedDate}</div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Target Role:</span>
                        <span className="font-bold text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 capitalize">
                          {roleTemplates[req.requestedRole]?.name || req.requestedRole.replace('_', ' ')}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Staff Justification / Reason:</span>
                        <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed italic">
                          "{req.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        disabled={!isAuthorizedAdmin}
                        onClick={() => handleOpenRejectRoleRequest(req)}
                        className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Reject Request
                      </button>

                      <button
                        disabled={!isAuthorizedAdmin}
                        onClick={() => approveRoleRequest(req.id)}
                        className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
                          isRemoval ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isRemoval ? 'Approve Role Deactivation' : 'Approve & Activate Role'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* TAB 3: DECISION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Employee Registrations History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Employee Registrations History ({historicalEmployees.length})</span>
            </h3>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Approved / Assigned Roles</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Reviewed By</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Remarks / Rejection Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historicalEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No employee registration history available.
                      </td>
                    </tr>
                  ) : (
                    historicalEmployees.map(emp => {
                      const isApproved = emp.status === 'active';
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {emp.name}
                            <div className="text-[10px] text-slate-400 font-mono font-normal">{emp.employeeCode}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="capitalize font-semibold text-slate-800">
                              Primary: {emp.primaryRole.replace('_', ' ')}
                            </div>
                            {emp.additionalRoles && emp.additionalRoles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {emp.additionalRoles.map(r => (
                                  <span key={r} className="px-1.5 py-0.2 rounded text-[9px] bg-blue-50 text-blue-700 border border-blue-200 capitalize font-medium">
                                    +{r.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {emp.approvalDetails?.reviewedBy?.name || 'Admin'}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {emp.approvalDetails?.reviewedAt ? new Date(emp.approvalDetails.reviewedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {emp.approvalDetails?.rejectionReason ? (
                              <span className="text-rose-700 font-medium">{emp.approvalDetails.rejectionReason}</span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Activated & available in attendance</span>
                            )}
                            {emp.rejectedAdditionalRoles && emp.rejectedAdditionalRoles.length > 0 && (
                              <div className="text-[10px] text-rose-600 mt-1">
                                Rejected roles: {emp.rejectedAdditionalRoles.map(r => r.role).join(', ')}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Requests History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Staff Role Changes History ({historicalRoleRequests.length})</span>
            </h3>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Action & Role</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Reviewed By</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historicalRoleRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No role change history available.
                      </td>
                    </tr>
                  ) : (
                    historicalRoleRequests.map(req => {
                      const isApproved = req.status === 'approved';
                      const isRemoval = req.requestType === 'remove';
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {req.employeeName}
                            <div className="text-[10px] text-slate-400 font-mono font-normal">{req.employeeCode}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mr-1.5 ${
                              isRemoval ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isRemoval ? 'Remove' : 'Add'}
                            </span>
                            <span className="font-semibold text-slate-800 capitalize">
                              {roleTemplates[req.requestedRole]?.name || req.requestedRole.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {isRemoval ? 'Revoked' : 'Approved'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {req.reviewedBy?.name || 'Hospital Admin'}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {req.rejectionReason ? (
                              <span className="text-rose-700 font-medium">{req.rejectionReason}</span>
                            ) : (
                              <span>{req.reason}</span>
                            )}
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

      {/* TAB 4: LIVE DELIVERY TRACKING */}
      {activeTab === 'deliveries' && (
        <DeliveryTrackingView />
      )}


      {/* MODAL 1: SELECTIVE ROLE REVIEW FOR EMPLOYEE REGISTRATION */}
      {reviewRolesEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Review Requested Roles</h3>
                  <p className="text-xs text-slate-500 font-mono">{reviewRolesEmployee.name} ({reviewRolesEmployee.employeeCode})</p>
                </div>
              </div>
              <button onClick={() => setReviewRolesEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              As Hospital Admin, you can selectively approve or reject individual additional roles. Only approved roles will be granted to the employee.
            </p>

            <div className="space-y-3">
              {/* Primary Role (Fixed) */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Primary Role (Mandatory)</span>
                  <span className="text-xs font-bold text-slate-900 capitalize">{reviewRolesEmployee.primaryRole.replace('_', ' ')}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  Approved by Default
                </span>
              </div>

              {/* Additional Roles Checkboxes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Requested Additional Roles:</label>
                {(reviewRolesEmployee.requestedAdditionalRoles || reviewRolesEmployee.additionalRoles || []).map(role => {
                  const isChecked = selectedApprovedRoles.includes(role);
                  return (
                    <label
                      key={role}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleApprovedRole(role)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs capitalize">{role.replace('_', ' ')}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isChecked ? 'bg-blue-200 text-blue-900' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isChecked ? 'Will Grant Access' : 'Reject Access'}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Note for unselected roles */}
              {(reviewRolesEmployee.requestedAdditionalRoles || reviewRolesEmployee.additionalRoles || []).some(r => !selectedApprovedRoles.includes(r)) && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-rose-700">Rejection Note for Unselected Roles:</label>
                  <input
                    type="text"
                    value={roleRejectionNotes}
                    onChange={(e) => setRoleRejectionNotes(e.target.value)}
                    placeholder="e.g. Additional role not authorized for current ward rotation."
                    className="w-full text-xs p-2 rounded-xl border border-rose-200 bg-rose-50/50 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewRolesEmployee(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReviewRoles}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                Confirm & Activate Employee
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 2: REJECT EMPLOYEE REGISTRATION */}
      {rejectModalEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                Reject Employee Registration
              </h3>
              <button onClick={() => setRejectModalEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are rejecting the registration for <strong>{rejectModalEmployee.name}</strong> ({rejectModalEmployee.employeeCode}). 
              Please provide a clear reason. This will be recorded in the audit trail and sent to HR.
            </p>

            <form onSubmit={handleConfirmRejectEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Qualification credentials could not be verified with the medical council."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalEmployee(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL 3: REJECT ROLE REQUEST */}
      {rejectModalRoleRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                Reject Role Request
              </h3>
              <button onClick={() => setRejectModalRoleRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting {rejectModalRoleRequest.requestType === 'remove' ? 'removal' : 'addition'} of{' '}
              <strong>{rejectModalRoleRequest.requestedRole.replace('_', ' ')}</strong> for{' '}
              <strong>{rejectModalRoleRequest.employeeName}</strong>. Provide an explanation:
            </p>

            <form onSubmit={handleConfirmRejectRoleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={roleRequestRejectionReason}
                  onChange={(e) => setRoleRequestRejectionReason(e.target.value)}
                  placeholder="e.g. Employee must complete mandatory compliance certification before role activation."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalRoleRequest(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL 4: INSPECT PROFILE */}
      {inspectEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">{inspectEmployee.name} Profile Details</h3>
              <button onClick={() => setInspectEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Employee ID</span>
                  <span className="font-bold text-slate-800 font-mono">{inspectEmployee.employeeCode}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Role</span>
                  <span className="font-bold text-slate-800 capitalize">{inspectEmployee.primaryRole.replace('_', ' ')}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Department</span>
                  <span className="font-bold text-slate-800">{inspectEmployee.departmentName}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Designation</span>
                  <span className="font-bold text-slate-800">{inspectEmployee.designation}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Mobile</span>
                  <span className="font-bold text-slate-800">{inspectEmployee.phone}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Joining Date</span>
                  <span className="font-bold text-slate-800">{inspectEmployee.joiningDate}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-800 uppercase">Salary Details</div>
                <div className="text-xs text-slate-700 mt-1 flex justify-between">
                  <span>Basic: ₹{(inspectEmployee.salaryDetails?.basic || 50000).toLocaleString('en-IN')}</span>
                  <span>Allowances: ₹{(inspectEmployee.salaryDetails?.allowances || 10000).toLocaleString('en-IN')}</span>
                  <span>Net Pay: <strong>₹{(inspectEmployee.salaryDetails?.net || 56000).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectEmployee(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Nurse Help Dialog */}
      <NurseHelpDialog
        isOpen={nurseHelpOpen}
        onClose={() => setNurseHelpOpen(false)}
        defaultTaskType="Patient Assistance"
      />
    </div>
  );
};