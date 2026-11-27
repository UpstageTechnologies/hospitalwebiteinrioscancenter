import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import type { HospitalNotification } from '../../types/audit';
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
  CheckCheck,
  Users,
  Shield,
  ShieldCheck,
  Stethoscope,
  Pill,
  Microscope,
  Building2,
  Receipt,
  Bed,
  Calendar,
  Truck,
  CreditCard,
  DollarSign,
  ArrowRight,
  Clock,
  Sparkles,
  Inbox
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

// Format ISO timestamp into human-readable relative time
const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs < 0 || isNaN(diffMs)) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
};

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'approval':
    case 'role_request':
      return {
        label: 'Approval',
        icon: ShieldCheck,
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200'
      };
    case 'clinical':
      return {
        label: 'Clinical',
        icon: Stethoscope,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200'
      };
    case 'appointment':
      return {
        label: 'Appointment',
        icon: Calendar,
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
      };
    case 'delivery':
      return {
        label: 'Delivery',
        icon: Truck,
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200'
      };
    case 'pharmacy':
      return {
        label: 'Pharmacy',
        icon: Pill,
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200'
      };
    case 'billing':
      return {
        label: 'Billing',
        icon: CreditCard,
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200'
      };
    case 'finance':
      return {
        label: 'Finance',
        icon: DollarSign,
        bg: 'bg-violet-50',
        text: 'text-violet-700',
        border: 'border-violet-200'
      };
    case 'lab':
      return {
        label: 'Laboratory',
        icon: Microscope,
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200'
      };
    default:
      return {
        label: 'System',
        icon: Bell,
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200'
      };
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

  const {
    notifications,
    employees,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useHospital();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [showAllNotifsModal, setShowAllNotifsModal] = useState(false);
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('all');
  const [modalSearchQuery, setModalSearchQuery] = useState('');

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

  // Role-based notification filtering: Each employee role receives only relevant notifications
  const roleFilteredNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    const currentUserId = currentUser?.id;
    const currentEmpCode = currentUser?.employeeCode;

    return notifications.filter((n) => {
      // 1. Hospital Tenant Isolation
      if (n.hospitalId && currentHospital.id && n.hospitalId !== currentHospital.id) {
        return false;
      }

      // 2. Direct user/employee targeting takes immediate precedence
      if (n.targetUserId && currentUserId && n.targetUserId === currentUserId) return true;
      if (n.targetEmployeeId && (n.targetEmployeeId === currentUserId || (currentEmpCode && n.targetEmployeeId === currentEmpCode))) return true;

      // 3. Admin & Hospital Owner have executive hospital oversight across all departments
      if (activeRole === 'owner' || activeRole === 'admin') {
        return true;
      }

      // 4. Role-specific matching
      if (n.targetRole === 'all') return true;
      if (n.targetRole === activeRole) return true;
      if (n.targetRoles && (n.targetRoles.includes('all') || n.targetRoles.includes(activeRole as any))) return true;

      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, activeRole, currentUser, currentHospital.id]);

  const isNotificationRead = (n: HospitalNotification) => {
    if (n.isRead) return true;
    if (currentUser?.id && n.readBy && n.readBy.includes(currentUser.id)) return true;
    return false;
  };

  const unreadNotifs = useMemo(() => {
    return roleFilteredNotifications.filter(n => !isNotificationRead(n));
  }, [roleFilteredNotifications, currentUser?.id]);

  const handleNotificationClick = async (notif: HospitalNotification) => {
    await markNotificationAsRead(notif.id);
    setShowNotifMenu(false);
    setShowAllNotifsModal(false);

    let destination = notif.targetTab;
    if (!destination) {
      switch (notif.category) {
        case 'approval':
        case 'role_request':
          destination = (activeRole === 'owner' || activeRole === 'admin' || activeRole === 'hr_manager') ? 'approvals' : 'my_roles';
          break;
        case 'appointment':
          destination = activeRole === 'doctor' ? 'doctor_dashboard' : 'reception_dashboard';
          break;
        case 'clinical':
          destination = activeRole === 'nurse' ? 'nurse_dashboard' : activeRole === 'doctor' ? 'doctor_dashboard' : 'patients';
          break;
        case 'delivery':
          destination = activeRole === 'delivery_person' ? 'delivery_dashboard' : 'delivery_tracking';
          break;
        case 'pharmacy':
          destination = 'pharmacy';
          break;
        case 'billing':
          destination = 'billing';
          break;
        case 'finance':
          destination = (activeRole === 'accountant') ? 'accountant_dashboard' : 'payroll';
          break;
        case 'lab':
          destination = activeRole === 'lab_technician' ? 'lab' : 'doctor_dashboard';
          break;
        default:
          destination = activeRole === 'owner' ? 'owner_dashboard' : 'workspace';
          break;
      }
    }

    if (onNavigateTab && destination) {
      onNavigateTab(destination);
    }
  };

  const isMatchCategory = (cat: string, filterTab: string) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'approval') return cat === 'approval' || cat === 'role_request';
    if (filterTab === 'clinical') return cat === 'clinical' || cat === 'patient' || cat === 'appointment';
    if (filterTab === 'billing') return cat === 'billing' || cat === 'finance';
    if (filterTab === 'pharmacy') return cat === 'pharmacy';
    if (filterTab === 'delivery') return cat === 'delivery';
    if (filterTab === 'lab') return cat === 'lab';
    return cat === filterTab;
  };

  const getCategoryCount = (tabId: string) => {
    if (tabId === 'all') return roleFilteredNotifications.length;
    if (tabId === 'unread') return unreadNotifs.length;
    return roleFilteredNotifications.filter(n => isMatchCategory(n.category, tabId)).length;
  };

  // Filtered list for the "View All Notifications" modal
  const filteredModalNotifs = useMemo(() => {
    return roleFilteredNotifications.filter((n) => {
      // Category / unread filter
      if (modalCategoryFilter === 'unread' && isNotificationRead(n)) return false;
      if (modalCategoryFilter !== 'all' && modalCategoryFilter !== 'unread') {
        if (!isMatchCategory(n.category, modalCategoryFilter)) return false;
      }

      // Search query filter (safe against undefined/null)
      if (modalSearchQuery.trim()) {
        const q = modalSearchQuery.toLowerCase().trim();
        const titleStr = (n.title || '').toLowerCase();
        const msgStr = (n.message || '').toLowerCase();
        const catStr = (n.category || '').toLowerCase();
        if (!titleStr.includes(q) && !msgStr.includes(q) && !catStr.includes(q)) return false;
      }

      return true;
    });
  }, [roleFilteredNotifications, modalCategoryFilter, modalSearchQuery, currentUser?.id]);

  // Dynamic user data resolution (never hardcoded)
  const userFullName = currentUser?.name || userProfile?.name || firebaseUser?.displayName || (firebaseUser?.email ? firebaseUser.email.split('@')[0] : 'Dr. Rajeshwar Sharma');
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
    <>
      <header className="min-h-16 py-2 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs gap-3 sm:gap-4 w-full select-none">
      {/* =================================================================== */}
      {/* LEFT: Greeting Header & Hospital Cloud Subtitle                   */}
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

        {/* Greeting Section (Moved from OwnerDashboard) */}
        <div className="flex flex-col select-none min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
            Good Morning, {userFullName}!
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
            Hospital: <span className="font-semibold text-slate-800">{currentHospital.name}</span> <span className="text-slate-400 mx-1">•</span> <span className="text-slate-500">Multi-Tenant Isolated Healthcare Cloud</span>
          </p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* RIGHT: Notifications, Dynamic User Profile & Sign Out             */}
      {/* =================================================================== */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Notifications Icon with Actual Unread Count & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center relative transition-all cursor-pointer ${
              showNotifMenu
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
            }`}
            title="Notifications"
            aria-label={`Notifications (${unreadNotifs.length} unread)`}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadNotifs.length > 99 ? '99+' : unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[85vh]">
              {/* Dropdown Header */}
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadNotifs.length > 0 && (
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                      {unreadNotifs.length} unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotifs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsAsRead(activeRole)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Items List */}
              <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-80 scrollbar-thin">
                {roleFilteredNotifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mb-2">
                      <Inbox className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="text-xs font-semibold text-slate-600">All caught up!</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">No notifications for your current role.</div>
                  </div>
                ) : (
                  roleFilteredNotifications.slice(0, 8).map((n) => {
                    const read = isNotificationRead(n);
                    const visual = getCategoryBadge(n.category);
                    const Icon = visual.icon;

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                          !read
                            ? 'bg-emerald-50/25 hover:bg-emerald-50/50'
                            : 'hover:bg-slate-50 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* Unread Accent Bar on Left */}
                        {!read && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full" />
                        )}

                        {/* Category Icon */}
                        <div className={`w-8 h-8 rounded-xl ${visual.bg} ${visual.text} border ${visual.border} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs truncate ${!read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium whitespace-nowrap">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between mt-1.5 pt-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${visual.bg} ${visual.text} ${visual.border}`}>
                              {visual.label}
                            </span>

                            {!read && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markNotificationAsRead(n.id);
                                }}
                                className="text-[10px] text-slate-400 hover:text-emerald-700 flex items-center gap-1 font-semibold p-0.5 transition-colors cursor-pointer"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark read</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer: View All Notifications */}
              {roleFilteredNotifications.length > 0 && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/70 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifMenu(false);
                      setShowAllNotifsModal(true);
                    }}
                    className="w-full text-center py-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>View All Notifications ({roleFilteredNotifications.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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

    {/* Full "View All Notifications" Modal */}
    {showAllNotifsModal && (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Notifications Center</span>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {roleFilteredNotifications.length} Total
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Live notifications for {roleFallback} • {currentHospital.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadNotifs.length > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsAsRead(activeRole)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAllNotifsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs and Search Bar */}
          <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All', count: getCategoryCount('all') },
                { id: 'unread', label: 'Unread', count: getCategoryCount('unread') },
                { id: 'clinical', label: 'Clinical', count: getCategoryCount('clinical') },
                { id: 'approval', label: 'Approvals', count: getCategoryCount('approval') },
                { id: 'delivery', label: 'Deliveries', count: getCategoryCount('delivery') },
                { id: 'billing', label: 'Billing', count: getCategoryCount('billing') },
                { id: 'pharmacy', label: 'Pharmacy', count: getCategoryCount('pharmacy') },
                { id: 'lab', label: 'Lab', count: getCategoryCount('lab') }
              ].map(tab => {
                const isActive = modalCategoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalCategoryFilter(tab.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Field */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Modal Notifications List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-2 max-h-[60vh] scrollbar-thin">
            {filteredModalNotifs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-slate-300" />
                </div>
                <div className="text-sm font-semibold text-slate-700">No notifications found</div>
                <div className="text-xs text-slate-400 mt-1">There are no notifications matching your current filters.</div>
              </div>
            ) : (
              filteredModalNotifs.map((n) => {
                const read = isNotificationRead(n);
                const visual = getCategoryBadge(n.category);
                const Icon = visual.icon;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 my-1 ${
                      !read
                        ? 'bg-emerald-50/30 hover:bg-emerald-50/60 border border-emerald-200/80'
                        : 'hover:bg-slate-50 border border-transparent opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${visual.bg} ${visual.text} border ${visual.border} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${!read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {n.title}
                          </span>
                          {!read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${visual.bg} ${visual.text} ${visual.border}`}>
                          {visual.label}
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            <span>Open Module</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                          {!read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(n.id);
                              }}
                              className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark read</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
};
