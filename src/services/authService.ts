import { initializeApp, deleteApp } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  getAuth
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, getFirebaseAuth, getFirebaseDb, firebaseConfig } from './firebase';
import { firestoreService } from './firestoreService';
import type { UserProfileDoc, HospitalDocument } from '../types/auth';
import type { RoleId } from '../types/roles';
import type { Employee } from '../types/employee';
import type { Hospital } from '../types/hospital';
import { DEFAULT_DEPARTMENTS } from './storageService';
import {
  getSyntheticEmailForLoginId,
  normalizeLoginId
} from '../utils/employeeIdGenerator';

export const STANDARD_STAFF_ACCOUNTS: Record<string, { email: string; name: string; role: RoleId; empId: string; dept: string; designation: string }> = {
  owner: {
    email: 'owner@upstagehospital.org',
    name: 'Dr. Rajeshwar Sharma',
    role: 'owner',
    empId: 'emp-owner-01',
    dept: 'General Medicine',
    designation: 'Chief Medical Director & Hospital CEO'
  },
  admin: {
    email: 'admin@upstagehospital.org',
    name: 'Pooja Deshmukh',
    role: 'admin',
    empId: 'emp-admin-01',
    dept: 'Hospital Administration',
    designation: 'Chief Operating Officer / Hospital Admin'
  },
  hr_manager: {
    email: 'hr@upstagehospital.org',
    name: 'Kavita Nambiar',
    role: 'hr_manager',
    empId: 'emp-hr-01',
    dept: 'Hospital Administration',
    designation: 'Head of Human Resources'
  },
  doctor: {
    email: 'doctor@upstagehospital.org',
    name: 'Dr. Siddharth Sen',
    role: 'doctor',
    empId: 'emp-doc-01',
    dept: 'General Medicine',
    designation: 'Senior Consultant Physician'
  },
  receptionist: {
    email: 'reception@upstagehospital.org',
    name: 'Kumar Varma',
    role: 'receptionist',
    empId: 'emp-rec-01',
    dept: 'Hospital Administration',
    designation: 'Front Office Executive'
  },
  billing_staff: {
    email: 'billing@upstagehospital.org',
    name: 'Rohan Mehra',
    role: 'billing_staff',
    empId: 'emp-bill-01',
    dept: 'Hospital Administration',
    designation: 'Senior Billing Officer'
  },
  nurse: {
    email: 'nurse@upstagehospital.org',
    name: 'Sister Mary Fernandez',
    role: 'nurse',
    empId: 'emp-nurse-01',
    dept: 'General Medicine',
    designation: 'Nursing Supervisor'
  },
  pharmacist: {
    email: 'pharmacist@upstagehospital.org',
    name: 'Suresh Singhania',
    role: 'pharmacist',
    empId: 'emp-pharm-01',
    dept: 'Pharmacy Services',
    designation: 'Chief Pharmacist'
  },
  lab_technician: {
    email: 'lab@upstagehospital.org',
    name: 'Anjali Nair',
    role: 'lab_technician',
    empId: 'emp-lab-01',
    dept: 'Laboratory & Pathology',
    designation: 'Senior Medical Lab Technologist'
  }
};

