import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import type { Bed, AdmissionRequest } from '../../types/admission';
import { NurseHelpDialog } from '../../components/nurse/NurseHelpDialog';
import {
  Bed as BedIcon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Wrench,
  Users,
  X,
  Plus,
  ShieldCheck,
  Check,
  Building2,
  Calendar,
  LogOut,
  CreditCard,
  HeartPulse
} from 'lucide-react';

export const WardDashboard: React.FC = () => {
  const {
    beds,
    admissions,
    admissionRequests,
    posRooms,
    allocateBedToAdmissionRequest,
    dischargePatientFromBed,
    updateBedStatus
  } = useHospital();

  const [activeTab, setActiveTab] = useState<'requests' | 'beds' | 'inpatients' | 'tariffs'>('requests');
  const [selectedWardId, setSelectedWardId] = useState<string>('all');

  // Allocation Modal State
  const [allocatingReq, setAllocatingReq] = useState<AdmissionRequest | null>(null);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [allocationError, setAllocationError] = useState('');

  // Discharge Modal State
  const [dischargingAdmId, setDischargingAdmId] = useState<string | null>(null);

  // Nurse Help Dialog State
  const [nurseHelpOpen, setNurseHelpOpen] = useState(false);
  const [nurseHelpContext, setNurseHelpContext] = useState<{
    patientId?: string;
    patientName?: string;
    patientUhid?: string;
    defaultTaskType?: string;
  } | null>(null);

  const pendingRequests = admissionRequests.filter(r => r.status === 'pending');
  const activeAdmissions = admissions.filter(a => a.status === 'active');

  const filteredBeds = beds.filter(b => {
    if (selectedWardId === 'all') return true;
    return b.wardId === selectedWardId;
  });

  const availableBeds = beds.filter(b => b.status === 'available');
  const occupiedBeds = beds.filter(b => b.status === 'occupied');
  const cleaningBeds = beds.filter(b => b.status === 'cleaning');

  const handleOpenAllocateModal = (req: AdmissionRequest) => {
    setAllocatingReq(req);
    setSelectedBedId(availableBeds[0]?.id || '');
    setAllocationError('');
  };

  const handleConfirmAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingReq || !selectedBedId) return;

    const res = await allocateBedToAdmissionRequest(allocatingReq.id, selectedBedId);
    if (res.success) {
      setAllocatingReq(null);
    } else {
      setAllocationError(res.error || 'Failed to allocate bed.');
    }
  };

  const handleDischargePatient = async (admId: string) => {
    if (window.confirm('Discharge this inpatient? Room charges will be calculated and posted to the patient unified bill.')) {
      setDischargingAdmId(admId);
      try {
        await dischargePatientFromBed(admId);
      } finally {
        setDischargingAdmId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BedIcon className="w-5 h-5 text-cyan-600" />
            Ward Census, Bed Allocation & Inpatient Stay Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admission Request Dispatch • Double-Booking Protection • Discharge Billing • Kadai POS Room Tariffs
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNurseHelpContext({ defaultTaskType: 'Ward Assistance' });
              setNurseHelpOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Request nurse assistance for ward duties or inpatient care"
          >
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Nurse Help</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'requests' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-600" />
            Doctor Admission Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('inpatients')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'inpatients' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BedIcon className="w-3.5 h-3.5 text-emerald-600" />
            Active Inpatients ({activeAdmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('beds')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'beds' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            Bed Floor Map ({beds.length})
          </button>
          <button
            onClick={() => setActiveTab('tariffs')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'tariffs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-600" />
            POS Room Tariffs ({posRooms.length})
          </button>
        </div>
      </div>
    </div>

      {/* Bed Census Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Available Beds</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{availableBeds.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Occupied Beds</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{occupiedBeds.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <BedIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Turnover / Cleaning</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{cleaningBeds.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Doctor Requests</div>
            <div className="text-2xl font-black text-cyan-700 mt-1">{pendingRequests.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TAB 1: DOCTOR ADMISSION REQUESTS QUEUE */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Doctor Inpatient Admission Requests</h3>
              <p className="text-xs text-slate-500">Forwarded directly from doctor consultation workspace</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-cyan-50 text-cyan-800 rounded-full border border-cyan-200">
              {pendingRequests.length} Pending Allocation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Patient / UHID</th>
                  <th className="py-3 px-4">Admitting Doctor</th>
                  <th className="py-3 px-4">Admission Class</th>
                  <th className="py-3 px-4">Clinical Recommendation</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No pending admission requests from doctors.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{req.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.patientUhid}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {req.doctorName}
                      </td>
                      <td className="py-3.5 px-4">
                        {req.isVip ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            VIP Care
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Standard Non-VIP
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                        {req.notes || req.reason}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAllocateModal(req)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 ml-auto"
                        >
                          <BedIcon className="w-3.5 h-3.5" /> Allocate Bed
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE INPATIENTS & DISCHARGE BILLING */}
      {activeTab === 'inpatients' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Inpatient Census</h3>
              <p className="text-xs text-slate-500">Currently admitted patients with ongoing bed stays</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {activeAdmissions.length} Inpatients
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">IP # / Patient</th>
                  <th className="py-3 px-4">Ward & Bed Number</th>
                  <th className="py-3 px-4">Admitting Doctor</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4">Diagnosis / Reason</th>
                  <th className="py-3 px-4 text-right">Discharge & Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAdmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No active inpatients in the ward.
                    </td>
                  </tr>
                ) : (
                  activeAdmissions.map(adm => (
                    <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{adm.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{adm.admissionNumber} • {adm.patientUhid}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {adm.wardName} • Bed {adm.bedNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {adm.admittingDoctorName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(adm.admissionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                        {adm.admittingDiagnosis || adm.admissionReason}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDischargePatient(adm.id)}
                          disabled={dischargingAdmId === adm.id}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 ml-auto disabled:opacity-50"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          {dischargingAdmId === adm.id ? 'Discharging...' : 'Discharge & Bill Stay'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BED FLOOR MAP */}
      {activeTab === 'beds' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredBeds.map(bed => (
            <div
              key={bed.id}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                bed.status === 'occupied'
                  ? 'border-rose-200 bg-rose-50/40'
                  : bed.status === 'cleaning'
                  ? 'border-amber-200 bg-amber-50/40'
                  : 'border-emerald-200 bg-emerald-50/40 hover:shadow-xs'
              }`}
            >
              <div className="font-mono text-sm font-black text-slate-900">{bed.bedNumber}</div>
              <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{bed.wardName}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">₹{bed.dailyRate}/day</div>

              <div className="mt-2.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  bed.status === 'occupied'
                    ? 'bg-rose-100 text-rose-800'
                    : bed.status === 'cleaning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {bed.status.toUpperCase()}
                </span>
              </div>

              {bed.status === 'cleaning' && (
                <button
                  onClick={() => updateBedStatus(bed.id, 'available')}
                  className="mt-2 text-[10px] font-bold text-emerald-700 hover:underline block mx-auto"
                >
                  Mark Sanitized
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: KADAI POS ROOM TARIFFS */}
      {activeTab === 'tariffs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kadai POS Room Tariff Matrix</h3>
              <p className="text-xs text-slate-500">Configured in connected Kadai Medical & Hospital module</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-cyan-50 text-cyan-800 rounded-full border border-cyan-200">
              {posRooms.length} Room Types
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Room Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">AC / Non-AC</th>
                  <th className="py-3 px-4">Speciality</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Daily Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posRooms.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.roomName}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{r.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.isAc ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {r.isAc ? 'AC Room' : 'Non-AC'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{r.speciality || 'General'}</td>
                    <td className="py-3.5 px-4 font-mono">{r.availableBeds} / {r.totalBeds} Beds</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{r.dailyCharge} / day</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALLOCATE BED MODAL (WITH DOUBLE-BOOKING CHECK) */}
      {allocatingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Allocate Inpatient Bed</h3>
                <p className="text-xs text-slate-500">{allocatingReq.patientName} ({allocatingReq.patientUhid})</p>
              </div>
              <button onClick={() => setAllocatingReq(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {allocationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{allocationError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmAllocation} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Available Bed *
                </label>
                <select
                  required
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none"
                >
                  <option value="">-- Choose Bed --</option>
                  {beds.map(b => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={b.status === 'occupied'}
                    >
                      {b.bedNumber} ({b.wardName}) - ₹{b.dailyRate}/day {b.status === 'occupied' ? '[OCCUPIED - DOUBLE BOOKING BLOCKED]' : `[${b.status.toUpperCase()}]`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-700">Doctor's Clinical Recommendation:</div>
                <div className="text-slate-600">{allocatingReq.notes || 'Routine admission monitoring'}</div>
                <div className="text-[10px] text-cyan-800 font-semibold pt-1">
                  Class: {allocatingReq.isVip ? 'VIP Special Care' : 'Standard Non-VIP'}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAllocatingReq(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Confirm Bed Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reusable Nurse Help Dialog */}
      <NurseHelpDialog
        isOpen={nurseHelpOpen}
        onClose={() => {
          setNurseHelpOpen(false);
          setNurseHelpContext(null);
        }}
        patientId={nurseHelpContext?.patientId}
        patientName={nurseHelpContext?.patientName}
        patientUhid={nurseHelpContext?.patientUhid}
        defaultTaskType={nurseHelpContext?.defaultTaskType || 'Ward Assistance'}
      />
    </div>
  );
};
