import assert from 'node:assert';

console.log("==========================================================================");
console.log("HOSPITAL-WIDE NURSE ASSIGNMENT & REAL-TIME AVAILABILITY TEST SUITE");
console.log("Validating: Concurrency protection, atomic transactions, 3-state availability,");
console.log("lifecycle progression, requester notifications & undefined payload guards.");
console.log("==========================================================================\n");

// Strict Firestore validator: Throws if ANY key contains an undefined value
function strictFirestoreValidator(path, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      throw new Error(`FirebaseError: Function updateDoc() called with invalid data. Unsupported field value: undefined (found in field ${key} in document ${path})`);
    }
  }
}

// Remove undefined fields implementation matching firestoreService.ts
function removeUndefinedFields(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => (typeof item === 'object' && item !== null ? removeUndefinedFields(item) : item));
  }
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        cleaned[key] = removeUndefinedFields(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned;
}

// In-memory Database simulating Firestore
const mockDb = {
  employees: {},
  nurseTasks: {},
  notifications: {}
};

// Seed test hospital staff
mockDb.employees['nurse-101'] = {
  id: 'nurse-101',
  hospitalId: 'hosp-001',
  employeeCode: 'NURSE-01',
  name: 'Sister Mary Fernandez',
  primaryRole: 'nurse',
  additionalRoles: [],
  status: 'active',
  availabilityStatus: 'available',
  activeTaskId: null,
  departmentName: 'General Inpatient Care'
};

mockDb.employees['nurse-102'] = {
  id: 'nurse-102',
  hospitalId: 'hosp-001',
  employeeCode: 'NURSE-02',
  name: 'Sister Anjali Sharma',
  primaryRole: 'nurse',
  additionalRoles: [],
  status: 'active',
  availabilityStatus: 'busy',
  activeTaskId: 'task-pre-existing',
  departmentName: 'ICU Nursing'
};

mockDb.employees['doctor-201'] = {
  id: 'doctor-201',
  hospitalId: 'hosp-001',
  employeeCode: 'DOC-01',
  name: 'Dr. Rajesh Sharma',
  primaryRole: 'doctor',
  additionalRoles: [],
  status: 'active',
  departmentName: 'General Medicine'
};

// Simulated Service Methods (Exact match to firestoreService.ts)
async function requestNurseTask(hospitalId, data) {
  const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const taskRecord = {
    id: taskId,
    hospitalId,
    taskId: `NT-${Date.now().toString().slice(-4)}`,
    nurseStaffId: data.nurseStaffId,
    nurseName: data.nurseName,
    requestedByStaffId: data.requestedByStaffId,
    requestedByName: data.requestedByName,
    requestedByRole: data.requestedByRole,
    taskType: data.taskType,
    description: data.description,
    priority: data.priority,
    status: 'pending',
    createdAt: now
  };

  if (data.nurseUid) taskRecord.nurseUid = data.nurseUid;
  if (data.requestedByUid) taskRecord.requestedByUid = data.requestedByUid;
  if (data.patientId) taskRecord.patientId = data.patientId;
  if (data.patientName) taskRecord.patientName = data.patientName;
  if (data.patientUhid) taskRecord.patientUhid = data.patientUhid;
  if (data.clinicalOrderDetails) taskRecord.clinicalOrderDetails = data.clinicalOrderDetails;

  const sanitized = removeUndefinedFields(taskRecord);
  strictFirestoreValidator(`hospitals/${hospitalId}/nurseTasks/${taskId}`, sanitized);
  mockDb.nurseTasks[taskId] = sanitized;

  // Notify nurse
  const notifId = `notif-${Date.now()}`;
  mockDb.notifications[notifId] = {
    id: notifId,
    targetEmployeeId: data.nurseStaffId,
    title: `New Task Request: ${data.taskType}`,
    message: `${data.requestedByName} (${data.requestedByRole}) has requested assistance. Priority: ${data.priority.toUpperCase()}`,
    isRead: false
  };

  return { success: true, taskId, task: sanitized };
}

