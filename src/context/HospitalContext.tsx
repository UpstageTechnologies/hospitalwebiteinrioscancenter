import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  storageService,
  DEFAULT_DEPARTMENTS
} from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import {
  getStoredPosConnection,
  verifyAndConnectKadaiPosUser,
  disconnectKadaiPos,
  subscribeToPosMedicines,
  subscribeToPosLabTests,
  subscribeToPosRooms
} from '../services/posIntegrationService';
import type {
  PosConnection,
  PosMedicine,
  PosLabTest,
  PosRoom
} from '../services/posIntegrationService';
import type { Department } from '../types/hospital';
import type { RoleTemplate, RoleId } from '../types/roles';
import type { Employee } from '../types/employee';
import type { RoleRequest } from '../types/roleRequest';
import type { Patient, VitalSign } from '../types/patient';
import type { Appointment, ConsultationRecord, LabOrder, RadiologyOrder, PrescriptionItem } from '../types/clinical';
import type { Bed, Ward, Admission, AdmissionRequest } from '../types/admission';
import type { Medicine, PharmacyDispense } from '../types/pharmacy';
import type { Invoice, HospitalExpense, BillItem, PaymentMethod } from '../types/billing';
import type { HospitalNotification, AuditLog } from '../types/audit';
import type { AttendanceRecord, PayrollRecord } from '../types/hr';
import type { NurseTask, NurseAvailabilityStatus } from '../types/nurse';
import { INITIAL_ROLE_TEMPLATES } from '../constants/roleTemplates';
import { useToast } from './ToastContext';

interface HospitalContextType {
  departments: Department[];
  employees: Employee[];
  roleTemplates: Record<RoleId, RoleTemplate>;
  roleRequests: RoleRequest[];
  patients: Patient[];
  vitals: VitalSign[];
  appointments: Appointment[];
  consultations: ConsultationRecord[];
  wards: Ward[];
  beds: Bed[];
  admissions: Admission[];
  admissionRequests: AdmissionRequest[];
  medicines: Medicine[];
  labOrders: LabOrder[];
  radiologyOrders: RadiologyOrder[];
  expenses: HospitalExpense[];
  invoices: Invoice[];
  notifications: HospitalNotification[];
  auditLogs: AuditLog[];
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  nurseTasks: NurseTask[];

  // Global Nurse Help & Task Assignment
  requestNurseTask: (data: Omit<NurseTask, 'id' | 'hospitalId' | 'taskId' | 'status' | 'createdAt'>) => Promise<{ success: boolean; taskId: string; error?: string }>;
  acceptNurseTask: (taskId: string, nurseStaffId: string) => Promise<{ success: boolean; error?: string }>;
  startNurseTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  completeNurseTask: (taskId: string, nurseStaffId: string, completionNotes: string) => Promise<{ success: boolean; error?: string }>;
  rejectNurseTask: (taskId: string, nurseStaffId: string, rejectionReason: string) => Promise<{ success: boolean; error?: string }>;
  cancelNurseTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  setNurseAvailability: (nurseStaffId: string, status: 'available' | 'busy' | 'offline') => Promise<void>;

  // Kadai POS State & Integration
  posConnection: PosConnection | null;
  posMedicines: PosMedicine[];
  posLabTests: PosLabTest[];
  posRooms: PosRoom[];
  handleConnectPos: (posUserId: string) => Promise<{ success: boolean; message: string }>;
  handleDisconnectPos: () => Promise<void>;

  // Phase 1 Employee Management & Admin Approval
  submitEmployeeRequest: (employeeData: Omit<Employee, 'id' | 'hospitalId' | 'status' | 'approvalDetails'>) => { success: boolean; message: string; employee?: Employee };
  approveEmployeeRequest: (employeeId: string, approvedAdditionalRoles?: RoleId[], rejectedAdditionalRoles?: { role: RoleId; reason?: string }[]) => void;
  rejectEmployeeRequest: (employeeId: string, rejectionReason: string) => void;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => void;

  // Phase 1 Attendance
  markAttendance: (employeeId: string, date: string, status: AttendanceRecord['status'], checkInTime?: string, checkOutTime?: string) => void;
  markBulkAttendance: (date: string, status: AttendanceRecord['status']) => void;

  // Phase 1 Payroll
  calculateMonthlyPayroll: (monthStr: string) => void;
  updatePayrollStatus: (payrollId: string, status: PayrollRecord['paymentStatus'], paymentRef?: string) => void;

  // Action methods
  addPatient: (patientData: Omit<Patient, 'id' | 'hospitalId' | 'uhid' | 'registeredAt' | 'status'>) => Patient;
  recordVitals: (vitalsData: Omit<VitalSign, 'id' | 'hospitalId' | 'recordedAt'>) => void;
  bookAppointment: (aptData: Omit<Appointment, 'id' | 'hospitalId' | 'tokenNumber' | 'bookedAt' | 'status'>) => Appointment;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => void;
  saveConsultation: (consultation: Omit<ConsultationRecord, 'id' | 'hospitalId' | 'consultedAt'>) => void;

  // Phase 2: Receptionist Online & Walk-in Appointments
  submitOnlineAppointment: (data: {
    patientName: string;
    mobile: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    preferredDoctorId: string;
    preferredDoctorName: string;
    departmentId?: string;
    departmentName?: string;
    preferredDate: string;
    problemDescription: string;
  }) => Promise<Appointment>;
  confirmOnlineAppointment: (appointmentId: string, tokenNumber?: number) => Promise<void>;
  registerWalkInAppointment: (data: {
    patientName: string;
    phone: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    doctorId: string;
    doctorName: string;
    departmentId?: string;
    departmentName?: string;
    chiefComplaint: string;
    appointmentDate?: string;
    consultationFee?: number;
  }) => Promise<Appointment>;

  // Phase 3: Doctor Clinical Consultation Workflow
  completeClinicalConsultationWorkflow: (data: {
    appointmentId: string;
    patientId: string;
    patientName: string;
    patientUhid: string;
    patientAge?: number;
    patientGender?: string;
    doctorId: string;
    doctorName: string;
    departmentId?: string;
    symptoms?: string[];
    clinicalObservations?: string;
    diagnosis: string;
    notes?: string;
    consultationFee: number;
    procedureFee?: number;
    procedureDescription?: string;
    prescriptions: PrescriptionItem[];
    labTests: {
      testId: string;
      testName: string;
      category: string;
      sampleType?: string;
      price: number;
    }[];
    admissionRecommendation?: {
      isVip: boolean;
      notes: string;
      reason?: string;
    };
  }) => Promise<void>;

