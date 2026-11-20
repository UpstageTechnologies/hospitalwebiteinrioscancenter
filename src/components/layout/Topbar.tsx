import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { DEFAULT_HOSPITALS, storageService } from '../../services/storageService';
import type { RoleId } from '../../types/roles';
import {
  Bell,
  Search,
  Building2,
  ChevronDown,
  User,
  Shield,
  CheckCircle2,
  Clock,
  Briefcase,
  ShieldCheck,
  Users,
  AlertCircle,
  Stethoscope,
  Calendar,
  Sparkles,
  LogOut
} from 'lucide-react';

interface TopbarProps {
  onNavigateTab?: (tab: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onNavigateTab }) => {
  const { currentHospital, currentUser, activeRole, switchHospital, loginAsEmployee, switchActiveRole, availableRoles, logout } = useAuth();
  const { notifications, employees } = useHospital();

  const [showHospitalMenu, setShowHospitalMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showStaffSelector, setShowStaffSelector] = useState(false);
  const [staffFilter, setStaffFilter] = useState('');

  const unreadNotifs = notifications.filter(n => !n.isRead);

  const filteredStaff = employees.filter(e =>
    e.name.toLowerCase().includes(staffFilter.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(staffFilter.toLowerCase()) ||
    e.primaryRole.toLowerCase().includes(staffFilter.toLowerCase()) ||
    e.departmentName.toLowerCase().includes(staffFilter.toLowerCase())
  );

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
      {/* Left: Hospital Selector & Multi-Tenant Identity */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative">
          <button
            onClick={() => setShowHospitalMenu(!showHospitalMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              UP
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 line-clamp-1">{currentHospital.name}</div>
              <div className="text-[10px] text-slate-500 font-medium">{currentHospital.code} • {currentHospital.city}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showHospitalMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Multi-Tenant Organization
              </div>
              {DEFAULT_HOSPITALS.map((hosp) => (
                <button
                  key={hosp.id}
                  onClick={() => {
                    switchHospital(hosp.id);
                    setShowHospitalMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    hosp.id === currentHospital.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div>{hosp.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{hosp.city} • {hosp.phone}</div>
                  </div>
                  {hosp.id === currentHospital.id && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Firebase Cloud Connected Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 select-none shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Firebase Cloud Connected (hospital-bf28e)</span>
        </div>

        {/* Multi-Role Switcher (if current employee has additional authorized roles) */}
        {availableRoles.length > 1 && (
          <div className="flex items-center gap-1.5 bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-200/80 text-xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase hidden sm:inline">Role:</span>
            {availableRoles.map(role => (
              <button
                key={role}
                onClick={() => switchActiveRole(role)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all capitalize ${
                  activeRole === role
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Quick link to My Roles */}
        {onNavigateTab && activeRole !== 'hr_manager' && (
          <button
            onClick={() => onNavigateTab('my_roles')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors"
            title="Manage My Roles"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>My Roles</span>
          </button>
        )}
      </div>

      {/* Right Controls: Staff Quick Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Staff Directory / All Roles Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStaffSelector(!showStaffSelector)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Switch Staff</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showStaffSelector && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 mb-2">Hospital Staff & Roles Directory</div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search staff, role or department..."
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {filteredStaff.map((emp) => {
                  const isCurrent = currentUser?.id === emp.id;
                  const isPending = emp.status === 'pending_approval';

                  return (
                    <button
                      key={emp.id}
                      onClick={() => {
                        loginAsEmployee(emp.id);
                        setShowStaffSelector(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-emerald-50/70 font-semibold text-emerald-950' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {emp.name.replace('Dr. ', '').charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold truncate text-slate-900">{emp.name}</div>
                          <div className="text-[10px] text-slate-500 capitalize truncate">
                            {emp.employeeCode} • {emp.designation}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {isPending ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            Pending Approval
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                            {emp.primaryRole.replace('_', ' ')}
                          </span>
                        )}
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dev Mode Reset Local Data */}
              <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] px-3">
                <span className="text-slate-400 font-medium">Phase 1 Development Mode</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset local hospital development data back to initial sample state?')) {
                      storageService.resetHospitalData(currentHospital.id);
                      window.location.reload();
                    }
                  }}
                  className="text-rose-600 hover:text-rose-700 font-bold hover:underline"
                >
                  Reset Sample Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications ({unreadNotifs.length})</span>
                <span className="text-[10px] text-emerald-600 font-medium">Auto-synced</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">Recent</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Profile Pill */}
        <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl border border-transparent">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            {currentUser?.name.replace('Dr. ', '').charAt(0) || 'U'}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser?.name}</div>
            <div className="text-[10px] text-slate-500 font-medium capitalize flex items-center gap-1">
              <span>{activeRole.replace('_', ' ')}</span>
              {currentUser?.status === 'pending_approval' && (
                <span className="text-amber-600 font-bold">(Locked)</span>
              )}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors"
          title="Sign out of Upstage Hospital ERP"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
