import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { auth, db, getFirebaseAuth, getFirebaseDb } from '../services/firebase';
import { authService, STANDARD_STAFF_ACCOUNTS } from '../services/authService';
import { firestoreService } from '../services/firestoreService';
import type { RoleId, PermissionCode } from '../types/roles';
import type { Employee } from '../types/employee';
import type { Hospital } from '../types/hospital';
import type { UserProfileDoc, HospitalDocument } from '../types/auth';
import { INITIAL_ROLE_TEMPLATES } from '../constants/roleTemplates';
import { DEFAULT_HOSPITALS, DEFAULT_EMPLOYEES } from '../services/storageService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfileDoc | null;
  currentUser: Employee | null;
  currentHospital: Hospital;
  activeRole: RoleId;
  availableRoles: RoleId[];
  permissions: PermissionCode[];
  isAuthLoading: boolean;
  hasPermission: (permission: PermissionCode) => boolean;
  switchActiveRole: (role: RoleId) => void;
  switchHospital: (hospitalId: string) => void;
  loginAsEmployee: (employeeId: string) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerHospitalOwner: (params: {
    hospitalName: string;
    ownerName: string;
    email: string;
    pass: string;
    phone: string;
    city: string;
  }) => Promise<void>;
  signInQuickStaff: (roleKey: string) => Promise<void>;
  refreshUser: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDoc | null>(null);
  const [currentHospital, setCurrentHospital] = useState<Hospital>(DEFAULT_HOSPITALS[0]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeRole, setActiveRole] = useState<RoleId>('owner');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Synchronize authenticated Firebase user with Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (fbUser) => {
      setIsAuthLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          // 1. Get profile from users/{uid}
          const profile = await authService.getOrCreateUserProfile(fbUser);
          setUserProfile(profile);

          // 2. Fetch hospital document
          const hospId = profile.hospitalId || 'hosp-001';
          const hospDetails = await authService.getHospital(hospId);
          setCurrentHospital(hospDetails);

          // Ensure hospital collections are initialized in Firestore
          await firestoreService.initializeHospitalInFirestore(hospId, hospDetails.name, fbUser.uid);

          // 3. Fetch employee document from hospitals/{hospitalId}/employees/{employeeId}
          let empData: Employee | null = null;
          if (profile.employeeId) {
            const empRef = doc(getFirebaseDb(), 'hospitals', hospId, 'employees', profile.employeeId);
            const empSnap = await getDoc(empRef);
            if (empSnap.exists()) {
              empData = empSnap.data() as Employee;
            }
          }

          if (!empData) {
            // Check by email in hospital employees
            const allEmpsSnap = await getDocs(collection(getFirebaseDb(), 'hospitals', hospId, 'employees'));
            const matchingDoc = allEmpsSnap.docs.find(d => {
              const dData = d.data();
              return dData.email?.toLowerCase() === (fbUser.email || '').toLowerCase() || dData.primaryRole === profile.role;
            });
            if (matchingDoc) {
              empData = matchingDoc.data() as Employee;
            }
          }

          if (!empData) {
            if (hospId === 'hosp-001') {
              empData = DEFAULT_EMPLOYEES.find(e => e.primaryRole === profile.role) || DEFAULT_EMPLOYEES[0];
            } else {
              // Real owner employee for original user
              const ownerEmpId = profile.employeeId || `emp-${fbUser.uid.slice(0, 8)}`;
              const ownerEmp: Employee = {
                id: ownerEmpId,
                hospitalId: hospId,
                employeeCode: 'EMP-001',
                name: profile.name || fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Hospital Owner'),
                email: fbUser.email || '',
                phone: '',
                departmentId: 'dept-admin',
                departmentName: 'Hospital Administration',
                designation: profile.role === 'owner' ? 'Hospital Owner / CEO' : 'Staff Member',
                primaryRole: profile.role || 'owner',
                additionalRoles: [],
                status: 'active',
                joiningDate: new Date().toISOString().split('T')[0],
                gender: 'Male',
                employmentType: 'Full-time'
              };
              await setDoc(doc(getFirebaseDb(), 'hospitals', hospId, 'employees', ownerEmpId), ownerEmp, { merge: true });
              empData = ownerEmp;
            }
          }

          setCurrentUser(empData);
          setActiveRole(profile.role || empData.primaryRole || 'owner');
        } catch (err) {
          console.warn('Error loading user profile from Firestore:', err);
          if (profile?.hospitalId === 'hosp-001') {
            setCurrentUser(DEFAULT_EMPLOYEES[0]);
            setActiveRole('owner');
          }
        }
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute all available approved roles for current employee
  const availableRoles: RoleId[] = currentUser
    ? [currentUser.primaryRole, ...(currentUser.additionalRoles || [])]
    : userProfile
    ? [userProfile.role]
    : ['owner'];

  // Role permissions
  const roleTemplate = INITIAL_ROLE_TEMPLATES[activeRole];
  const permissions: PermissionCode[] = (roleTemplate?.defaultPermissions || []) as PermissionCode[];

  const hasPermission = (permission: PermissionCode): boolean => {
    if (activeRole === 'owner') return true;
    return permissions.includes(permission);
  };

  const switchActiveRole = (role: RoleId) => {
    if (availableRoles.includes(role) || activeRole === 'owner' || activeRole === 'admin') {
      setActiveRole(role);
    }
  };

  const switchHospital = async (hospitalId: string) => {
    const hosp = await authService.getHospital(hospitalId);
    setCurrentHospital(hosp);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
      await authService.signIn(email, pass);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const registerHospitalOwner = async (params: {
    hospitalName: string;
    ownerName: string;
    email: string;
    pass: string;
    phone: string;
    city: string;
  }) => {
    setIsAuthLoading(true);
    try {
      await authService.registerHospitalOwner(params);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signInQuickStaff = async (roleKey: string) => {
    setIsAuthLoading(true);
    try {
      await authService.signInQuickStaff(roleKey);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginAsEmployee = async (employeeId: string) => {
    const staffMatch = Object.entries(STANDARD_STAFF_ACCOUNTS).find(([_, s]) => s.empId === employeeId);
    if (staffMatch) {
      await signInQuickStaff(staffMatch[0]);
    } else {
      // Local session switch if employee not mapped to standard staff email
      const emp = DEFAULT_EMPLOYEES.find(e => e.id === employeeId);
      if (emp) {
        setCurrentUser(emp);
        setActiveRole(emp.primaryRole);
      }
    }
  };

  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const empRef = doc(getFirebaseDb(), 'hospitals', currentHospital.id, 'employees', currentUser.id);
      const snap = await getDoc(empRef);
      if (snap.exists()) {
        const updated = snap.data() as Employee;
        setCurrentUser(updated);
        const currentApproved = [updated.primaryRole, ...(updated.additionalRoles || [])];
        if (!currentApproved.includes(activeRole) && updated.primaryRole !== 'owner' && updated.primaryRole !== 'admin') {
          setActiveRole(updated.primaryRole);
        }
      }
    } catch (e) {
      console.warn('Could not refresh employee from Firestore:', e);
    }
  };

  const logout = async () => {
    setIsAuthLoading(true);
    try {
      await authService.signOut();
      setCurrentUser(null);
      setUserProfile(null);
      setFirebaseUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        currentUser,
        currentHospital,
        activeRole,
        availableRoles,
        permissions,
        isAuthLoading,
        hasPermission,
        switchActiveRole,
        switchHospital,
        loginAsEmployee,
        loginWithEmail,
        registerHospitalOwner,
        signInQuickStaff,
        refreshUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