  // Phase 4: Pharmacy Dispense
  dispensePrescriptionAtomic: (data: {
    prescriptionId: string;
    patientId: string;
    patientName: string;
    patientUhid: string;
    doctorName: string;
    itemsToDispense: {
      medicineId: string;
      posMedicineId?: string;
      medicineName: string;
      quantity: number;
      unitPrice: number;
      batchNumber?: string;
    }[];
  }) => Promise<{ success: boolean; error?: string }>;

  // Phase 5: Laboratory Status & Verification
  updateLabOrderStatus: (orderId: string, status: LabOrder['sampleStatus'], details?: {
    resultValue?: string;
    isAbnormal?: boolean;
    remarks?: string;
    verifiedBy?: string;
  }) => Promise<void>;

  // Phase 6: Ward Bed Allocation & Discharge
  allocateBedToAdmissionRequest: (requestId: string, bedId: string) => Promise<{ success: boolean; error?: string }>;
  dischargePatientFromBed: (admissionId: string) => Promise<{ success: boolean; roomCharges: number }>;

  // Phase 7: Unified Billing Settlements
  recordInvoicePayment: (invoiceId: string, amount: number, method: PaymentMethod, ref?: string) => Promise<void>;
  
  // Role Requests & Approvals
  requestAdditionalRole: (employeeId: string, roleToRequest: RoleId, reason: string, requestType?: 'add' | 'remove') => void;
  approveRoleRequest: (requestId: string) => void;
  rejectRoleRequest: (requestId: string, rejectionReason: string) => void;
  toggleRoleTemplateActive: (roleId: RoleId, isActive: boolean) => void;

  // Bed & Inpatient Management
  admitPatient: (admissionData: Omit<Admission, 'id' | 'hospitalId' | 'admissionNumber' | 'status'>) => void;
  transferBed: (admissionId: string, newBedId: string) => void;
  dischargePatient: (admissionId: string, summary: Admission['dischargeSummary']) => void;
  updateBedStatus: (bedId: string, status: Bed['status']) => void;

  // Pharmacy & Diagnostics
  dispensePrescription: (dispenseData: Omit<PharmacyDispense, 'id' | 'hospitalId' | 'dispenseNumber' | 'dispensedAt'>) => void;
  updateLabOrderResult: (orderId: string, resultValue: string, isAbnormal: boolean, remarks?: string) => void;
  verifyLabOrder: (orderId: string, verifierName: string) => void;
  updateRadiologyStatus: (orderId: string, status: RadiologyOrder['status']) => void;
  saveRadiologyReport: (orderId: string, findings: string, impression: string, radiologistName: string) => void;

