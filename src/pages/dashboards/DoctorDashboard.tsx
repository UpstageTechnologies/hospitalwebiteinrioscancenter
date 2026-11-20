import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Patient } from '../../types/patient';
import type { Appointment } from '../../types/clinical';
import {
  Activity,
  Heart,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  Calendar as CalendarIcon,
  RotateCcw,
  RotateCw,
  TrendingUp,
  Stethoscope,
  FileText,
  Pill,
  Microscope,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { patients, appointments, vitals, saveConsultation, updateAppointmentStatus } = useHospital();
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'patients' | 'insights' | 'schedule'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => patients[0]?.id || '');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(9);

  // Consultation Modal State
  const [consultModalAppointment, setConsultModalAppointment] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('Coronary Artery Disease / Stage 1 HTN');
  const [treatmentPlan, setTreatmentPlan] = useState('Continue lipid-lowering therapy. Low-sodium diet, 30 min daily walking.');
  const [rxMeds, setRxMeds] = useState('Tab Atorvastatin 20mg (0-0-1), Tab Telmisartan 40mg (1-0-0)');
  const [labTests, setLabTests] = useState('Lipid Profile, Complete Blood Count, Serum Creatinine');
  const [radiologyTests, setRadiologyTests] = useState('Digital Chest X-Ray PA');
  const [followUpDate, setFollowUpDate] = useState('2026-12-10');

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const patientVitals = vitals.find(v => v.patientId === activePatient?.id);

  const handleOpenConsultation = (apt: Appointment) => {
    setConsultModalAppointment(apt);
  };

  const handleCompleteConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultModalAppointment) return;

    saveConsultation({
      appointmentId: consultModalAppointment.id,
      patientId: consultModalAppointment.patientId,
      patientName: consultModalAppointment.patientName,
      patientUhid: consultModalAppointment.patientUhid,
      doctorId: currentUser?.id || consultModalAppointment.doctorId,
      doctorName: currentUser?.name || consultModalAppointment.doctorName,
      departmentId: consultModalAppointment.departmentId,
      chiefComplaints: consultModalAppointment.chiefComplaint || 'Routine cardiac follow-up',
      provisionalDiagnosis: diagnosis,
      prescriptions: rxMeds.split(',').map((m, idx) => ({
        medicineId: `med-${idx}`,
        medicineName: m.trim(),
        dosage: '1 Tab Oral',
        frequency: '1-0-1',
        durationDays: 14,
        instructions: 'After meals'
      })),
      labTestsOrdered: labTests ? labTests.split(',').map(s => s.trim()).filter(Boolean) : [],
      radiologyOrdered: radiologyTests ? radiologyTests.split(',').map(s => s.trim()).filter(Boolean) : [],
      followUpDate,
      clinicalNotes: treatmentPlan
    });

    setConsultModalAppointment(null);
  };

  // Calendar dates generation for January 2026
  const calendarDays = [
    { date: 28, isCurrentMonth: false },
    { date: 29, isCurrentMonth: false },
    { date: 30, isCurrentMonth: false },
    { date: 31, isCurrentMonth: false },
    { date: 1, isCurrentMonth: true },
    { date: 2, isCurrentMonth: true },
    { date: 3, isCurrentMonth: true },
    { date: 4, isCurrentMonth: true },
    { date: 5, isCurrentMonth: true },
    { date: 6, isCurrentMonth: true, hasMeeting: true },
    { date: 7, isCurrentMonth: true },
    { date: 8, isCurrentMonth: true },
    { date: 9, isCurrentMonth: true, isSelected: true },
    { date: 10, isCurrentMonth: true },
    { date: 11, isCurrentMonth: true },
    { date: 12, isCurrentMonth: true },
    { date: 13, isCurrentMonth: true },
    { date: 14, isCurrentMonth: true, hasSurgery: true },
    { date: 15, isCurrentMonth: true },
    { date: 16, isCurrentMonth: true },
    { date: 17, isCurrentMonth: true },
    { date: 18, isCurrentMonth: true },
    { date: 19, isCurrentMonth: true },
    { date: 20, isCurrentMonth: true },
    { date: 21, isCurrentMonth: true },
    { date: 22, isCurrentMonth: true },
    { date: 23, isCurrentMonth: true },
    { date: 24, isCurrentMonth: true },
    { date: 25, isCurrentMonth: true },
    { date: 26, isCurrentMonth: true, hasAppointment: true },
    { date: 27, isCurrentMonth: true },
    { date: 28, isCurrentMonth: true },
    { date: 29, isCurrentMonth: true },
    { date: 30, isCurrentMonth: true },
    { date: 31, isCurrentMonth: true }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Sub-Navbar Matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white px-3 sm:px-5 py-2.5 rounded-2xl border border-slate-200/70 shadow-xs">
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/70 p-1 rounded-xl text-xs font-semibold overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'patients', label: 'Patients' },
            { id: 'insights', label: 'Insights' },
            { id: 'schedule', label: 'Schedule' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block truncate">
          Dr. Workspace • <strong className="text-slate-800">{currentUser?.name || 'Dr. Vikram Malhotra'}</strong>
        </div>
      </div>

      {/* TOP SECTION: Patient Details Card (left) & Clinical Gauges / Demographics (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient Details Hero Card (~35% / 4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-bold text-slate-900">Patient details</h3>
              <div className="flex items-center gap-1 text-slate-400">
                <button className="p-1 hover:text-slate-700"><RotateCcw className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:text-slate-700"><RotateCw className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Patient Portrait & Name */}
            <div className="flex items-center gap-4 my-2">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-800 text-2xl font-bold flex-shrink-0 shadow-xs">
                {activePatient?.name.charAt(0) || 'P'}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">{activePatient?.name || 'Dianne Russell'}</h2>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Patient ID: <span className="font-semibold text-slate-600">{activePatient?.uhid || '#PT-20458'}</span>
                </div>
              </div>
            </div>

            {/* Patient Contact Info */}
            <div className="space-y-2 mt-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{activePatient?.phone || '+1-222-5555-0187'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{activePatient?.address || 'New Delhi, India'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{activePatient?.email || 'patient@upstagehospital.org'}</span>
              </div>
            </div>
          </div>

          {/* Bottom Stats Ribbon (Total Patients / Treated / Active) */}
          <div className="grid grid-cols-3 gap-2 pt-6 mt-4 border-t border-slate-100">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Total Patients</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">1,148</div>
              <div className="h-0.5 w-10 bg-blue-500 rounded mt-1"></div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Patients Treated</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">857</div>
              <div className="h-0.5 w-10 bg-amber-500 rounded mt-1"></div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Active Patients</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">261</div>
              <div className="h-0.5 w-10 bg-lime-500 rounded mt-1"></div>
            </div>
          </div>
        </div>

        {/* Right: 3 Semicircular Gauges & Demographics (~65% / 8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs space-y-6">
          {/* 3 Semicircular Arc Gauges matching Screenshot 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Gauge 1: Vitals Stability (Blue) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Vitals Stability</span>
                <span className="text-[10px] text-blue-600 font-bold">↗</span>
              </div>
              <div className="text-center pt-2">
                <div className="text-[11px] text-blue-600 font-bold mb-1">+3.1% ▲</div>
                <div className="relative inline-flex items-center justify-center">
                  <svg width="120" height="70" viewBox="0 0 120 70">
                    <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
                    <path d="M 10 65 A 50 50 0 0 1 95 25" fill="none" stroke="#3b82f6" strokeWidth="9" strokeLinecap="round" />
                  </svg>
                  <span className="absolute bottom-1 text-2xl font-black text-slate-900">84%</span>
                </div>
              </div>
            </div>

            {/* Gauge 2: Treatment Progress (Orange) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Treatment Progress</span>
                <span className="text-[10px] text-orange-500 font-bold">↗</span>
              </div>
              <div className="text-center pt-2">
                <div className="text-[11px] text-orange-500 font-bold mb-1">+4.2% ▼</div>
                <div className="relative inline-flex items-center justify-center">
                  <svg width="120" height="70" viewBox="0 0 120 70">
                    <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
                    <path d="M 10 65 A 50 50 0 0 1 105 45" fill="none" stroke="#f97316" strokeWidth="9" strokeLinecap="round" />
                  </svg>
                  <span className="absolute bottom-1 text-2xl font-black text-slate-900">91%</span>
                </div>
              </div>
            </div>

            {/* Gauge 3: Medication Adherence (Lime) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Medication Adherence</span>
                <span className="text-[10px] text-lime-600 font-bold">↗</span>
              </div>
              <div className="text-center pt-2">
                <div className="text-[11px] text-lime-600 font-bold mb-1">-3.1% ▲</div>
                <div className="relative inline-flex items-center justify-center">
                  <svg width="120" height="70" viewBox="0 0 120 70">
                    <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
                    <path d="M 10 65 A 50 50 0 0 1 70 17" fill="none" stroke="#84cc16" strokeWidth="9" strokeLinecap="round" />
                  </svg>
                  <span className="absolute bottom-1 text-2xl font-black text-slate-900">58%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stepped Demographics Histogram Chart matching Screenshot 3 */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-bold text-slate-900">Patient Demographics</h4>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px]">
                <span className="flex items-center gap-1.5 text-blue-600 font-medium whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Elderly: +13% (23%)
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 font-medium whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Adult: +10% (67%)
                </span>
                <span className="flex items-center gap-1.5 text-lime-600 font-medium whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-lime-500"></span> Youth: +8% (10%)
                </span>
              </div>
            </div>

            {/* Stepped 3-block Gradient Histogram */}
            <div className="grid grid-cols-3 gap-3 items-end h-28 pt-2">
              <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-xs font-bold text-slate-700">23%</span>
                <div className="w-full h-12 rounded-xl bg-gradient-to-t from-blue-500 to-sky-300"></div>
              </div>
              <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-xs font-bold text-slate-700">67%</span>
                <div className="w-full h-24 rounded-xl bg-gradient-to-t from-amber-500 to-amber-300"></div>
              </div>
              <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-xs font-bold text-slate-700">10%</span>
                <div className="w-full h-8 rounded-xl bg-gradient-to-t from-lime-500 to-lime-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Patient Overview Table (left) & Month Calendar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient Overview Table (~70% / 8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Patient Overview</h3>
              <p className="text-xs text-slate-400">Manage and monitor all patient profiles from a single dashboard.</p>
            </div>
            <button className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
              Today ▾
            </button>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead className="text-slate-400 border-b border-slate-100 font-medium">
                <tr>
                  <th className="pb-3">Token</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Chief Complaint</th>
                  <th className="pb-3">Time Slot</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No OPD consultations in queue today.
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => {
                    const isCompleted = apt.status === 'completed';
                    return (
                      <tr key={apt.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 font-bold font-mono text-slate-900">
                          #{apt.tokenNumber || 1}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">
                              {apt.patientName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{apt.patientName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{apt.patientUhid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-600 max-w-[150px] truncate">{apt.chiefComplaint}</td>
                        <td className="py-3.5 text-slate-600 font-mono">{apt.timeSlot}</td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {apt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {isCompleted ? (
                            <span className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Billed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenConsultation(apt)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                            >
                              Consult
                            </button>
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

        {/* Right: Interactive Calendar (~30% / 4 Cols matching Screenshot 3) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-bold text-slate-900">Calendar</h3>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <button className="p-1 hover:text-slate-900"><ChevronLeft className="w-4 h-4" /></button>
                <span>January 2026</span>
                <button className="p-1 hover:text-slate-900"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mt-3">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>
              ))}

              {calendarDays.map((cd, idx) => {
                const isCurrent = cd.date === selectedCalendarDay && cd.isCurrentMonth;
                return (
                  <button
                    key={idx}
                    onClick={() => cd.isCurrentMonth && setSelectedCalendarDay(cd.date)}
                    className={`h-8 w-8 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-semibold relative transition-all ${
                      isCurrent
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : cd.isCurrentMonth
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300'
                    }`}
                  >
                    <span>{cd.date}</span>
                    {cd.hasAppointment && !isCurrent && (
                      <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-1"></span>
                    )}
                    {cd.hasMeeting && !isCurrent && (
                      <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-1"></span>
                    )}
                    {cd.hasSurgery && !isCurrent && (
                      <span className="w-1 h-1 rounded-full bg-lime-500 absolute bottom-1"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] font-medium pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Appointment
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Meeting
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-lime-500"></span> Surgery
            </span>
          </div>
        </div>
      </div>

      {/* CLINICAL CONSULTATION MODAL */}
      {consultModalAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Clinical Consultation — {consultModalAppointment.patientName}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  UHID: {consultModalAppointment.patientUhid} • Token #{consultModalAppointment.tokenNumber} • {consultModalAppointment.departmentName}
                </p>
              </div>
              <button onClick={() => setConsultModalAppointment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteConsultation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaints</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                  {consultModalAppointment.chiefComplaint || 'General OPD follow-up'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provisional Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Coronary Artery Disease / Stage 1 HTN"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prescribed Medicines (Dispensed via Pharmacy)</label>
                <textarea
                  rows={2}
                  value={rxMeds}
                  onChange={(e) => setRxMeds(e.target.value)}
                  placeholder="e.g. Tab Atorvastatin 20mg (0-0-1), Tab Telmisartan 40mg (1-0-0)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Separate multiple medications with commas.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Laboratory Orders (Pathology)</label>
                  <input
                    type="text"
                    value={labTests}
                    onChange={(e) => setLabTests(e.target.value)}
                    placeholder="e.g. Lipid Profile, CBC"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Sent automatically to Lab Technician queue.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Radiology Orders (Imaging)</label>
                  <input
                    type="text"
                    value={radiologyTests}
                    onChange={(e) => setRadiologyTests(e.target.value)}
                    placeholder="e.g. Digital Chest X-Ray PA"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Sent automatically to Radiology queue.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Plan & Clinical Advice</label>
                <textarea
                  rows={2}
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="e.g. Maintain low sodium diet. Follow-up after 10 days."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 sm:pt-5">
                  <button
                    type="button"
                    onClick={() => setConsultModalAppointment(null)}
                    className="px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 sm:py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors text-center"
                  >
                    Complete & Generate Bill
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
