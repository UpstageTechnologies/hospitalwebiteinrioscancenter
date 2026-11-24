import React, { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../types/employee';
import type { NurseTaskType, NurseTaskPriority } from '../../types/nurse';
import {
  X,
  Search,
  UserCheck,
  AlertTriangle,
  Clock,
  Send,
  HeartPulse,
  Syringe,
  Activity,
  User,
  ShieldAlert,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';

interface NurseHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  patientUhid?: string;
  defaultTaskType?: string;
  clinicalOrderDetails?: {
    prescriptionId?: string;
    medicineName?: string;
    dosage?: string;
    route?: string;
    doctorInstructions?: string;
  };
}

const TASK_TYPES: { id: NurseTaskType; label: string; icon: string }[] = [
  { id: 'Injection Administration', label: 'Injection Administration', icon: 'syringe' },
  { id: 'Patient Assistance', label: 'Patient Assistance & Mobilization', icon: 'user' },
  { id: 'Check Patient Vitals', label: 'Check Patient Vitals (BP, Pulse, Temp, SpO2)', icon: 'pulse' },
  { id: 'Dressing Assistance', label: 'Wound Dressing & Bandaging', icon: 'shield' },
  { id: 'Patient Transfer Assistance', label: 'Patient Transfer (Bed/Wheelchair/OT/Lab)', icon: 'activity' },
  { id: 'Doctor Assistance', label: 'OPD Doctor Consultation Assistance', icon: 'stethoscope' },
  { id: 'Ward Assistance', label: 'Inpatient Ward Nursing Care', icon: 'activity' },
  { id: 'Laboratory Assistance', label: 'Specimen Collection Assistance', icon: 'pulse' },
  { id: 'Other', label: 'Other Clinical Task', icon: 'clock' }
];

export const NurseHelpDialog: React.FC<NurseHelpDialogProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientUhid,
  defaultTaskType,
  clinicalOrderDetails
}) => {
  const { employees, requestNurseTask } = useHospital();
  const { currentUser } = useAuth();

  const [selectedNurse, setSelectedNurse] = useState<Employee | null>(null);
  const [taskType, setTaskType] = useState<NurseTaskType>(
    (defaultTaskType as NurseTaskType) || 'Patient Assistance'
  );
  const [priority, setPriority] = useState<NurseTaskPriority>('normal');
  const [description, setDescription] = useState('');
  const [nurseSearch, setNurseSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualPatientName, setManualPatientName] = useState(patientName || '');
  const [manualPatientUhid, setManualPatientUhid] = useState(patientUhid || '');

  // Filter only active nurses in hospital
  const nurses = useMemo(() => {
    return employees.filter(e => {
      const isNurse = e.primaryRole === 'nurse' || (e.additionalRoles && e.additionalRoles.includes('nurse'));
      return isNurse && e.status === 'active';
    });
  }, [employees]);

  const filteredNurses = useMemo(() => {
    const q = nurseSearch.toLowerCase().trim();
    if (!q) return nurses;
    return nurses.filter(n =>
      n.name.toLowerCase().includes(q) ||
      (n.employeeCode && n.employeeCode.toLowerCase().includes(q)) ||
      (n.departmentName && n.departmentName.toLowerCase().includes(q))
    );
  }, [nurses, nurseSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNurse) {
      alert('Please select an available nurse from the roster.');
      return;
    }

    if (selectedNurse.availabilityStatus === 'busy') {
      alert('Selected nurse is currently busy on another task. Please choose an available nurse.');
      return;
    }

    if (selectedNurse.availabilityStatus === 'offline') {
      alert('Selected nurse is currently offline. Please choose an available nurse.');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a brief instruction or task description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPatientName = patientName || manualPatientName.trim() || undefined;
      const finalPatientUhid = patientUhid || manualPatientUhid.trim() || undefined;

      const res = await requestNurseTask({
        nurseStaffId: selectedNurse.id,
        nurseUid: selectedNurse.email || selectedNurse.id,
        nurseName: selectedNurse.name,
        requestedByStaffId: currentUser?.id || 'emp-user',
        requestedByUid: currentUser?.email || currentUser?.id || 'emp-user',
        requestedByName: currentUser?.name || 'Staff Member',
        requestedByRole: currentUser?.primaryRole || 'staff',
        patientId: patientId || undefined,
        patientName: finalPatientName,
        patientUhid: finalPatientUhid,
        taskType,
        description: description.trim(),
        priority,
        clinicalOrderDetails: clinicalOrderDetails || undefined
      });

      if (res.success) {
        // Reset form & close
        setSelectedNurse(null);
        setDescription('');
        setPriority('normal');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-rose-50 via-pink-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Hospital-Wide Nurse Assistance Request
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider">
                  Live Dispatch
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Instantly assign a clinical task to an available on-duty nurse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Patient Context (if available) */}
          {(patientName || patientUhid) ? (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{patientName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">UHID: {patientUhid}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Patient Attached
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Patient Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={manualPatientName}
                  onChange={(e) => setManualPatientName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-rose-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Patient UHID / Room No (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPH-P2026-0012 or Room 204"
                  value={manualPatientUhid}
                  onChange={(e) => setManualPatientUhid(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-rose-400"
                />
              </div>
            </div>
          )}

          {/* Clinical Order Notice (e.g., Medicine details if injection) */}
          {clinicalOrderDetails?.medicineName && (
            <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Syringe className="w-4 h-4 text-amber-700" />
                Prescription Medication Details Attached
              </div>
              <div className="text-[11px] text-amber-800">
                <span className="font-semibold">Medicine:</span> {clinicalOrderDetails.medicineName} •{' '}
                <span className="font-semibold">Dosage:</span> {clinicalOrderDetails.dosage || 'As prescribed'} •{' '}
                <span className="font-semibold">Route:</span> {clinicalOrderDetails.route || 'Intramuscular / IV'}
              </div>
              {clinicalOrderDetails.doctorInstructions && (
                <div className="text-[10px] text-amber-700 italic">
                  Note: {clinicalOrderDetails.doctorInstructions}
                </div>
              )}
            </div>
          )}

          {/* Nurse Selector Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                1. Select Available Nurse *
              </label>
              <span className="text-[11px] text-slate-500">
                {nurses.filter(n => n.availabilityStatus === 'available' || !n.availabilityStatus).length} Available Now
              </span>
            </div>

            {/* Nurse Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search nurse by name or employee code..."
                value={nurseSearch}
                onChange={(e) => setNurseSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white"
              />
            </div>

            {/* Nurse List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredNurses.length === 0 ? (
                <div className="col-span-2 py-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No active nursing staff found matching search.
                </div>
              ) : (
                filteredNurses.map((nurse) => {
                  const availability = nurse.availabilityStatus || 'available';
                  const isAvailable = availability === 'available';
                  const isBusy = availability === 'busy';
                  const isOffline = availability === 'offline';
                  const isSelected = selectedNurse?.id === nurse.id;

                  return (
                    <div
                      key={nurse.id}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedNurse(nurse);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-2 ring-rose-200'
                          : isAvailable
                          ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                          : 'border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {nurse.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{nurse.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {nurse.employeeCode} • {nurse.departmentName || 'Nursing'}
                            </div>
                          </div>
                        </div>

                        {/* Availability Badge */}
                        <div>
                          {isAvailable && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Available
                            </span>
                          )}
                          {isBusy && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title="Busy on another task">
                              <Clock className="w-2.5 h-2.5" />
                              Busy
                            </span>
                          )}
                          {isOffline && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              Offline
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-2 text-[10px] font-bold text-rose-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Selected for assignment
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Task Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                2. Task Category *
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as NurseTaskType)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 outline-none focus:bg-white"
              >
                {TASK_TYPES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                3. Priority Level *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    priority === 'normal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    priority === 'urgent'
                      ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Urgent / Stat
                </button>
              </div>
            </div>
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              4. Instructions & Clinical Task Details *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide exact instructions (e.g. Administer 100ml Paracetamol IV infusion, check vitals q15min, escort patient to Radiology for chest X-ray)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-rose-400 font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Requesting as: <span className="font-bold text-slate-700">{currentUser?.name || 'Staff'} ({currentUser?.primaryRole || 'doctor'})</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedNurse}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Dispatching...' : 'Dispatch Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