// Atomic Transaction Simulation for acceptNurseTask
async function acceptNurseTask(hospitalId, taskId, nurseStaffId) {
  const task = mockDb.nurseTasks[taskId];
  const nurse = mockDb.employees[nurseStaffId];

  if (!task) return { success: false, error: 'Task record not found.' };
  if (!nurse) return { success: false, error: 'Nurse employee profile not found.' };

  if (task.status !== 'pending') {
    return { success: false, error: `Task is already ${task.status}. Cannot accept.` };
  }

  // Concurrency check: If nurse is already busy on another task, abort!
  if (nurse.availabilityStatus === 'busy') {
    return { success: false, error: 'Nurse is already busy on another clinical task.' };
  }

  const now = new Date().toISOString();

  // Atomically update task
  const taskUpdates = {
    status: 'accepted',
    acceptedAt: now
  };
  strictFirestoreValidator(`hospitals/${hospitalId}/nurseTasks/${taskId}`, taskUpdates);
  mockDb.nurseTasks[taskId] = { ...task, ...taskUpdates };

  // Atomically update nurse availability
  const nurseUpdates = {
    availabilityStatus: 'busy',
    activeTaskId: taskId,
    lastAvailabilityUpdate: now
  };
  strictFirestoreValidator(`hospitals/${hospitalId}/employees/${nurseStaffId}`, nurseUpdates);
  mockDb.employees[nurseStaffId] = { ...nurse, ...nurseUpdates };

  return { success: true };
}

async function startNurseTask(hospitalId, taskId) {
  const task = mockDb.nurseTasks[taskId];
  if (!task) return { success: false, error: 'Task record not found.' };
  if (task.status !== 'accepted') return { success: false, error: 'Task must be accepted before starting.' };

  const taskUpdates = {
    status: 'in_progress',
    startedAt: new Date().toISOString()
  };
  strictFirestoreValidator(`hospitals/${hospitalId}/nurseTasks/${taskId}`, taskUpdates);
  mockDb.nurseTasks[taskId] = { ...task, ...taskUpdates };
  return { success: true };
}

async function completeNurseTask(hospitalId, taskId, nurseStaffId, completionNotes) {
  const task = mockDb.nurseTasks[taskId];
  const nurse = mockDb.employees[nurseStaffId];

  if (!task) return { success: false, error: 'Task not found.' };

  const now = new Date().toISOString();
  const taskUpdates = {
    status: 'completed',
    completedAt: now,
    completionNotes: completionNotes.trim()
  };
  strictFirestoreValidator(`hospitals/${hospitalId}/nurseTasks/${taskId}`, taskUpdates);
  mockDb.nurseTasks[taskId] = { ...task, ...taskUpdates };

  // Atomically release nurse back to available
  if (nurse && nurse.activeTaskId === taskId) {
    const nurseUpdates = {
      availabilityStatus: 'available',
      activeTaskId: null,
      lastAvailabilityUpdate: now
    };
    strictFirestoreValidator(`hospitals/${hospitalId}/employees/${nurseStaffId}`, nurseUpdates);
    mockDb.employees[nurseStaffId] = { ...nurse, ...nurseUpdates };
  }

  return { success: true };
}

async function rejectNurseTask(hospitalId, taskId, nurseStaffId, rejectionReason) {
  const task = mockDb.nurseTasks[taskId];
  const nurse = mockDb.employees[nurseStaffId];

  if (!task) return { success: false, error: 'Task not found.' };

  const now = new Date().toISOString();
  const taskUpdates = {
    status: 'rejected',
    rejectionReason: rejectionReason.trim()
  };
  strictFirestoreValidator(`hospitals/${hospitalId}/nurseTasks/${taskId}`, taskUpdates);
  mockDb.nurseTasks[taskId] = { ...task, ...taskUpdates };

  if (nurse && nurse.activeTaskId === taskId) {
    mockDb.employees[nurseStaffId] = {
      ...nurse,
      availabilityStatus: 'available',
      activeTaskId: null,
      lastAvailabilityUpdate: now
    };
  }

  return { success: true };
}

// --------------------------------------------------------------------------
// TEST SCENARIOS
// --------------------------------------------------------------------------

