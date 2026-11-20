import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import {
  Bell,
  HelpCircle,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MessageSquare,
  User,
  Users,
  Check,
  X
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const { patients, appointments, roleRequests } = useHospital();

  const [selectedDay, setSelectedDay] = useState(13);

  // Session / Task Requests state matching screenshot
  const [requests, setRequests] = useState([
    { id: '1', client: 'James Patel', time: 'Today, 15:00', type: 'Clinical Consultation', status: 'Approved' },
    { id: '2', client: 'Hannah Collins', time: 'Tomorrow, 18:30', type: 'Vitals & ECG Review', status: 'Pending' },
    { id: '3', client: 'Sara Kim', time: 'Fri, 10:00', type: 'Follow-up Assessment', status: 'Declined' }
  ]);

  const daysOfWeek = [
    { day: 'Mo', date: 12 },
    { day: 'Tu', date: 13 },
    { day: 'We', date: 14 },
    { day: 'Th', date: 15 },
    { day: 'Fr', date: 16 },
    { day: 'Sa', date: 17 },
    { day: 'Su', date: 18 }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 2-Column Main Layout: Left Work Area (68%) & Right Agenda Sidebar (32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Greeting Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {currentUser?.name.split(' ')[0] || 'Emily'}!
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Easily manage your hospital schedule, patient sessions, and tasks.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-xs">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-xs">
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Pastel Summary KPI Pill Cards (Exactly matching Screenshot 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Soft Pastel Amber */}
            <div className="bg-[#fef08a]/45 border border-[#fef08a] rounded-3xl p-5 shadow-xs flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-slate-800">Assigned Tasks</span>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-slate-900">4</div>
                <div className="w-6 h-6 rounded-full bg-amber-200/80 flex items-center justify-center text-slate-800">
                  <span className="text-[10px] font-bold">●</span>
                </div>
              </div>
            </div>

            {/* Card 2: Soft Pastel Sky Blue */}
            <div className="bg-[#bae6fd]/45 border border-[#bae6fd] rounded-3xl p-5 shadow-xs flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-slate-800">Patients on Roster</span>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-slate-900">{patients.length}</div>
                <div className="w-6 h-6 rounded-full bg-sky-200/80 flex items-center justify-center text-slate-800">
                  <span className="text-[10px] font-bold">●</span>
                </div>
              </div>
            </div>

            {/* Card 3: Soft Pastel Lavender */}
            <div className="bg-[#e9d5ff]/45 border border-[#e9d5ff] rounded-3xl p-5 shadow-xs flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-slate-800">Pending Actions</span>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-slate-900">{appointments.length}</div>
                <div className="w-6 h-6 rounded-full bg-purple-200/80 flex items-center justify-center text-slate-800">
                  <span className="text-[10px] font-bold">●</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row: Recent Messages & My Clients Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Recent Messages (7 Cols) */}
            <div className="md:col-span-7 bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Recent Clinical Notices</h3>
              <div className="space-y-3 pt-1">
                {[
                  { name: 'Alice Brown', msg: 'Can we try breathing exercises?', time: '11:01', avatar: 'A' },
                  { name: 'Dr. Vikram Malhotra', msg: 'Yes, I will review her chart.', time: '09:18', avatar: 'V' },
                  { name: 'Michael Lee', msg: 'Thank you for your assistance!', time: '09:18', avatar: 'M' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {item.avatar}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.msg}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Patients / Clients (5 Cols) */}
            <div className="md:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">My Patients</h3>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">View all</span>
              </div>

              <div className="my-3">
                <div className="text-3xl font-extrabold text-slate-900">{patients.length * 6}</div>
                <span className="inline-block text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md mt-1 border border-purple-200">
                  {appointments.length} consults this week
                </span>
              </div>

              {/* Overlapping Avatar Row */}
              <div className="flex items-center -space-x-2 pt-1">
                {['J', 'M', 'S'].map((initial, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white text-slate-700 font-bold text-[10px] flex items-center justify-center">
                    {initial}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white text-white font-bold text-[9px] flex items-center justify-center">
                  +16
                </div>
              </div>
            </div>
          </div>

          {/* Session / Schedule Requests Table (Matching Screenshot 2) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900">Clinical & Session Requests</h3>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs min-w-[420px]">
                <thead className="text-slate-400 font-medium border-b border-slate-100">
                  <tr>
                    <th className="pb-2.5 font-medium">Client</th>
                    <th className="pb-2.5 font-medium">Requested Time</th>
                    <th className="pb-2.5 font-medium">Type</th>
                    <th className="pb-2.5 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => {
                    const statusStyles: Record<string, string> = {
                      Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
                      Declined: 'bg-rose-50 text-rose-700 border-rose-200'
                    };

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-900 flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            {req.client.charAt(0)}
                          </div>
                          <span>{req.client}</span>
                        </td>
                        <td className="py-3 text-slate-500">{req.time}</td>
                        <td className="py-3 text-slate-700 font-medium">{req.type}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${statusStyles[req.status]}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section: Profile & Agenda Sidebar (4 Cols, Exactly matching Screenshot 2) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs space-y-6 flex flex-col justify-between">
          {/* Profile Card Header */}
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-700 text-2xl font-bold mx-auto shadow-xs">
                {currentUser?.name.charAt(0) || 'E'}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{currentUser?.name || 'Emily Carter'}</h2>
              <p className="text-xs text-slate-400 font-medium">{currentUser?.designation || 'Staff Nurse / Front Desk'}</p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Available
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </span>
            </div>
          </div>

          {/* Agenda Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">My agenda</h3>
              <span className="text-[11px] text-slate-400 font-medium hover:text-slate-700 cursor-pointer">View all</span>
            </div>

            {/* Horizontal Mini Calendar Row (Mo 12, Tu 13 active, We 14...) */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {daysOfWeek.map((d) => {
                const isActive = d.date === selectedDay;
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDay(d.date)}
                    className={`py-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] opacity-70">{d.day}</span>
                    <span className="text-xs font-bold mt-0.5">{d.date}</span>
                  </button>
                );
              })}
            </div>

            {/* Agenda Schedule Cards */}
            <div className="space-y-2.5 pt-1">
              {[
                { title: 'Morning Vitals Round', time: '09:00 - 10:00', avatar: 'V' },
                { title: '1:1 with T. Morgan', time: '14:30 - 15:15', avatar: 'T' },
                { title: '1:1 with S. Green', time: '16:30 - 17:00', avatar: 'S' },
                { title: 'Medication Administration', time: '18:00 - 19:00', avatar: 'M' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                      {item.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{item.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom All Upcoming Events Button */}
          <button className="w-full py-2.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors">
            All upcoming events
          </button>
        </div>
      </div>
    </div>
  );
};
