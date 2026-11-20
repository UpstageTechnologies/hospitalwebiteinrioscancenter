import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Patient } from '../../types/patient';
import type { Appointment } from '../../types/clinical';
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
  CreditCard
} from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const { patients, appointments, employees, addPatient, bookAppointment, updateAppointmentStatus, updateAppointment } = useHospital();
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'new_patient' | 'book' | 'patients'>('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');

  // Edit Appointment Modal State
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [editComplaint, setEditComplaint] = useState('');
  const [editDocId, setEditDocId] = useState('');
  const [editSlot, setEditSlot] = useState('');
  const [editDate, setEditDate] = useState('');

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

  // New Patient Form
  const [pName, setPName] = useState('');
  const [pMobile, setPMobile] = useState('');
  const [pAge, setPAge] = useState('35');
  const [pGender, setPGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [pBlood, setPBlood] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('B+');
  const [pAddress, setPAddress] = useState('New Delhi');

  // Booking Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [aptDate, setAptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [chiefComplaint, setChiefComplaint] = useState('General Consultation');

  const doctors = employees.filter(
    e => (e.primaryRole === 'doctor' || e.additionalRoles.includes('doctor') || e.primaryRole === 'owner') && e.status === 'active'
  );

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pMobile) return;

    const newPat = addPatient({
      name: pName,
      age: parseInt(pAge) || 30,
      gender: pGender,
      dob: '1990-01-01',
      phone: pMobile,
      address: pAddress,
      bloodGroup: pBlood,
      allergies: [],
      chronicConditions: [],
      emergencyContact: {
        name: 'Family Contact',
        relationship: 'Family',
        phone: pMobile
      }
    });

    // Reset & prep booking
    setSelectedPatientId(newPat.id);
    setPName('');
    setPMobile('');
    setActiveSubTab('book');
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatientId);
    const doc = employees.find(e => e.id === selectedDoctorId);
    if (!pat || !doc) return;

    bookAppointment({
      patientId: pat.id,
      patientName: pat.name,
      patientUhid: pat.uhid,
      patientPhone: pat.phone,
      doctorId: doc.id,
      doctorName: doc.name,
      departmentId: doc.departmentId,
      departmentName: doc.departmentName,
      appointmentDate: aptDate,
      timeSlot,
      type: 'general',
      chiefComplaint,
      consultationFee: doc.consultationFee || 1200,
      isFeePaid: true
    });

    setChiefComplaint('General Consultation');
    setActiveSubTab('queue');
  };

  const handleCheckIn = (aptId: string) => {
    updateAppointmentStatus(aptId, 'in_consultation');
  };

  const handleCancelApt = (aptId: string) => {
    updateAppointmentStatus(aptId, 'cancelled');
  };

  // Filtered queue
  const queueAppointments = appointments.filter(apt => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      apt.patientName.toLowerCase().includes(q) ||
      apt.patientUhid.toLowerCase().includes(q) ||
      apt.doctorName.toLowerCase().includes(q);
    const matchDoc = selectedDoctorFilter === 'all' || apt.doctorId === selectedDoctorFilter;
    return matchSearch && matchDoc;
  });

  const waitingCount = appointments.filter(a => a.status === 'scheduled').length;
  const inConsultCount = appointments.filter(a => a.status === 'in_consultation').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reception & OPD Front Desk</h1>
              <p className="text-xs text-slate-500">
                Patient Registration • Token Queue Management • Doctor OPD Availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('new_patient')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </button>
            <button
              onClick={() => setActiveSubTab('book')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Token / Appointment</span>
            </button>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-2 pt-5 border-t border-slate-100 mt-5 overflow-x-auto scrollbar-none">
          {[
            { id: 'queue', label: 'Live Token Queue', icon: Clock, badge: waitingCount + inConsultCount },
            { id: 'book', label: 'Appointment Booking', icon: Plus },
            { id: 'new_patient', label: 'New Patient Registration', icon: UserPlus },
            { id: 'patients', label: 'Patient Directory & UHID', icon: Users, badge: patients.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waiting in OPD Queue</div>
          <div className="text-2xl font-black text-amber-600 mt-0.5">{waitingCount}</div>
          <div className="text-[10px] text-slate-500">Tokens pending consultation</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Consultation</div>
          <div className="text-2xl font-black text-blue-600 mt-0.5">{inConsultCount}</div>
          <div className="text-[10px] text-slate-500">Currently with doctor</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consultations Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">{completedCount}</div>
          <div className="text-[10px] text-slate-500">Billed & completed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctors Available</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{doctors.length}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">Active & on duty</div>
        </div>
      </div>

      {/* VIEW: LIVE QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name, UHID or doctor..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
              >
                <option value="all">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.departmentName})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor & Department</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queueAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                      No appointments in queue for today.
                    </td>
                  </tr>
                ) : (
                  queueAppointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold font-mono text-base text-slate-900">
                        #{apt.tokenNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{apt.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{apt.patientUhid} • {apt.patientPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{apt.doctorName}</div>
                        <div className="text-[10px] text-slate-500">{apt.departmentName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {apt.timeSlot}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          apt.status === 'scheduled' ? 'bg-amber-100 text-amber-800' :
                          apt.status === 'in_consultation' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === 'scheduled' && (
                            <button
                              onClick={() => handleCheckIn(apt.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                            >
                              Check-In
                            </button>
                          )}
                          {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => handleStartEditApt(apt)}
                                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancelApt(apt.id)}
                                className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {apt.status === 'completed' && (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Billed
                            </span>
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

      {/* VIEW: BOOK APPOINTMENT */}
      {activeSubTab === 'book' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 max-w-2xl mx-auto shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Book OPD Appointment & Token
            </h2>
            <p className="text-xs text-slate-500">
              Generates immediate consultation queue token and links to doctor dashboard.
            </p>
          </div>

          <form onSubmit={handleBookSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              >
                <option value="">-- Choose Patient by UHID / Name --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.uhid}) - {p.phone}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Consulting Doctor *</label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.departmentName}) - ₹{d.consultationFee || 1200}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                >
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint</label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Chest discomfort, palpitations on exertion"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('queue')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
              >
                Generate Token & Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: NEW PATIENT REGISTRATION */}
      {activeSubTab === 'new_patient' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 max-w-2xl mx-auto shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              New Patient Registration (Master UHID Generation)
            </h2>
            <p className="text-xs text-slate-500">
              Unique Hospital ID (UHID) is generated with automatic mobile deduplication.
            </p>
          </div>

          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={pMobile}
                  onChange={(e) => setPMobile(e.target.value)}
                  placeholder="e.g. +91 98111 55667"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={pAge}
                  onChange={(e) => setPAge(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={pGender}
                  onChange={(e) => setPGender(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={pBlood}
                  onChange={(e) => setPBlood(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={pAddress}
                onChange={(e) => setPAddress(e.target.value)}
                placeholder="e.g. 14 Defence Colony, New Delhi"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('queue')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                Generate UHID & Proceed
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: PATIENTS DIRECTORY */}
      {activeSubTab === 'patients' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Patient Master Index</h3>
            <span className="text-xs text-slate-400 font-mono">{patients.length} Registered</span>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">UHID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Blood</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{p.uhid}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.age} yrs • {p.gender}</td>
                    <td className="py-3 px-4 text-slate-600">{p.phone}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">{p.bloodGroup}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setActiveSubTab('book');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100"
                      >
                        Book Token
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT APPOINTMENT MODAL */}
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
    </div>
  );
};
