import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { BillingDashboard } from '../dashboards/BillingDashboard';
import { PharmacyDashboard } from '../dashboards/PharmacyDashboard';
import { LabDashboard } from '../dashboards/LabDashboard';
import { RoleManagementPage } from './RoleManagementPage';
import { HRDashboard } from '../dashboards/HRDashboard';
import { ReportsPage } from './ReportsPage';
import { AuditLogsPage } from './AuditLogsPage';
import {
  Receipt,
  Pill,
  Microscope,
  Activity,
  ShieldCheck,
  Users,
  TrendingUp,
  History,
  Settings,
  Grid,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface MorePageProps {
  initialSubTab?: string;
}

export const MorePage: React.FC<MorePageProps> = ({ initialSubTab = 'hub' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const { activeRole, availableRoles, currentHospital } = useAuth();
  const { roleRequests, departments, invoices } = useHospital();

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const isOwnerOrAdmin = activeRole === 'owner' || activeRole === 'admin';
  const pendingRoleRequests = roleRequests.filter(r => r.status === 'pending').length;

  interface ModuleDef {
    id: string;
    label: string;
    category: 'Finance' | 'Clinical' | 'Governance' | 'Administration';
    description: string;
    icon: React.ElementType;
    badge?: number | string;
    roles?: string[];
  }

  const allModules: ModuleDef[] = [
    {
      id: 'billing',
      label: 'Billing & Cashier',
      category: 'Finance',
      description: 'OPD/IPD invoices, advance deposits, receipts and insurance settlements.',
      icon: Receipt,
      roles: ['billing_staff', 'accountant']
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy & Drug Stock',
      category: 'Clinical',
      description: 'Formulary dispensing, batch expiry tracking, and purchase order reorders.',
      icon: Pill,
      roles: ['pharmacist', 'doctor', 'nurse']
    },
    {
      id: 'laboratory',
      label: 'Diagnostic Laboratory',
      category: 'Clinical',
      description: 'Specimen accessioning, analyzer test results, and pathology sign-off.',
      icon: Microscope,
      roles: ['lab_technician', 'pathologist', 'doctor']
    },
    {
      id: 'radiology',
      label: 'Radiology & Imaging',
      category: 'Clinical',
      description: 'X-Ray, CT Scan, Ultrasound, MRI orders and digital imaging reports.',
      icon: Activity,
      roles: ['radiologist', 'doctor']
    },
    {
      id: 'roles',
      label: '17 Roles & Governance',
      category: 'Governance',
      description: '17 Dynamic Role templates, permissions matrix, and additional role approvals.',
      icon: ShieldCheck,
      badge: pendingRoleRequests > 0 ? pendingRoleRequests : undefined,
      roles: ['hr_manager']
    },
    {
      id: 'employees',
      label: 'Staff Directory & HR',
      category: 'Administration',
      description: 'Doctor credentials, nurse shifts, employee profiles and biometric attendance.',
      icon: Users,
      roles: ['hr_manager']
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      category: 'Finance',
      description: 'Revenue breakdowns, bed occupancy statistics, and clinical outcome metrics.',
      icon: TrendingUp,
      roles: ['accountant', 'hr_manager']
    },
    {
      id: 'audit',
      label: 'Audit Trail & Security',
      category: 'Governance',
      description: 'Immutable system audit ledger, compliance trail, and multi-tenant isolation.',
      icon: History,
      roles: []
    },
    {
      id: 'settings',
      label: 'Hospital Settings',
      category: 'Governance',
      description: 'Multi-tenant organization parameters, working hours, and master rules.',
      icon: Settings,
      roles: []
    }
  ];

  // Filter by user role authorization
  const authorizedModules = allModules.filter(m => {
    if (isOwnerOrAdmin) return true;
    if (!m.roles || m.roles.length === 0) return true;
    return m.roles.includes(activeRole) || availableRoles.some(r => m.roles?.includes(r));
  });

  return (
    <div className="space-y-6">
      {/* Top Header with Quick Sub-Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('hub')}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold transition-all ${
                activeTab === 'hub'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
              }`}
              title="View All Modules Hub"
            >
              <Grid className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Hospital Modules & Services</h2>
              <p className="text-xs text-slate-500">
                Finance • Diagnostics • HR & 17 Dynamic Roles • Compliance & Master Settings
              </p>
            </div>
          </div>

          {/* Quick Sub-tab selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('hub')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'hub'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Modules Hub
            </button>
            {authorizedModules.map((m) => {
              const Icon = m.icon;
              const isActive = activeTab === m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label.split(' ')[0]}</span>
                  {m.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-white">
                      {m.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Render Module Content or Hub Card Grid */}
      {activeTab === 'hub' ? (
        <div className="space-y-6">
          {/* Categorized Hub Sections */}
          {(['Finance', 'Clinical', 'Governance', 'Administration'] as const).map((category) => {
            const catModules = authorizedModules.filter(m => m.category === category);
            if (catModules.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {category} Modules
                  </h3>
                  <div className="flex-1 h-px bg-slate-200/80"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catModules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => setActiveTab(mod.id)}
                        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 border border-slate-200/80 group-hover:border-emerald-200 flex items-center justify-center transition-colors">
                              <Icon className="w-5 h-5" />
                            </div>
                            {mod.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                {mod.badge} Action
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {mod.label}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {mod.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                          <span>Launch Module</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {activeTab === 'billing' && <BillingDashboard />}
          {activeTab === 'pharmacy' && <PharmacyDashboard />}
          {activeTab === 'laboratory' && <LabDashboard />}
          {activeTab === 'roles' && <RoleManagementPage />}
          {activeTab === 'employees' && <HRDashboard />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'audit' && <AuditLogsPage />}

          {/* Radiology View */}
          {activeTab === 'radiology' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Radiology, PACS & Medical Imaging
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    DICOM viewer integration • Digital X-Ray, CT, Ultrasound & MRI Diagnostic Records
                  </p>
                </div>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                  PACS DICOM Connected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="text-xs font-bold text-slate-700">Digital X-Ray Chest PA</div>
                  <div className="text-[11px] text-slate-500 mt-1">Patient: Michael Turner (#PT-10021)</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-2">Reported: Normal bronchovascular markings</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="text-xs font-bold text-slate-700">MRI Brain T1/T2 Axial</div>
                  <div className="text-[11px] text-slate-500 mt-1">Patient: Daniel Brooks (#PT-10022)</div>
                  <div className="text-[10px] text-amber-700 font-semibold mt-2">Status: Awaiting Radiologist Verification</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="text-xs font-bold text-slate-700">Ultrasound Whole Abdomen</div>
                  <div className="text-[11px] text-slate-500 mt-1">Patient: Carlos Mendes (#PT-10023)</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-2">Reported: Normal hepatobiliary scan</div>
                </div>
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-700" />
                  Hospital Cloud Configuration & Multi-Tenancy Rules
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tenant ID: <span className="font-mono text-emerald-600 font-bold">{currentHospital.id}</span>
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Multi-Tenancy Isolation</div>
                    <div className="text-slate-500 text-[11px]">Strict orgId segregation on all patient, billing and clinical records.</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Active & Enforced
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Dynamic 17 Roles Architecture</div>
                    <div className="text-slate-500 text-[11px]">Primary + Additional Role assignment with Owner/HR approval gate.</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    17 Templates Loaded
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Audit Trail Integrity</div>
                    <div className="text-slate-500 text-[11px]">Immutable write-only audit log records every sensitive clinical/financial operation.</div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    HIPAA Aligned
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
