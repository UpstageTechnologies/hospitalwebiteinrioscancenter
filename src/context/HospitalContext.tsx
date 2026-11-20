import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  storageService,
  DEFAULT_RADIOLOGY_ORDERS,
  DEFAULT_EXPENSES,
  DEFAULT_EMPLOYEES,
  DEFAULT_ROLE_REQUESTS
} from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import type { Department } from '../types/hospital';
import type { RoleTemplate, RoleId } from '../types/roles';
import type { Employee } from '../types/employee';
import type { RoleRequest } from '../types/roleRequest';
import type { Patient, VitalSign } from '../types/patient';
import type { Appointment, ConsultationRecord, LabOrder, RadiologyOrder } from '../types/clinical';
import type { Bed, Ward, Admission } from '../types/admission';
import type { Medicine, PharmacyDispense } from '../types/pharmacy';
import type { Invoice, HospitalExpense } from '../types/billing';
import type { HospitalNotification, AuditLog } from '../types/audit';
import type { AttendanceRecord, PayrollRecord } from '../types/hr';
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
  medicines: Medicine[];
  labOrders: LabOrder[];
  radiologyOrders: RadiologyOrder[];
  expenses: HospitalExpense[];
  invoices: Invoice[];
  notifications: HospitalNotification[];
  auditLogs: AuditLog[];
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];

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

  const [departments, setDepartments] = useState<Department[]>(() =>
    storageService.getCollection<Department>(hospId, 'departments', [])
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    storageService.getCollection<Employee>(hospId, 'employees', DEFAULT_EMPLOYEES)
  );
  const [roleTemplates, setRoleTemplates] = useState<Record<RoleId, RoleTemplate>>(INITIAL_ROLE_TEMPLATES);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>(() =>
    storageService.getCollection<RoleRequest>(hospId, 'roleRequests', DEFAULT_ROLE_REQUESTS)
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
  const [medicines, setMedicines] = useState<Medicine[]>(() =>
    storageService.getCollection<Medicine>(hospId, 'medicines', [])
  );
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() =>
    storageService.getCollection<LabOrder>(hospId, 'labOrders', [])
  );
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>(() =>
    storageService.getCollection<RadiologyOrder>(hospId, 'radiologyOrders', DEFAULT_RADIOLOGY_ORDERS)
  );
  const [expenses, setExpenses] = useState<HospitalExpense[]>(() =>
    storageService.getCollection<HospitalExpense>(hospId, 'expenses', DEFAULT_EXPENSES)
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

  useEffect(() => {
    storageService.initHospital(hospId);
    setDepartments(storageService.getCollection(hospId, 'departments', []));
    setEmployees(storageService.getCollection(hospId, 'employees', []));
    setRoleRequests(storageService.getCollection(hospId, 'roleRequests', []));
    setPatients(storageService.getCollection(hospId, 'patients', []));
    setVitals(storageService.getCollection(hospId, 'vitals', []));
    setAppointments(storageService.getCollection(hospId, 'appointments', []));
    setConsultations(storageService.getCollection(hospId, 'consultations', []));
    setWards(storageService.getCollection(hospId, 'wards', []));
    setBeds(storageService.getCollection(hospId, 'beds', []));
    setAdmissions(storageService.getCollection(hospId, 'admissions', []));
    setMedicines(storageService.getCollection(hospId, 'medicines', []));
    setLabOrders(storageService.getCollection(hospId, 'labOrders', []));
    setInvoices(storageService.getCollection(hospId, 'invoices', []));
    setNotifications(storageService.getCollection(hospId, 'notifications', []));
    setAuditLogs(storageService.getCollection(hospId, 'auditLogs', []));
    setAttendanceRecords(storageService.getCollection(hospId, 'attendance', []));
    setPayrollRecords(storageService.getCollection(hospId, 'payroll', []));

    // Real-time Firestore Subscriptions
    const unsubDepts = firestoreService.subscribeToCollection<Department>(hospId, 'departments', (data) => {
      if (data && data.length > 0) {
        setDepartments(data);
        storageService.saveCollection(hospId, 'departments', data);
      }
    });

    const unsubEmps = firestoreService.subscribeToCollection<Employee>(hospId, 'employees', (data) => {
      if (data && data.length > 0) {
        setEmployees(data);
        storageService.saveCollection(hospId, 'employees', data);
      }
    });

    const unsubReqs = firestoreService.subscribeToCollection<RoleRequest>(hospId, 'roleRequests', (data) => {
      if (data && data.length > 0) {
        setRoleRequests(data);
        storageService.saveCollection(hospId, 'roleRequests', data);
      }
    });

    const unsubPatients = firestoreService.subscribeToCollection<Patient>(hospId, 'patients', (data) => {
      if (data && data.length > 0) {
        setPatients(data);
        storageService.saveCollection(hospId, 'patients', data);
      }
    });

    const unsubVitals = firestoreService.subscribeToCollection<VitalSign>(hospId, 'vitals', (data) => {
      if (data && data.length > 0) {
        setVitals(data);
        storageService.saveCollection(hospId, 'vitals', data);
      }
    });

    const unsubApts = firestoreService.subscribeToCollection<Appointment>(hospId, 'appointments', (data) => {
      if (data && data.length > 0) {
        setAppointments(data);
        storageService.saveCollection(hospId, 'appointments', data);
      }
    });

    const unsubCons = firestoreService.subscribeToCollection<ConsultationRecord>(hospId, 'consultations', (data) => {
      if (data && data.length > 0) {
        setConsultations(data);
        storageService.saveCollection(hospId, 'consultations', data);
      }
    });

    const unsubWards = firestoreService.subscribeToCollection<Ward>(hospId, 'wards', (data) => {
      if (data && data.length > 0) {
        setWards(data);
        storageService.saveCollection(hospId, 'wards', data);
      }
    });

    const unsubBeds = firestoreService.subscribeToCollection<Bed>(hospId, 'beds', (data) => {
      if (data && data.length > 0) {
        setBeds(data);
        storageService.saveCollection(hospId, 'beds', data);
      }
    });

    const unsubAdms = firestoreService.subscribeToCollection<Admission>(hospId, 'admissions', (data) => {
      if (data && data.length > 0) {
        setAdmissions(data);
        storageService.saveCollection(hospId, 'admissions', data);
      }
    });

    const unsubMeds = firestoreService.subscribeToCollection<Medicine>(hospId, 'medicines', (data) => {
      if (data && data.length > 0) {
        setMedicines(data);
        storageService.saveCollection(hospId, 'medicines', data);
      }
    });

    const unsubLabs = firestoreService.subscribeToCollection<LabOrder>(hospId, 'labOrders', (data) => {
      if (data && data.length > 0) {
        setLabOrders(data);
        storageService.saveCollection(hospId, 'labOrders', data);
      }
    });

    const unsubRads = firestoreService.subscribeToCollection<RadiologyOrder>(hospId, 'radiologyOrders', (data) => {
      if (data && data.length > 0) {
        setRadiologyOrders(data);
        storageService.saveCollection(hospId, 'radiologyOrders', data);
      }
    });

    const unsubExpenses = firestoreService.subscribeToCollection<HospitalExpense>(hospId, 'expenses', (data) => {
      if (data && data.length > 0) {
        setExpenses(data);
        storageService.saveCollection(hospId, 'expenses', data);
      }
    });

    const unsubBills = firestoreService.subscribeToCollection<Invoice>(hospId, 'bills', (data) => {
      if (data && data.length > 0) {
        setInvoices(data);
        storageService.saveCollection(hospId, 'invoices', data);
      }
    });

    const unsubNotifs = firestoreService.subscribeToCollection<HospitalNotification>(hospId, 'notifications', (data) => {
      if (data && data.length > 0) {
        setNotifications(data);
        storageService.saveCollection(hospId, 'notifications', data);
      }
    });

    const unsubLogs = firestoreService.subscribeToCollection<AuditLog>(hospId, 'auditLogs', (data) => {
      if (data && data.length > 0) {
        setAuditLogs(data);
        storageService.saveCollection(hospId, 'auditLogs', data);
      }
    });

    const unsubAtt = firestoreService.subscribeToCollection<AttendanceRecord>(hospId, 'attendance', (data) => {
      if (data && data.length > 0) {
        setAttendanceRecords(data);
        storageService.saveCollection(hospId, 'attendance', data);
      }
    });

    const unsubPay = firestoreService.subscribeToCollection<PayrollRecord>(hospId, 'payroll', (data) => {
      if (data && data.length > 0) {
        setPayrollRecords(data);
        storageService.saveCollection(hospId, 'payroll', data);
      }
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
      unsubMeds();
      unsubLabs();
      unsubRads();
      unsubExpenses();
      unsubBills();
      unsubNotifs();
      unsubLogs();
      unsubAtt();
      unsubPay();
    };
  }, [hospId]);

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
        sampleStatus: 'pending_collection',
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
        modality: (testName.toLowerCase().includes('ct')
          ? 'CT Scan'
          : testName.toLowerCase().includes('mri')
          ? 'MRI'
          : testName.toLowerCase().includes('ultra')
          ? 'Ultrasound'
          : testName.toLowerCase().includes('ecg')
          ? 'ECG'
          : 'X-Ray') as RadiologyOrder['modality'],
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

    // Auto-create Billing charges for consultation & lab/prescriptions/radiology
    const billItems = [
      {
        id: `item-cons-${Date.now()}`,
        description: `OPD Consultation Fee - ${consultationData.doctorName}`,
        category: 'Consultation' as const,
        quantity: 1,
        unitPrice: 1200,
        total: 1200
      }
    ];

    if (consultationData.labTestsOrdered && consultationData.labTestsOrdered.length > 0) {
      consultationData.labTestsOrdered.forEach((test, idx) => {
        billItems.push({
          id: `item-lab-${Date.now()}-${idx}`,
          description: `Laboratory Test: ${test}`,
          category: 'Lab Test' as const,
          quantity: 1,
          unitPrice: 650,
          total: 650
        });
      });
    }

    if (radList && radList.length > 0) {
      radList.forEach((test, idx) => {
        billItems.push({
          id: `item-rad-${Date.now()}-${idx}`,
          description: `Radiology Imaging: ${test}`,
          category: 'Radiology' as const,
          quantity: 1,
          unitPrice: 1200,
          total: 1200
        });
      });
    }

    if (consultationData.prescriptions && consultationData.prescriptions.length > 0) {
      consultationData.prescriptions.forEach((rx, idx) => {
        billItems.push({
          id: `item-rx-${Date.now()}-${idx}`,
          description: `Rx: ${rx.medicineName} (${rx.dosage})`,
          category: 'Pharmacy' as const,
          quantity: 1,
          unitPrice: 280,
          total: 280
        });
      });
    }

    const subtotal = billItems.reduce((sum, b) => sum + b.total, 0);
    const tax = Math.round(subtotal * 0.05);
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      hospitalId: hospId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
      invoiceType: 'OPD',
      patientId: consultationData.patientId,
      patientName: consultationData.patientName,
      patientUhid: consultationData.patientUhid,
      patientPhone: '+91 98111 22334',
      items: billItems,
      subtotal,
      discountAmount: 0,
      taxAmount: tax,
      totalAmount: subtotal + tax,
      amountPaid: 0,
      balanceDue: subtotal + tax,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      createdByStaffName: consultationData.doctorName
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    storageService.saveCollection(hospId, 'invoices', updatedInvoices);

    firestoreService.saveConsultationAtomic(
      hospId,
      newConsultation,
      consultationData.appointmentId,
      newOrders,
      newRadOrders,
      newInvoice
    ).catch(err => console.warn('Firestore saveConsultationAtomic error:', err));

    logAudit('CONSULTATION_COMPLETED', 'Doctor Clinical', `Consultation for ${consultationData.patientName} (${consultationData.patientUhid}) - ${consultationData.provisionalDiagnosis}`);
    success('Consultation Saved', 'Prescriptions, diagnostic orders & billing charges generated.');
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
      const hasPendingRemove = roleRequests.some(r => r.employeeId === employeeId && r.requestedRole === roleToRequest && r.requestType === 'remove' && r.status === 'pending');
      if (hasPendingRemove) {
        error('Request Pending', 'A removal request for this role is already awaiting Admin approval.');
        return;
      }
    } else {
      if (emp.primaryRole === roleToRequest || emp.additionalRoles.includes(roleToRequest)) {
        error('Role Already Active', `Employee already has ${roleTemplates[roleToRequest]?.name || roleToRequest}`);
        return;
      }
      const hasPending = roleRequests.some(r => r.employeeId === employeeId && r.requestedRole === roleToRequest && r.requestType !== 'remove' && r.status === 'pending');
      if (hasPending) {
        error('Request Pending', `A request for this role is already awaiting Admin approval.`);
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
    firestoreService.setDocument(hospId, 'roleRequests', newReq.id, newReq).catch(err => console.warn('Firestore set roleRequest error:', err));

    const notif: HospitalNotification = {
      id: `notif-${Date.now()}`,
      hospitalId: hospId,
      targetRole: 'admin',
      title: requestType === 'remove' ? 'Role Removal Request Pending Review' : 'New Role Request Pending Review',
      message: `${emp.name} (${emp.employeeCode}) requested ${requestType === 'remove' ? 'removal of' : 'assignment of'} ${roleTemplates[roleToRequest]?.name || roleToRequest}. Reason: ${reason}`,
      category: 'role_request',
      priority: 'high',
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedRecordId: newReq.id
    };
    updateNotifications([notif, ...notifications]);
    firestoreService.setDocument(hospId, 'notifications', notif.id, notif).catch(err => console.warn('Firestore set notification error:', err));

    logAudit('ROLE_REQUEST_CREATED', 'Role Governance', `Requested ${requestType === 'remove' ? 'removal' : 'addition'} of role ${roleTemplates[roleToRequest]?.name || roleToRequest} for ${emp.name}`, newReq.id);
    success(requestType === 'remove' ? 'Removal Request Submitted' : 'Role Request Submitted', 'Sent to Hospital Admin for approval.');
  };

  const approveRoleRequest = (requestId: string) => {
    const req = roleRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;

    const updatedReqs: RoleRequest[] = roleRequests.map(r =>
      r.id === requestId
        ? {
            ...r,
            status: 'approved' as const,
            reviewedBy: {
              id: currentUser?.id || 'emp-admin-01',
              name: currentUser?.name || 'Hospital Admin'
            },
            reviewedAt: new Date().toISOString()
          }
        : r
    );
    updateRoleRequests(updatedReqs);
    firestoreService.updateDocument(hospId, 'roleRequests', requestId, {
      status: 'approved',
      reviewedBy: {
        id: currentUser?.id || 'emp-admin-01',
        name: currentUser?.name || 'Hospital Admin'
      },
      reviewedAt: new Date().toISOString()
    }).catch(err => console.warn('Firestore update roleRequest error:', err));

    const updatedEmps = employees.map(emp => {
      if (emp.id === req.employeeId) {
        if (req.requestType === 'remove') {
          const newRoles = emp.additionalRoles.filter(r => r !== req.requestedRole);
          return { ...emp, additionalRoles: newRoles };
        } else {
          const newRoles = Array.from(new Set([...emp.additionalRoles, req.requestedRole]));
          return { ...emp, additionalRoles: newRoles };
        }
      }
      return emp;
    });
    updateEmployees(updatedEmps);
    const targetApprovedEmp = updatedEmps.find(e => e.id === req.employeeId);
    if (targetApprovedEmp) {
      firestoreService.setDocument(hospId, 'employees', req.employeeId, targetApprovedEmp).catch(err => console.warn('Firestore update employee error:', err));
    }
    refreshUser();

    const notif: HospitalNotification = {
      id: `notif-${Date.now()}`,
      hospitalId: hospId,
      targetUserId: req.employeeId,
      title: req.requestType === 'remove' ? 'Role Deactivation Approved' : 'Additional Role Approved!',
      message: req.requestType === 'remove'
        ? `Your request to remove ${roleTemplates[req.requestedRole]?.name || req.requestedRole} has been approved by Admin.`
        : `Your request for ${roleTemplates[req.requestedRole]?.name || req.requestedRole} has been approved by Admin.`,
      category: 'role_request',
      priority: 'normal',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    updateNotifications([notif, ...notifications]);
    firestoreService.setDocument(hospId, 'notifications', notif.id, notif).catch(err => console.warn('Firestore set notification error:', err));

    logAudit('ROLE_REQUEST_APPROVED', 'Role Governance', `Admin approved ${req.requestType === 'remove' ? 'removal' : 'addition'} of ${roleTemplates[req.requestedRole]?.name || req.requestedRole} for ${req.employeeName}`, req.id);
    success(req.requestType === 'remove' ? 'Role Deactivated' : 'Role Approved', req.requestType === 'remove' ? `${roleTemplates[req.requestedRole]?.name || req.requestedRole} has been revoked.` : `${roleTemplates[req.requestedRole]?.name || req.requestedRole} is now active.`);
  };

  const rejectRoleRequest = (requestId: string, rejectionReason: string) => {
    const req = roleRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;

    const updatedReqs: RoleRequest[] = roleRequests.map(r =>
      r.id === requestId
        ? {
            ...r,
            status: 'rejected',
            rejectionReason,
            reviewedBy: {
              id: currentUser?.id || 'emp-admin-01',
              name: currentUser?.name || 'Hospital Admin'
            },
            reviewedAt: new Date().toISOString()
          }
        : r
    );
    updateRoleRequests(updatedReqs);
    firestoreService.updateDocument(hospId, 'roleRequests', requestId, {
      status: 'rejected',
      rejectionReason,
      reviewedBy: {
        id: currentUser?.id || 'emp-admin-01',
        name: currentUser?.name || 'Hospital Admin'
      },
      reviewedAt: new Date().toISOString()
    }).catch(err => console.warn('Firestore update roleRequest error:', err));

    const notif: HospitalNotification = {
      id: `notif-${Date.now()}`,
      hospitalId: hospId,
      targetUserId: req.employeeId,
      title: 'Role Request Rejected',
      message: `Request for ${roleTemplates[req.requestedRole].name} was rejected: ${rejectionReason}`,
      category: 'role_request',
      priority: 'normal',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    updateNotifications([notif, ...notifications]);
    firestoreService.setDocument(hospId, 'notifications', notif.id, notif).catch(err => console.warn('Firestore set notification error:', err));

    logAudit('ROLE_REQUEST_REJECTED', 'Role Governance', `Admin rejected ${roleTemplates[req.requestedRole].name} for ${req.employeeName}`, req.id);
    info('Role Rejected', `Rejection recorded with reason.`);
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
    logAudit('ROLE_TEMPLATE_TOGGLED', 'Role Governance', `${isActive ? 'Activated' : 'Deactivated'} ${roleTemplates[roleId].name}`);
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

    const updatedBeds = beds.map(b =>
      b.id === admissionData.bedId
        ? {
            ...b,
            status: 'occupied' as Bed['status'],
            currentPatientId: admissionData.patientId,
            currentPatientName: admissionData.patientName,
            currentPatientUhid: admissionData.patientUhid,
            admissionId: newAdm.id
          }
        : b
    );
    updateBeds(updatedBeds);

    const updatedPatients = patients.map(p => p.id === admissionData.patientId ? { ...p, status: 'IP' as const } : p);
    updatePatients(updatedPatients);

    updateAdmissions([newAdm, ...admissions]);
    firestoreService.setDocument(hospId, 'admissions', newAdm.id, newAdm).catch(err => console.warn(err));
    firestoreService.updateDocument(hospId, 'beds', admissionData.bedId, {
      status: 'occupied',
      currentPatientId: admissionData.patientId,
      currentPatientName: admissionData.patientName,
      currentPatientUhid: admissionData.patientUhid,
      admissionId: newAdm.id
    }).catch(err => console.warn(err));
    firestoreService.updateDocument(hospId, 'patients', admissionData.patientId, { status: 'IP' }).catch(err => console.warn(err));

    logAudit('PATIENT_ADMITTED', 'IPD Ward Care', `Admitted ${admissionData.patientName} to Bed ${admissionData.bedNumber}`, newAdm.id);
    success('Admission Completed', `Assigned to Bed ${admissionData.bedNumber}.`);
  };

  const transferBed = (admissionId: string, newBedId: string) => {
    const adm = admissions.find(a => a.id === admissionId);
    const newBed = beds.find(b => b.id === newBedId);
    if (!adm || !newBed || newBed.status !== 'available') {
      error('Transfer Error', 'Target bed is not available.');
      return;
    }

    const updatedBeds = beds.map(b => {
      if (b.id === adm.bedId) {
        return { ...b, status: 'cleaning' as Bed['status'], currentPatientId: undefined, currentPatientName: undefined, currentPatientUhid: undefined, admissionId: undefined };
      }
      if (b.id === newBedId) {
        return {
          ...b,
          status: 'occupied' as Bed['status'],
          currentPatientId: adm.patientId,
          currentPatientName: adm.patientName,
          currentPatientUhid: adm.patientUhid,
          admissionId: adm.id
        };
      }
      return b;
    });
    updateBeds(updatedBeds);

    const updatedAdms = admissions.map(a =>
      a.id === admissionId ? { ...a, bedId: newBed.id, bedNumber: newBed.bedNumber, wardId: newBed.wardId, wardName: newBed.wardName } : a
    );
    updateAdmissions(updatedAdms);

    firestoreService.updateDocument(hospId, 'beds', adm.bedId, {
      status: 'cleaning',
      currentPatientId: null,
      currentPatientName: null,
      currentPatientUhid: null,
      admissionId: null
    }).catch(err => console.warn(err));
    firestoreService.updateDocument(hospId, 'beds', newBedId, {
      status: 'occupied',
      currentPatientId: adm.patientId,
      currentPatientName: adm.patientName,
      currentPatientUhid: adm.patientUhid,
      admissionId: adm.id
    }).catch(err => console.warn(err));
    firestoreService.updateDocument(hospId, 'admissions', admissionId, {
      bedId: newBed.id,
      bedNumber: newBed.bedNumber,
      wardId: newBed.wardId,
      wardName: newBed.wardName
    }).catch(err => console.warn(err));

    logAudit('BED_TRANSFER', 'IPD Ward Care', `Transferred ${adm.patientName} to Bed ${newBed.bedNumber}`);
    success('Bed Transferred', `Moved to Bed ${newBed.bedNumber}.`);
  };

  const dischargePatient = (admissionId: string, summary: Admission['dischargeSummary']) => {
    const adm = admissions.find(a => a.id === admissionId);
    if (!adm) return;

    const updatedBeds = beds.map(b =>
      b.id === adm.bedId
        ? { ...b, status: 'cleaning' as Bed['status'], currentPatientId: undefined, currentPatientName: undefined, currentPatientUhid: undefined, admissionId: undefined }
        : b
    );
    updateBeds(updatedBeds);

    const updatedAdms = admissions.map(a =>
      a.id === admissionId
        ? { ...a, status: 'discharged' as const, dischargeDate: new Date().toISOString(), dischargeSummary: summary }
        : a
    );
    updateAdmissions(updatedAdms);

    const updatedPatients = patients.map(p => p.id === adm.patientId ? { ...p, status: 'Discharged' as const } : p);
    updatePatients(updatedPatients);

    firestoreService.updateDocument(hospId, 'beds', adm.bedId, {
      status: 'cleaning',
      currentPatientId: null,
      currentPatientName: null,
      currentPatientUhid: null,
      admissionId: null
    }).catch(err => console.warn(err));
    firestoreService.updateDocument(hospId, 'admissions', admissionId, {
      status: 'discharged',
      dischargeDate: new Date().toISOString(),
      dischargeSummary: summary
    }).catch(err => console.warn(err));
    firestoreService.updateDocument(hospId, 'patients', adm.patientId, { status: 'Discharged' }).catch(err => console.warn(err));

    logAudit('PATIENT_DISCHARGED', 'IPD Ward Care', `Discharged ${adm.patientName} from Bed ${adm.bedNumber}`, admissionId);
    success('Discharge Complete', `Patient discharged.`);
  };

  const updateBedStatus = (bedId: string, status: Bed['status']) => {
    const updatedBeds = beds.map(b => b.id === bedId ? { ...b, status } : b);
    updateBeds(updatedBeds);
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

    const updatedMeds = medicines.map(med => {
      const dispensedItem = dispenseData.items.find(i => i.medicineId === med.id);
      if (dispensedItem) {
        const remaining = Math.max(0, med.currentStock - dispensedItem.quantity);
        return { ...med, currentStock: remaining };
      }
      return med;
    });
    setMedicines(updatedMeds);
    storageService.saveCollection(hospId, 'medicines', updatedMeds);
    firestoreService.setDocument(hospId, 'dispenses', newDisp.id, newDisp).catch(err => console.warn(err));
    updatedMeds.forEach(m => firestoreService.updateDocument(hospId, 'medicines', m.id, { currentStock: m.currentStock }).catch(err => console.warn(err)));

    logAudit('MEDICINE_DISPENSED', 'Pharmacy', `Dispensed #${dispNumber} to ${dispenseData.patientName} - ₹${dispenseData.grandTotal}`);
    success('Prescription Dispensed', `Dispense #${dispNumber} finalized.`);
  };

  const updateLabOrderResult = (orderId: string, resultValue: string, isAbnormal: boolean, remarks?: string) => {
    const updated = labOrders.map(l =>
      l.id === orderId
        ? { ...l, resultValue, isAbnormal, remarks, sampleStatus: 'completed' as const }
        : l
    );
    setLabOrders(updated);
    storageService.saveCollection(hospId, 'labOrders', updated);
    firestoreService.updateDocument(hospId, 'labOrders', orderId, {
      resultValue,
      isAbnormal,
      remarks,
      sampleStatus: 'completed'
    }).catch(err => console.warn(err));
    success('Test Result Saved', 'Ready for verification.');
  };

  const verifyLabOrder = (orderId: string, verifierName: string) => {
    const updated = labOrders.map(l =>
      l.id === orderId
        ? { ...l, sampleStatus: 'verified' as const, verifiedBy: verifierName, verifiedAt: new Date().toISOString() }
        : l
    );
    setLabOrders(updated);
    storageService.saveCollection(hospId, 'labOrders', updated);
    firestoreService.updateDocument(hospId, 'labOrders', orderId, {
      sampleStatus: 'verified',
      verifiedBy: verifierName,
      verifiedAt: new Date().toISOString()
    }).catch(err => console.warn(err));

    logAudit('LAB_RESULT_VERIFIED', 'Laboratory', `Lab order ${orderId} verified by ${verifierName}`);
    success('Report Verified', 'Results available to clinical doctor.');
  };

  const updateRadiologyStatus = (orderId: string, status: RadiologyOrder['status']) => {
    const updated = radiologyOrders.map(r =>
      r.id === orderId ? { ...r, status } : r
    );
    setRadiologyOrders(updated);
    storageService.saveCollection(hospId, 'radiologyOrders', updated);
    firestoreService.updateDocument(hospId, 'radiologyOrders', orderId, { status }).catch(err => console.warn(err));
    success('Imaging Status Updated', `Order status changed to ${status}.`);
  };

  const saveRadiologyReport = (orderId: string, findings: string, impression: string, radiologistName: string) => {
    const updated = radiologyOrders.map(r =>
      r.id === orderId
        ? {
            ...r,
            findings,
            impression,
            radiologistName,
            status: 'verified' as const,
            verifiedAt: new Date().toISOString()
          }
        : r
    );
    setRadiologyOrders(updated);
    storageService.saveCollection(hospId, 'radiologyOrders', updated);
    firestoreService.updateDocument(hospId, 'radiologyOrders', orderId, {
      findings,
      impression,
      radiologistName,
      status: 'verified',
      verifiedAt: new Date().toISOString()
    }).catch(err => console.warn(err));
    logAudit('RADIOLOGY_VERIFIED', 'Radiology', `Scan #${orderId} verified by ${radiologistName}`);
    success('Radiology Report Signed', 'Report verified & released to doctor.');
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

    logAudit('INVOICE_GENERATED', 'Billing & Finance', `Invoice #${invNumber} for ${newInv.patientName} - ₹${newInv.totalAmount}`);
    success('Invoice Generated', `Invoice #${invNumber} created.`);
    return newInv;
  };

  const updateInvoice = (invoiceId: string, updates: Partial<Invoice>) => {
    const updated = invoices.map(i => {
      if (i.id === invoiceId) {
        const merged = { ...i, ...updates };
        const balanceDue = Math.max(0, merged.totalAmount - merged.amountPaid);
        return {
          ...merged,
          balanceDue,
          paymentStatus: (balanceDue <= 0 ? 'paid' : (merged.amountPaid > 0 ? 'partial' : 'unpaid')) as Invoice['paymentStatus']
        };
      }
      return i;
    });
    setInvoices(updated);
    storageService.saveCollection(hospId, 'invoices', updated);
    firestoreService.updateDocument(hospId, 'bills', invoiceId, updates).catch(err => console.warn(err));
    logAudit('INVOICE_UPDATED', 'Billing & Finance', `Invoice ${invoiceId} updated`);
    success('Invoice Updated', 'Invoice changes saved successfully.');
  };

  const recordPayment = (invoiceId: string, amount: number, method: Invoice['paymentMethod'], ref?: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        const newPaid = inv.amountPaid + amount;
        const newBalance = inv.totalAmount - newPaid;
        return {
          ...inv,
          amountPaid: newPaid,
          balanceDue: newBalance,
          paymentStatus: (newBalance <= 0 ? 'paid' : 'partial') as Invoice['paymentStatus'],
          paymentMethod: method,
          transactionRef: ref || inv.transactionRef,
          receiptNumber: `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
        };
      }
      return inv;
    });
    setInvoices(updated);
    storageService.saveCollection(hospId, 'invoices', updated);
    firestoreService.recordInvoicePayment(hospId, invoiceId, amount, method, ref).catch(err => console.warn(err));
    logAudit('PAYMENT_RECEIVED', 'Billing & Finance', `Payment of ₹${amount} for Invoice ${invoiceId}`);
    success('Payment Recorded', `Amount ₹${amount} received.`);
  };

  const recordExpense = (expenseData: Omit<HospitalExpense, 'id' | 'hospitalId' | 'expenseNumber'>) => {
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(expenses.length + 101).padStart(4, '0')}`;
    const newExpense: HospitalExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      hospitalId: hospId,
      expenseNumber
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    storageService.saveCollection(hospId, 'expenses', updated);
    firestoreService.setDocument(hospId, 'expenses', newExpense.id, newExpense).catch(err => console.warn(err));
    logAudit('EXPENSE_RECORDED', 'Accounts & Finance', `Expense ${expenseNumber} recorded: ₹${expenseData.amount} for ${expenseData.category}`);
    success('Expense Voucher Saved', `Voucher ${expenseNumber} logged successfully.`);
  };

  // Phase 1 Employee Registration by HR
  const submitEmployeeRequest = (employeeData: Omit<Employee, 'id' | 'hospitalId' | 'status' | 'approvalDetails'>): { success: boolean; message: string; employee?: Employee } => {
    // 1. Enforce protection: HR cannot create owner or admin accounts
    if (employeeData.primaryRole === 'owner' || employeeData.primaryRole === 'admin') {
      error('Unauthorized Role', 'Hospital Owner and Hospital Admin roles cannot be created through HR employee registration.');
      return { success: false, message: 'Hospital Owner and Admin are protected administrative roles.' };
    }

    // 2. Prevent duplicate employee submissions (check mobile & employeeCode)
    const normalizedMobile = employeeData.phone.replace(/\D/g, '');
    const duplicatePhone = employees.find(e => e.phone.replace(/\D/g, '') === normalizedMobile);
    if (duplicatePhone) {
      error('Duplicate Submission', `An employee with mobile number ${employeeData.phone} already exists (${duplicatePhone.name} - ${duplicatePhone.employeeCode}).`);
      return { success: false, message: `Duplicate mobile number. Employee ${duplicatePhone.name} already exists.` };
    }

    const duplicateCode = employees.find(e => e.employeeCode.trim().toUpperCase() === employeeData.employeeCode.trim().toUpperCase());
    if (duplicateCode) {
      error('Duplicate Employee ID', `Employee ID ${employeeData.employeeCode} is already assigned to ${duplicateCode.name}.`);
      return { success: false, message: `Employee ID ${employeeData.employeeCode} already in use.` };
    }

    // 3. Create employee with status 'pending_approval'
    const newEmployee: Employee = {
      ...employeeData,
      id: `emp-${Date.now()}`,
      hospitalId: hospId,
      status: 'pending_approval',
      approvalDetails: {
        submittedBy: {
          id: currentUser?.id || 'emp-hr-01',
          name: currentUser?.name || 'Kavita Nambiar (HR)',
          role: currentUser?.primaryRole || 'hr_manager'
        },
        submittedAt: new Date().toISOString(),
        status: 'pending'
      }
    };

    const updatedEmployees = [newEmployee, ...employees];
    updateEmployees(updatedEmployees);
    firestoreService.setDocument(hospId, 'employees', newEmployee.id, newEmployee).catch(err => console.warn('Firestore set employee error:', err));

    // 4. Create Notification for Admin
    const adminNotif: HospitalNotification = {
      id: `notif-${Date.now()}`,
      hospitalId: hospId,
      targetRole: 'admin',
      title: 'New Employee Registration Pending Approval',
      message: `${currentUser?.name || 'HR Manager'} submitted ${newEmployee.name} (${newEmployee.designation} - ${newEmployee.primaryRole}). Review required.`,
      category: 'role_request',
      priority: 'high',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    updateNotifications([adminNotif, ...notifications]);
    firestoreService.setDocument(hospId, 'notifications', adminNotif.id, adminNotif).catch(err => console.warn('Firestore set notification error:', err));

    logAudit('EMPLOYEE_REQUEST_SUBMITTED', 'HR Management', `HR submitted employee registration for ${newEmployee.name} (${newEmployee.employeeCode}) as ${newEmployee.primaryRole}. Status: Pending Approval.`, newEmployee.id);
    success('Employee Request Submitted', `${newEmployee.name} has been submitted for Admin approval.`);

    return { success: true, message: 'Submitted for Admin Approval', employee: newEmployee };
  };

  const updateEmployee = (employeeId: string, updates: Partial<Employee>) => {
    const updatedEmployees = employees.map(e => e.id === employeeId ? { ...e, ...updates } : e);
    updateEmployees(updatedEmployees);
    firestoreService.updateDocument(hospId, 'employees', employeeId, updates).catch(err => console.warn('Firestore update employee error:', err));
    logAudit('EMPLOYEE_UPDATED', 'HR Management', `Employee ${employeeId} updated`);
    success('Employee Updated', 'Staff details updated successfully.');
  };

  // Phase 1 Admin Approval
  const approveEmployeeRequest = (
    employeeId: string,
    approvedAdditionalRoles?: RoleId[],
    rejectedAdditionalRoles?: { role: RoleId; reason?: string }[]
  ) => {
    if (currentUser?.primaryRole === 'hr_manager') {
      error('Unauthorized Action', 'HR Managers cannot approve employee registrations. Only Hospital Admin or Owner can approve.');
      return;
    }

    const targetEmp = employees.find(e => e.id === employeeId);
    if (!targetEmp) {
      error('Not Found', 'Employee not found.');
      return;
    }

    if (targetEmp.status === 'active') {
      info('Already Active', `${targetEmp.name} is already an active approved employee.`);
      return;
    }

    const finalAdditionalRoles = approvedAdditionalRoles !== undefined
      ? approvedAdditionalRoles
      : (targetEmp.requestedAdditionalRoles || targetEmp.additionalRoles || []);

    const finalRejectedRoles = rejectedAdditionalRoles !== undefined
      ? rejectedAdditionalRoles
      : (targetEmp.rejectedAdditionalRoles || []);

    const updatedEmployees = employees.map(e => {
      if (e.id === employeeId) {
        return {
          ...e,
          status: 'active' as const,
          attendanceStatus: 'present' as const,
          additionalRoles: finalAdditionalRoles,
          requestedAdditionalRoles: [],
          rejectedAdditionalRoles: finalRejectedRoles,
          approvalDetails: {
            submittedBy: e.approvalDetails?.submittedBy || {
              id: 'emp-hr-01',
              name: 'Kavita Nambiar',
              role: 'hr_manager'
            },
            submittedAt: e.approvalDetails?.submittedAt || e.joiningDate || new Date().toISOString(),
            reviewedBy: {
              id: currentUser?.id || 'emp-admin-01',
              name: currentUser?.name || 'Pooja Deshmukh (Admin)',
              role: currentUser?.primaryRole || 'admin'
            },
            reviewedAt: new Date().toISOString(),
            status: 'approved' as const
          }
        };
      }
      return e;
    });

    updateEmployees(updatedEmployees);
    const approvedEmp = updatedEmployees.find(e => e.id === employeeId);
    if (approvedEmp) {
      firestoreService.setDocument(hospId, 'employees', employeeId, approvedEmp).catch(err => console.warn('Firestore update employee error:', err));
    }
    refreshUser();

    // Automatically make employee available in Attendance for today
    const today = new Date().toISOString().split('T')[0];
    const existingAtt = attendanceRecords.find(a => a.employeeId === employeeId && a.date === today);
    if (!existingAtt) {
      const newAttRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        hospitalId: hospId,
        employeeId: targetEmp.id,
        employeeCode: targetEmp.employeeCode,
        employeeName: targetEmp.name,
        departmentName: targetEmp.departmentName,
        designation: targetEmp.designation,
        date: today,
        checkInTime: '09:00 AM',
        status: 'present',
        workHours: 8.0,
        syncWithBiometric: true
      };
      updateAttendance([newAttRecord, ...attendanceRecords]);
      firestoreService.setDocument(hospId, 'attendance', newAttRecord.id, newAttRecord).catch(err => console.warn('Firestore set attendance error:', err));
    }

    // Notify HR
    const hrNotif: HospitalNotification = {
      id: `notif-${Date.now()}`,
      hospitalId: hospId,
      targetRole: 'hr_manager',
      title: 'Employee Approved by Admin',
      message: `Admin ${currentUser?.name || 'Pooja Deshmukh'} approved ${targetEmp.name} (${targetEmp.employeeCode}). Access & Attendance activated.`,
      category: 'role_request',
      priority: 'normal',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    updateNotifications([hrNotif, ...notifications]);
    firestoreService.setDocument(hospId, 'notifications', hrNotif.id, hrNotif).catch(err => console.warn('Firestore set notification error:', err));

    logAudit('EMPLOYEE_APPROVED', 'Admin Approvals', `Approved and activated employee ${targetEmp.name} (${targetEmp.employeeCode}) as ${targetEmp.primaryRole}.`, targetEmp.id);
    success('Employee Approved', `${targetEmp.name} has been activated and added to Attendance.`);
  };

  // Phase 1 Admin Rejection
  const rejectEmployeeRequest = (employeeId: string, rejectionReason: string) => {
    if (currentUser?.primaryRole === 'hr_manager') {
      error('Unauthorized Action', 'HR Managers cannot reject employee registration requests.');
      return;
    }

    if (!rejectionReason.trim()) {
      error('Rejection Reason Required', 'Please provide a clear reason for rejecting the employee registration.');
      return;
    }

    const targetEmp = employees.find(e => e.id === employeeId);
    if (!targetEmp) return;

    const updatedEmployees = employees.map(e => {
      if (e.id === employeeId) {
        return {
          ...e,
          status: 'rejected' as const,
          approvalDetails: {
            submittedBy: e.approvalDetails?.submittedBy || {
              id: 'emp-hr-01',
              name: 'Kavita Nambiar',
              role: 'hr_manager'
            },
            submittedAt: e.approvalDetails?.submittedAt || e.joiningDate || new Date().toISOString(),
            reviewedBy: {
              id: currentUser?.id || 'emp-admin-01',
              name: currentUser?.name || 'Pooja Deshmukh (Admin)',
              role: currentUser?.primaryRole || 'admin'
            },
            reviewedAt: new Date().toISOString(),
            status: 'rejected' as const,
            rejectionReason
          }
        };
      }
      return e;
    });

    updateEmployees(updatedEmployees);
    const rejectedEmp = updatedEmployees.find(e => e.id === employeeId);
    if (rejectedEmp) {
      firestoreService.setDocument(hospId, 'employees', employeeId, rejectedEmp).catch(err => console.warn('Firestore update employee error:', err));
    }

    const hrNotif: HospitalNotification = {
      id: `notif-${Date.now()}`,
      hospitalId: hospId,
      targetRole: 'hr_manager',
      title: 'Employee Registration Rejected',
      message: `Admin rejected registration for ${targetEmp.name}. Reason: ${rejectionReason}`,
      category: 'role_request',
      priority: 'high',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    updateNotifications([hrNotif, ...notifications]);
    firestoreService.setDocument(hospId, 'notifications', hrNotif.id, hrNotif).catch(err => console.warn('Firestore set notification error:', err));

    logAudit('EMPLOYEE_REJECTED', 'Admin Approvals', `Rejected employee ${targetEmp.name} (${targetEmp.employeeCode}). Reason: ${rejectionReason}`, targetEmp.id);
    info('Employee Request Rejected', `Registration for ${targetEmp.name} was rejected.`);
  };

  // Phase 1 Attendance
  const markAttendance = (
    employeeId: string,
    date: string,
    status: AttendanceRecord['status'],
    checkInTime?: string,
    checkOutTime?: string
  ) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    if (emp.status !== 'active') {
      error('Inactive Employee', 'Cannot record attendance for non-active or unapproved employee.');
      return;
    }

    const existingIndex = attendanceRecords.findIndex(a => a.employeeId === employeeId && a.date === date);
    let updated: AttendanceRecord[];

    if (existingIndex >= 0) {
      updated = [...attendanceRecords];
      const existing = updated[existingIndex];
      const checkIn = checkInTime !== undefined ? checkInTime : existing.checkInTime || '09:00 AM';
      const checkOut = checkOutTime !== undefined ? checkOutTime : existing.checkOutTime;
      const workHours = status === 'absent' ? 0 : status === 'half_day' ? 4.5 : 8.5;

      updated[existingIndex] = {
        ...existing,
        status,
        checkInTime: status === 'absent' ? undefined : checkIn,
        checkOutTime: status === 'absent' ? undefined : checkOut,
        workHours
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        hospitalId: hospId,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        departmentName: emp.departmentName,
        designation: emp.designation,
        date,
        checkInTime: status === 'absent' ? undefined : (checkInTime || '09:00 AM'),
        checkOutTime: status === 'absent' ? undefined : (checkOutTime || '05:30 PM'),
        status,
        workHours: status === 'absent' ? 0 : status === 'half_day' ? 4.5 : 8.5,
        syncWithBiometric: true
      };
      updated = [newRecord, ...attendanceRecords];
    }

    updateAttendance(updated);
    const targetRecord = updated.find(a => a.employeeId === employeeId && a.date === date);
    if (targetRecord) {
      firestoreService.setDocument(hospId, 'attendance', targetRecord.id, targetRecord).catch(err => console.warn('Firestore set attendance error:', err));
    }
    success('Attendance Updated', `${emp.name} marked as ${status.toUpperCase()} for ${date}.`);
  };

  const markBulkAttendance = (date: string, status: AttendanceRecord['status']) => {
    const activeEmployees = employees.filter(e => e.status === 'active');
    const updated = [...attendanceRecords];

    activeEmployees.forEach(emp => {
      const idx = updated.findIndex(a => a.employeeId === emp.id && a.date === date);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          status,
          checkInTime: status === 'absent' ? undefined : (updated[idx].checkInTime || '09:00 AM'),
          workHours: status === 'absent' ? 0 : status === 'half_day' ? 4.5 : 8.5
        };
      } else {
        updated.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          hospitalId: hospId,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.name,
          departmentName: emp.departmentName,
          designation: emp.designation,
          date,
          checkInTime: status === 'absent' ? undefined : '09:00 AM',
          checkOutTime: status === 'absent' ? undefined : '05:30 PM',
          status,
          workHours: status === 'absent' ? 0 : status === 'half_day' ? 4.5 : 8.5,
          syncWithBiometric: true
        });
      }
    });

    updateAttendance(updated);
    updated.filter(a => a.date === date).forEach(rec => {
      firestoreService.setDocument(hospId, 'attendance', rec.id, rec).catch(err => console.warn('Firestore set attendance error:', err));
    });
    success('Bulk Attendance Logged', `Marked all ${activeEmployees.length} active staff as ${status.toUpperCase()} for ${date}.`);
  };

  // Phase 1 Payroll
  const calculateMonthlyPayroll = (monthStr: string) => {
    const activeEmployees = employees.filter(e => e.status === 'active');
    const totalWorkingDays = 26;

    const newPayrollList: PayrollRecord[] = activeEmployees.map(emp => {
      const basic = emp.salaryDetails?.basic || 50000;
      const allowances = emp.salaryDetails?.allowances || 10000;
      const standardDeductions = emp.salaryDetails?.deductions || 4000;
      const grossSalary = basic + allowances;

      const empMonthAtt = attendanceRecords.filter(a => a.employeeId === emp.id && a.date.startsWith(monthStr));
      let presentDays = empMonthAtt.filter(a => a.status === 'present' || a.status === 'late').length;
      let leaveDays = empMonthAtt.filter(a => a.status === 'leave').length;
      let halfDays = empMonthAtt.filter(a => a.status === 'half_day').length;
      let recordedAbsent = empMonthAtt.filter(a => a.status === 'absent').length;

      if (empMonthAtt.length === 0) {
        presentDays = 25;
        leaveDays = 1;
        recordedAbsent = 0;
      } else {
        presentDays = presentDays + (halfDays * 0.5);
      }

      const absentDays = Math.max(0, recordedAbsent);
      const dailyRate = Math.round(basic / totalWorkingDays);
      const unpaidDeductions = Math.round(absentDays * dailyRate);
      const totalDeductions = standardDeductions + unpaidDeductions;
      const netPayable = Math.max(0, grossSalary - totalDeductions);

      const existingPay = payrollRecords.find(p => p.employeeId === emp.id && p.payrollMonth === monthStr);

      return {
        id: existingPay?.id || `pay-${Date.now()}-${emp.id}`,
        hospitalId: hospId,
        payrollMonth: monthStr,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        department: emp.departmentName,
        designation: emp.designation,
        joiningDate: emp.joiningDate,
        basicSalary: basic,
        allowances,
        grossSalary,
        totalWorkingDays,
        presentDays: Math.round(presentDays),
        leaveDays,
        absentDays,
        unpaidDeductions,
        taxDeductions: standardDeductions,
        otherDeductions: 0,
        totalDeductions,
        netPayable,
        paymentStatus: existingPay?.paymentStatus || 'processed',
        paymentDate: existingPay?.paymentDate,
        paymentReference: existingPay?.paymentReference
      };
    });

    const otherMonths = payrollRecords.filter(p => p.payrollMonth !== monthStr);
    const updated = [...newPayrollList, ...otherMonths];
    updatePayroll(updated);
    newPayrollList.forEach(rec => {
      firestoreService.setDocument(hospId, 'payroll', rec.id, rec).catch(err => console.warn('Firestore set payroll error:', err));
    });
    success('Payroll Calculated', `Generated monthly payroll for ${newPayrollList.length} approved active staff for ${monthStr}.`);
  };

  const updatePayrollStatus = (payrollId: string, status: PayrollRecord['paymentStatus'], paymentRef?: string) => {
    const updated = payrollRecords.map(p => {
      if (p.id === payrollId) {
        return {
          ...p,
          paymentStatus: status,
          paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : p.paymentDate,
          paymentReference: paymentRef || (status === 'paid' ? `TXN-${Date.now().toString().slice(-6)}` : p.paymentReference)
        };
      }
      return p;
    });
    updatePayroll(updated);
    const pay = updated.find(p => p.id === payrollId);
    if (pay) {
      firestoreService.setDocument(hospId, 'payroll', payrollId, pay).catch(err => console.warn('Firestore update payroll error:', err));
    }
    success('Payment Status Updated', `Payroll marked as ${status.toUpperCase()}.`);
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
        medicines,
        labOrders,
        radiologyOrders,
        expenses,
        invoices,
        notifications,
        auditLogs,
        attendanceRecords,
        payrollRecords,
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
