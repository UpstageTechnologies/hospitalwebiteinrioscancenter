import React, { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { NurseTask, NurseAvailabilityStatus, NurseTaskPriority } from '../../types/nurse';
import {
  HeartPulse,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Send,
  X,
  Check,
  Play,
  RotateCcw,
  Syringe,
  ClipboardList,
  ShieldAlert,
  ChevronRight,
  Filter,
  Plus,
  BedDouble
} from 'lucide-react';

export const NurseDashboard: React.FC = () => {
  const {
    nurseTasks,
    employees,
    acceptNurseTask,
    startNurseTask,
    completeNurseTask,
    rejectNurseTask,
    setNurseAvailability,
    admissions,
    vitals,
    recordVitals
  } = useHospital();

  const { currentUser } = useAuth();

  // Find nurse employee profile in the hospital
  const currentNurse = useMemo(() => {
    return employees.find(
      e => e.id === currentUser?.id || (currentUser?.email && e.email === currentUser.email)
    );
  }, [employees, currentUser]);

  const nurseStaffId = currentNurse?.id || currentUser?.id || 'emp-nurse';
  const availability = currentNurse?.availabilityStatus || 'available';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed' | 'all' | 'vitals'>('pending');

  // Modals
  const [rejectModalTask, setRejectModalTask] = useState<NurseTask | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [completeModalTask, setCompleteModalTask] = useState<NurseTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showVitalsModal, setShowVitalsModal] = useState(false);

  // Vitals form state
  const [vitalsPatientId, setVitalsPatientId] = useState('');
  const [vitalsPatientUhid, setVitalsPatientUhid] = useState('');
  const [bpSys, setBpSys] = useState('120');
  const [bpDia, setBpDia] = useState('80');
  const [pulse, setPulse] = useState('76');
  const [temp, setTemp] = useState('98.6');
  const [spo2, setSpo2] = useState('98');
  const [vitalsNotes, setVitalsNotes] = useState('');

  // Filter tasks for this nurse
  const myTasks = useMemo(() => {
    return nurseTasks.filter(
      t => t.nurseStaffId === nurseStaffId || t.nurseUid === currentUser?.email || t.nurseUid === currentUser?.id
    );
  }, [nurseTasks, nurseStaffId, currentUser]);

  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const inProgressTasks = myTasks.filter(t => t.status === 'accepted' || t.status === 'in_progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  // Today's completed tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = completedTasks.filter(t => (t.completedAt || t.createdAt).startsWith(todayStr));

  // Handler for availability switch
  const handleAvailabilityChange = async (newStatus: NurseAvailabilityStatus) => {
    if (!nurseStaffId) return;
    await setNurseAvailability(nurseStaffId, newStatus);
  };

  // Actions
  const handleAccept = async (task: NurseTask) => {
    await acceptNurseTask(task.id, nurseStaffId);
  };

  const handleStart = async (task: NurseTask) => {
    await startNurseTask(task.id);
  };

  const handleOpenCompleteModal = (task: NurseTask) => {
    setCompleteModalTask(task);
    setCompletionNotes('');
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalTask) return;
    await completeNurseTask(completeModalTask.id, nurseStaffId, completionNotes.trim() || 'Task executed successfully.');
    setCompleteModalTask(null);
  };

  const handleOpenRejectModal = (task: NurseTask) => {
    setRejectModalTask(task);
    setRejectionReason('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalTask) return;
    if (!rejectionReason.trim()) {
      alert('Please specify the reason for declining this request.');
      return;
    }
    await rejectNurseTask(rejectModalTask.id, nurseStaffId, rejectionReason.trim());
    setRejectModalTask(null);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsPatientId) {
      alert('Please select or specify a patient.');
      return;
    }

    recordVitals({
      patientId: vitalsPatientId,
      uhid: vitalsPatientUhid || 'UPH-PAT',
      recordedBy: {
        id: nurseStaffId,
        name: currentUser?.name || 'Staff Nurse',
        role: 'nurse'
      },
      bloodPressureSystolic: parseInt(bpSys) || 120,
      bloodPressureDiastolic: parseInt(bpDia) || 80,
      heartRatePulse: parseInt(pulse) || 72,
      temperature: parseFloat(temp) || 98.6,
      spo2: parseInt(spo2) || 98,
      notes: vitalsNotes
    });

    setShowVitalsModal(false);
    setVitalsNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Availability Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Nursing Station & Global Task Queue
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {currentNurse?.employeeCode || 'NURSE-01'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Logged in as: <strong className="text-slate-700">{currentUser?.name}</strong> • Real-time patient care assignments
              </p>
            </div>
          </div>
        </div>

        {/* Global Live Availability Status Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 pl-2">My Duty Status:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAvailabilityChange('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                availability === 'available'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${availability === 'available' ? 'bg-white' : 'bg-emerald-500'}`} />
              Available
            </button>
            <button
              onClick={() => handleAvailabilityChange('busy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                availability === 'busy'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${availability === 'busy' ? 'bg-white' : 'bg-amber-500'}`} />
              Busy
            </button>
            <button
              onClick={() => handleAvailabilityChange('offline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                availability === 'offline'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${availability === 'offline' ? 'bg-white' : 'bg-slate-400'}`} />
              Offline
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-100'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>New Requests</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{pendingTasks.length}</span>
            <span className="text-xs text-slate-500">awaiting response</span>
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setActiveTab('active')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-100'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Active Assignments</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{inProgressTasks.length}</span>
            <span className="text-xs text-slate-500">in progress</span>
          </div>
        </div>

        {/* Completed Today */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-100'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{completedToday.length}</span>
            <span className="text-xs text-slate-500">tasks finalized</span>
          </div>
        </div>

        {/* Availability Badge Card */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Current Status</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                availability === 'available'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : availability === 'busy'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  availability === 'available'
                    ? 'bg-emerald-500 animate-pulse'
                    : availability === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              {availability}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            New Requests
            {pendingTasks.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'pending' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {pendingTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Active & In Progress
            {inProgressTasks.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'active' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {inProgressTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Completed Tasks
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'completed' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {completedTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All History ({myTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'vitals'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            Ward Vitals & Inpatients
          </button>
        </div>

        {activeTab === 'vitals' && (
          <button
            onClick={() => setShowVitalsModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Record Vitals
          </button>
        )}
      </div>

      {/* Main Task List Content */}
      {activeTab !== 'vitals' ? (
        <div className="space-y-3">
          {(() => {
            const listToRender =
              activeTab === 'pending'
                ? pendingTasks
                : activeTab === 'active'
                ? inProgressTasks
                : activeTab === 'completed'
                ? completedTasks
                : myTasks;

            if (listToRender.length === 0) {
              return (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 shadow-xs space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No Assignments Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {activeTab === 'pending'
                      ? 'No pending assistance requests at the moment. You will be notified immediately when a new task is dispatched.'
                      : activeTab === 'active'
                      ? 'No tasks currently marked as active or in progress.'
                      : activeTab === 'completed'
                      ? 'No tasks completed yet.'
                      : 'No task records found in your queue.'}
                  </p>
                </div>
              );
            }

            return listToRender.map((task) => {
              const isUrgent = task.priority === 'urgent';
              const isPending = task.status === 'pending';
              const isAccepted = task.status === 'accepted';
              const isInProgress = task.status === 'in_progress';
              const isCompleted = task.status === 'completed';
              const isRejected = task.status === 'rejected';

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-3xl border bg-white shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isUrgent ? 'border-rose-300 ring-1 ring-rose-100 bg-rose-50/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    {/* Header line: Badges & Time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {task.taskId || task.id}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isPending
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            : isAccepted
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : isInProgress
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>

                      {/* Priority */}
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                          <AlertTriangle className="w-2.5 h-2.5" /> URGENT / STAT
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Task Title & Requester */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {task.taskType}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Requested by <strong className="text-slate-700">{task.requestedByName}</strong> ({task.requestedByRole.toUpperCase()})
                      </p>
                    </div>

                    {/* Patient Context (if any) */}
                    {(task.patientName || task.patientUhid) && (
                      <div className="inline-flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-bold text-slate-800">{task.patientName}</span>
                        {task.patientUhid && (
                          <span className="text-[11px] font-mono text-slate-500">({task.patientUhid})</span>
                        )}
                      </div>
                    )}

                    {/* Clinical Details (e.g. Injections) */}
                    {task.clinicalOrderDetails?.medicineName && (
                      <div className="text-xs p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
                        <span className="font-bold">Prescription:</span> {task.clinicalOrderDetails.medicineName} •{' '}
                        <span className="font-semibold">Dose:</span> {task.clinicalOrderDetails.dosage || 'Standard'} •{' '}
                        <span className="font-semibold">Route:</span> {task.clinicalOrderDetails.route || 'IV / IM'}
                      </div>
                    )}

                    {/* Description / Instructions */}
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                      {task.description}
                    </p>

                    {/* Notes if completed or rejected */}
                    {task.completionNotes && (
                      <div className="text-xs text-emerald-800 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                        <span className="font-bold">Completion Notes:</span> {task.completionNotes}
                      </div>
                    )}
                    {task.rejectionReason && (
                      <div className="text-xs text-rose-800 bg-rose-50/60 p-2 rounded-xl border border-rose-100">
                        <span className="font-bold">Decline Reason:</span> {task.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-2 md:pt-0">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleAccept(task)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Task
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(task)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-xl text-xs transition-all"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => handleStart(task)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Task
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => handleOpenCompleteModal(task)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete Task
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Finalized
                      </span>
                    )}

                    {isRejected && (
                      <span className="text-xs font-bold text-rose-500">
                        Declined
                      </span>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : (
        /* Ward Inpatients & Vitals View */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Inpatient Ward Census</h3>
              <p className="text-xs text-slate-500">Current admitted patients and latest observation charts</p>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              {admissions.filter(a => a.status === 'active').length} Inpatients
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {admissions.filter(a => a.status === 'active').length === 0 ? (
              <div className="col-span-3 py-12 text-center text-xs text-slate-400">
                No active inpatient admissions currently assigned to wards.
              </div>
            ) : (
              admissions.filter(a => a.status === 'active').map(adm => {
                const latestVital = vitals.find(v => v.patientId === adm.patientId);
                return (
                  <div key={adm.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{adm.patientName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        Bed {adm.bedNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {adm.patientUhid} • {adm.wardName}
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-1 italic">
                      Diagnosis: {adm.admittingDiagnosis}
                    </div>
                    {latestVital ? (
                      <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-1 text-center text-[10px]">
                        <div className="bg-white p-1 rounded border border-slate-200">
                          <span className="text-slate-400 block">BP</span>
                          <span className="font-bold text-slate-800">{latestVital.bloodPressureSystolic}/{latestVital.bloodPressureDiastolic}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-200">
                          <span className="text-slate-400 block">Pulse</span>
                          <span className="font-bold text-slate-800">{latestVital.heartRatePulse}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-200">
                          <span className="text-slate-400 block">SpO2</span>
                          <span className="font-bold text-slate-800">{latestVital.spo2}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 italic">
                        No recent vitals recorded
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE TASK */}
      {completeModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Finalize Task & Release Status
              </h3>
              <button onClick={() => setCompleteModalTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmComplete} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-800">{completeModalTask.taskType}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Requested by {completeModalTask.requestedByName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nursing Observations & Administration Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record administration confirmation, patient reaction, IV flow rate, vitals observed, or handover remarks..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                Upon finalizing, your hospital status will automatically reset to <strong>Available</strong> for incoming assignments.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalTask(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Mark Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DECLINE / REJECT TASK */}
      {rejectModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Decline Assistance Request
              </h3>
              <button onClick={() => setRejectModalTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-800">{rejectModalTask.taskType}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Requested by {rejectModalTask.requestedByName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Declining (Mandatory) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Attending emergency code blue in ICU, assisting in OT 2, shift ending..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-rose-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalTask(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD VITALS */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Record Clinical Vital Signs
              </h3>
              <button onClick={() => setShowVitalsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={vitalsPatientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setVitalsPatientId(id);
                    const match = admissions.find(a => a.patientId === id);
                    if (match) setVitalsPatientUhid(match.patientUhid);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option value="">-- Choose Admitted Patient --</option>
                  {admissions.filter(a => a.status === 'active').map(a => (
                    <option key={a.id} value={a.patientId}>
                      {a.patientName} (Bed {a.bedNumber} • {a.patientUhid})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">BP Systolic (mmHg)</label>
                  <input
                    type="number"
                    value={bpSys}
                    onChange={(e) => setBpSys(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">BP Diastolic (mmHg)</label>
                  <input
                    type="number"
                    value={bpDia}
                    onChange={(e) => setBpDia(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinical Observations</label>
                <textarea
                  value={vitalsNotes}
                  onChange={(e) => setVitalsNotes(e.target.value)}
                  placeholder="Patient responsive, comfortable, no distress..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
