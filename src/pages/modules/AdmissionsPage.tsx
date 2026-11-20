import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import type { Admission } from '../../types/admission';
import {
  Bed,
  Plus,
  Users,
  Search,
  CheckCircle2,
  Calendar,
  X,
  FileText
} from 'lucide-react';

export const AdmissionsPage: React.FC = () => {
  const { admissions, patients, employees, wards, beds, admitPatient, dischargePatient } = useHospital();

  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);

  // New Admission Form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [admissionReason, setAdmissionReason] = useState('');
  const [admittingDiagnosis, setAdmittingDiagnosis] = useState('');
  const [advanceDeposit, setAdvanceDeposit] = useState('15000');

  // Discharge Form state
  const [conditionAtDischarge, setConditionAtDischarge] = useState('Stable, afebrile, vitals normal');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [medicationsAdvised, setMedicationsAdvised] = useState('Tab Atorvastatin 20mg 0-0-1 for 30 days');
  const [followUpInstructions, setFollowUpInstructions] = useState('Review in Cardiology OPD after 7 days');

  const availableBeds = beds.filter(b => b.status === 'available');
  const doctors = employees.filter(e => e.primaryRole === 'doctor' || e.additionalRoles.includes('doctor') || e.primaryRole === 'owner');

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatientId);
    const doc = employees.find(e => e.id === selectedDoctorId);
    const targetBed = beds.find(b => b.id === selectedBedId);
    if (!pat || !doc || !targetBed) return;

    admitPatient({
      patientId: pat.id,
      patientName: pat.name,
      patientUhid: pat.uhid,
      admittingDoctorId: doc.id,
      admittingDoctorName: doc.name,
      wardId: targetBed.wardId,
      wardName: targetBed.wardName,
      bedId: targetBed.id,
      bedNumber: targetBed.bedNumber,
      admissionDate: new Date().toISOString(),
      admissionReason,
      admittingDiagnosis,
      advanceDepositPaid: parseFloat(advanceDeposit) || 0
    });

    setShowAdmitModal(false);
  };

  const handleDischargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    dischargePatient(selectedAdmission.id, {
      conditionAtDischarge,
      finalDiagnosis: finalDiagnosis || selectedAdmission.admittingDiagnosis,
      medicationsAdvised,
      followUpInstructions,
      dischargedByDoctorName: selectedAdmission.admittingDoctorName
    });

    setShowDischargeModal(false);
    setSelectedAdmission(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bed className="w-5 h-5 text-purple-600" />
            Inpatient Department (IPD) Admissions & Discharge Summary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admission Registry • Automated Single-Occupancy Bed Allocation • Comprehensive Discharge Protocol
          </p>
        </div>

        <button
          onClick={() => setShowAdmitModal(true)}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Admit Inpatient
        </button>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inpatient Registry</h3>
          <span className="text-xs text-slate-400">{admissions.length} Total Cases</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">Admission #</th>
                <th className="p-3 font-semibold">Patient</th>
                <th className="p-3 font-semibold">Ward & Bed</th>
                <th className="p-3 font-semibold">Admitting Doctor</th>
                <th className="p-3 font-semibold">Diagnosis</th>
                <th className="p-3 font-semibold">Advance Paid</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admissions.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{adm.admissionNumber}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{adm.patientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{adm.patientUhid}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">Bed {adm.bedNumber}</div>
                    <div className="text-[10px] text-slate-400">{adm.wardName}</div>
                  </td>
                  <td className="p-3 text-slate-700 font-medium">{adm.admittingDoctorName}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{adm.admittingDiagnosis}</td>
                  <td className="p-3 font-bold text-emerald-700">₹{adm.advanceDepositPaid.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      adm.status === 'active' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {adm.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {adm.status === 'active' ? (
                      <button
                        onClick={() => {
                          setSelectedAdmission(adm);
                          setFinalDiagnosis(adm.admittingDiagnosis);
                          setShowDischargeModal(true);
                        }}
                        className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded shadow-xs"
                      >
                        Process Discharge
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Discharged
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADMIT PATIENT */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Inpatient Admission & Bed Allocation</h3>
              <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admitting Physician</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.departmentName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available Bed *</label>
                  <select
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  >
                    <option value="">-- Choose Bed --</option>
                    {availableBeds.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} - {b.wardName} (₹{b.dailyRate}/day)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admitting Clinical Diagnosis</label>
                <input
                  type="text"
                  value={admittingDiagnosis}
                  onChange={(e) => setAdmittingDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Coronary Syndrome Observation"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Indication</label>
                  <input
                    type="text"
                    value={admissionReason}
                    onChange={(e) => setAdmissionReason(e.target.value)}
                    placeholder="e.g. Chest pain under observation"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Deposit (₹)</label>
                  <input
                    type="number"
                    value={advanceDeposit}
                    onChange={(e) => setAdvanceDeposit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs"
                >
                  Confirm IP Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISCHARGE PATIENT */}
      {showDischargeModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Process Patient Discharge Summary</h3>
              <button onClick={() => setShowDischargeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>Patient: <strong className="text-slate-800">{selectedAdmission.patientName}</strong> ({selectedAdmission.patientUhid})</div>
                <div>Bed: <strong className="text-slate-800">{selectedAdmission.bedNumber} ({selectedAdmission.wardName})</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition at Discharge</label>
                <input
                  type="text"
                  value={conditionAtDischarge}
                  onChange={(e) => setConditionAtDischarge(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Final Confirmed Diagnosis</label>
                <input
                  type="text"
                  value={finalDiagnosis}
                  onChange={(e) => setFinalDiagnosis(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discharge Medications Advised</label>
                <textarea
                  value={medicationsAdvised}
                  onChange={(e) => setMedicationsAdvised(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Instructions</label>
                <input
                  type="text"
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
                >
                  Approve Discharge & Release Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
