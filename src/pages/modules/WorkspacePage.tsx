import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import {
  LayoutGrid,
  Stethoscope,
  Users,
  Bed,
  Pill,
  Microscope,
  Receipt,
  ShieldCheck,
  History,
  Activity,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface WorkspacePageProps {
  onNavigateTab: (tabId: string, subTab?: string) => void;
}

interface ModuleCard {
  id: string;
  subTab?: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ElementType;
  bgGradient: string;
  accentColor: string;
  badge?: string;
  roles?: string[]; // Allowed roles (owner & admin always allowed)
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onNavigateTab }) => {
  const { currentUser, currentHospital, activeRole, availableRoles } = useAuth();
  const { patients, appointments, admissions, beds, roleRequests, invoices } = useHospital();

  const isOwnerOrAdmin = activeRole === 'owner' || activeRole === 'admin';
  const pendingRequests = roleRequests.filter(r => r.status === 'pending').length;
  const activeAdmissionsCount = admissions.filter(a => a.status === 'active').length;
  const todayAptsCount = appointments.filter(a => a.status === 'scheduled' || a.status === 'in_consultation').length;

  const modules: ModuleCard[] = [
    {
      id: 'operations',
      subTab: 'appointments',
      title: 'Doctor & OPD Station',
      subtitle: `${todayAptsCount} scheduled consultations today. Queue triage and live clinical notes.`,
      category: 'Clinical Operations',
      icon: Stethoscope,
      bgGradient: 'from-emerald-600 to-teal-700',
      accentColor: 'text-emerald-100',
      badge: `${todayAptsCount} Active`,
      roles: ['doctor', 'receptionist', 'nurse']
    },
    {
      id: 'patients',
      title: 'Patients & EMR Records',
      subtitle: `${patients.length} registered patients. Unique UHID master index, allergies & vitals timeline.`,
      category: 'Patient Care',
      icon: Users,
      bgGradient: 'from-amber-500 to-orange-600',
      accentColor: 'text-amber-100',
      badge: `${patients.length} Profiles`,
      roles: ['doctor', 'nurse', 'receptionist', 'billing_staff']
    },
    {
      id: 'operations',
      subTab: 'admissions',
      title: 'Inpatient & Ward Bed Map',
      subtitle: `${activeAdmissionsCount} active inpatients. ICU, General Wards, and real-time bed allocation.`,
      category: 'Patient Care',
      icon: Bed,
      bgGradient: 'from-rose-500 to-pink-600',
      accentColor: 'text-rose-100',
      badge: `${activeAdmissionsCount} Admitted`,
      roles: ['nurse', 'ward_incharge', 'doctor', 'receptionist']
    },
    {
      id: 'more',
      subTab: 'pharmacy',
      title: 'Pharmacy & Drug Stock',
      subtitle: 'Prescription dispensing, batch expiry tracking, and low-stock reorder triggers.',
      category: 'Diagnostics & Drugs',
      icon: Pill,
      bgGradient: 'from-purple-600 to-indigo-700',
      accentColor: 'text-purple-100',
      badge: 'Formulary Online',
      roles: ['pharmacist', 'doctor', 'nurse']
    },
    {
      id: 'more',
      subTab: 'laboratory',
      title: 'Clinical Diagnostic Lab',
      subtitle: 'Pathology test orders, specimen barcode scanning, and pathologist verification.',
      category: 'Diagnostics & Drugs',
      icon: Microscope,
      bgGradient: 'from-cyan-600 to-blue-700',
      accentColor: 'text-cyan-100',
      badge: 'NABL Compliant',
      roles: ['lab_technician', 'pathologist', 'doctor']
    },
    {
      id: 'more',
      subTab: 'billing',
      title: 'Billing, Cashier & TPA',
      subtitle: 'OPD/IPD invoices, multi-mode payments, deposit refunds and insurance claims.',
      category: 'Finance & Cashier',
      icon: Receipt,
      bgGradient: 'from-amber-600 to-yellow-600',
      accentColor: 'text-amber-100',
      badge: 'GST Invoicing',
      roles: ['billing_staff', 'accountant']
    },
    {
      id: 'more',
      subTab: 'roles',
      title: 'Staff & 17 Dynamic Roles',
      subtitle: `${pendingRequests} pending role assignments. Multi-role governance and approvals.`,
      category: 'Administration',
      icon: ShieldCheck,
      bgGradient: 'from-teal-600 to-emerald-700',
      accentColor: 'text-teal-100',
      badge: pendingRequests > 0 ? `${pendingRequests} Awaiting Approval` : '17 Roles Active',
      roles: ['hr_manager']
    },
    {
      id: 'more',
      subTab: 'audit',
      title: 'Audit Trail & Compliance',
      subtitle: 'Immutable system activity log, HIPAA-aligned audit trails, and multi-tenant isolation.',
      category: 'Governance & Security',
      icon: History,
      bgGradient: 'from-slate-700 to-slate-900',
      accentColor: 'text-slate-200',
      badge: 'Immutable Log',
      roles: []
    }
  ];

  // Filter modules visible to logged-in user
  // Multi-role users see modules for ANY of their approved roles
  const visibleModules = modules.filter(m => {
    if (isOwnerOrAdmin) return true;
    if (!m.roles || m.roles.length === 0) return true;
    // Check if active role or any available approved role has access
    return m.roles.includes(activeRole) || availableRoles.some(r => m.roles?.includes(r));
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Greeting Header matching Screenshot 2 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Good Morning, {currentUser?.name.split(' ')[0] || 'Doctor'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Welcome to <span className="font-semibold text-slate-800">{currentHospital.name}</span> Workspace • Access your authorized hospital modules below.
          </p>
        </div>

        {/* Multi-Role Quick Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200/80 flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Role: <span className="capitalize font-bold">{activeRole.replace('_', ' ')}</span>
          </span>
        </div>
      </div>

      {/* Module Launcher Cards (Matching Screenshot 2 aesthetic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleModules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <div
              key={`${mod.id}-${mod.subTab || idx}`}
              onClick={() => onNavigateTab(mod.id, mod.subTab)}
              className={`relative bg-gradient-to-br ${mod.bgGradient} text-white p-7 rounded-3xl shadow-lg cursor-pointer overflow-hidden group hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[220px]`}
            >
              {/* Top Row: Title & Icon */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block mb-1">
                    {mod.category}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white">{mod.title}</h3>
                  <p className={`${mod.accentColor} text-xs mt-1.5 max-w-[210px] leading-relaxed line-clamp-2`}>
                    {mod.subtitle}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Bottom Action Row */}
              <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/90 group-hover:text-white">
                  <span>Open Module</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
                {mod.badge && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/20 text-white/90 backdrop-blur-xs">
                    {mod.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