export class AuthService {
  // 1. Sign In With Email & Password
  public async signIn(email: string, pass: string): Promise<{ user: FirebaseUser; profile: UserProfileDoc }> {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), pass);
    const profile = await this.getOrCreateUserProfile(cred.user);
    if (profile.status === 'inactive') {
      await signOut(getFirebaseAuth());
      throw new Error('This account has been deactivated. Please contact your Hospital Administrator.');
    }
    return { user: cred.user, profile };
  }

  // Password Recovery via Firebase Auth
  public async resetPassword(email: string): Promise<void> {
    if (!email || !email.trim()) {
      throw new Error('Please enter a valid email address.');
    }
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }

  // 2. Register New Hospital Owner & Initialize Hospital Architecture
  public async registerHospitalOwner(params: {
    hospitalName: string;
    ownerName: string;
    email: string;
    pass: string;
    phone: string;
    city: string;
  }): Promise<{ user: FirebaseUser; hospital: HospitalDocument; profile: UserProfileDoc }> {
    // A. Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), params.email.trim(), params.pass);
    const uid = cred.user.uid;

    // B. Generate unique hospital ID
    const hospitalId = `hosp-${Date.now().toString(36)}`;
    const hospitalCode = `UPH-${String(Math.floor(Math.random() * 90 + 10))}`;

    // C. Write to hospitals/{hospitalId}
    const hospitalDoc: HospitalDocument = {
      hospitalId,
      hospitalName: params.hospitalName.trim(),
      ownerUid: uid,
      code: hospitalCode,
      city: params.city.trim() || 'New Delhi',
      phone: params.phone.trim(),
      email: params.email.trim(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    await setDoc(doc(getFirebaseDb(), 'hospitals', hospitalId), {
      ...hospitalDoc,
      createdAtServer: serverTimestamp()
    });

    // D. Write to users/{uid}
    const ownerEmpId = `emp-${uid.slice(0, 8)}`;
    const profileDoc: UserProfileDoc = {
      uid,
      name: params.ownerName.trim(),
      email: params.email.trim(),
      hospitalId,
      role: 'owner',
      status: 'active',
      employeeId: ownerEmpId,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(getFirebaseDb(), 'users', uid), {
      ...profileDoc,
      createdAtServer: serverTimestamp()
    });

    // Create real Owner Employee record in hospitals/{hospitalId}/employees/{ownerEmpId}
    const ownerEmployee: Employee = {
      id: ownerEmpId,
      hospitalId,
      employeeCode: 'EMP-001',
      name: params.ownerName.trim(),
      email: params.email.trim(),
      phone: params.phone.trim(),
      departmentId: 'dept-admin',
      departmentName: 'Hospital Administration',
      designation: 'Hospital Owner / CEO',
      primaryRole: 'owner',
      additionalRoles: [],
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0],
      gender: 'Male',
      employmentType: 'Full-time',
      salaryDetails: { basic: 100000, allowances: 20000, deductions: 5000, net: 115000 },
      attendanceStatus: 'present'
    };
    await setDoc(doc(getFirebaseDb(), 'hospitals', hospitalId, 'employees', ownerEmpId), ownerEmployee);

    // Initialize clean department catalog for this new hospital
    const depts = DEFAULT_DEPARTMENTS.map(d => ({
      ...d,
      hospitalId,
      headDoctorName: params.ownerName.trim()
    }));
    for (const d of depts) {
      await setDoc(doc(getFirebaseDb(), 'hospitals', hospitalId, 'departments', d.id), d);
    }

    // E. Initialize hospital subcollections in Firestore
    await firestoreService.initializeHospitalInFirestore(hospitalId, params.hospitalName, uid);

    return { user: cred.user, hospital: hospitalDoc, profile: profileDoc };
  }

  // 3. Privileged Staff Account Creation with isolated secondary app instance
  // Guarantees current authenticated session (Owner/Admin) in primary app is never disrupted
  public async createStaffAuthAccount(params: {
    email?: string;
    loginId?: string;
    pass: string;
    name: string;
    role: RoleId;
    hospitalId: string;
    ownerUid: string;
    employeeId: string;
    creatorRole: RoleId;
    creatorUid?: string;
  }): Promise<{ uid: string; alreadyExisted: boolean; loginId?: string; syntheticEmail: string }> {
    // 1. Strict Hierarchy Validation
    if (params.creatorRole === 'admin') {
      if (params.role === 'admin' || params.role === 'owner') {
        throw new Error('Permission Denied: Hospital Admin cannot create Admin or Owner accounts.');
      }
    } else if (params.creatorRole === 'hr_manager') {
      if (params.role === 'admin' || params.role === 'owner' || params.role === 'hr_manager') {
        throw new Error('Permission Denied: HR Manager cannot create Admin, Owner, or HR accounts.');
      }
    } else if (params.creatorRole === 'owner') {
      if (params.role === 'owner') {
        throw new Error('Permission Denied: Cannot create multiple Hospital Owner accounts.');
      }
    } else {
      throw new Error('Permission Denied: Unauthorized employee creation attempt.');
    }

    let uid = '';
    let alreadyExisted = false;

    // Determine synthetic authentication email for deterministic login ID mapping
    const loginId = params.loginId ? normalizeLoginId(params.loginId) : undefined;
    const syntheticEmail = loginId
      ? getSyntheticEmailForLoginId(loginId)
      : (params.email?.trim() || `${params.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@staff.upstagehospital.org`);

    // 2. Initialize temporary secondary FirebaseApp for isolated auth creation
    const secondaryAppName = `temp_staff_auth_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let secondaryApp: any = null;

    try {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, syntheticEmail, params.pass);
      uid = cred.user.uid;
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        alreadyExisted = true;
        uid = `usr-${syntheticEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      } else {
        console.warn('Firebase Auth user creation notice:', err);
        uid = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      }
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(e => console.warn('Secondary app cleanup warning:', e));
      }
    }

    // 3. Write User Profile to users/{uid}
    const userProfile: UserProfileDoc = {
      uid,
      name: params.name.trim(),
      email: params.email?.trim() || syntheticEmail,
      loginId,
      syntheticEmail,
      hospitalId: params.hospitalId,
      role: params.role,
      status: 'active',
      employeeId: params.employeeId,
      createdAt: new Date().toISOString()
    };

    const userRef = doc(getFirebaseDb(), 'users', uid);
    await setDoc(userRef, {
      ...userProfile,
      ownerUid: params.ownerUid,
      createdAtServer: serverTimestamp()
    }, { merge: true });

    return { uid, alreadyExisted, loginId, syntheticEmail };
  }

  // Staff Unified Login via User ID and Password
  public async signInWithStaffId(
    rawLoginId: string,
    pass: string
  ): Promise<{ user: FirebaseUser; profile: UserProfileDoc; employee?: Employee }> {
    const loginId = normalizeLoginId(rawLoginId);
    if (!loginId) {
      throw new Error('Please enter your Employee User ID.');
    }
    if (!pass) {
      throw new Error('Please enter your password.');
    }

    const syntheticEmail = getSyntheticEmailForLoginId(loginId);
    let cred: any = null;

    try {
      cred = await signInWithEmailAndPassword(getFirebaseAuth(), syntheticEmail, pass);
    } catch (err: any) {
      // If direct synthetic email failed, check if user provided their full work email
      if (rawLoginId.includes('@') && rawLoginId.includes('.')) {
        try {
          cred = await signInWithEmailAndPassword(getFirebaseAuth(), rawLoginId.trim(), pass);
        } catch {
          throw new Error('Invalid User ID or Password. Please verify your credentials.');
        }
      } else {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          throw new Error('Invalid User ID or Password. Please verify your credentials.');
        } else if (err.code === 'auth/too-many-requests') {
          throw new Error('Too many failed login attempts. Please wait a moment before trying again.');
        }
        throw new Error(err.message || 'Authentication failed. Please verify your credentials.');
      }
    }

    // Retrieve user profile from users/{uid}
    const profile = await this.getOrCreateUserProfile(cred.user);
    if (profile.status === 'inactive' || profile.status === 'suspended' || profile.status === 'rejected') {
      await signOut(getFirebaseAuth());
      throw new Error('Your hospital staff account has been deactivated. Please contact your Hospital Administrator.');
    }

    // Retrieve staff record from hospitals/{hospId}/employees/{empId}
    let employeeData: Employee | undefined;
    const hospId = profile.hospitalId || 'hosp-001';
    if (profile.employeeId) {
      const empSnap = await getDoc(doc(getFirebaseDb(), 'hospitals', hospId, 'employees', profile.employeeId));
      if (empSnap.exists()) {
        employeeData = empSnap.data() as Employee;
      }
    }

    if (employeeData && (employeeData.status === 'inactive' || employeeData.status === 'suspended')) {
      await signOut(getFirebaseAuth());
      throw new Error('Your hospital staff account is inactive. Please contact Hospital Administration.');
    }

    return { user: cred.user, profile, employee: employeeData };
  }

  // Toggle active/inactive status of an employee account
  public async setEmployeeAccountStatus(
    hospitalId: string,
    employeeId: string,
    uid: string | undefined,
    status: 'active' | 'inactive'
  ): Promise<void> {
    await firestoreService.updateDocument(hospitalId, 'employees', employeeId, {
      status,
      updatedAt: new Date().toISOString()
    });

    if (uid) {
      await setDoc(doc(getFirebaseDb(), 'users', uid), {
        status,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.warn('Could not update users status:', err));
    }
  }

  // 4. Quick Real Firebase Auth Sign In for Testing / Staff Login
  public async signInQuickStaff(roleKey: string): Promise<{ user: FirebaseUser; profile: UserProfileDoc }> {
    const config = STANDARD_STAFF_ACCOUNTS[roleKey] || STANDARD_STAFF_ACCOUNTS.owner;
    const defaultPassword = 'HospitalPassword@2026';
    const hospitalId = 'hosp-001';

    try {
      // Try regular sign in
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), config.email, defaultPassword);
      const profile = await this.getOrCreateUserProfile(cred.user, config, hospitalId);
      return { user: cred.user, profile };
    } catch (err: any) {
      // If user doesn't exist yet in Firebase Auth, automatically create it!
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-email'
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), config.email, defaultPassword);
          const profile = await this.getOrCreateUserProfile(cred.user, config, hospitalId);
          return { user: cred.user, profile };
        } catch (createErr: any) {
          // If already exists or error, try sign in again or throw
          if (createErr.code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(getFirebaseAuth(), config.email, defaultPassword);
            const profile = await this.getOrCreateUserProfile(cred.user, config, hospitalId);
            return { user: cred.user, profile };
          }
          throw createErr;
        }
      }
      throw err;
    }
  }

  // 4. Get or Create User Profile in users/{uid}
  public async getOrCreateUserProfile(
    firebaseUser: FirebaseUser,
    fallbackStaff?: typeof STANDARD_STAFF_ACCOUNTS[string],
    fallbackHospitalId: string = 'hosp-001'
  ): Promise<UserProfileDoc> {
    const userRef = doc(getFirebaseDb(), 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      return snap.data() as UserProfileDoc;
    }

    // Determine matching staff from default pool or fallback
    const email = firebaseUser.email || '';
    const staffMatch = Object.values(STANDARD_STAFF_ACCOUNTS).find(s => s.email.toLowerCase() === email.toLowerCase()) || fallbackStaff;
    const isDemo = fallbackHospitalId === 'hosp-001' || (email && email.toLowerCase().endsWith('@upstagehospital.org'));

    const newProfile: UserProfileDoc = {
      uid: firebaseUser.uid,
      name: staffMatch?.name || firebaseUser.displayName || (email ? email.split('@')[0] : 'Hospital Owner'),
      email: firebaseUser.email || '',
      hospitalId: isDemo ? 'hosp-001' : fallbackHospitalId,
      role: staffMatch?.role || (isDemo ? 'doctor' : 'owner'),
      status: 'active',
      employeeId: staffMatch?.empId || `emp-${firebaseUser.uid.slice(0, 8)}`,
      createdAt: new Date().toISOString()
    };

    await setDoc(userRef, {
      ...newProfile,
      createdAtServer: serverTimestamp()
    }, { merge: true });

    return newProfile;
  }

  // 5. Get Hospital Meta Document
  public async getHospital(hospitalId: string): Promise<Hospital> {
    try {
      const snap = await getDoc(doc(getFirebaseDb(), 'hospitals', hospitalId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: hospitalId,
          name: data.hospitalName || data.name || 'Upstage Multi-Speciality Hospital',
          code: data.code || 'UPH-01',
          city: data.city || 'New Delhi',
          phone: data.phone || '+91 11 4050 9900',
          email: data.email || 'admin@upstagehospital.org',
          tagline: data.tagline || 'Excellence in Tertiary Patient Care',
          address: data.address || 'Medical Enclave, New Delhi',
          ownerId: data.ownerUid || 'emp-owner-01',
          ownerName: data.ownerName || 'Dr. Rajeshwar Sharma',
          createdAt: data.createdAt || new Date().toISOString(),
          activeModules: data.activeModules || ['opd', 'ipd', 'pharmacy', 'laboratory', 'radiology', 'billing'],
          settings: data.settings || {
            currency: '₹',
            taxRate: 5.0,
            opdConsultationValidityDays: 7,
            emergencyContact: '+91 11 4050 9999',
            operatingHours: '24/7 Tertiary Care'
          }
        };
      }
    } catch (e) {
      console.warn('Could not fetch hospital from Firestore:', e);
    }
    return {
      id: hospitalId,
      name: 'Upstage Multi-Speciality Hospital',
      code: 'UPH-01',
      city: 'New Delhi',
      phone: '+91 11 4050 9900',
      email: 'contact@upstagehospital.org',
      tagline: 'Advanced Clinical Care & Research Institute',
      address: 'Medical Enclave, New Delhi',
      ownerId: 'emp-owner-01',
      ownerName: 'Hospital Administration',
      createdAt: new Date().toISOString(),
      activeModules: ['opd', 'ipd', 'pharmacy', 'laboratory', 'radiology', 'billing'],
      settings: {
        currency: '₹',
        taxRate: 5.0,
        opdConsultationValidityDays: 7,
        emergencyContact: '+91 11 4050 9999',
        operatingHours: '24/7 Tertiary Care'
      }
    };
  }

  // 6. Sign Out
  public async signOut(): Promise<void> {
    await signOut(getFirebaseAuth());
  }
}

export const authService = new AuthService();
