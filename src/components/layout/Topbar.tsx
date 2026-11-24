import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import type { RoleId } from '../../types/roles';
import {
  Bell,
  ChevronDown,
  User,
  ShieldCheck,
  LogOut,
  Menu
} from 'lucide-react';

interface TopbarProps {
  onNavigateTab?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onNavigateTab, onToggleMobileMenu }) => {
  const { currentHospital, currentUser, activeRole, switchActiveRole, availableRoles, logout } = useAuth();
  const { notifications } = useHospital();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs gap-2 sm:gap-4 w-full">
      {/* Left: Mobile Drawer Trigger & Hospital Badge */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Mobile Hamburger Drawer Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex-shrink-0"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 select-none">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
            UP
          </div>
          <div className="hidden xs:block sm:block max-w-[120px] sm:max-w-[200px] truncate">
            <div className="text-xs font-semibold text-slate-800 truncate">{currentHospital.name}</div>
            <div className="text-[10px] text-slate-500 font-medium truncate">{currentHospital.code} • {currentHospital.city}</div>
          </div>
        </div>

        {/* Firebase Cloud Connected Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 select-none shadow-xs flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden xl:inline">Firebase Cloud Connected (hospital-bf28e)</span>
          <span className="inline xl:hidden">Cloud Connected</span>
        </div>

        {/* Mobile Firebase dot badge */}
        <div className="flex md:hidden items-center p-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold flex-shrink-0" title="Firebase Cloud Connected (hospital-bf28e)">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Multi-Role Switcher (if current employee has additional authorized roles) */}
        {availableRoles.length > 1 && (
          <div className="flex items-center gap-1 bg-emerald-50/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border border-emerald-200/80 text-xs overflow-x-auto max-w-[140px] sm:max-w-none scrollbar-none flex-shrink-0">
            <span className="text-[10px] font-bold text-emerald-800 uppercase hidden lg:inline">Role:</span>
            {availableRoles.map(role => (
              <button
                key={role}
                onClick={() => switchActiveRole(role)}
                className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all capitalize whitespace-nowrap ${
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
            className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors flex-shrink-0"
            title="Manage My Roles"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>My Roles</span>
          </button>
        )}
      </div>

      {/* Right Controls: Notifications, User Profile, Sign Out */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
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
        <div className="flex items-center gap-1.5 sm:gap-2 px-1 py-1 rounded-xl border border-transparent">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {currentUser?.name.replace('Dr. ', '').charAt(0) || 'U'}
          </div>
          <div className="text-left hidden md:block max-w-[130px] truncate">
            <div className="text-xs font-bold text-slate-800 leading-tight truncate">{currentUser?.name}</div>
            <div className="text-[10px] text-slate-500 font-medium capitalize flex items-center gap-1 truncate">
              <span>{activeRole.replace('_', ' ')}</span>
              {currentUser?.status === 'pending_approval' && (
                <span className="text-amber-600 font-bold">(Locked)</span>
              )}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors"
          title="Sign out of Upstage Hospital ERP"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