  // Billing & Finance
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'hospitalId' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => void;
  recordPayment: (invoiceId: string, amount: number, method: Invoice['paymentMethod'], ref?: string) => void;
  recordExpense: (expenseData: Omit<HospitalExpense, 'id' | 'hospitalId' | 'expenseNumber'>) => void;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentHospital, currentUser, refreshUser } = useAuth();
  const { success, error, info } = useToast();
  const hospId = currentHospital.id;

  useEffect(() => {
    storageService.initHospital(hospId);
  }, [hospId]);

  const isDemo = hospId === 'hosp-001';

  const [departments, setDepartments] = useState<Department[]>(() =>
    storageService.getCollection<Department>(hospId, 'departments', DEFAULT_DEPARTMENTS)
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    storageService.getCollection<Employee>(hospId, 'employees', [])
  );
  const [roleTemplates, setRoleTemplates] = useState<Record<RoleId, RoleTemplate>>(INITIAL_ROLE_TEMPLATES);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>(() =>
    storageService.getCollection<RoleRequest>(hospId, 'roleRequests', [])
  );
  const [patients, setPatients] = useState<Patient[]>(() =>
    storageService.getCollection<Patient>(hospId, 'patients', [])
  );
  const [vitals, setVitals] = useState<VitalSign[]>(() =>
    storageService.getCollection<VitalSign>(hospId, 'vitals', [])
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    storageService.getCollection<Appointment>(hospId, 'appointments', [])
  );
  const [consultations, setConsultations] = useState<ConsultationRecord[]>(() =>
    storageService.getCollection<ConsultationRecord>(hospId, 'consultations', [])
  );
  const [wards, setWards] = useState<Ward[]>(() =>
    storageService.getCollection<Ward>(hospId, 'wards', [])
  );
  const [beds, setBeds] = useState<Bed[]>(() =>
    storageService.getCollection<Bed>(hospId, 'beds', [])
  );
  const [admissions, setAdmissions] = useState<Admission[]>(() =>
    storageService.getCollection<Admission>(hospId, 'admissions', [])
  );
  const [admissionRequests, setAdmissionRequests] = useState<AdmissionRequest[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>(() =>
    storageService.getCollection<Medicine>(hospId, 'medicines', [])
  );
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() =>
    storageService.getCollection<LabOrder>(hospId, 'labOrders', [])
  );
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>(() =>
    storageService.getCollection<RadiologyOrder>(hospId, 'radiologyOrders', [])
  );
  const [expenses, setExpenses] = useState<HospitalExpense[]>(() =>
    storageService.getCollection<HospitalExpense>(hospId, 'expenses', [])
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    storageService.getCollection<Invoice>(hospId, 'invoices', [])
  );
  const [notifications, setNotifications] = useState<HospitalNotification[]>(() =>
    storageService.getCollection<HospitalNotification>(hospId, 'notifications', [])
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    storageService.getCollection<AuditLog>(hospId, 'auditLogs', [])
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    storageService.getCollection<AttendanceRecord>(hospId, 'attendance', [])
  );
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() =>
    storageService.getCollection<PayrollRecord>(hospId, 'payroll', [])
  );
  const [nurseTasks, setNurseTasks] = useState<NurseTask[]>(() =>
    storageService.getCollection<NurseTask>(hospId, 'nurseTasks', [])
  );

  // Kadai POS State
  const [posConnection, setPosConnection] = useState<PosConnection | null>(null);
  const [posMedicines, setPosMedicines] = useState<PosMedicine[]>([]);
  const [posLabTests, setPosLabTests] = useState<PosLabTest[]>([]);
  const [posRooms, setPosRooms] = useState<PosRoom[]>([]);

  // Initialize Kadai POS Connection
  useEffect(() => {
    let isMounted = true;
    getStoredPosConnection(hospId).then(conn => {
      if (isMounted && conn) {
        setPosConnection(conn);
      }
    });
    return () => { isMounted = false; };
  }, [hospId]);

  // Sync Kadai POS Catalogs when connected
  useEffect(() => {
    if (!posConnection || posConnection.status !== 'connected') return;

    const ownerUid = posConnection.ownerUid || 'uid_upstageuser1015';
    const unsubMeds = subscribeToPosMedicines(ownerUid, (data) => {
      if (data && data.length > 0) setPosMedicines(data);
    });
    const unsubLabs = subscribeToPosLabTests(ownerUid, (data) => {
      if (data && data.length > 0) setPosLabTests(data);
    });
    const unsubRooms = subscribeToPosRooms(ownerUid, (data) => {
      if (data && data.length > 0) setPosRooms(data);
    });

    return () => {
      unsubMeds();
      unsubLabs();
      unsubRooms();
    };
  }, [posConnection]);

  // Subscriptions for Hospital Collections
  useEffect(() => {
    storageService.initHospital(hospId);

    const unsubDepts = firestoreService.subscribeToCollection<Department>(hospId, 'departments', (data) => {
      setDepartments(data || []);
      storageService.saveCollection(hospId, 'departments', data || []);
    });

    const unsubEmps = firestoreService.subscribeToCollection<Employee>(hospId, 'employees', (data) => {
      setEmployees(data || []);
      storageService.saveCollection(hospId, 'employees', data || []);
    });

    const unsubReqs = firestoreService.subscribeToCollection<RoleRequest>(hospId, 'roleRequests', (data) => {
      setRoleRequests(data || []);
      storageService.saveCollection(hospId, 'roleRequests', data || []);
    });

    const unsubPatients = firestoreService.subscribeToCollection<Patient>(hospId, 'patients', (data) => {
      setPatients(data || []);
      storageService.saveCollection(hospId, 'patients', data || []);
    });

    const unsubVitals = firestoreService.subscribeToCollection<VitalSign>(hospId, 'vitals', (data) => {
      setVitals(data || []);
      storageService.saveCollection(hospId, 'vitals', data || []);
    });

    const unsubApts = firestoreService.subscribeToCollection<Appointment>(hospId, 'appointments', (data) => {
      setAppointments(data || []);
      storageService.saveCollection(hospId, 'appointments', data || []);
    });

    const unsubCons = firestoreService.subscribeToCollection<ConsultationRecord>(hospId, 'consultations', (data) => {
      setConsultations(data || []);
      storageService.saveCollection(hospId, 'consultations', data || []);
    });

    const unsubWards = firestoreService.subscribeToCollection<Ward>(hospId, 'wards', (data) => {
      setWards(data || []);
      storageService.saveCollection(hospId, 'wards', data || []);
    });

    const unsubBeds = firestoreService.subscribeToCollection<Bed>(hospId, 'beds', (data) => {
      setBeds(data || []);
      storageService.saveCollection(hospId, 'beds', data || []);
    });

    const unsubAdms = firestoreService.subscribeToCollection<Admission>(hospId, 'admissions', (data) => {
      setAdmissions(data || []);
      storageService.saveCollection(hospId, 'admissions', data || []);
    });

    const unsubAdmReqs = firestoreService.subscribeToCollection<AdmissionRequest>(hospId, 'admissionRequests', (data) => {
      setAdmissionRequests(data || []);
    });

    const unsubMeds = firestoreService.subscribeToCollection<Medicine>(hospId, 'medicines', (data) => {
      setMedicines(data || []);
      storageService.saveCollection(hospId, 'medicines', data || []);
    });

    const unsubLabs = firestoreService.subscribeToCollection<LabOrder>(hospId, 'labOrders', (data) => {
      setLabOrders(data || []);
      storageService.saveCollection(hospId, 'labOrders', data || []);
    });

    const unsubRads = firestoreService.subscribeToCollection<RadiologyOrder>(hospId, 'radiologyOrders', (data) => {
      setRadiologyOrders(data || []);
      storageService.saveCollection(hospId, 'radiologyOrders', data || []);
    });

    const unsubExpenses = firestoreService.subscribeToCollection<HospitalExpense>(hospId, 'expenses', (data) => {
      setExpenses(data || []);
      storageService.saveCollection(hospId, 'expenses', data || []);
    });

    const unsubBills = firestoreService.subscribeToCollection<Invoice>(hospId, 'bills', (data) => {
      setInvoices(data || []);
      storageService.saveCollection(hospId, 'invoices', data || []);
    });

    const unsubNotifs = firestoreService.subscribeToCollection<HospitalNotification>(hospId, 'notifications', (data) => {
      setNotifications(data || []);
      storageService.saveCollection(hospId, 'notifications', data || []);
    });

    const unsubLogs = firestoreService.subscribeToCollection<AuditLog>(hospId, 'auditLogs', (data) => {
      setAuditLogs(data || []);
      storageService.saveCollection(hospId, 'auditLogs', data || []);
    });

    const unsubAtt = firestoreService.subscribeToCollection<AttendanceRecord>(hospId, 'attendance', (data) => {
      setAttendanceRecords(data || []);
      storageService.saveCollection(hospId, 'attendance', data || []);
    });

    const unsubPay = firestoreService.subscribeToCollection<PayrollRecord>(hospId, 'payroll', (data) => {
      setPayrollRecords(data || []);
      storageService.saveCollection(hospId, 'payroll', data || []);
    });

    const unsubNurseTasks = firestoreService.subscribeToCollection<NurseTask>(hospId, 'nurseTasks', (data) => {
      setNurseTasks(data || []);
      storageService.saveCollection(hospId, 'nurseTasks', data || []);
    });

    return () => {
      unsubDepts();
      unsubEmps();
      unsubReqs();
      unsubPatients();
      unsubVitals();
      unsubApts();
      unsubCons();
      unsubWards();
      unsubBeds();
      unsubAdms();
      unsubAdmReqs();
      unsubMeds();
      unsubLabs();
      unsubRads();
      unsubExpenses();
      unsubBills();
      unsubNotifs();
      unsubLogs();
      unsubAtt();
      unsubPay();
      unsubNurseTasks();
    };
  }, [hospId]);

  // Kadai POS Connection Handlers
  const handleConnectPos = async (posUserId: string): Promise<{ success: boolean; message: string }> => {
    const res = await verifyAndConnectKadaiPosUser(hospId, posUserId);
    if (res.success && res.connection) {
      setPosConnection(res.connection);
      success('Kadai POS Connected', `Verified: ${res.connection.shopName}`);
      return { success: true, message: `Connected to ${res.connection.shopName}` };
    } else {
      error('Connection Failed', res.error || 'Could not verify Kadai POS User ID.');
      return { success: false, message: res.error || 'Failed to connect.' };
    }
  };

  const handleDisconnectPos = async () => {
    await disconnectKadaiPos(hospId);
    setPosConnection(null);
    info('Kadai POS Disconnected', 'Hospital detached from POS inventory.');
  };

  const updateAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendanceRecords(newRecords);
    storageService.saveCollection(hospId, 'attendance', newRecords);
  };

  const updatePayroll = (newPayroll: PayrollRecord[]) => {
    setPayrollRecords(newPayroll);
    storageService.saveCollection(hospId, 'payroll', newPayroll);
  };

  const updatePatients = (newPatients: Patient[]) => {
    setPatients(newPatients);
    storageService.saveCollection(hospId, 'patients', newPatients);
  };

  const updateAppointments = (newApts: Appointment[]) => {
    setAppointments(newApts);
    storageService.saveCollection(hospId, 'appointments', newApts);
  };

  const updateBeds = (newBeds: Bed[]) => {
    setBeds(newBeds);
    storageService.saveCollection(hospId, 'beds', newBeds);
  };

  const updateAdmissions = (newAdms: Admission[]) => {
    setAdmissions(newAdms);
    storageService.saveCollection(hospId, 'admissions', newAdms);
  };

  const updateEmployees = (newEmps: Employee[]) => {
    setEmployees(newEmps);
    storageService.saveCollection(hospId, 'employees', newEmps);
  };

  const updateRoleRequests = (newReqs: RoleRequest[]) => {
    setRoleRequests(newReqs);
    storageService.saveCollection(hospId, 'roleRequests', newReqs);
  };

  const updateNotifications = (newNotifs: HospitalNotification[]) => {
    setNotifications(newNotifs);
    storageService.saveCollection(hospId, 'notifications', newNotifs);
  };

  const logAudit = (action: string, module: string, details: string, targetId?: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      hospitalId: hospId,
      actorId: currentUser?.id || 'sys-admin',
      actorName: currentUser?.name || 'System Admin',
      actorRole: currentUser?.primaryRole || 'admin',
      action,
      module,
      details,
      targetEntityId: targetId,
      timestamp: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    storageService.saveCollection(hospId, 'auditLogs', updatedLogs.slice(0, 200));
    firestoreService.logAudit(hospId, {
      actorId: newLog.actorId,
      actorName: newLog.actorName,
      actorRole: newLog.actorRole,
      action,
      module,
      details,
      targetEntityId: targetId
    }).catch(err => console.warn('Firestore logAudit warning:', err));
  };

  // Phase 2 Methods
  const submitOnlineAppointment = async (data: {
    patientName: string;
    mobile: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    preferredDoctorId: string;
    preferredDoctorName: string;
    departmentId?: string;
    departmentName?: string;
    preferredDate: string;
    problemDescription: string;
  }): Promise<Appointment> => {
    const res = await firestoreService.submitOnlineAppointment(hospId, data);
    setAppointments(prev => [res.appointment, ...prev]);
    success('Online Booking Received', `Request logged for ${data.patientName}.`);
    return res.appointment;
  };

  const confirmOnlineAppointment = async (appointmentId: string, tokenNumber?: number) => {
    const updated = await firestoreService.confirmOnlineAppointment(hospId, appointmentId, tokenNumber);
    setAppointments(prev => prev.map(a => a.id === appointmentId ? updated : a));
    success('Appointment Confirmed', `Token #${updated.tokenNumber} issued.`);
  };

  const registerWalkInAppointment = async (data: {
    patientName: string;
    phone: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    doctorId: string;
    doctorName: string;
    departmentId?: string;
    departmentName?: string;
    chiefComplaint: string;
    appointmentDate?: string;
    consultationFee?: number;
  }): Promise<Appointment> => {
    const res = await firestoreService.registerWalkInAppointment(hospId, data);
    setAppointments(prev => {
      const exists = prev.some(a => a.id === res.appointment.id);
      return exists ? prev : [res.appointment, ...prev];
    });
    success('Walk-in Registered', `Token #${res.appointment.tokenNumber} issued for ${res.patient.name}.`);
    return res.appointment;
  };

  // Phase 3 Doctor Clinical Consultation Workflow
  const completeClinicalConsultationWorkflow = async (data: {
    appointmentId: string;
    patientId: string;
    patientName: string;
    patientUhid: string;
    patientAge?: number;
    patientGender?: string;
    doctorId: string;
    doctorName: string;
    departmentId?: string;
    symptoms?: string[];
    clinicalObservations?: string;
    diagnosis: string;
    notes?: string;
    consultationFee: number;
    procedureFee?: number;
    procedureDescription?: string;
    prescriptions: PrescriptionItem[];
    labTests: {
      testId: string;
      testName: string;
      category: string;
      sampleType?: string;
      price: number;
    }[];
    admissionRecommendation?: {
      isVip: boolean;
      notes: string;
      reason?: string;
    };
  }) => {
    await firestoreService.completeClinicalConsultationWorkflow(hospId, data);
    setAppointments(prev => prev.map(a => a.id === data.appointmentId ? { ...a, status: 'completed' } : a));
    success('Consultation Forwarded', 'Orders sent to Pharmacy, Lab, and Ward.');
  };

  // Phase 4 Pharmacy Dispense
  const dispensePrescriptionAtomic = async (data: {
    prescriptionId: string;
    patientId: string;
    patientName: string;
    patientUhid: string;
    doctorName: string;
    itemsToDispense: {
      medicineId: string;
      posMedicineId?: string;
      medicineName: string;
      quantity: number;
      unitPrice: number;
      batchNumber?: string;
    }[];
  }) => {
    const ownerUid = posConnection?.ownerUid || 'uid_upstageuser1015';
    const res = await firestoreService.dispensePrescriptionAtomic(hospId, ownerUid, {
      ...data,
      pharmacistName: currentUser?.name || 'Pharmacist'
    });

    if (res.success) {
      success('Medicine Dispensed', 'POS stock deducted atomically and synced to bill.');
      return { success: true };
    } else {
      error('Dispense Failed', res.error || 'Insufficient stock or deduction error.');
      return { success: false, error: res.error };
    }
  };

  // Phase 5 Lab Status Update
  const updateLabOrderStatus = async (
    orderId: string,
    status: LabOrder['sampleStatus'],
    details?: {
      resultValue?: string;
      isAbnormal?: boolean;
      remarks?: string;
      verifiedBy?: string;
    }
  ) => {
    await firestoreService.updateLabOrderStatus(hospId, orderId, status, details);
    setLabOrders(prev => prev.map(l => {
      if (l.id !== orderId) return l;
      const updated: LabOrder = {
        ...l,
        sampleStatus: status
      };
      if (details?.resultValue !== undefined) {
        updated.resultValue = details.resultValue;
      }
      if (details?.isAbnormal !== undefined) {
        updated.isAbnormal = details.isAbnormal;
      }
      if (details?.remarks !== undefined) {
        updated.remarks = details.remarks;
      }
      if (details?.verifiedBy !== undefined) {
        updated.verifiedBy = details.verifiedBy;
      }
      if (status === 'verified') {
        updated.verifiedAt = new Date().toISOString();
        if (!updated.verifiedBy) {
          updated.verifiedBy = details?.verifiedBy || l.verifiedBy || 'Dr. Pathologist';
        }
      }
      if (status === 'collected' && !l.collectedAt) {
        updated.collectedAt = new Date().toISOString();
      }
      if (status === 'completed') {
        updated.isBilled = true;
      } else if (status === 'cancelled') {
        updated.isBilled = false;
      }
      return updated;
    }));
    success('Lab Status Updated', `Order status changed to ${status.toUpperCase()}.`);
  };

  // Phase 6 Ward Bed Allocation & Discharge
  const allocateBedToAdmissionRequest = async (requestId: string, bedId: string) => {
    const res = await firestoreService.allocateBedToAdmissionRequest(hospId, requestId, bedId);
    if (res.success) {
      success('Bed Allocated', 'Patient admitted to room.');
      return { success: true };
    } else {
      error('Allocation Blocked', res.error || 'Failed to allocate bed.');
      return { success: false, error: res.error };
    }
  };

  const dischargePatientFromBed = async (admissionId: string) => {
    const res = await firestoreService.dischargePatientFromBed(hospId, admissionId);
    if (res.success) {
      success('Patient Discharged', `Room charges ₹${res.roomCharges} posted to patient bill.`);
      return { success: true, roomCharges: res.roomCharges };
    } else {
      error('Discharge Failed', res.error || 'Failed to discharge patient.');
      return { success: false, roomCharges: 0 };
    }
  };

  // Phase 7 Invoicing & Settlements
  const recordInvoicePayment = async (invoiceId: string, amount: number, method: PaymentMethod, ref?: string) => {
    await firestoreService.recordInvoicePayment(hospId, invoiceId, amount, method, ref);
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const newPaid = (inv.amountPaid || 0) + amount;
        const newBalance = Math.max(0, inv.totalAmount - newPaid);
        return {
          ...inv,
          amountPaid: newPaid,
          balanceDue: newBalance,
          paymentStatus: newBalance <= 0 ? 'paid' : 'partial'
        };
      }
      return inv;
    }));
    success('Payment Recorded', `₹${amount} collected via ${method.toUpperCase()}.`);
  };

  // Other Existing Methods
  const addPatient = (patientData: Omit<Patient, 'id' | 'hospitalId' | 'uhid' | 'registeredAt' | 'status'>): Patient => {
    const existing = patients.find(p => p.phone.replace(/\D/g, '') === patientData.phone.replace(/\D/g, ''));
    if (existing) {
      info('Existing Patient Found', `Patient already registered with UHID: ${existing.uhid}`);
      return existing;
    }

    const uhid = `UPH-${new Date().getFullYear()}-${String(patients.length + 101).padStart(5, '0')}`;
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}`,
      hospitalId: hospId,
      uhid,
      registeredAt: new Date().toISOString(),
      status: 'OP'
    };

    const updated = [newPatient, ...patients];
    updatePatients(updated);
    firestoreService.setDocument(hospId, 'patients', newPatient.id, newPatient).catch(err => console.warn('Firestore set patient error:', err));
    logAudit('PATIENT_REGISTERED', 'Patient Management', `Registered ${newPatient.name} with UHID ${uhid}`, newPatient.id);
    success('Patient Registered', `UHID ${uhid} generated.`);
    return newPatient;
  };

  const recordVitals = (vitalsData: Omit<VitalSign, 'id' | 'hospitalId' | 'recordedAt'>) => {
    const newVital: VitalSign = {
      ...vitalsData,
      id: `vit-${Date.now()}`,
      hospitalId: hospId,
      recordedAt: new Date().toISOString()
    };
    const updated = [newVital, ...vitals];
    setVitals(updated);
    storageService.saveCollection(hospId, 'vitals', updated);
    firestoreService.setDocument(hospId, 'vitals', newVital.id, newVital).catch(err => console.warn('Firestore set vitals error:', err));
    logAudit('VITALS_RECORDED', 'Clinical Care', `Vitals for UHID ${vitalsData.uhid}: BP ${vitalsData.bloodPressureSystolic}/${vitalsData.bloodPressureDiastolic}`);
    success('Vitals Saved', 'Patient observations recorded.');
  };

  const bookAppointment = (aptData: Omit<Appointment, 'id' | 'hospitalId' | 'tokenNumber' | 'bookedAt' | 'status'>): Appointment => {
    const todayTokens = appointments.filter(a => a.appointmentDate === aptData.appointmentDate);
    const tokenNumber = todayTokens.length + 1;

    const newApt: Appointment = {
      ...aptData,
      id: `apt-${Date.now()}`,
      hospitalId: hospId,
      tokenNumber,
      tokenFormatted: `OP-${tokenNumber}`,
      bookingSource: 'walk_in',
      bookedAt: new Date().toISOString(),
      status: 'scheduled'
    };

    const updated = [newApt, ...appointments];
    updateAppointments(updated);
    firestoreService.setDocument(hospId, 'appointments', newApt.id, newApt).catch(err => console.warn('Firestore set appointment error:', err));
    logAudit('APPOINTMENT_BOOKED', 'OPD Management', `Token #${tokenNumber} for ${newApt.patientName} with ${newApt.doctorName}`);
    success('Appointment Confirmed', `Token #${tokenNumber} generated.`);
    return newApt;
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status } : a);
    updateAppointments(updated);
    firestoreService.updateDocument(hospId, 'appointments', id, { status }).catch(err => console.warn('Firestore update appointment status error:', err));
  };

  const updateAppointment = (appointmentId: string, updates: Partial<Appointment>) => {
    const updated = appointments.map(a => a.id === appointmentId ? { ...a, ...updates } : a);
    updateAppointments(updated);
    firestoreService.updateDocument(hospId, 'appointments', appointmentId, updates).catch(err => console.warn('Firestore update appointment error:', err));
    success('Appointment Updated', 'Changes saved successfully.');
  };

  const saveConsultation = (consultationData: Omit<ConsultationRecord, 'id' | 'hospitalId' | 'consultedAt'>) => {
    const newConsultation: ConsultationRecord = {
      ...consultationData,
      id: `cons-${Date.now()}`,
      hospitalId: hospId,
      consultedAt: new Date().toISOString()
    };
    const updatedConsultations = [newConsultation, ...consultations];
    setConsultations(updatedConsultations);
    storageService.saveCollection(hospId, 'consultations', updatedConsultations);

    updateAppointmentStatus(consultationData.appointmentId, 'completed');

    let newOrders: LabOrder[] = [];
    if (consultationData.labTestsOrdered && consultationData.labTestsOrdered.length > 0) {
      newOrders = consultationData.labTestsOrdered.map((testName, idx) => ({
        id: `lab-${Date.now()}-${idx}`,
        hospitalId: hospId,
        orderNumber: `LAB-${new Date().getFullYear()}-${String(labOrders.length + idx + 1).padStart(4, '0')}`,
        patientId: consultationData.patientId,
        patientName: consultationData.patientName,
        patientUhid: consultationData.patientUhid,
        patientAge: 35,
        patientGender: 'Male',
        doctorId: consultationData.doctorId,
        doctorName: consultationData.doctorName,
        testCategory: 'Biochemistry',
        testName,
        sampleType: 'Whole Blood',
        sampleStatus: 'pending',
        referenceRange: 'Normal',
        unit: 'mg/dL',
        cost: 500,
        isBilled: false,
        orderedAt: new Date().toISOString()
      }));
      const updatedLab = [...newOrders, ...labOrders];
      setLabOrders(updatedLab);
      storageService.saveCollection(hospId, 'labOrders', updatedLab);
    }

    let newRadOrders: RadiologyOrder[] = [];
    const radList = consultationData.radiologyOrdered || consultationData.radiologyTestsOrdered;
    if (radList && radList.length > 0) {
      newRadOrders = radList.map((testName, idx) => ({
        id: `rad-${Date.now()}-${idx}`,
        hospitalId: hospId,
        orderNumber: `RAD-${new Date().getFullYear()}-${String(radiologyOrders.length + idx + 1).padStart(4, '0')}`,
        patientId: consultationData.patientId,
        patientName: consultationData.patientName,
        patientUhid: consultationData.patientUhid,
        doctorId: consultationData.doctorId,
        doctorName: consultationData.doctorName,
        modality: 'X-Ray',
        bodyPart: testName,
        clinicalIndication: consultationData.provisionalDiagnosis || 'Clinical investigation',
        status: 'scheduled',
        cost: 1200,
        isBilled: true,
        orderedAt: new Date().toISOString()
      }));
      const updatedRad = [...newRadOrders, ...radiologyOrders];
      setRadiologyOrders(updatedRad);
      storageService.saveCollection(hospId, 'radiologyOrders', updatedRad);
    }

    logAudit('CONSULTATION_COMPLETED', 'Doctor Clinical', `Consultation for ${consultationData.patientName}`);
    success('Consultation Saved', 'Prescriptions and orders queued.');
  };

  const requestAdditionalRole = (employeeId: string, roleToRequest: RoleId, reason: string, requestType: 'add' | 'remove' = 'add') => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    if (requestType === 'remove') {
      if (emp.primaryRole === roleToRequest) {
        error('Protected Primary Role', 'Primary Role cannot be removed. Contact Hospital Administration for re-assignment.');
        return;
      }
      if (!emp.additionalRoles.includes(roleToRequest)) {
        error('Role Not Assigned', 'Employee does not possess this additional role.');
        return;
      }
    }

    const newReq: RoleRequest = {
      id: `req-${Date.now()}`,
      hospitalId: hospId,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.employeeCode,
      currentPrimaryRole: emp.primaryRole,
      requestedRole: roleToRequest,
      requestType,
      reason,
      requestedBy: {
        id: currentUser?.id || emp.id,
        name: currentUser?.name || emp.name,
        role: currentUser?.primaryRole || emp.primaryRole
      },
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    updateRoleRequests([newReq, ...roleRequests]);
    firestoreService.setDocument(hospId, 'roleRequests', newReq.id, newReq).catch(err => console.warn(err));
    success('Request Submitted', 'Awaiting Admin review.');
  };

  const approveRoleRequest = (requestId: string) => {
    const req = roleRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;

    const updatedReqs: RoleRequest[] = roleRequests.map(r =>
      r.id === requestId ? { ...r, status: 'approved' as const, reviewedAt: new Date().toISOString() } : r
    );
    updateRoleRequests(updatedReqs);
    firestoreService.updateDocument(hospId, 'roleRequests', requestId, { status: 'approved' }).catch(err => console.warn(err));

    const updatedEmps = employees.map(emp => {
      if (emp.id === req.employeeId) {
        const newRoles = req.requestType === 'remove'
          ? emp.additionalRoles.filter(r => r !== req.requestedRole)
          : Array.from(new Set([...emp.additionalRoles, req.requestedRole]));
        return { ...emp, additionalRoles: newRoles };
      }
      return emp;
    });
    updateEmployees(updatedEmps);
    refreshUser();
    success('Role Approved', 'Permissions updated.');
  };

  const rejectRoleRequest = (requestId: string, rejectionReason: string) => {
    const updatedReqs: RoleRequest[] = roleRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const, rejectionReason } : r
    );
    updateRoleRequests(updatedReqs);
    firestoreService.updateDocument(hospId, 'roleRequests', requestId, { status: 'rejected', rejectionReason }).catch(err => console.warn(err));
    info('Role Rejected', 'Rejection recorded.');
  };

  const toggleRoleTemplateActive = (roleId: RoleId, isActive: boolean) => {
    if (roleTemplates[roleId].isMandatory) {
      error('Mandatory Role', 'Owner and Admin roles cannot be deactivated.');
      return;
    }
    const updated = {
      ...roleTemplates,
      [roleId]: { ...roleTemplates[roleId], isActiveForHospital: isActive }
    };
    setRoleTemplates(updated);
    success('Role Template Updated', `${roleTemplates[roleId].name} is now ${isActive ? 'active' : 'inactive'}.`);
  };

  const admitPatient = (admissionData: Omit<Admission, 'id' | 'hospitalId' | 'admissionNumber' | 'status'>) => {
    const targetBed = beds.find(b => b.id === admissionData.bedId);
    if (!targetBed || targetBed.status !== 'available') {
      error('Bed Unavailable', 'Selected bed is not available.');
      return;
    }

    const admNumber = `IP-${new Date().getFullYear()}-${String(admissions.length + 101).padStart(4, '0')}`;
    const newAdm: Admission = {
      ...admissionData,
      id: `adm-${Date.now()}`,
      hospitalId: hospId,
      admissionNumber: admNumber,
      status: 'active'
    };

    updateBeds(beds.map(b => b.id === admissionData.bedId ? { ...b, status: 'occupied' as Bed['status'], admissionId: newAdm.id } : b));
    updateAdmissions([newAdm, ...admissions]);
    success('Admission Completed', `Assigned to Bed ${admissionData.bedNumber}.`);
  };

  const transferBed = (admissionId: string, newBedId: string) => {
    const adm = admissions.find(a => a.id === admissionId);
    const newBed = beds.find(b => b.id === newBedId);
    if (!adm || !newBed || newBed.status !== 'available') {
      error('Transfer Error', 'Target bed is not available.');
      return;
    }

    updateBeds(beds.map(b => {
      if (b.id === adm.bedId) return { ...b, status: 'cleaning' as Bed['status'], admissionId: undefined };
      if (b.id === newBedId) return { ...b, status: 'occupied' as Bed['status'], admissionId: adm.id };
      return b;
    }));
    updateAdmissions(admissions.map(a => a.id === admissionId ? { ...a, bedId: newBed.id, bedNumber: newBed.bedNumber } : a));
    success('Bed Transferred', `Moved to Bed ${newBed.bedNumber}.`);
  };

  const dischargePatient = (admissionId: string, summary: Admission['dischargeSummary']) => {
    const adm = admissions.find(a => a.id === admissionId);
    if (!adm) return;

    updateBeds(beds.map(b => b.id === adm.bedId ? { ...b, status: 'cleaning' as Bed['status'], admissionId: undefined } : b));
    updateAdmissions(admissions.map(a => a.id === admissionId ? { ...a, status: 'discharged' as const, dischargeSummary: summary } : a));
    success('Discharge Complete', 'Patient discharged.');
  };

  const updateBedStatus = (bedId: string, status: Bed['status']) => {
    updateBeds(beds.map(b => b.id === bedId ? { ...b, status } : b));
    firestoreService.updateDocument(hospId, 'beds', bedId, { status }).catch(err => console.warn(err));
  };

  const dispensePrescription = (dispenseData: Omit<PharmacyDispense, 'id' | 'hospitalId' | 'dispenseNumber' | 'dispensedAt'>) => {
    const dispNumber = `PHARM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const newDisp: PharmacyDispense = {
      ...dispenseData,
      id: `disp-${Date.now()}`,
      hospitalId: hospId,
      dispenseNumber: dispNumber,
      dispensedAt: new Date().toISOString()
    };
    success('Prescription Dispensed', `Dispense #${dispNumber} finalized.`);
  };

  const updateLabOrderResult = (orderId: string, resultValue: string, isAbnormal: boolean, remarks?: string) => {
    updateLabOrderStatus(orderId, 'completed', { resultValue, isAbnormal, remarks });
  };

  const verifyLabOrder = (orderId: string, verifierName: string) => {
    updateLabOrderStatus(orderId, 'verified', { verifiedBy: verifierName });
  };

  const updateRadiologyStatus = (orderId: string, status: RadiologyOrder['status']) => {
    setRadiologyOrders(prev => prev.map(r => r.id === orderId ? { ...r, status } : r));
  };

  const saveRadiologyReport = (orderId: string, findings: string, impression: string, radiologistName: string) => {
    setRadiologyOrders(prev => prev.map(r => r.id === orderId ? { ...r, findings, impression, radiologistName, status: 'verified' } : r));
    success('Radiology Signed', 'Report verified.');
  };

  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'hospitalId' | 'invoiceNumber' | 'createdAt'>): Invoice => {
    const invNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 501).padStart(5, '0')}`;
    const newInv: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      hospitalId: hospId,
      invoiceNumber: invNumber,
      createdAt: new Date().toISOString()
    };
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    storageService.saveCollection(hospId, 'invoices', updated);
    firestoreService.setDocument(hospId, 'bills', newInv.id, newInv).catch(err => console.warn(err));
    return newInv;
  };

  const updateInvoice = (invoiceId: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, ...updates } : i));
    firestoreService.updateDocument(hospId, 'bills', invoiceId, updates).catch(err => console.warn(err));
  };

  const recordPayment = (invoiceId: string, amount: number, method: Invoice['paymentMethod'], ref?: string) => {
    recordInvoicePayment(invoiceId, amount, method, ref);
  };

  const recordExpense = (expenseData: Omit<HospitalExpense, 'id' | 'hospitalId' | 'expenseNumber'>) => {
    const newExp: HospitalExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      hospitalId: hospId,
      expenseNumber: `EXP-${new Date().getFullYear()}-${String(expenses.length + 101).padStart(4, '0')}`
    };
    setExpenses(prev => [newExp, ...prev]);
    firestoreService.setDocument(hospId, 'expenses', newExp.id, newExp).catch(err => console.warn(err));
  };

  const submitEmployeeRequest = (employeeData: Omit<Employee, 'id' | 'hospitalId' | 'status' | 'approvalDetails'>) => {
    const newEmp: Employee = {
      ...employeeData,
      id: `emp-${Date.now()}`,
      hospitalId: hospId,
      status: 'pending_approval'
    };
    setEmployees(prev => [newEmp, ...prev]);
    firestoreService.setDocument(hospId, 'employees', newEmp.id, newEmp).catch(err => console.warn(err));
    return { success: true, message: 'Submitted for Admin review', employee: newEmp };
  };

  const approveEmployeeRequest = (employeeId: string, approvedRoles?: RoleId[]) => {
    const updates = {
      status: 'active' as const,
      ...(approvedRoles ? { additionalRoles: approvedRoles } : {})
    };
    setEmployees(prev => prev.map(e => e.id === employeeId ? {
      ...e,
      ...updates
    } : e));
    firestoreService.updateDocument(hospId, 'employees', employeeId, updates).catch(err => console.warn(err));
    success('Employee Approved', 'Profile activated.');
  };

  const rejectEmployeeRequest = (employeeId: string, reason: string) => {
    const updates = { status: 'rejected' as const, rejectionReason: reason };
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, ...updates } : e));
    firestoreService.updateDocument(hospId, 'employees', employeeId, updates).catch(err => console.warn(err));
    info('Employee Rejected', reason);
  };

  const updateEmployee = (employeeId: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, ...updates } : e));
    firestoreService.updateDocument(hospId, 'employees', employeeId, updates).catch(err => console.warn(err));
  };

  const markAttendance = (employeeId: string, date: string, status: AttendanceRecord['status'], checkIn?: string, checkOut?: string) => {
    const rec: AttendanceRecord = {
      id: `att-${Date.now()}`,
      hospitalId: hospId,
      employeeId,
      employeeName: employees.find(e => e.id === employeeId)?.name || 'Staff',
      date,
      status,
      shift: 'General',
      checkInTime: checkIn,
      checkOutTime: checkOut
    };
    updateAttendance([rec, ...attendanceRecords]);
    success('Attendance Saved', `${rec.employeeName} marked ${status}.`);
  };

  const markBulkAttendance = (date: string, status: AttendanceRecord['status']) => {
    const newRecs: AttendanceRecord[] = employees.filter(e => e.status === 'active').map(e => ({
      id: `att-${Date.now()}-${e.id}`,
      hospitalId: hospId,
      employeeId: e.id,
      employeeName: e.name,
      date,
      status,
      shift: 'General'
    }));
    updateAttendance([...newRecs, ...attendanceRecords]);
    success('Bulk Attendance', `Marked ${status} for all staff.`);
  };

  const calculateMonthlyPayroll = (monthStr: string) => {
    const newPay: PayrollRecord[] = employees.filter(e => e.status === 'active').map((e, idx) => ({
      id: `pay-${monthStr}-${e.id}`,
      hospitalId: hospId,
      payrollPeriod: monthStr,
      employeeId: e.id,
      employeeName: e.name,
      employeeCode: e.employeeCode,
      departmentName: e.departmentName,
      basicSalary: 45000,
      allowances: { hra: 8000, medical: 3000, transport: 2500, special: 1500 },
      deductions: { pf: 3600, esi: 0, taxDeducted: 2500, otherDeductions: 0 },
      netSalary: 54400,
      paymentStatus: 'processed',
      paymentMethod: 'bank_transfer',
      generatedAt: new Date().toISOString()
    }));
    updatePayroll([...newPay, ...payrollRecords]);
    success('Payroll Processed', `Computed for ${monthStr}.`);
  };

  const updatePayrollStatus = (payrollId: string, status: PayrollRecord['paymentStatus'], ref?: string) => {
    setPayrollRecords(prev => prev.map(p => p.id === payrollId ? { ...p, paymentStatus: status, paymentReference: ref } : p));
    success('Payroll Status Updated', `Status changed to ${status}.`);
  };

  // Nurse Help Handlers
  const requestNurseTask = async (data: Omit<NurseTask, 'id' | 'hospitalId' | 'taskId' | 'status' | 'createdAt'>) => {
    const res = await firestoreService.requestNurseTask(hospId, data);
    if (res.success) {
      success('Nurse Request Sent', `Task dispatched to ${data.nurseName}.`);
    } else {
      error('Request Failed', res.error || 'Could not send task to nurse.');
    }
    return res;
  };

  const acceptNurseTask = async (taskId: string, nurseStaffId: string) => {
    const res = await firestoreService.acceptNurseTask(hospId, taskId, nurseStaffId);
    if (res.success) {
      success('Task Accepted', 'You are now marked as Busy on this assignment.');
    } else {
      error('Could Not Accept', res.error || 'Failed to accept task.');
    }
    return res;
  };

  const startNurseTask = async (taskId: string) => {
    const res = await firestoreService.startNurseTask(hospId, taskId);
    if (res.success) {
      info('Task In Progress', 'Work commenced on assignment.');
    }
    return res;
  };

  const completeNurseTask = async (taskId: string, nurseStaffId: string, completionNotes: string) => {
    const res = await firestoreService.completeNurseTask(hospId, taskId, nurseStaffId, completionNotes);
    if (res.success) {
      success('Task Completed', 'Assignment finalized. You are now Available for new tasks.');
    } else {
      error('Completion Error', res.error || 'Failed to complete task.');
    }
    return res;
  };

  const rejectNurseTask = async (taskId: string, nurseStaffId: string, rejectionReason: string) => {
    const res = await firestoreService.rejectNurseTask(hospId, taskId, nurseStaffId, rejectionReason);
    if (res.success) {
      info('Task Declined', 'Requester has been notified.');
    } else {
      error('Error', res.error || 'Failed to decline task.');
    }
    return res;
  };

  const cancelNurseTask = async (taskId: string) => {
    const res = await firestoreService.cancelNurseTask(hospId, taskId);
    if (res.success) {
      info('Task Cancelled', 'The task has been cancelled.');
    }
    return res;
  };

  const setNurseAvailability = async (nurseStaffId: string, status: 'available' | 'busy' | 'offline') => {
    await firestoreService.setNurseAvailability(hospId, nurseStaffId, status);
    success('Availability Updated', `Your status is now ${status.toUpperCase()}.`);
  };

  return (
    <HospitalContext.Provider
      value={{
        departments,
        employees,
        roleTemplates,
        roleRequests,
        patients,
        vitals,
        appointments,
        consultations,
        wards,
        beds,
        admissions,
        admissionRequests,
        medicines,
        labOrders,
        radiologyOrders,
        expenses,
        invoices,
        notifications,
        auditLogs,
        attendanceRecords,
        payrollRecords,
        nurseTasks,
        requestNurseTask,
        acceptNurseTask,
        startNurseTask,
        completeNurseTask,
        rejectNurseTask,
        cancelNurseTask,
        setNurseAvailability,
        posConnection,
        posMedicines,
        posLabTests,
        posRooms,
        handleConnectPos,
        handleDisconnectPos,
        submitOnlineAppointment,
        confirmOnlineAppointment,
        registerWalkInAppointment,
        completeClinicalConsultationWorkflow,
        dispensePrescriptionAtomic,
        updateLabOrderStatus,
        allocateBedToAdmissionRequest,
        dischargePatientFromBed,
        recordInvoicePayment,
        submitEmployeeRequest,
        approveEmployeeRequest,
        rejectEmployeeRequest,
        updateEmployee,
        markAttendance,
        markBulkAttendance,
        calculateMonthlyPayroll,
        updatePayrollStatus,
        addPatient,
        recordVitals,
        bookAppointment,
        updateAppointmentStatus,
        updateAppointment,
        saveConsultation,
        requestAdditionalRole,
        approveRoleRequest,
        rejectRoleRequest,
        toggleRoleTemplateActive,
        admitPatient,
        transferBed,
        dischargePatient,
        updateBedStatus,
        dispensePrescription,
        updateLabOrderResult,
        verifyLabOrder,
        updateRadiologyStatus,
        saveRadiologyReport,
        createInvoice,
        updateInvoice,
        recordPayment,
        recordExpense
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
