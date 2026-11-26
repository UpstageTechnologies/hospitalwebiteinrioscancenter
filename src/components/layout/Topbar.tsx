import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  User,
  Search,
  X,
  ArrowLeft,
  Check,
  Users,
  Shield,
  Stethoscope,
  Pill,
  Microscope,
  Building2,
  Receipt,
  Bed
} from 'lucide-react';

interface TopbarProps {
  onNavigateTab?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

// Generate initials from actual user's full name (e.g., "Dr. Rajeshwar Sharma" -> "RS")
const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'U';
  const clean = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Sister)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

// Format role identifier into human-readable label
const formatRoleLabel = (role?: string): string => {
  if (!role) return 'Staff';
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Hospital Admin';
  if (role === 'hr_manager') return 'HR Manager';
  if (role === 'doctor') return 'Doctor';
  if (role === 'nurse') return 'Nurse';
  if (role === 'receptionist') return 'Receptionist';
  if (role === 'pharmacist') return 'Pharmacist';
  if (role === 'lab_technician') return 'Lab Technician';
  if (role === 'radiologist') return 'Radiologist';
  if (role === 'billing_staff') return 'Billing Staff';
  if (role === 'ward_incharge') return 'Ward In-charge';
  if (role === 'store_manager') return 'Store Manager';
  if (role === 'accountant') return 'Accountant';
  if (role === 'ambulance_driver') return 'Ambulance Driver';
  if (role === 'housekeeping') return 'Housekeeping';
  if (role === 'security') return 'Security';
  if (role === 'maintenance') return 'Maintenance';
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Role badge color helper
const getRoleBadgeClasses = (role?: string): string => {
  switch (role) {
    case 'owner':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'admin':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'hr_manager':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'doctor':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    case 'nurse':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'receptionist':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'pharmacist':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'lab_technician':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const Topbar: React.FC<TopbarProps> = ({ onNavigateTab, onToggleMobileMenu }) => {
  const {
    currentHospital,
    currentUser,
    userProfile,
    firebaseUser,
    activeRole,
    loginAsEmployee,
    returnToOwner,
    isViewingAsStaff,
    logout,
    isAuthLoading
  } = useAuth();

  const { notifications, employees } = useHospital();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.isRead);

  // Dynamic user data resolution (never hardcoded)
  const userFullName = currentUser?.name || userProfile?.name || firebaseUser?.displayName || (firebaseUser?.email ? firebaseUser.email.split('@')[0] : 'Hospital Staff');
  const userRole = activeRole || currentUser?.primaryRole || userProfile?.role || 'staff';
  const roleFallback = formatRoleLabel(userRole);
  const userDesignation = currentUser?.designation && currentUser.designation.trim() !== ''
    ? currentUser.designation
    : (userProfile?.designation && userProfile.designation.trim() !== '' ? userProfile.designation : roleFallback);
  const userDepartment = currentUser?.departmentName || userProfile?.departmentName || '';
  const userEmployeeCode = currentUser?.employeeCode || userProfile?.loginId || userProfile?.employeeId || '';
  const userInitials = getInitials(userFullName);
  const userAvatarUrl = currentUser?.avatarUrl;

  // Determine if currently authenticated session belongs to Hospital Owner
  const isOwnerSession = userProfile?.role === 'owner' || isViewingAsStaff || currentUser?.primaryRole === 'owner';

  // Filter all registered employees by search query (name, code, designation, department, role)
  const filteredEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    if (!empSearchQuery.trim()) return employees;
    const q = empSearchQuery.toLowerCase().trim();
    return employees.filter(emp => {
      return (
        (emp.name && emp.name.toLowerCase().includes(q)) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q)) ||
        (emp.employeeLoginId && emp.employeeLoginId.toLowerCase().includes(q)) ||
        (emp.designation && emp.designation.toLowerCase().includes(q)) ||
        (emp.departmentName && emp.departmentName.toLowerCase().includes(q)) ||
        (emp.primaryRole && emp.primaryRole.toLowerCase().includes(q)) ||
        (emp.id && emp.id.toLowerCase().includes(q))
      );
    });
  }, [employees, empSearchQuery]);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs gap-3 sm:gap-4 w-full select-none">
      {/* =================================================================== */}
      {/* LEFT: Hospital Name, Code & City Location                         */}
      {/* =================================================================== */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Drawer Button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex-shrink-0"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        )}

        {/* Hospital Branding (Single Hospital Name & Location - no duplicate icon) */}
        <div className="flex flex-col select-none min-w-0">
          <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate max-w-[180px] xs:max-w-[240px] sm:max-w-[360px]">
            {currentHospital.name}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
            {currentHospital.code} • India
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* RIGHT: Notifications, Dynamic User Profile & Sign Out             */}
      {/* =================================================================== */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Notifications Icon with Actual Unread Count */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
            className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications ({unreadNotifs.length})</span>
                <span className="text-[10px] text-emerald-600 font-medium">Real-Time</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No new notifications</div>
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

        {/* Dynamic Authenticated User Profile */}
        <div className="relative" ref={profileRef}>
          {isAuthLoading ? (
            <div className="flex items-center gap-2 p-1.5">
              <div className="w-8 h-8 rounded-xl bg-slate-200 animate-pulse" />
              <div className="hidden sm:block space-y-1">
                <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
                <div className="w-16 h-2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
            >
              {/* Profile Avatar / Initials */}
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={userFullName}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                  {userInitials}
                </div>
              )}

              {/* Dynamic Name & Designation */}
              <div className="hidden sm:block text-left max-w-[150px] md:max-w-[200px] truncate">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {userFullName}
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate capitalize">
                  {userDesignation}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>
          )}

          {/* =============================================================== */}
          {/* PROFILE DROPDOWN MENU WITH COMPLETE HOSPITAL EMPLOYEE LIST     */}
          {/* =============================================================== */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-[380px] md:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
              {/* 1. Active Profile Summary */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 truncate">{userFullName}</div>
                    <div className="text-xs text-slate-600 font-medium truncate capitalize">{userDesignation}</div>
                    {userDepartment && (
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{userDepartment}</div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize flex-shrink-0 ${getRoleBadgeClasses(userRole)}`}>
                    {roleFallback}
                  </span>
                </div>

                {userEmployeeCode && (
                  <div className="mt-2.5 text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">Employee ID</span>
                    <span className="font-bold text-slate-700">{userEmployeeCode}</span>
                  </div>
                )}
              </div>

              {/* 2. RETURN TO OWNER DASHBOARD (If currently viewing as staff) */}
              {isViewingAsStaff && (
                <div className="p-3 bg-emerald-50/70">
                  <button
                    type="button"
                    onClick={() => {
                      returnToOwner();
                      setShowProfileMenu(false);
                      setEmpSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      <span>Return to Owner Dashboard</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/70 text-white px-2 py-0.5 rounded-full font-mono uppercase">
                      Owner Mode
                    </span>
                  </button>
                </div>
              )}

              {/* 3. COMPLETE HOSPITAL EMPLOYEE WORKSPACE SWITCHER (Owner Authorized) */}
              {isOwnerSession && (
                <div className="py-2.5">
                  {/* Section Title */}
                  <div className="flex items-center justify-between px-4 pb-2">
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                        Switch Employee Workspace
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {employees.length} Registered Hospital Staff • Click to view workspace
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Owner Access
                    </span>
                  </div>

                  {/* Search Bar by Name, ID, Designation, Role */}
                  <div className="px-3 pb-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={empSearchQuery}
                        onChange={(e) => setEmpSearchQuery(e.target.value)}
                        placeholder="Search by name, ID, designation, role..."
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-colors"
                      />
                      {empSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setEmpSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Employee List */}
                  <div className="max-h-64 sm:max-h-72 overflow-y-auto px-2 space-y-1 divide-y divide-slate-50">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No employees found matching &quot;{empSearchQuery}&quot;
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isCurrentActive = emp.id === currentUser?.id;
                        const empInitials = getInitials(emp.name);
                        const empRoleLabel = formatRoleLabel(emp.primaryRole);

                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              if (emp.primaryRole === 'owner') {
                                returnToOwner();
                              } else {
                                loginAsEmployee(emp.id);
                              }
                              setShowProfileMenu(false);
                              setEmpSearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all group ${
                              isCurrentActive
                                ? 'bg-emerald-50/80 border border-emerald-200/80 shadow-2xs'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Avatar / Initials */}
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                                  isCurrentActive
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                                }`}
                              >
                                {empInitials}
                              </div>

                              {/* Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {emp.name}
                                  </span>
                                  {isCurrentActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-600 truncate font-medium">
                                  {emp.designation || empRoleLabel}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                  <span>{emp.departmentName || 'Staff'}</span>
                                  <span>•</span>
                                  <span className="font-mono">{emp.employeeCode || emp.employeeLoginId || emp.id}</span>
                                </div>
                              </div>
                            </div>

                            {/* Role Badge & Check Indicator */}
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap capitalize ${getRoleBadgeClasses(
                                  emp.primaryRole
                                )}`}
                              >
                                {empRoleLabel}
                              </span>
                              {isCurrentActive && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* 4. Sign Out Button in Dropdown */}
              <div className="pt-2 px-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Sign Out Button */}
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
