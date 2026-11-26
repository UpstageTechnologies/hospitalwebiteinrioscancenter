import React, { useState, useRef, useEffect } from 'react';
import type { RoleId } from '../../types/roles';
import { ChevronDown, Check, X, Shield, Plus } from 'lucide-react';

export interface RoleOption {
  id: RoleId;
  label: string;
  group?: string;
}

interface MultiRoleSelectDropdownProps {
  availableRoles: RoleOption[];
  selectedRoles: RoleId[];
  onChange: (roles: RoleId[]) => void;
  primaryRole: RoleId;
  placeholder?: string;
  compact?: boolean;
}

export const MultiRoleSelectDropdown: React.FC<MultiRoleSelectDropdownProps> = ({
  availableRoles,
  selectedRoles,
  onChange,
  primaryRole,
  placeholder = '+ Add Additional Roles...',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter out the primary role to prevent duplicate selections
  const selectableRoles = availableRoles.filter(r => r.id !== primaryRole);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Clean selected roles if any role matches the primary role
  useEffect(() => {
    if (selectedRoles.includes(primaryRole)) {
      onChange(selectedRoles.filter(r => r !== primaryRole));
    }
  }, [primaryRole, selectedRoles, onChange]);

  const toggleRole = (roleId: RoleId) => {
    if (selectedRoles.includes(roleId)) {
      onChange(selectedRoles.filter(r => r !== roleId));
    } else {
      onChange([...selectedRoles, roleId]);
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectableRoles.map(r => r.id));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const filteredRoles = selectableRoles.filter(r =>
    r.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (r.group && r.group.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] min-h-[38px] px-2.5 bg-white border rounded-xl flex items-center justify-between gap-1.5 cursor-pointer transition-all shadow-2xs select-none ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-100'
            : selectedRoles.length > 0
            ? 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
        title="Select additional cross-departmental roles"
      >
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0 overflow-hidden">
          {selectedRoles.length === 0 ? (
            <span className="text-xs text-slate-400 font-medium truncate flex items-center gap-1">
              <Plus className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>{placeholder.replace(/^\+\s*/, '')}</span>
            </span>
          ) : (
            <>
              {selectedRoles.slice(0, 1).map(roleId => {
                const roleObj = availableRoles.find(r => r.id === roleId);
                const roleName = roleObj ? roleObj.label.split('/')[0].trim() : roleId;
                return (
                  <span
                    key={roleId}
                    className="inline-flex items-center gap-1 bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  >
                    <Shield className="w-2.5 h-2.5 text-emerald-700 flex-shrink-0" />
                    <span className="truncate max-w-[90px]">{roleName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRole(roleId);
                      }}
                      className="hover:text-rose-700 hover:bg-emerald-200/60 rounded-full p-0.2 cursor-pointer"
                      title={`Remove ${roleName}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}

              {selectedRoles.length > 1 && (
                <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200 flex-shrink-0">
                  +{selectedRoles.length - 1} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {selectedRoles.length > 0 && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-600 text-white">
              {selectedRoles.length}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Multi-Select Checkbox Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-68 sm:w-72 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2">
          {/* Menu Header with Action Buttons */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Additional Roles ({selectedRoles.length})</span>
            </span>

            <div className="flex items-center gap-2 text-[10px] font-bold">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles..."
              className="w-full text-xs py-1.5 px-2.5 bg-slate-50 rounded-lg border border-slate-200 outline-none placeholder-slate-400 focus:bg-white focus:border-emerald-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Checkbox Roles List (Scrollable) */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5 divide-y divide-slate-50">
            {filteredRoles.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No matching roles found
              </div>
            ) : (
              filteredRoles.map(role => {
                const isChecked = selectedRoles.includes(role.id);
                return (
                  <div
                    key={role.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRole(role.id);
                    }}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleRole(role.id);
                      }
                    }}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer text-xs font-medium transition-colors select-none ${
                      isChecked
                        ? 'bg-emerald-50 text-emerald-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'border-slate-300 bg-white hover:border-emerald-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{role.label}</span>
                    </div>

                    {role.group && (
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">
                        {role.group}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom helper tip */}
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Primary role is excluded</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-slate-700 hover:text-slate-900 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
