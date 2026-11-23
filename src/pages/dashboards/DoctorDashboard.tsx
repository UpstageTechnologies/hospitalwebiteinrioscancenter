import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Patient } from '../../types/patient';
import type { Appointment, PrescriptionItem } from '../../types/clinical';
import type { PosMedicine, PosLabTest } from '../../services/posIntegrationService';
import {
  Stethoscope,
  Clock,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Pill,
  Microscope,
  Bed,
  CreditCard,
  Globe,
  UserPlus,
  Search,
  Activity,
  Heart,
  FileText,
  ShieldCheck
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const {
    patients,
    appointments,
    vitals,
    posMedicines,
    posLabTests,
    completeClinicalConsultationWorkflow,
    updateAppointmentStatus
  } = useHospital();
  const { currentUser } = useAuth();

  // Grid filter tab
  const [filterTab, setFilterTab] = useState<'today' | 'upcoming' | 'waiting' | 'in_consultation' | 'completed'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Consultation Workspace Modal State
  const [activeConsultApt, setActiveConsultApt] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clinical Consultation Fields
  const [clinicalObs, setClinicalObs] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(500);
  const [procedureFee, setProcedureFee] = useState<number>(0);
  const [procedureDesc, setProcedureDesc] = useState('');

  // Selected Prescriptions from Kadai POS
  const [selectedMeds, setSelectedMeds] = useState<{
    posMedicineId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    quantity: number;
    unitPrice: number;
    availableStock: number;
    unit: string;
  }[]>([]);

  // Selected Lab Tests from Kadai POS
  const [selectedLabs, setSelectedLabs] = useState<PosLabTest[]>([]);

  // Inpatient Admission Recommendation
  const [needsAdmission, setNeedsAdmission] = useState(false);
  const [isVipAdmission, setIsVipAdmission] = useState(false);
  const [admissionNotes, setAdmissionNotes] = useState('');

  // Filter Appointments for Doctor
  const todayStr = new Date().toISOString().split('T')[0];

  const doctorAppointments = appointments.filter(a => {
    // If current user is doctor, show their appointments or show all if owner/admin
    const isDoc = currentUser?.primaryRole === 'doctor' || currentUser?.additionalRoles.includes('doctor');
    if (isDoc && currentUser?.name) {
      const matchName = a.doctorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        a.doctorId === currentUser.id;
      if (!matchName && currentUser?.primaryRole !== 'owner') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQ = a.patientName.toLowerCase().includes(q) ||
        a.patientUhid.toLowerCase().includes(q) ||
        (a.tokenFormatted && a.tokenFormatted.toLowerCase().includes(q)) ||
        a.chiefComplaint.toLowerCase().includes(q);
      if (!matchQ) return false;
    }

    if (filterTab === 'today') {
      return a.appointmentDate === todayStr;
    }
    if (filterTab === 'upcoming') {
      return a.appointmentDate > todayStr;
    }
    if (filterTab === 'waiting') {
      return a.status === 'waiting' || a.status === 'scheduled';
    }
    if (filterTab === 'in_consultation') {
      return a.status === 'in_consultation';
    }
    if (filterTab === 'completed') {
      return a.status === 'completed';
    }
    return true;
  });

  const handleOpenConsultation = (apt: Appointment) => {
    setActiveConsultApt(apt);
    updateAppointmentStatus(apt.id, 'in_consultation');
    setClinicalObs('BP: 120/80 mmHg, Pulse: 76 bpm, Temp: 98.4°F, Chest clear, normal S1/S2.');
    setDiagnosis(apt.chiefComplaint ? `Evaluation for ${apt.chiefComplaint}` : 'Acute Upper Respiratory Infection / Viral Fever');
    setNotes('Advised rest, adequate hydration, follow up if fever persists.');
    setConsultationFee(apt.consultationFee || 500);
    setProcedureFee(0);
    setProcedureDesc('');

    // Pre-select 1 common medicine from Kadai POS as helpful starter
    if (posMedicines.length > 0) {
      const firstMed = posMedicines[0];
      setSelectedMeds([
        {
          posMedicineId: firstMed.id,
          medicineName: firstMed.name,
          dosage: firstMed.dosage || '1 Tab Oral BD',
          frequency: '1-0-1',
          durationDays: 5,
          quantity: 10,
          unitPrice: firstMed.sellingPrice,
          availableStock: firstMed.currentStock,
          unit: firstMed.unit
        }
      ]);
    } else {
      setSelectedMeds([]);
    }

    setSelectedLabs([]);
    setNeedsAdmission(false);
    setIsVipAdmission(false);
    setAdmissionNotes('');
  };

  const handleAddMedicine = (medId: string) => {
    const med = posMedicines.find(m => m.id === medId);
    if (!med) return;
    if (selectedMeds.some(m => m.posMedicineId === med.id)) return;

    setSelectedMeds(prev => [
      ...prev,
      {
        posMedicineId: med.id,
        medicineName: med.name,
        dosage: med.dosage || '1 Tab Oral BD',
        frequency: '1-0-1',
        durationDays: 5,
        quantity: 10,
        unitPrice: med.sellingPrice,
        availableStock: med.currentStock,
        unit: med.unit
      }
    ]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setSelectedMeds(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToggleLab = (lab: PosLabTest) => {
    if (selectedLabs.some(l => l.id === lab.id)) {
      setSelectedLabs(prev => prev.filter(l => l.id !== lab.id));
    } else {
      setSelectedLabs(prev => [...prev, lab]);
    }
  };

  // Submit and Forward with Idempotency Guard
  const handleSubmitConsultation = async () => {
    if (!activeConsultApt || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const prescriptions: PrescriptionItem[] = selectedMeds.map(m => ({
        medicineId: m.posMedicineId,
        posMedicineId: m.posMedicineId,
        medicineName: m.medicineName,
        dosage: m.dosage,
        frequency: m.frequency,
        durationDays: m.durationDays,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        totalPrice: m.unitPrice * m.quantity,
        instructions: 'After meals'
      }));

      const labOrdersList = selectedLabs.map(l => ({
        testId: l.id,
        testName: l.testName,
        category: l.category,
        sampleType: l.sampleType,
        price: l.price
      }));

      const payload: any = {
        appointmentId: activeConsultApt.id,
        patientId: activeConsultApt.patientId,
        patientName: activeConsultApt.patientName,
        patientUhid: activeConsultApt.patientUhid,
        patientAge: activeConsultApt.patientAge || 35,
        patientGender: activeConsultApt.patientGender || 'Male',
        doctorId: currentUser?.id || activeConsultApt.doctorId,
        doctorName: currentUser?.name || activeConsultApt.doctorName,
        departmentId: activeConsultApt.departmentId || 'dept-gen-med',
        clinicalObservations: clinicalObs || '',
        diagnosis: diagnosis || 'Under Evaluation',
        notes: notes || '',
        consultationFee: consultationFee || 500,
        prescriptions,
        labTests: labOrdersList
      };

      if (procedureFee && procedureFee > 0) {
        payload.procedureFee = procedureFee;
        payload.procedureDescription = procedureDesc || 'Clinical Procedure';
      }

      // Strictly conditional: Only attach if doctor explicitly checked admission
      if (needsAdmission) {
        payload.admissionRecommendation = {
          isVip: isVipAdmission,
          notes: admissionNotes || 'Requires inpatient monitoring',
          reason: diagnosis || 'Under Evaluation'
        };
      }

      await completeClinicalConsultationWorkflow(payload);

      setActiveConsultApt(null);
    } catch (err) {
      console.error('Error submitting consultation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            Doctor Clinical Workspace & Appointment Grid
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connected to Kadai POS Medicine Inventory & Lab Catalog • Unified Department Dispatch
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'waiting', label: 'Waiting' },
            { id: 'in_consultation', label: 'In Consultation' },
            { id: 'completed', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filterTab === tab.id ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search appointments by Patient name, UHID, Token (e.g. OP-101), complaint..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 px-2 whitespace-nowrap">
          {doctorAppointments.length} Appointments Found
        </div>
      </div>

      {/* Modern Grid of Appointment Cards */}
      {doctorAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Appointments in this View</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no patient consultations matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctorAppointments.map(apt => (
            <div
              key={apt.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                apt.status === 'in_consultation'
                  ? 'border-purple-300 ring-2 ring-purple-100'
                  : apt.status === 'completed'
                  ? 'border-slate-200/70 bg-slate-50/50'
                  : 'border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
              }`}
            >
              {/* Card Top: Badges & Token */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                  {apt.tokenFormatted || `OP-${apt.tokenNumber}`}
                </span>

                <div className="flex items-center gap-1.5">
                  {apt.bookingSource === 'online' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Globe className="w-2.5 h-2.5" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <UserPlus className="w-2.5 h-2.5" /> Walk-in
                    </span>
                  )}

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    apt.status === 'in_consultation' ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {apt.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Patient Info */}
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                  <span>{apt.patientUhid}</span>
                  <span>•</span>
                  <span>{apt.patientPhone}</span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{apt.appointmentDate} • {apt.timeSlot}</span>
                </div>
              </div>

              {/* Chief Complaint */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Patient Complaint</div>
                <div className="line-clamp-2">{apt.chiefComplaint || 'General Health Consultation'}</div>
              </div>

              {/* Card Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Fee: ₹{apt.consultationFee || 500}
                </span>

                {apt.status === 'completed' ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Consultation Done
                  </span>
                ) : (
                  <button
                    onClick={() => handleOpenConsultation(apt)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> Start Consultation
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL CLINICAL CONSULTATION WORKSPACE MODAL */}
      {activeConsultApt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-in fade-in zoom-in-95 duration-100 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-xs">
                  <Stethoscope className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Patient Consultation Workspace • {activeConsultApt.patientName}
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {activeConsultApt.tokenFormatted || `OP-${activeConsultApt.tokenNumber}`}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    UHID: {activeConsultApt.patientUhid} • {activeConsultApt.patientAge ? `${activeConsultApt.patientAge} yrs, ` : ''}{activeConsultApt.patientGender || ''} • Complaint: {activeConsultApt.chiefComplaint}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveConsultApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Observations & Diagnosis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Clinical Observations & Vitals
                </label>
                <textarea
                  rows={3}
                  value={clinicalObs}
                  onChange={(e) => setClinicalObs(e.target.value)}
                  placeholder="BP, Pulse, Temperature, SpO2, Systemic Examination..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Diagnosis / Clinical Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Primary diagnosis, ICD/clinical notes..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Section 2: Consultation Notes & Doctor Charges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doctor Consultation Charge (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Procedure Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={procedureFee}
                  onChange={(e) => setProcedureFee(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Procedure Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nebulization, ECG, Dressing"
                  value={procedureDesc}
                  onChange={(e) => setProcedureDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Section 3: Treatment Selection - A. Medicines from Kadai POS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    A. Prescribe Medicines (Kadai POS Live Inventory)
                  </h4>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                    Prescribing does NOT deduct stock
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMedicine(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="text-xs p-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
                  >
                    <option value="">+ Add Medicine from POS...</option>
                    {posMedicines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Stock: {m.currentStock} {m.unit}) - ₹{m.sellingPrice}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Medicine Prescription Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Medicine Name</th>
                      <th className="py-2 px-3">Dosage / Frequency</th>
                      <th className="py-2 px-3">Days</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">POS Stock</th>
                      <th className="py-2 px-3">Price</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedMeds.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400">
                          No medicines prescribed. Select from Kadai POS catalog above.
                        </td>
                      </tr>
                    ) : (
                      selectedMeds.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {med.medicineName}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedMeds(prev => prev.map((m, i) => i === idx ? { ...m, dosage: val } : m));
                              }}
                              className="w-28 p-1 border border-slate-200 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={med.durationDays}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setSelectedMeds(prev => prev.map((m, i) => i === idx ? { ...m, durationDays: val } : m));
                              }}
                              className="w-14 p-1 border border-slate-200 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={med.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setSelectedMeds(prev => prev.map((m, i) => i === idx ? { ...m, quantity: val } : m));
                              }}
                              className="w-14 p-1 border border-slate-200 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              med.availableStock >= med.quantity
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {med.availableStock} {med.unit}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            ₹{med.unitPrice * med.quantity}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Treatment Selection - B. Lab Tests from Kadai POS */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  B. Diagnostic Laboratory Tests (Kadai POS Catalog)
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {posLabTests.map(lab => {
                  const isChecked = selectedLabs.some(l => l.id === lab.id);
                  return (
                    <button
                      key={lab.id}
                      type="button"
                      onClick={() => handleToggleLab(lab)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/80 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 truncate">{lab.testName}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-500">{lab.category} • ₹{lab.price}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 5: Treatment Selection - C. Inpatient Admission Recommendation */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-cyan-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    C. Inpatient Admission Decision (Forward to Ward Staff)
                  </h4>
                </div>

                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsAdmission}
                    onChange={(e) => setNeedsAdmission(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Recommend Patient Admission</span>
                </label>
              </div>

              {needsAdmission && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 animate-in fade-in duration-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Admission Class / Category
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                        <input
                          type="radio"
                          name="admClass"
                          checked={!isVipAdmission}
                          onChange={() => setIsVipAdmission(false)}
                        />
                        <span>Standard / Non-VIP</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-700">
                        <input
                          type="radio"
                          name="admClass"
                          checked={isVipAdmission}
                          onChange={() => setIsVipAdmission(true)}
                        />
                        <span>VIP / Special Care</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Admission Notes for Ward In-charge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Requires IV fluids, telemetry, cardiac monitoring"
                      value={admissionNotes}
                      onChange={(e) => setAdmissionNotes(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Total Line Items Created: {selectedMeds.length} Meds, {selectedLabs.length} Labs
                {needsAdmission ? ', 1 Admission Request' : ''}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveConsultApt(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitConsultation}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Submitting & Forwarding...' : 'Submit & Forward to Departments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
