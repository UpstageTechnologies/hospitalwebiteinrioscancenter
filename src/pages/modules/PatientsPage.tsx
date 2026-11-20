import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import type { Patient } from '../../types/patient';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  Heart,
  AlertTriangle,
  FileText,
  User,
  X,
  Filter,
  CheckCircle2
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const { patients, addPatient, vitals } = useHospital();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Patient Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('1990-01-01');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState<Patient['bloodGroup']>('B+');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const filteredPatients = patients.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !age) return;

    addPatient({
      name,
      age: parseInt(age),
      gender,
      dob,
      phone,
      email,
      address: address || 'Medical Enclave, New Delhi',
      bloodGroup,
      allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
      chronicConditions: chronicConditions.split(',').map(s => s.trim()).filter(Boolean),
      emergencyContact: {
        name: emergencyName || 'Family Member',
        relationship: 'Contact',
        phone: emergencyPhone || phone
      }
    });

    // Reset Form
    setName('');
    setAge('');
    setPhone('');
    setEmail('');
    setAddress('');
    setAllergies('');
    setChronicConditions('');
    setShowNewModal(false);
  };

  const patientVitals = selectedPatient ? vitals.filter(v => v.patientId === selectedPatient.id) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Patient Master Index & Medical Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unique Hospital Identification (UHID) • Automated Deduplication • Lifetime Longitudinal EMR
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register New Patient
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UHID, patient name or mobile number..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Registered: <strong className="text-slate-800">{patients.length}</strong> Patients
        </div>
      </div>

      {/* Patient Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((p) => {
          return (
            <div
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 hover:text-emerald-700">{p.name}</h4>
                    <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {p.uhid}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.status === 'IP' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">Age/Gender:</span> {p.age}y / {p.gender}
                </div>
                <div>
                  <span className="text-slate-400">Blood:</span> <strong className="text-slate-800">{p.bloodGroup}</strong>
                </div>
                <div className="col-span-2 truncate">
                  <span className="text-slate-400">Phone:</span> {p.phone}
                </div>
              </div>

              {p.allergies.length > 0 && (
                <div className="text-[10px] text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 font-medium truncate">
                  Allergies: {p.allergies.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL 1: REGISTER NEW PATIENT */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Register New Patient (UHID Generation)
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number * (Deduplication)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group *</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Postal Code"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Known Drug Allergies</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Sulfa"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chronic Conditions</label>
                  <input
                    type="text"
                    value={chronicConditions}
                    onChange={(e) => setChronicConditions(e.target.value)}
                    placeholder="e.g. Diabetes, Hypertension"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Confirm Registration & Issue UHID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PATIENT FULL PROFILE VIEW */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedPatient.name}</h3>
                  <div className="text-[11px] font-mono text-slate-500">{selectedPatient.uhid}</div>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {/* Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Age / Gender</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedPatient.age} yrs / {selectedPatient.gender}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Blood Group</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedPatient.bloodGroup}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Phone</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedPatient.phone}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Registered Since</span>
                  <div className="font-bold text-slate-800 mt-0.5">{new Date(selectedPatient.registeredAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Vitals History */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Recorded Clinical Vitals</h4>
                {patientVitals.length === 0 ? (
                  <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    No vital signs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patientVitals.map((v) => (
                      <div key={v.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">
                            BP: {v.bloodPressureSystolic}/{v.bloodPressureDiastolic} mmHg • Pulse: {v.heartRatePulse} bpm • SpO2: {v.spo2}%
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">Recorded by {v.recordedBy.name} ({v.recordedBy.role})</div>
                        </div>
                        <span className="text-[10px] text-slate-400">{new Date(v.recordedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinical History & Allergies */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Allergies</span>
                  <div className="text-rose-700 font-semibold mt-1">
                    {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.join(', ') : 'None'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Chronic Conditions</span>
                  <div className="text-slate-800 font-semibold mt-1">
                    {selectedPatient.chronicConditions.length > 0 ? selectedPatient.chronicConditions.join(', ') : 'None'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
