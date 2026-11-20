import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  Sparkles,
  Shield,
  Wrench,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  Phone,
  MapPin,
  Check
} from 'lucide-react';

export const SupportDashboards: React.FC = () => {
  const { activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'ambulance' | 'housekeeping' | 'security' | 'maintenance'>('ambulance');

  // Ambulance trips state
  const [trips, setTrips] = useState([
    { id: '1', tripNo: 'AMB-108-01', vehicle: 'DL-01-AX-9912', patient: 'Ramesh Verma', pickup: 'Sector 62, Noida', destination: 'Upstage Emergency ICU', status: 'en_route_pickup' },
    { id: '2', tripNo: 'AMB-108-02', vehicle: 'DL-01-AX-9914', patient: 'Mrs. Shanti Devi', pickup: 'Lajpat Nagar, New Delhi', destination: 'Upstage Hospital Trauma', status: 'completed' }
  ]);

  // Housekeeping tasks state
  const [tasks, setTasks] = useState([
    { id: '1', room: 'General Ward Male - Bed GW-03', task: 'Terminal Bed Sanitization & Linen Change', priority: 'high', status: 'pending' },
    { id: '2', room: 'ICU Unit - Bed ICU-02', task: 'Formalin Disinfection Cycle', priority: 'urgent', status: 'completed' },
    { id: '3', room: 'OPD 2nd Floor Corridor', task: 'Routine Floor Mopping & Dustbin Clearance', priority: 'normal', status: 'completed' }
  ]);

  // Security gate passes state
  const [visitorPasses, setVisitorPasses] = useState([
    { id: '1', passNo: 'VIS-2026-0041', visitor: 'Sunita Sen', patient: 'Amitabh Sen (UPH-2026-00101)', ward: 'General Ward Male - Bed GW-01', entryTime: '10:30 AM', status: 'inside' },
    { id: '2', passNo: 'VIS-2026-0042', visitor: 'Rohit Chopra', patient: 'Priyanka Chopra (UPH-2026-00102)', ward: 'Cardiology OPD Room 3', entryTime: '09:15 AM', status: 'checked_out' }
  ]);

  // Maintenance tickets state
  const [tickets, setTickets] = useState([
    { id: '1', ticketNo: 'MNT-2026-012', equipment: 'ICU Ventilator #2 Oxygen Pipeline Pressure', department: 'ICU Unit', priority: 'urgent', status: 'in_repair' },
    { id: '2', ticketNo: 'MNT-2026-013', equipment: 'Radiology Digital X-Ray Console UPS Backup', department: 'Radiology', priority: 'high', status: 'open' },
    { id: '3', ticketNo: 'MNT-2026-014', equipment: '4th Floor AC Chiller Air Flow Balance', department: 'Deluxe Private', priority: 'normal', status: 'resolved' }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-700" />
            Support Services & Facility Operations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Emergency Transport • Infection Control & Sanitation • Physical Security • Biomedical Engineering
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ambulance')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'ambulance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Ambulance
          </button>
          <button
            onClick={() => setActiveTab('housekeeping')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'housekeeping' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Housekeeping
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'security' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Security
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'maintenance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Maintenance
          </button>
        </div>
      </div>

      {/* TAB 1: AMBULANCE */}
      {activeTab === 'ambulance' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Emergency 108 Ambulance Fleet & Dispatches
              </h3>
              <p className="text-[11px] text-slate-400">Real-time GPS dispatch and patient transit monitoring</p>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              Fleet Ready (3 Ambulances on standby)
            </span>
          </div>

          <div className="space-y-3">
            {trips.map((trip) => (
              <div key={trip.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{trip.tripNo}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Vehicle: {trip.vehicle}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      trip.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {trip.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 font-semibold">
                    Patient: {trip.patient}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Pickup: {trip.pickup} ➔ Destination: {trip.destination}
                  </div>
                </div>

                {trip.status !== 'completed' && (
                  <button
                    onClick={() => {
                      setTrips(trips.map(t => t.id === trip.id ? { ...t, status: 'completed' } : t));
                    }}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-xs"
                  >
                    Mark Trip Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: HOUSEKEEPING */}
      {activeTab === 'housekeeping' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ward Sanitization & Infection Control Tasks
              </h3>
              <p className="text-[11px] text-slate-400">Terminal bed disinfection and biomedical sanitation roster</p>
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
              NABH Infection Control Protocol
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {tasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div key={task.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
                      }}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                        isDone ? 'bg-emerald-600 text-white' : 'border border-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <div className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.room}
                      </div>
                      <div className="text-[11px] text-slate-500">{task.task}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hospital Gate Register & Visitor Passes
              </h3>
              <p className="text-[11px] text-slate-400">Patient attendant tracking & curfew regulation</p>
            </div>
            <button className="text-xs font-semibold bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg shadow-xs">
              + Issue Attendant Pass
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {visitorPasses.map((pass) => (
              <div key={pass.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{pass.passNo}</span>
                    <span className="text-xs font-semibold text-slate-700">• {pass.visitor}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Attending: {pass.patient} • Location: {pass.ward}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    pass.status === 'inside' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {pass.status.replace('_', ' ')}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Entry: {pass.entryTime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Biomedical & Engineering Work Orders
              </h3>
              <p className="text-[11px] text-slate-400">Oxygen lines, UPS power backups, HVAC & life-support equipment</p>
            </div>
            <button className="text-xs font-semibold bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg shadow-xs">
              + Log Service Ticket
            </button>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{t.ticketNo}</span>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {t.department}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      t.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 font-semibold mt-1">{t.equipment}</div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                  t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
