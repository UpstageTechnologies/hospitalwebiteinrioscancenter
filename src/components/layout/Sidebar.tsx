import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import type { RoleId } from '../../types/roles';
import {
  Users,
  Clock,
  CreditCard,
  ShieldAlert,
  HeartPulse,
  Shield,
  CheckCircle2,
  Stethoscope,
  Calendar,
  FileText,
  UserPlus,
  Pill,
  Microscope,
  Scan,
  Bed,
  Boxes,
  DollarSign,
  Wrench,
  LayoutGrid,
  Receipt,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen = false, onClose }) => {
  const { activeRole, currentUser } = useAuth();
  const { employees } = useHospital();

  const isHRManager = activeRole === 'hr_manager';
  const pendingApprovalsCount = employees.filter(e => e.status === 'pending_approval').length;

  // STRICT PHASE 1 REQUIREMENT: HR MANAGER GETS ONLY 3 ITEMS
  const hrNavItems: NavItem[] = [
    {
      id: 'attendance',
      label: 'Attendance',
      icon: Clock,
      description: 'Daily Roster'
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users,
      description: 'Staff Directory'
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: CreditCard,
      description: 'Disbursements'
    }
  ];

  // Role-specific minimal navigations (maximum 3-4 items, clean & minimal)
  const roleNavItems: Record<RoleId, NavItem[]> = {
    hr_manager: hrNavItems,

    admin: [
      {
        id: 'approvals',
        label: 'Approvals',
        icon: ShieldAlert,
        description: 'HR Submissions',
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        badgeColor: 'bg-amber-500 text-white'
      },
      {
        id: 'employees',
        label: 'Employees',
        icon: Users,
        description: 'Staff Directory'
      },
      {
        id: 'attendance',
        label: 'Attendance',
        icon: Clock,
        description: 'Daily Roster'
      },
      {
        id: 'payroll',
        label: 'Payroll',
        icon: CreditCard,
        description: 'Disbursements'
      },
      {
        id: 'workspace',
        label: 'Operations',
        icon: LayoutGrid,
        description: 'Module Hub'
      }
    ],

    owner: [
      {
        id: 'owner_dashboard',
        label: 'Dashboard',
        icon: LayoutGrid,
        description: 'Executive Hub'
      },
      {
        id: 'approvals',
        label: 'Approvals',
        icon: ShieldAlert,
        description: 'HR Submissions',
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        badgeColor: 'bg-amber-500 text-white'
      },
      {
        id: 'employees',
        label: 'Employees',
        icon: Users,
        description: 'Staff Directory'
      },
      {
        id: 'payroll',
        label: 'Payroll',
        icon: CreditCard,
        description: 'Disbursements'
      }
    ],

    doctor: [
      {
        id: 'doctor_dashboard',
        label: 'Clinical Desk',
        icon: Stethoscope,
        description: 'Patient Overview'
      },
      {
        id: 'employee_dashboard',
        label: 'Personal Agenda',
        icon: Calendar,
        description: 'Schedule & Tasks'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    receptionist: [
      {
        id: 'reception_dashboard',
        label: 'Reception Desk',
        icon: UserPlus,
        description: 'Token Queue & Booking'
      },
      {
        id: 'employee_dashboard',
        label: 'My Schedule',
        icon: Calendar,
        description: 'Shifts & Agenda'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    billing_staff: [
      {
        id: 'billing_dashboard',
        label: 'Billing Desk',
        icon: Receipt,
        description: 'Invoices & Payments'
      },
      {
        id: 'accountant_dashboard',
        label: 'Daily Cash Ledger',
        icon: DollarSign,
        description: 'Collections Summary'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    nurse: [
      {
        id: 'nurse_dashboard',
        label: 'Nursing Station',
        icon: HeartPulse,
        description: 'Ward Vitals & Meds'
      },
      {
        id: 'employee_dashboard',
        label: 'Shift Agenda',
        icon: Calendar,
        description: 'Tasks & Roster'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    pharmacist: [
      {
        id: 'pharmacy_dashboard',
        label: 'Pharmacy Desk',
        icon: Pill,
        description: 'Dispense & Stock'
      },
      {
        id: 'store_dashboard',
        label: 'Inventory Orders',
        icon: Boxes,
        description: 'Procurement'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    lab_technician: [
      {
        id: 'lab_dashboard',
        label: 'Laboratory Desk',
        icon: Microscope,
        description: 'Analyzer & Verification'
      },
      {
        id: 'employee_dashboard',
        label: 'My Workstation',
        icon: Calendar,
        description: 'Tasks & Queue'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    radiologist: [
      {
        id: 'radiology_dashboard',
        label: 'Radiology Desk',
        icon: Scan,
        description: 'PACS DICOM & Scans'
      },
      {
        id: 'employee_dashboard',
        label: 'Reporting Agenda',
        icon: Calendar,
        description: 'Case Queue'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    ward_incharge: [
      {
        id: 'ward_dashboard',
        label: 'Ward Census',
        icon: Bed,
        description: 'Beds & Allocation'
      },
      {
        id: 'nurse_dashboard',
        label: 'Inpatient Vitals',
        icon: HeartPulse,
        description: 'Clinical Care'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    store_manager: [
      {
        id: 'store_dashboard',
        label: 'Central Store',
        icon: Boxes,
        description: 'Supplies & POs'
      },
      {
        id: 'accountant_dashboard',
        label: 'Vendor Ledger',
        icon: DollarSign,
        description: 'Invoices & AMC'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    accountant: [
      {
        id: 'accountant_dashboard',
        label: 'Accounts Desk',
        icon: DollarSign,
        description: 'Ledger & Audit'
      },
      {
        id: 'billing_dashboard',
        label: 'Billing Desk',
        icon: Receipt,
        description: 'Patient Invoices'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    ambulance_driver: [
      {
        id: 'support_dashboard',
        label: 'Ambulance Roster',
        icon: Wrench,
        description: 'Trips & Dispatch'
      },
      {
        id: 'employee_dashboard',
        label: 'My Schedule',
        icon: Calendar,
        description: 'Duty Shifts'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    housekeeping: [
      {
        id: 'support_dashboard',
        label: 'Sanitation Tasks',
        icon: Wrench,
        description: 'Bed & Ward Cleaning'
      },
      {
        id: 'employee_dashboard',
        label: 'My Schedule',
        icon: Calendar,
        description: 'Daily Checklist'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    security: [
      {
        id: 'support_dashboard',
        label: 'Security Desk',
        icon: Shield,
        description: 'Visitor Passes & Gate'
      },
      {
        id: 'employee_dashboard',
        label: 'My Schedule',
        icon: Calendar,
        description: 'Duty Roster'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ],

    maintenance: [
      {
        id: 'support_dashboard',
        label: 'Plant & Biomed',
        icon: Wrench,
        description: 'Equipment Tickets'
      },
      {
        id: 'employee_dashboard',
        label: 'My Schedule',
        icon: Calendar,
        description: 'Work Orders'
      },
      {
        id: 'my_roles',
        label: 'My Roles',
        icon: ShieldCheck,
        description: 'Role Governance'
      }
    ]
  };

  const navItems = roleNavItems[activeRole] || hrNavItems;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200/80 flex flex-col h-full shadow-2xl transition-transform duration-200 ease-in-out lg:static lg:h-screen lg:w-60 xl:w-64 lg:shadow-none flex-shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 sm:px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 font-bold text-sm flex-shrink-0">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                UPSTAGE
                <span className="text-emerald-700 font-extrabold text-[9px] bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/80">
                  ERP
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-400 truncate capitalize">
                {isHRManager ? 'HR & Staff Workspace' : `${activeRole.replace('_', ' ')} Workspace`}
              </div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation List */}
        <div className="flex-1 py-4 sm:py-6 px-3 space-y-1.5 sm:space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose?.();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-medium transition-all group relative min-h-[44px] ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 rounded-r-full" />
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-100/70 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs ${isActive ? 'font-bold text-emerald-950' : 'font-medium'}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Role Info (Compact & Clean) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <div className="truncate">
                <div className="text-[11px] font-semibold text-slate-700 capitalize truncate">
                  {currentUser?.name || activeRole.replace('_', ' ')}
                </div>
                <div className="text-[9px] text-slate-400 font-medium capitalize">
                  {activeRole.replace('_', ' ')}
                </div>
              </div>
            </div>
            <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
