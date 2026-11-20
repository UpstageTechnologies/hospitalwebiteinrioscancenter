import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  HeartPulse,
  Activity,
  Bed,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  User,
  Save,
  Check
} from 'lucide-react';

export const NurseDashboard: React.FC = () => {
  const { admissions, vitals, recordVitals, updateBedStatus, beds } = useHospital();
  const { currentUser } = useAuth();

  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>(() => admissions[0]?.id || '');
  const [showVitalsModal, setShowVitalsModal] = useState(false);

  // Vitals recording form state
  const [bpSys, setBpSys] = useState('120');
  const [bpDia, setBpDia] = useState('80');
  const [pulse, setPulse] = useState('76');
  const [temp, setTemp] = useState('98.6');
  const [spo2, setSpo2] = useState('98');
  const [respRate, setRespRate] = useState('18');
  const [glucose, setGlucose] = useState('110');
  const [vitalsNotes, setVitalsNotes] = useState('');

  // Medication Administration checklist state
  const [medSchedule, setMedSchedule] = useState([
    { id: 1, medicine: 'Atorvastatin 20mg', dose: '1 Tab', time: '09:00 AM', status: 'administered' },
    { id: 2, medicine: 'Augmentin 625 Duo', dose: '1 Tab', time: '01:00 PM', status: 'pending' },
    { id: 3, medicine: 'Pan 40mg IV', dose: '1 Vial', time: '08:00 PM', status: 'pending' }
  ]);

  const activeAdmissions = admissions.filter(a => a.status === 'active');
  const currentAdm = admissions.find(a => a.id === selectedAdmissionId) || admissions[0];
  const patientVitals = vitals.filter(v => v.patientId === currentAdm?.patientId);

  const handleRecordVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdm) return;

    recordVitals({
      patientId: currentAdm.patientId,
      uhid: currentAdm.patientUhid,
      recordedBy: {
        id: currentUser?.id || 'emp-nurse-01',
        name: currentUser?.name || 'Sister Mary Fernandez',
        role: 'nurse'
      },
      bloodPressureSystolic: parseInt(bpSys) || 120,
      bloodPressureDiastolic: parseInt(bpDia) || 80,
      heartRatePulse: parseInt(pulse) || 72,
      temperature: parseFloat(temp) || 98.6,
      spo2: parseInt(spo2) || 98,
      respiratoryRate: parseInt(respRate) || 18,
      bloodGlucose: parseInt(glucose) || 100,
      notes: vitalsNotes
    });

    setShowVitalsModal(false);
    setVitalsNotes('');
  };

  const toggleMedication = (id: number) => {
    setMedSchedule(medSchedule.map(m =>
      m.id === id ? { ...m, status: m.status === 'administered' ? 'pending' : 'administered' } : m
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            Nursing Station & Inpatient Clinical Care
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vital Signs Monitoring • Medication Administration Protocol • Nursing Shift Observations
          </p>
        </div>
        <button
          onClick={() => setShowVitalsModal(true)}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Patient Vitals</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ward Patient Census (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ward Inpatients</h3>
              <p className="text-[11px] text-slate-400">Assigned active admissions</p>
            </div>
            <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
              {activeAdmissions.length} Patients
            </span>
          </div>

          <div className="space-y-2.5 mt-3">
            {activeAdmissions.map((adm) => {
              const isSelected = (currentAdm?.id === adm.id);
              return (
                <div
                  key={adm.id}
                  onClick={() => setSelectedAdmissionId(adm.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-rose-400 bg-rose-50/40 shadow-xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{adm.patientName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                      Bed {adm.bedNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {adm.patientUhid} • {adm.wardName}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
                    Diagnosis: {adm.admittingDiagnosis}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Patient Nursing Chart (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentAdm ? (
            <>
              {/* Vitals Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{currentAdm.patientName}</span>
                      <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {currentAdm.patientUhid}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Admitted under {currentAdm.admittingDoctorName} • Advance Paid: ₹{currentAdm.advanceDepositPaid.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Bed {currentAdm.bedNumber}
                  </span>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Blood Pressure</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-1">
                      {patientVitals[0] ? `${patientVitals[0].bloodPressureSystolic}/${patientVitals[0].bloodPressureDiastolic}` : '120/80'}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">mmHg</span>
                    </div>
                  </div>

                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Heart Rate / Pulse</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-1">
                      {patientVitals[0] ? patientVitals[0].heartRatePulse : '76'}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">bpm</span>
                    </div>
                  </div>

                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Oxygen Saturation</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-1">
                      {patientVitals[0] ? patientVitals[0].spo2 : '98'}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">% SpO2</span>
                    </div>
                  </div>

                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Temperature</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-1">
                      {patientVitals[0] ? patientVitals[0].temperature : '98.6'}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">°F</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medication Administration Schedule */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Medication Administration Protocol
                    </h4>
                    <p className="text-[11px] text-slate-400">Mark administered dosages for patient safety record</p>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Shift: Morning Round</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {medSchedule.map((med) => {
                    const isDone = med.status === 'administered';
                    return (
                      <div
                        key={med.id}
                        className={`p-3.5 flex items-center justify-between transition-colors ${
                          isDone ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleMedication(med.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              isDone ? 'bg-emerald-600 text-white' : 'border border-slate-300 hover:border-emerald-500'
                            }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div>
                            <div className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {med.medicine}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              Dosage: {med.dose} • Scheduled: {med.time}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {med.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shift Handover Observation Notes */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Shift Handover & Patient Nursing Notes
                </h4>
                <textarea
                  placeholder="Record patient fluid intake/output, night sleep status, pain scale, or pending investigations for incoming nursing shift..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-500 outline-none"
                />
                <div className="flex justify-end mt-2">
                  <button className="text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xs">
                    Save Handover Note
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200/80 text-slate-400 text-xs">
              No active inpatient admissions found.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: RECORD VITALS */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Record Clinical Vital Signs
              </h3>
              <button onClick={() => setShowVitalsModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordVitals} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BP Systolic (mmHg)</label>
                  <input
                    type="number"
                    value={bpSys}
                    onChange={(e) => setBpSys(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BP Diastolic (mmHg)</label>
                  <input
                    type="number"
                    value={bpDia}
                    onChange={(e) => setBpDia(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Observations</label>
                <textarea
                  value={vitalsNotes}
                  onChange={(e) => setVitalsNotes(e.target.value)}
                  placeholder="Patient responsive, comfortable, no distress..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
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
