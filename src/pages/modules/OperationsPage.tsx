import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { AppointmentsPage } from './AppointmentsPage';
import { AdmissionsPage } from './AdmissionsPage';
import { WardDashboard } from '../dashboards/WardDashboard';
import { SupportDashboards } from '../dashboards/SupportDashboards';
import { HRDashboard } from '../dashboards/HRDashboard';
import {
  Calendar,
  Bed,
  Layers,
  Wrench,
  Clock,
  Activity,
  UserCheck
} from 'lucide-react';

interface OperationsPageProps {
  initialSubTab?: string;
}

export const OperationsPage: React.FC<OperationsPageProps> = ({ initialSubTab = 'appointments' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const { activeRole, availableRoles } = useAuth();
  const { appointments, admissions, beds } = useHospital();

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const isOwnerOrAdmin = activeRole === 'owner' || activeRole === 'admin';

  // Sub-tab definitions with permissions
  const tabs = [
    {
      id: 'appointments',
      label: 'Appointments & OPD',
      icon: Calendar,
      badge: appointments.filter(a => a.status === 'scheduled').length,
      roles: ['receptionist', 'doctor', 'nurse']
    },
    {
      id: 'admissions',
      label: 'Inpatient Admissions',
      icon: Bed,
      badge: admissions.filter(a => a.status === 'active').length,
      roles: ['receptionist', 'nurse', 'ward_incharge', 'doctor']
    },
    {
      id: 'wards',
      label: 'Ward & Bed Map',
      icon: Layers,
      badge: `${beds.filter(b => b.status === 'available').length} free`,
      roles: ['nurse', 'ward_incharge', 'doctor']
    },
    {
      id: 'support',
      label: 'Support Services',
      icon: Wrench,
      roles: ['ambulance_driver', 'housekeeping', 'security', 'maintenance']
    },
    {
      id: 'roster',
      label: 'Staff Attendance & Roster',
      icon: Clock,
      roles: ['hr_manager']
    }
  ];

  // Filter tabs by authorized roles
  const visibleTabs = tabs.filter(t => {
    if (isOwnerOrAdmin) return true;
    if (!t.roles) return true;
    return t.roles.includes(activeRole) || availableRoles.some(r => t.roles?.includes(r));
  });

  return (
    <div className="space-y-6">
      {/* Top Operations Header with Pill Navigation (matching Screenshot 3 style) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Hospital Operations Hub</h2>
              <p className="text-xs text-slate-500">
                Appointments • Inpatient Admissions • Live Bed Grid • Facility Support
              </p>
            </div>
          </div>

          {/* Sub-Navigation Pills (Matching Screenshot 3 design language) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Render Active Operation Sub-View */}
      <div>
        {activeTab === 'appointments' && <AppointmentsPage />}
        {activeTab === 'admissions' && <AdmissionsPage />}
        {activeTab === 'wards' && <WardDashboard />}
        {activeTab === 'support' && <SupportDashboards />}
        {activeTab === 'roster' && <HRDashboard />}
      </div>
    </div>
  );
};
