import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_ROLE_TEMPLATES } from '../../constants/roleTemplates';
import { NurseHelpDialog } from '../../components/nurse/NurseHelpDialog';
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Check,
  X,
  HeartPulse
} from 'lucide-react';

export const HRDashboard: React.FC = () => {
  const { employees, roleRequests } = useHospital();
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [nurseHelpOpen, setNurseHelpOpen] = useState(false);

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Human Resources, Staffing & Attendance Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Staff Directory • Primary & Additional Role Mapping • Biometric Attendance • Payroll
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setNurseHelpOpen(true)}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Request nurse assistance"
          >
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Nurse Help</span>
          </button>

          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'directory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Directory ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Biometric Attendance
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'payroll' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payroll Summary
          </button>
        </div>
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY WITH DYNAMIC ROLES */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name, code or department..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 outline-none focus:border-purple-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing {filteredEmployees.length} registered employees
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Employee</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Primary Role</th>
                  <th className="p-3 font-semibold">Approved Additional Roles</th>
                  <th className="p-3 font-semibold">Contact</th>
                  <th className="p-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const primaryTemplate = INITIAL_ROLE_TEMPLATES[emp.primaryRole];

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.employeeCode} • {emp.designation}</div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{emp.departmentName}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${primaryTemplate.badgeColor}`}>
                          {primaryTemplate.name}
                        </span>
                      </td>
                      <td className="p-3">
                        {emp.additionalRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {emp.additionalRoles.map(r => (
                              <span key={r} className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                                {INITIAL_ROLE_TEMPLATES[r]?.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-700">{emp.phone}</div>
                        <div className="text-[10px] text-slate-400">{emp.email}</div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 capitalize">
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BIOMETRIC ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daily Biometric Attendance Sync
              </h3>
              <p className="text-[11px] text-slate-400">Date: {new Date().toLocaleDateString()} • Device: Gate-01 Scanner</p>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              Biometric Engine Online
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((emp) => (
              <div key={emp.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{emp.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{emp.employeeCode} • {emp.departmentName}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Present (08:55 AM)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL INFORMATION */}
      {activeTab === 'payroll' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Monthly Staff Payroll Preview
              </h3>
              <p className="text-[11px] text-slate-400">Payroll Cycle: Current Month</p>
            </div>
            <button className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg shadow-xs">
              Process Direct Bank Disbursal
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Staff Member</th>
                  <th className="p-3 font-semibold">Designation</th>
                  <th className="p-3 font-semibold">Basic Pay</th>
                  <th className="p-3 font-semibold">Allowances</th>
                  <th className="p-3 font-semibold">Net Disbursal</th>
                  <th className="p-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                    <td className="p-3 text-slate-600">{emp.designation}</td>
                    <td className="p-3 font-semibold text-slate-800">₹45,000</td>
                    <td className="p-3 text-slate-600">₹8,500</td>
                    <td className="p-3 font-extrabold text-emerald-700">₹53,500</td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Ready
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Reusable Nurse Help Dialog */}
      <NurseHelpDialog
        isOpen={nurseHelpOpen}
        onClose={() => setNurseHelpOpen(false)}
        defaultTaskType="Patient Assistance"
      />
    </div>
  );
};