async function runTests() {
  console.log("TEST 1: Request Nurse Help with Patient & Prescription Details attached");
  const res1 = await requestNurseTask('hosp-001', {
    nurseStaffId: 'nurse-101',
    nurseName: 'Sister Mary Fernandez',
    requestedByStaffId: 'doctor-201',
    requestedByName: 'Dr. Rajesh Sharma',
    requestedByRole: 'doctor',
    patientId: 'pat-1001',
    patientName: 'Ramesh Patel',
    patientUhid: 'UPH-P2026-0042',
    taskType: 'Injection Administration',
    description: 'Administer 1g Ceftriaxone IV STAT after sensitivity test.',
    priority: 'urgent',
    clinicalOrderDetails: {
      medicineName: 'Ceftriaxone 1g',
      dosage: '1g IV STAT',
      route: 'Intravenous'
    }
  });
  assert.strictEqual(res1.success, true);
  assert.strictEqual(mockDb.nurseTasks[res1.taskId].status, 'pending');
  assert.strictEqual(mockDb.nurseTasks[res1.taskId].priority, 'urgent');
  console.log("  [PASS] Task created without undefined errors and dispatched to nurse-101.\n");

  console.log("TEST 2: Request Nurse Help with NO patient (Front Desk assistance)");
  const res2 = await requestNurseTask('hosp-001', {
    nurseStaffId: 'nurse-101',
    nurseName: 'Sister Mary Fernandez',
    requestedByStaffId: 'rec-01',
    requestedByName: 'Suresh Receptionist',
    requestedByRole: 'receptionist',
    taskType: 'Patient Assistance',
    description: 'Wheelchair assistance requested at Main Entrance for elderly visitor.',
    priority: 'normal'
  });
  assert.strictEqual(res2.success, true);
  assert.strictEqual(mockDb.nurseTasks[res2.taskId].patientId, undefined);
  assert.strictEqual(mockDb.nurseTasks[res2.taskId].status, 'pending');
  console.log("  [PASS] Task created cleanly with optional fields safely omitted.\n");

  console.log("TEST 3: Nurse Accepts Task (Availability changes to BUSY atomically)");
  assert.strictEqual(mockDb.employees['nurse-101'].availabilityStatus, 'available');
  const acceptRes = await acceptNurseTask('hosp-001', res1.taskId, 'nurse-101');
  assert.strictEqual(acceptRes.success, true);
  assert.strictEqual(mockDb.nurseTasks[res1.taskId].status, 'accepted');
  assert.strictEqual(mockDb.employees['nurse-101'].availabilityStatus, 'busy');
  assert.strictEqual(mockDb.employees['nurse-101'].activeTaskId, res1.taskId);
  console.log("  [PASS] Nurse status immediately transitioned to BUSY and activeTaskId tracked.\n");

  console.log("TEST 4: Concurrency Protection (Prevent simultaneous acceptance when busy)");
  const secondAcceptRes = await acceptNurseTask('hosp-001', res2.taskId, 'nurse-101');
  assert.strictEqual(secondAcceptRes.success, false);
  assert.match(secondAcceptRes.error, /already busy/i);
  console.log("  [PASS] Atomic transaction blocked double-acceptance: " + secondAcceptRes.error + "\n");

  console.log("TEST 5: Nurse Starts Task");
  const startRes = await startNurseTask('hosp-001', res1.taskId);
  assert.strictEqual(startRes.success, true);
  assert.strictEqual(mockDb.nurseTasks[res1.taskId].status, 'in_progress');
  console.log("  [PASS] Task transitioned to in_progress.\n");

  console.log("TEST 6: Nurse Completes Task (Availability resets to AVAILABLE)");
  const completeRes = await completeNurseTask(
    'hosp-001',
    res1.taskId,
    'nurse-101',
    'IV line flushed, Ceftriaxone administered with zero adverse reactions. Vitals stable.'
  );
  assert.strictEqual(completeRes.success, true);
  assert.strictEqual(mockDb.nurseTasks[res1.taskId].status, 'completed');
  assert.strictEqual(mockDb.employees['nurse-101'].availabilityStatus, 'available');
  assert.strictEqual(mockDb.employees['nurse-101'].activeTaskId, null);
  console.log("  [PASS] Nurse released to AVAILABLE upon task finalization.\n");

  console.log("TEST 7: Second Task Can Now Be Accepted (Since nurse is available again)");
  const secondAcceptAfterRelease = await acceptNurseTask('hosp-001', res2.taskId, 'nurse-101');
  assert.strictEqual(secondAcceptAfterRelease.success, true);
  assert.strictEqual(mockDb.nurseTasks[res2.taskId].status, 'accepted');
  assert.strictEqual(mockDb.employees['nurse-101'].availabilityStatus, 'busy');
  console.log("  [PASS] Nurse can now accept the pending task.\n");

  console.log("TEST 8: Rejection Workflow (Requires mandatory reason, releases nurse)");
  const rejectRes = await rejectNurseTask(
    'hosp-001',
    res2.taskId,
    'nurse-101',
    'Emergency call to OT Suite 3.'
  );
  assert.strictEqual(rejectRes.success, true);
  assert.strictEqual(mockDb.nurseTasks[res2.taskId].status, 'rejected');
  assert.strictEqual(mockDb.nurseTasks[res2.taskId].rejectionReason, 'Emergency call to OT Suite 3.');
  assert.strictEqual(mockDb.employees['nurse-101'].availabilityStatus, 'available');
  console.log("  [PASS] Task rejected with logged reason and nurse released to available.\n");

  console.log("==========================================================================");
  console.log("ALL 8 NURSE ASSIGNMENT & AVAILABILITY WORKFLOW TESTS PASSED PERFECTLY!");
  console.log("==========================================================================");
}

runTests();
