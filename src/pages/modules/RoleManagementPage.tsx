import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { RoleId, RoleGroup } from '../../types/roles';
import { INITIAL_ROLE_TEMPLATES } from '../../constants/roleTemplates';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Filter,
  Users,
  Search,
  Check,
  X,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const RoleManagementPage: React.FC = () => {
  const { employees, roleTemplates, roleRequests, requestAdditionalRole, approveRoleRequest, rejectRoleRequest, toggleRoleTemplateActive } = useHospital();
  const { activeRole, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'requests' | 'catalogue' | 'matrix'>('requests');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<RoleGroup | 'all'>('all');

  // Modal states for Requesting Role & Rejecting Role
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId>('billing_staff');
  const [requestReason, setRequestReason] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredRequests = roleRequests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !requestReason) return;
    requestAdditionalRole(selectedEmpId, selectedRoleId, requestReason);
    setShowRequestModal(false);
    setRequestReason('');
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId || !rejectionReason) return;
    rejectRoleRequest(rejectingRequestId, rejectionReason);
    setShowRejectModal(false);
    setRejectingRequestId(null);
    setRejectionReason('');
  };

  const roleGroups: RoleGroup[] = ['Management', 'Medical Team', 'Front Office & Operations', 'Support Services'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Dynamic Role Governance & Approval Workflow
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            17 Dynamic Role Templates across 4 Groups • Primary & Multiple Approved Additional Roles • Admin Workflow
          </p>
        </div>

        {/* Tab switchers & Action */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'requests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Role Requests ({roleRequests.filter(r => r.status === 'pending').length} Pending)
            </button>
            <button
              onClick={() => setActiveTab('catalogue')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'catalogue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              17 Role Templates
            </button>
          </div>

          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request Additional Role
          </button>
        </div>
      </div>

      {/* TAB 1: ROLE REQUESTS & APPROVAL WORKFLOW */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 ml-1" />
              <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              Showing {filteredRequests.length} request records
            </div>
          </div>

          {/* Request Cards */}
          <div className="grid grid-cols-1 gap-3">
            {filteredRequests.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-200/80 text-slate-400 text-xs">
                No role requests found matching filter.
              </div>
            ) : (
              filteredRequests.map((req) => {
                const requestedTemplate = roleTemplates[req.requestedRole];
                const currentTemplate = roleTemplates[req.currentPrimaryRole];

                const statusBadges = {
                  pending: 'bg-amber-100 text-amber-800 border-amber-300',
                  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  rejected: 'bg-rose-100 text-rose-800 border-rose-300',
                  cancelled: 'bg-slate-100 text-slate-700 border-slate-300'
                };

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{req.employeeName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-medium">
                          {req.employeeCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusBadges[req.status]}`}>
                          {req.status}
                        </span>
                      </div>

                      {/* Role transition info */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Primary:</span>
                        <span className="font-semibold text-slate-700">{currentTemplate.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500">Requested Additional:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {requestedTemplate.name}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        <span className="font-semibold text-slate-700">Justification:</span> {req.reason}
                      </p>

                      <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-0.5">
                        <span>Requested by: {req.requestedBy.name} ({req.requestedBy.role})</span>
                        <span>•</span>
                        <span>Date: {new Date(req.createdAt).toLocaleDateString()}</span>
                        {req.reviewedBy && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">Reviewed by: {req.reviewedBy.name}</span>
                          </>
                        )}
                      </div>

                      {req.rejectionReason && (
                        <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 font-medium">
                          Rejection Reason: {req.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Admin Actions */}
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => approveRoleRequest(req.id)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Approve Role
                        </button>
                        <button
                          onClick={() => {
                            setRejectingRequestId(req.id);
                            setShowRejectModal(true);
                          }}
                          className="flex items-center gap-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 17 DYNAMIC ROLE TEMPLATES CATALOGUE */}
      {activeTab === 'catalogue' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed">
            <span className="font-bold">Institutional Staffing Flexibility:</span> Only <strong>Hospital Owner</strong> and <strong>Hospital Admin</strong> are mandatory. The remaining 15 roles can be toggled active or inactive based on your hospital's operational capacity (clinics vs tertiary multi-specialty centers).
          </div>

          {roleGroups.map((group) => {
            const groupRoles = (Object.keys(roleTemplates) as RoleId[]).filter(
              (rId) => roleTemplates[rId].group === group
            );

            return (
              <div key={group} className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <span>{group}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-semibold">
                    {groupRoles.length} Roles
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupRoles.map((rId) => {
                    const role = roleTemplates[rId];
                    const activeAssignedCount = employees.filter(
                      (e) => e.primaryRole === rId || e.additionalRoles.includes(rId)
                    ).length;

                    return (
                      <div
                        key={rId}
                        className={`bg-white rounded-xl p-4 border transition-all ${
                          role.isActiveForHospital
                            ? 'border-slate-200/80 shadow-xs hover:border-emerald-300'
                            : 'border-slate-200/50 opacity-60 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{role.name}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {role.isMandatory ? (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                  Mandatory Core Role
                                </span>
                              ) : (
                                <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded">
                                  Optional Role
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500 font-medium">
                                {activeAssignedCount} Staff Assigned
                              </span>
                            </div>
                          </div>

                          {/* Toggle Active status for optional roles */}
                          {!role.isMandatory && (
                            <button
                              onClick={() => toggleRoleTemplateActive(rId, !role.isActiveForHospital)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                                role.isActiveForHospital
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700'
                                  : 'bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                              }`}
                            >
                              {role.isActiveForHospital ? 'Active' : 'Activate'}
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                          {role.description}
                        </p>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{role.defaultPermissions.length} Granular Permissions</span>
                          <span className="text-emerald-600 font-medium">RBAC Template</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: REQUEST ADDITIONAL ROLE */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Request Additional Dynamic Role</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) - Primary: {roleTemplates[emp.primaryRole]?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Additional Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value as RoleId)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  required
                >
                  {(Object.keys(roleTemplates) as RoleId[]).map((rId) => (
                    <option key={rId} value={rId}>
                      {roleTemplates[rId].name} ({roleTemplates[rId].group})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Justification / Reason</label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Specify why this employee requires additional role privileges..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Submit for Admin Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT ROLE REQUEST */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Reject Role Assignment Request
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Justification</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the administrative or clinical reason for rejecting this additional role..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-500 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
