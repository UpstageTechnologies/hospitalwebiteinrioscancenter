import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';

// Phase 1 Exclusive HR & Administrative Modules
import { EmployeeManagementPage } from './pages/modules/EmployeeManagementPage';
import { AdminApprovalsPage } from './pages/modules/AdminApprovalsPage';
import { AttendancePage } from './pages/modules/AttendancePage';
import { PayrollPage } from './pages/modules/PayrollPage';

// Role-Based Working Dashboards
import { DoctorDashboard } from './pages/dashboards/DoctorDashboard';
import { ReceptionistDashboard } from './pages/dashboards/ReceptionistDashboard';
import { BillingDashboard } from './pages/dashboards/BillingDashboard';
import { NurseDashboard } from './pages/dashboards/NurseDashboard';
import { PharmacyDashboard } from './pages/dashboards/PharmacyDashboard';
import { LabDashboard } from './pages/dashboards/LabDashboard';
import { RadiologyDashboard } from './pages/dashboards/RadiologyDashboard';
import { WardDashboard } from './pages/dashboards/WardDashboard';
import { StoreDashboard } from './pages/dashboards/StoreDashboard';
import { AccountantDashboard } from './pages/dashboards/AccountantDashboard';
import { SupportDashboards } from './pages/dashboards/SupportDashboards';
import { OwnerDashboard } from './pages/dashboards/OwnerDashboard';
import { EmployeeDashboard } from './pages/dashboards/EmployeeDashboard';
import { MyRolesPage } from './pages/modules/MyRolesPage';
import { LoginPage } from './pages/auth/LoginPage';

import { ShieldAlert, ShieldCheck, HeartPulse } from 'lucide-react';

const HospitalAppContent: React.FC = () => {
  const { activeRole, currentUser, logout, isAuthLoading } = useAuth();

  const getDefaultTabForRole = (role: string): string => {
    switch (role) {
      case 'hr_manager':
        return 'employees';
      case 'admin':
        return 'approvals';
      case 'owner':
        return 'owner_dashboard';
      case 'doctor':
        return 'doctor_dashboard';
      case 'receptionist':
        return 'reception_dashboard';
      case 'billing_staff':
        return 'billing_dashboard';
      case 'nurse':
        return 'nurse_dashboard';
      case 'pharmacist':
        return 'pharmacy_dashboard';
      case 'lab_technician':
        return 'lab_dashboard';
      case 'radiologist':
        return 'radiology_dashboard';
      case 'ward_incharge':
        return 'ward_dashboard';
      case 'store_manager':
        return 'store_dashboard';
      case 'accountant':
        return 'accountant_dashboard';
      case 'ambulance_driver':
      case 'housekeeping':
      case 'security':
      case 'maintenance':
        return 'support_dashboard';
      default:
        return 'employee_dashboard';
    }
  };

  const [currentTab, setCurrentTab] = useState<string>(() => getDefaultTabForRole(activeRole));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Keep tab updated when user switches role, and close mobile drawer
  useEffect(() => {
    setCurrentTab(getDefaultTabForRole(activeRole));
    setIsMobileMenuOpen(false);
  }, [activeRole]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentTab]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse shadow-xl">
          <HeartPulse className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white tracking-wide">Upstage Hospital ERP</h2>
          <p className="text-xs text-slate-400">Connecting to Firebase Cloud Database (hospital-bf28e)...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderActiveModule = () => {
    // If current employee is pending approval, gate functional access
    if (currentUser?.status === 'pending_approval') {
      return (
        <div className="max-w-xl mx-auto py-16 px-6 text-center space-y-6 bg-white rounded-3xl border border-amber-200/80 shadow-lg">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-300">
              Access Restricted
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
              Employee Registration Pending Admin Approval
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Welcome, <span className="font-bold text-slate-800">{currentUser.name}</span> ({currentUser.employeeCode}). Your employee registration submitted by HR is currently awaiting review and authorization by Hospital Administration. Application modules remain locked until an Administrator approves your profile.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-center">
            <button
              onClick={() => logout()}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              Sign Out & Return Later
            </button>
          </div>
        </div>
      );
    }

    switch (currentTab) {
      // HR Core Modules
      case 'employees':
        return <EmployeeManagementPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'payroll':
        return <PayrollPage />;
      case 'approvals':
        return <AdminApprovalsPage />;
      case 'my_roles':
      case 'roles':
      case 'role_requests':
        return <MyRolesPage />;

      // Role-Specific Working Dashboards
      case 'doctor_dashboard':
        return <DoctorDashboard />;
      case 'reception_dashboard':
      case 'patients':
        return <ReceptionistDashboard />;
      case 'billing_dashboard':
      case 'billing':
        return <BillingDashboard />;
      case 'nurse_dashboard':
        return <NurseDashboard />;
      case 'pharmacy_dashboard':
      case 'pharmacy':
        return <PharmacyDashboard />;
      case 'lab_dashboard':
      case 'lab':
        return <LabDashboard />;
      case 'radiology_dashboard':
      case 'radiology':
        return <RadiologyDashboard />;
      case 'ward_dashboard':
      case 'wards':
        return <WardDashboard />;
      case 'store_dashboard':
      case 'store':
        return <StoreDashboard />;
      case 'accountant_dashboard':
      case 'accounts':
        return <AccountantDashboard />;
      case 'support_dashboard':
        return <SupportDashboards />;
      case 'owner_dashboard':
        return <OwnerDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'employee_dashboard':
        return <EmployeeDashboard />;
      case 'workspace':
        return <OwnerDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;

      default:
        return <EmployeeManagementPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden">
      {/* Role-Specific Minimal Slim Sidebar with Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Topbar with Direct Role Switcher & Multi-Tenant Hospital Picker */}
        <Topbar
          onNavigateTab={setCurrentTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 lg:p-8">
          <div className="max-w-7xl 2xl:max-w-[1800px] w-full mx-auto min-w-0">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HospitalProvider>
          <HospitalAppContent />
        </HospitalProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
