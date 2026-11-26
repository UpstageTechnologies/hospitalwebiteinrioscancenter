import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Patient } from '../../types/patient';
import type { Appointment } from '../../types/clinical';
import { NurseHelpDialog } from '../../components/nurse/NurseHelpDialog';
import {
  Calendar,
  Clock,
  UserPlus,
  Users,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Phone,
  Filter,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  X,
  CreditCard,
  Globe,
  Tag,
  Check,
  HeartPulse
} from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const {
    patients,
    appointments,
    employees,
    addPatient,
    registerWalkInAppointment,
    confirmOnlineAppointment,
    updateAppointmentStatus,
    updateAppointment
  } = useHospital();
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'walk_in' | 'online' | 'queue' | 'patients'>('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');

  // Walk-in Registration Form State
  const [wName, setWName] = useState('');
  const [wPhone, setWPhone] = useState('');
  const [wAge, setWAge] = useState('32');
  const [wGender, setWGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [wDoctorId, setWDoctorId] = useState('');
  const [wConsultationFee, setWConsultationFee] = useState<string>('500');
  const [wIsFeePaid, setWIsFeePaid] = useState<boolean>(true);
  const [wComplaint, setWComplaint] = useState('General Consultation & Checkup');
  const [wDate, setWDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Edit / Reschedule Modal State
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  // Nurse Help Dialog State
  const [nurseHelpOpen, setNurseHelpOpen] = useState(false);
  const [nurseHelpContext, setNurseHelpContext] = useState<{
    patientId?: string;
    patientName?: string;
    patientUhid?: string;
    defaultTaskType?: string;
  } | null>(null);
  const [editComplaint, setEditComplaint] = useState('');
  const [editDocId, setEditDocId] = useState('');
  const [editSlot, setEditSlot] = useState('');
  const [editDate, setEditDate] = useState('');

  const doctors = employees.filter(
    e => (e.primaryRole === 'doctor' || e.additionalRoles.includes('doctor') || e.primaryRole === 'owner') && e.status === 'active'
  );

  const handleDoctorChange = (selectedId: string) => {
    setWDoctorId(selectedId);
    const chosenDoc = doctors.find(d => d.id === selectedId);
    if (chosenDoc?.consultationFee != null && Number(chosenDoc.consultationFee) >= 0) {
      setWConsultationFee(String(chosenDoc.consultationFee));
    } else {
      setWConsultationFee('500');
    }
  };

  // Quick Walk-in Registration
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wName || !wPhone) return;

    const doc = doctors.find(d => d.id === wDoctorId) || doctors[0];
    if (!doc) return;

    const parsedFee = parseFloat(wConsultationFee);
    const validFee = !isNaN(parsedFee) && parsedFee >= 0 ? parsedFee : 500;

    await registerWalkInAppointment({
      patientName: wName.trim(),
      phone: wPhone.trim(),
      age: parseInt(wAge) || 30,
      gender: wGender,
      doctorId: doc.id,
      doctorName: doc.name,
      departmentId: doc.departmentId,
      departmentName: doc.departmentName,
      chiefComplaint: wComplaint.trim(),
      appointmentDate: wDate,
      consultationFee: validFee,
      isFeePaid: wIsFeePaid
    });

    setWName('');
    setWPhone('');
    setWComplaint('General Consultation & Checkup');
    setActiveSubTab('queue');
  };

  // Online Appointments Confirm & Issue Token
  const handleConfirmOnline = async (apt: Appointment) => {
    await confirmOnlineAppointment(apt.id);
  };

  const handleCancelApt = (aptId: string) => {
    updateAppointmentStatus(aptId, 'cancelled');
  };

  const handleStartEditApt = (apt: Appointment) => {
    setEditingApt(apt);
    setEditComplaint(apt.chiefComplaint);
    setEditDocId(apt.doctorId);
    setEditSlot(apt.timeSlot);
    setEditDate(apt.appointmentDate);
  };

  const handleSaveEditApt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    const doc = employees.find(e => e.id === editDocId);
    updateAppointment(editingApt.id, {
      chiefComplaint: editComplaint.trim(),
      doctorId: editDocId,
      doctorName: doc?.name || editingApt.doctorName,
      timeSlot: editSlot,
      appointmentDate: editDate
    });
    setEditingApt(null);
  };

  // Filter queues
  const onlineRequests = appointments.filter(a => a.status === 'requested' || a.bookingSource === 'online');

  const filteredQueue = appointments.filter(apt => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      apt.patientName.toLowerCase().includes(q) ||
      apt.patientUhid.toLowerCase().includes(q) ||
      apt.patientPhone.includes(q) ||
      (apt.tokenFormatted && apt.tokenFormatted.toLowerCase().includes(q)) ||
      String(apt.tokenNumber).includes(q);
    const matchDoc = selectedDoctorFilter === 'all' || apt.doctorId === selectedDoctorFilter;
    return matchSearch && matchDoc;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Reception Desk • Online & Walk-in Token Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant OP Tokens • Online Request Review • Duplicate Prevention • Real-Time Queue
          </p>
        </div>

        {/* Top Action & Quick Nav Subtabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNurseHelpContext(null);
              setNurseHelpOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Request nurse assistance at Front Desk"
          >
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Nurse Help</span>
          </button>

          {/* Quick Nav Subtabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('walk_in')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'walk_in' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            Walk-in Desk
          </button>
          <button
            onClick={() => setActiveSubTab('online')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'online' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            Online Requests
            {onlineRequests.filter(r => r.status === 'requested').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {onlineRequests.filter(r => r.status === 'requested').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'queue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            Live OP Queue ({filteredQueue.length})
          </button>
          <button
            onClick={() => setActiveSubTab('patients')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'patients' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            Patients ({patients.length})
          </button>
        </div>
      </div>
    </div>

      {/* TAB 1: WALK-IN TOKEN DESK */}
      {activeSubTab === 'walk_in' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Quick Walk-in Patient Registration & Token Generation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically matches existing records by mobile or creates new UHID and issues sequential daily OP token.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Desk Active
            </span>
          </div>

          <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (Duplicate Check) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9840123456"
                  value={wPhone}
                  onChange={(e) => setWPhone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={wAge}
                  onChange={(e) => setWAge(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={wGender}
                  onChange={(e) => setWGender(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consulting Doctor *</label>
                <select
                  value={wDoctorId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.departmentName}) {d.consultationFee ? `• ₹${d.consultationFee}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={wDate}
                  onChange={(e) => setWDate(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Consultation Fee (₹) *</label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Editable</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={wConsultationFee}
                    onChange={(e) => setWConsultationFee(e.target.value)}
                    placeholder="500.00"
                    className="w-full text-xs pl-7 pr-3 py-3 rounded-xl border border-slate-200 bg-white focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Payment Status</label>
                <select
                  value={wIsFeePaid ? 'paid' : 'pending'}
                  onChange={(e) => setWIsFeePaid(e.target.value === 'paid')}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                >
                  <option value="paid">✅ Paid (Collected at Desk)</option>
                  <option value="pending">⏳ Pending (Pay at Billing)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint / Short Reason *</label>
              <textarea
                rows={2}
                required
                value={wComplaint}
                onChange={(e) => setWComplaint(e.target.value)}
                placeholder="e.g. High fever for 2 days, body aches, cough"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setWName('');
                  setWPhone('');
                }}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs transition-colors"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Issue OP Token & Forward to Doctor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ONLINE APPOINTMENTS QUEUE */}
      {activeSubTab === 'online' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Incoming Online Appointment Requests</h3>
                <p className="text-xs text-slate-500">Submitted by patients via online hospital portal</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              {onlineRequests.length} Online Requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Patient / UHID</th>
                  <th className="py-3 px-4">Phone / Age</th>
                  <th className="py-3 px-4">Requested Doctor</th>
                  <th className="py-3 px-4">Preferred Date & Time</th>
                  <th className="py-3 px-4">Complaint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {onlineRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No online appointment requests at this time.
                    </td>
                  </tr>
                ) : (
                  onlineRequests.map(apt => (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{apt.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{apt.patientUhid}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{apt.patientPhone}</div>
                        <div className="text-[10px] text-slate-400">{apt.patientAge ? `${apt.patientAge} yrs, ` : ''}{apt.patientGender || ''}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {apt.doctorName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold">{apt.appointmentDate}</div>
                        <div className="text-[10px] text-slate-400">{apt.timeSlot}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                        {apt.chiefComplaint || apt.problemDescription || 'General Consultation'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'requested' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          apt.status === 'waiting' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          apt.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {apt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === 'requested' && (
                            <button
                              onClick={() => handleConfirmOnline(apt)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-xs flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Confirm & Issue Token
                            </button>
                          )}
                          <button
                            onClick={() => handleStartEditApt(apt)}
                            className="px-2 py-1 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
                          >
                            Reschedule
                          </button>
                          {apt.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelApt(apt.id)}
                              className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE OP QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, UHID, token (e.g. OP-101), phone..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              >
                <option value="all">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <button
                onClick={() => setActiveSubTab('walk_in')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> New Walk-in Token
              </button>
            </div>
          </div>

          {/* Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Patient / UHID</th>
                    <th className="py-3 px-4">Assigned Doctor</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4">Chief Complaint</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No appointments found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
                            {apt.tokenFormatted || `OP-${apt.tokenNumber}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {apt.bookingSource === 'online' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Globe className="w-2.5 h-2.5" /> Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <UserPlus className="w-2.5 h-2.5" /> Walk-in
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{apt.patientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{apt.patientUhid} • {apt.patientPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {apt.doctorName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {apt.appointmentDate} • {apt.timeSlot}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                          {apt.chiefComplaint}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            apt.status === 'in_consultation' ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse' :
                            apt.status === 'waiting' || apt.status === 'scheduled' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            apt.status === 'requested' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {apt.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditApt(apt)}
                              className="px-2 py-1 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
                            >
                              Edit
                            </button>
                            {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                              <button
                                onClick={() => handleCancelApt(apt.id)}
                                className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PATIENTS DIRECTORY */}
      {activeSubTab === 'patients' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Hospital Patient Directory ({patients.length})</h3>
            <span className="text-xs text-slate-500">Unique Identity & Multi-Department Medical Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">UHID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{p.uhid}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.age} yrs • {p.gender}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT / RESCHEDULE MODAL */}
      {editingApt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit / Reschedule Appointment</h3>
                  <p className="text-xs text-slate-400">Token #{editingApt.tokenNumber} • {editingApt.patientName}</p>
                </div>
              </div>
              <button onClick={() => setEditingApt(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditApt} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor *</label>
                <select
                  value={editDocId}
                  onChange={(e) => setEditDocId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.departmentName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={editSlot}
                    onChange={(e) => setEditSlot(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  >
                    {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint *</label>
                <textarea
                  rows={2}
                  required
                  value={editComplaint}
                  onChange={(e) => setEditComplaint(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Changes
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
        defaultTaskType={nurseHelpContext?.defaultTaskType || 'Patient Assistance'}
      />
    </div>
  );
};
