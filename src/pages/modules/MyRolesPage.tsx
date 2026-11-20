import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import type { RoleId } from '../../types/roles';
import {
  ShieldCheck,
  Lock,
  PlusCircle,
  MinusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  X,
  User,
  ArrowRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export const MyRolesPage: React.FC = () => {
  const { currentUser, activeRole, availableRoles, switchActiveRole } = useAuth();
  const {
    roleTemplates,
    roleRequests,
    requestAdditionalRole
  } = useHospital();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRoleToRequest, setSelectedRoleToRequest] = useState<RoleId>('billing_staff');
  const [addReason, setAddReason] = useState('');

  const [deactivateModalRole, setDeactivateModalRole] = useState<RoleId | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
        Please select or log in as an employee to manage your roles.
      </div>
    );
  }

  // Active roles held by this employee
  const primaryRole = currentUser.primaryRole;
  const additionalRoles = currentUser.additionalRoles || [];

  // Allowed roles for request (exclude owner, admin, primaryRole, already held additionalRoles)
  const existingRoleIds = new Set([primaryRole, ...additionalRoles]);
  const availableRolesToRequest = (Object.keys(roleTemplates) as RoleId[]).filter(
    r => r !== 'owner' && r !== 'admin' && !existingRoleIds.has(r)
  );

  // Filter requests for current employee
  const myPendingRequests = roleRequests.filter(
    r => r.employeeId === currentUser.id && r.status === 'pending'
  );
  const myHistoricalRequests = roleRequests.filter(
    r => r.employeeId === currentUser.id && (r.status === 'approved' || r.status === 'rejected')
  );

  const handleOpenAddModal = () => {
    if (availableRolesToRequest.length > 0) {
      setSelectedRoleToRequest(availableRolesToRequest[0]);
    }
    setAddReason('');
    setIsAddModalOpen(true);
  };

  const handleSubmitAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addReason.trim()) return;

    requestAdditionalRole(currentUser.id, selectedRoleToRequest, addReason.trim(), 'add');
    setIsAddModalOpen(false);
    setAddReason('');
  };

  const handleOpenDeactivateModal = (role: RoleId) => {
    setDeactivateModalRole(role);
    setDeactivateReason('Department workload reallocated. Requesting deactivation of additional duties.');
  };

  const handleSubmitDeactivateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivateModalRole || !deactivateReason.trim()) return;

    requestAdditionalRole(currentUser.id, deactivateModalRole, deactivateReason.trim(), 'remove');
    setDeactivateModalRole(null);
    setDeactivateReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Roles & Authorizations</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {availableRoles.length} Active {availableRoles.length === 1 ? 'Role' : 'Roles'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital Staff Role Governance • Self Role Management • Admin-Authorized Cross-Functional Duties
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request New Additional Role</span>
            </button>
          </div>
        </div>

        {/* Current Identity & Role Switcher Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              {currentUser.name.replace('Dr. ', '').charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentUser.employeeCode} • {currentUser.designation} • {currentUser.departmentName}
              </div>
            </div>
          </div>

          {availableRoles.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Switch Active Role:</span>
              <div className="flex items-center gap-1">
                {availableRoles.map(role => (
                  <button
                    key={role}
                    onClick={() => switchActiveRole(role)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                      activeRole === role
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: PRIMARY ROLE (LOCKED & PROTECTED) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Primary Assigned Role</h2>
              <p className="text-[11px] text-slate-400">Core hospital appointment established during HR registration</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Lock className="w-3 h-3 text-emerald-600" />
            Protected • Permanent
          </span>
        </div>

        <div className="bg-gradient-to-r from-emerald-50/60 to-teal-50/40 rounded-xl p-5 border border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-emerald-950 capitalize">
                {roleTemplates[primaryRole]?.name || primaryRole.replace('_', ' ')}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                Core Role
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl">
              {roleTemplates[primaryRole]?.description || 'Principal role for hospital clinical and operational duties.'}
            </p>
          </div>

          <div className="text-left md:text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Administrative Status</div>
            <div className="text-xs font-bold text-emerald-800 mt-0.5">Active & Authorized by Admin</div>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
              Primary roles cannot be self-deactivated. Contact HR or Hospital Admin for departmental re-assignment.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: APPROVED ADDITIONAL ROLES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Approved Additional Roles</h2>
              <p className="text-[11px] text-slate-400">
                Cross-functional duties authorized by Hospital Admin for your account
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            {additionalRoles.length} Additional {additionalRoles.length === 1 ? 'Role' : 'Roles'}
          </span>
        </div>

        {additionalRoles.length === 0 ? (
          <div className="bg-slate-50/70 rounded-xl p-8 text-center border border-dashed border-slate-200 space-y-2">
            <Shield className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No Additional Roles Assigned</div>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              You are currently operating solely under your primary role. If you are handling cross-functional hospital responsibilities, you can request an additional role below.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Request Additional Role</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalRoles.map(roleId => {
              const template = roleTemplates[roleId];
              const isCurrentActive = activeRole === roleId;

              return (
                <div
                  key={roleId}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isCurrentActive
                      ? 'bg-blue-50/50 border-blue-300 shadow-xs ring-1 ring-blue-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 capitalize">
                        {template?.name || roleId.replace('_', ' ')}
                      </h3>
                      {isCurrentActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                          Active Now
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Approved & Active
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {template?.description || 'Authorized secondary role permitting access to designated department modules.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => switchActiveRole(roleId)}
                      className={`text-xs font-semibold inline-flex items-center gap-1 ${
                        isCurrentActive ? 'text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{isCurrentActive ? 'Currently in Workspace' : 'Switch to this Workspace'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenDeactivateModal(roleId)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 hover:underline"
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>Request Deactivation</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: PENDING ROLE REQUESTS TRACKER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pending Role Requests Tracker</h2>
              <p className="text-[11px] text-slate-400">
                Requests currently awaiting review by Hospital Administration
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {myPendingRequests.length} Pending
          </span>
        </div>

        {myPendingRequests.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No pending role requests. All submitted requests have been reviewed by Hospital Admin.
          </div>
        ) : (
          <div className="space-y-3">
            {myPendingRequests.map(req => {
              const isRemoval = req.requestType === 'remove';
              const reqDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Today';

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isRemoval ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isRemoval ? 'Request Role Deactivation' : 'Request Additional Role'}
                      </span>
                      <strong className="text-slate-900 capitalize text-sm">
                        {roleTemplates[req.requestedRole]?.name || req.requestedRole.replace('_', ' ')}
                      </strong>
                    </div>
                    <p className="text-slate-600 italic">"{req.reason}"</p>
                    <div className="text-[10px] text-slate-400">Submitted: {reqDate}</div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Awaiting Admin Approval
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: ROLE REQUEST HISTORY & REJECTION REASONS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Role Request History & Feedback</h2>
              <p className="text-[11px] text-slate-400">
                Previous administrative decisions and feedback reasons
              </p>
            </div>
          </div>
        </div>

        {/* Display any rejected additional roles recorded on employee profile */}
        {currentUser.rejectedAdditionalRoles && currentUser.rejectedAdditionalRoles.length > 0 && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
            <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Admin Rejection Feedback on Registration Roles</span>
            </span>
            <div className="space-y-1.5">
              {currentUser.rejectedAdditionalRoles.map(rej => (
                <div key={rej.role} className="text-xs text-rose-800 bg-white p-2.5 rounded-lg border border-rose-200">
                  <span className="font-bold capitalize">{rej.role.replace('_', ' ')}:</span>{' '}
                  <span>{rej.reason || 'Not approved for this staff profile by Hospital Administration.'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {myHistoricalRequests.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No past role request history for your account.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myHistoricalRequests.map(req => {
              const isApproved = req.status === 'approved';
              const isRemoval = req.requestType === 'remove';
              const reviewedDate = req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Recently';

              return (
                <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isRemoval ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isRemoval ? 'Deactivation' : 'Addition'}
                      </span>
                      <strong className="text-slate-900 capitalize">
                        {roleTemplates[req.requestedRole]?.name || req.requestedRole.replace('_', ' ')}
                      </strong>
                    </div>
                    <div className="text-slate-500">Reason: {req.reason}</div>
                    {req.rejectionReason && (
                      <div className="text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 font-medium">
                        Admin Feedback: {req.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right flex-shrink-0">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Approved by {req.reviewedBy?.name || 'Admin'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Rejected by {req.reviewedBy?.name || 'Admin'}
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400 mt-0.5">{reviewedDate}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: REQUEST ADDITIONAL ROLE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Request Additional Role</h3>
                  <p className="text-xs text-slate-500">Requires Hospital Admin Review</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Additional Role *</label>
                <select
                  value={selectedRoleToRequest}
                  onChange={(e) => setSelectedRoleToRequest(e.target.value as RoleId)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                >
                  {availableRolesToRequest.map(r => (
                    <option key={r} value={r}>
                      {roleTemplates[r]?.name || r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Owner and Admin roles cannot be requested by staff.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justification / Business Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  placeholder="e.g. Taking over evening cashier billing duties due to reception schedule adjustments."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] text-slate-500">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  Employees cannot directly grant themselves roles. Your request will be queued for Hospital Admin review and will only become active once approved.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Submit Request to Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST DEACTIVATION OF ADDITIONAL ROLE */}
      {deactivateModalRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                  <MinusCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Request Role Deactivation</h3>
                  <p className="text-xs text-slate-500 font-mono capitalize">{deactivateModalRole.replace('_', ' ')}</p>
                </div>
              </div>
              <button onClick={() => setDeactivateModalRole(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeactivateRequest} className="space-y-4 text-xs">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are requesting deactivation of your additional role{' '}
                <strong className="text-slate-900 capitalize">{deactivateModalRole.replace('_', ' ')}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Deactivation *</label>
                <textarea
                  required
                  rows={3}
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="e.g. Completed rotation in billing; returning full-time to outpatient clinical schedule."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2 text-[11px] text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Your access to this role will remain active until Hospital Admin authorizes the deactivation. Once approved, the role will be revoked immediately.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeactivateModalRole(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Submit Deactivation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};