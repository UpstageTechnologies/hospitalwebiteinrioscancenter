import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import type { AttendanceRecord } from '../../types/hr';
import type { Employee } from '../../types/employee';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  History,
  X,
  Sparkles,
  Download
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { employees, attendanceRecords, markAttendance, markBulkAttendance } = useHospital();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [historyModalEmployee, setHistoryModalEmployee] = useState<Employee | null>(null);

  // STRICT REQUIREMENT: ONLY approved and active employees appear in Attendance!
  const approvedActiveEmployees = employees.filter(e => e.status === 'active');

  // Filtered employees for the daily sheet
  const displayEmployees = approvedActiveEmployees.filter(emp => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      emp.name.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.primaryRole.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q);

    const matchDept = selectedDeptFilter === 'all' || emp.departmentId === selectedDeptFilter;
    return matchSearch && matchDept;
  });

  // Calculate Attendance Stats for selected date
  const selectedDateRecords = attendanceRecords.filter(a => a.date === selectedDate);
  
  // Count by status for active employees
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let leaveCount = 0;

  approvedActiveEmployees.forEach(emp => {
    const rec = selectedDateRecords.find(a => a.employeeId === emp.id);
    if (!rec || rec.status === 'present') {
      presentCount++;
    } else if (rec.status === 'absent') {
      absentCount++;
    } else if (rec.status === 'late') {
      lateCount++;
    } else if (rec.status === 'half_day') {
      halfDayCount++;
    } else if (rec.status === 'leave') {
      leaveCount++;
    }
  });

  const totalActive = approvedActiveEmployees.length;
  const attendanceRate = totalActive > 0 ? Math.round(((presentCount + lateCount) / totalActive) * 100) : 0;

  const handleStatusChange = (
    empId: string,
    newStatus: AttendanceRecord['status'],
    defaultCheckIn?: string,
    defaultCheckOut?: string
  ) => {
    markAttendance(empId, selectedDate, newStatus, defaultCheckIn, defaultCheckOut);
  };

  const handleMarkAllPresent = () => {
    markBulkAttendance(selectedDate, 'present');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Staff Attendance</h1>
              <p className="text-xs text-slate-500">
                Daily Roster • Working Hours Calculation • Automatic Integration with Approved Staff Register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            />

            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark All Present</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-5 border-t border-slate-100 mt-5">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Staff</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalActive}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Approved in register</div>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Present Today</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{presentCount}</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{attendanceRate}% Attendance</div>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Late Arrivals</div>
            <div className="text-xl font-extrabold text-amber-700 mt-0.5">{lateCount}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Punch-in after 09:15</div>
          </div>

          <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/70">
            <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Absent</div>
            <div className="text-xl font-extrabold text-rose-700 mt-0.5">{absentCount}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Unexcused absence</div>
          </div>

          <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/70">
            <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">On Leave / Half Day</div>
            <div className="text-xl font-extrabold text-blue-700 mt-0.5">{leaveCount + halfDayCount}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">{leaveCount} Leave • {halfDayCount} Half-day</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search approved staff by name, code or designation..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
          >
            <option value="all">All Departments</option>
            {Array.from(new Set(approvedActiveEmployees.map(e => e.departmentName))).map(deptName => (
              <option key={deptName} value={deptName}>{deptName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Attendance Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Dept</th>
                <th className="py-3 px-4">Status Toggle</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No approved active staff found. (Pending employees must be accepted by Admin before appearing in attendance).
                  </td>
                </tr>
              ) : (
                displayEmployees.map(emp => {
                  const record = selectedDateRecords.find(a => a.employeeId === emp.id);
                  const currentStatus = record?.status || 'present';
                  const checkIn = record?.checkInTime || (currentStatus === 'absent' ? '—' : '09:00 AM');
                  const checkOut = record?.checkOutTime || (currentStatus === 'absent' ? '—' : '05:30 PM');
                  const hours = record?.workHours !== undefined ? record.workHours : (currentStatus === 'absent' ? 0 : 8.5);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {emp.name.replace('Dr. ', '').replace('Sister ', '').charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{emp.employeeCode}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 capitalize">{emp.primaryRole.replace('_', ' ')}</div>
                        <div className="text-[10px] text-slate-500">{emp.departmentName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {[
                            { id: 'present', label: 'P', title: 'Present', activeClass: 'bg-emerald-600 text-white font-bold shadow-xs' },
                            { id: 'late', label: 'L', title: 'Late', activeClass: 'bg-amber-500 text-white font-bold shadow-xs' },
                            { id: 'half_day', label: 'HD', title: 'Half Day', activeClass: 'bg-purple-600 text-white font-bold shadow-xs' },
                            { id: 'leave', label: 'Lv', title: 'Leave', activeClass: 'bg-blue-600 text-white font-bold shadow-xs' },
                            { id: 'absent', label: 'A', title: 'Absent', activeClass: 'bg-rose-600 text-white font-bold shadow-xs' }
                          ].map(btn => (
                            <button
                              key={btn.id}
                              title={btn.title}
                              onClick={() => handleStatusChange(emp.id, btn.id as any)}
                              className={`w-7 h-7 rounded-lg text-xs transition-all ${
                                currentStatus === btn.id
                                  ? btn.activeClass
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {checkIn}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {checkOut}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {hours > 0 ? `${hours} hrs` : '0.0 hrs'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setHistoryModalEmployee(emp)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5 text-slate-400" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPLOYEE-WISE ATTENDANCE HISTORY MODAL */}
      {historyModalEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                  {historyModalEmployee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{historyModalEmployee.name} Attendance History</h3>
                  <p className="text-xs text-slate-400 font-mono">{historyModalEmployee.employeeCode} • {historyModalEmployee.designation}</p>
                </div>
              </div>
              <button onClick={() => setHistoryModalEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {attendanceRecords
                .filter(a => a.employeeId === historyModalEmployee.id)
                .map(att => (
                  <div key={att.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{att.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {att.checkInTime ? `${att.checkInTime} - ${att.checkOutTime || 'Present'}` : 'Not checked in'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        att.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                        att.status === 'late' ? 'bg-amber-100 text-amber-800' :
                        att.status === 'half_day' ? 'bg-purple-100 text-purple-800' :
                        att.status === 'leave' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {att.status}
                      </span>
                      <span className="font-mono font-bold text-slate-700">{att.workHours || 0}h</span>
                    </div>
                  </div>
                ))}

              {attendanceRecords.filter(a => a.employeeId === historyModalEmployee.id).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No previous check-in records for this staff member.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryModalEmployee(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
