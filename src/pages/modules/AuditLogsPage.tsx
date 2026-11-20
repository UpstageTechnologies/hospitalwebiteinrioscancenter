import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  FileText
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useHospital();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (
      log.actorName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q)
    );
    const matchModule = selectedModule === 'all' || log.module === selectedModule;
    return matchSearch && matchModule;
  });

  const modules = Array.from(new Set(auditLogs.map(l => l.module)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            Immutable Audit Trail & Regulatory Compliance Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic Action Traceability • Clinical Changes • Role Approvals • Billing Adjustments
          </p>
        </div>

        <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
          Audit Ledger Immutable
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by staff name, action, or details..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Module:</span>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
          >
            <option value="all">All Modules</option>
            {modules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Actor / Staff</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Module</th>
                <th className="p-3 font-semibold">Action</th>
                <th className="p-3 font-semibold">Event Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-slate-900 font-sans">
                    {log.actorName}
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-sans font-medium uppercase">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-sans">{log.module}</td>
                  <td className="p-3 font-semibold text-emerald-700">{log.action}</td>
                  <td className="p-3 text-slate-700 font-sans leading-relaxed">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
