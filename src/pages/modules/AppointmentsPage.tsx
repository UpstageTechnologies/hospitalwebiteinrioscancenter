import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import type { Appointment } from '../../types/clinical';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { appointments, patients, employees, bookAppointment, updateAppointmentStatus } = useHospital();

  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [modalFee, setModalFee] = useState<string>('500');
  const [aptDate, setAptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [complaint, setComplaint] = useState('');

  const doctors = employees.filter(e => e.primaryRole === 'doctor' || e.additionalRoles.includes('doctor') || e.primaryRole === 'owner');

  const handleDoctorSelect = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = employees.find(e => e.id === docId);
    if (doc?.consultationFee != null && Number(doc.consultationFee) >= 0) {
      setModalFee(String(doc.consultationFee));
    } else {
      setModalFee('500');
    }
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatientId);
    const doc = employees.find(e => e.id === selectedDoctorId);
    if (!pat || !doc) return;

    const parsedFee = parseFloat(modalFee);
    const finalFee = !isNaN(parsedFee) && parsedFee >= 0 ? parsedFee : (doc.consultationFee || 500);

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
      chiefComplaint: complaint || 'General OPD Consultation',
      consultationFee: finalFee,
      isFeePaid: true
    });

    setShowBookModal(false);
    setComplaint('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Outpatient Department (OPD) Scheduling & Token Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-Time Token Numbering • Doctor Availability • Walk-in Registration • Consultation Check-in
          </p>
        </div>

        <button
          onClick={() => setShowBookModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Book Appointment / Token
        </button>
      </div>

      {/* Appointment Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Today's Appointment Schedule</h3>
          <span className="text-xs text-slate-400">{appointments.length} Consultations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">Token</th>
                <th className="p-3 font-semibold">Patient</th>
                <th className="p-3 font-semibold">Doctor & Department</th>
                <th className="p-3 font-semibold">Time Slot</th>
                <th className="p-3 font-semibold">Chief Complaint</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((apt) => {
                const statusBadges = {
                  scheduled: 'bg-slate-100 text-slate-700',
                  checked_in: 'bg-blue-100 text-blue-800 font-bold',
                  in_consultation: 'bg-amber-100 text-amber-800 font-bold',
                  completed: 'bg-emerald-100 text-emerald-800',
                  cancelled: 'bg-rose-100 text-rose-800',
                  no_show: 'bg-slate-100 text-slate-400'
                };

                return (
                  <tr key={apt.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        #{apt.tokenNumber}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{apt.patientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{apt.patientUhid} • {apt.patientPhone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{apt.doctorName}</div>
                      <div className="text-[10px] text-slate-400">{apt.departmentName}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{apt.timeSlot}</td>
                    <td className="p-3 text-slate-700 italic max-w-xs truncate">"{apt.chiefComplaint}"</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full capitalize ${statusBadges[apt.status]}`}>
                        {apt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {apt.status === 'scheduled' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'checked_in')}
                          className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded shadow-xs"
                        >
                          Check In
                        </button>
                      )}
                      {apt.status === 'checked_in' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'in_consultation')}
                          className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded shadow-xs"
                        >
                          Call In
                        </button>
                      )}
                      {apt.status === 'completed' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Finished
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BOOK APPOINTMENT */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Book OPD Token & Appointment</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleBook} className="space-y-4 mt-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consulting Doctor</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => handleDoctorSelect(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.departmentName}) {d.consultationFee ? `• ₹${d.consultationFee}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Consultation Fee (₹)</label>
                    <span className="text-[10px] text-blue-600 font-bold">Editable</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={modalFee}
                      onChange={(e) => setModalFee(e.target.value)}
                      placeholder="500.00"
                      className="w-full text-xs pl-6 pr-2.5 py-2.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint</label>
                <input
                  type="text"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="e.g. Recurrent headache, persistent cough"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
                >
                  Generate Token & Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
