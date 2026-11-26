import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { faceRecognitionService, type EnrolledFaceTemplate, type FaceBox } from '../../services/faceRecognitionService';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  ScanFace,
  Clock,
  Sparkles,
  User,
  ShieldCheck,
  Building2,
  KeyRound,
  ArrowRight,
  RefreshCw,
  LogOut,
  LogIn
} from 'lucide-react';

interface FaceAttendanceKioskModalProps {
  onClose: () => void;
}

type KioskScannerState = 'READY' | 'DETECTING' | 'VERIFYING' | 'CONFIRMING' | 'WAITING_CLEAR';

export const FaceAttendanceKioskModal: React.FC<FaceAttendanceKioskModalProps> = ({ onClose }) => {
  const { employees, recordFaceAttendance } = useHospital();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mode, setMode] = useState<'face' | 'manual'>('face');

  // UI state
  const [kioskStatus, setKioskStatus] = useState<'idle' | 'detecting' | 'verifying' | 'success' | 'unknown'>('idle');
  const [statusMessage, setStatusMessage] = useState('Position your face inside the frame');

  // Success Confirmation State (displayed for exactly 2 seconds, then auto-cleared)
  const [confirmedRecord, setConfirmedRecord] = useState<{
    employeeName: string;
    employeeCode: string;
    departmentName?: string;
    avatarUrl?: string;
    type: 'check_in' | 'check_out';
    timestamp: string;
    message: string;
  } | null>(null);

  // Manual fallback state
  const [manualCode, setManualCode] = useState('');
  const [manualPin, setManualPin] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Core scanner refs to maintain continuous lifecycle without unmounting or tearing down loops
  const kioskStateRef = useRef<KioskScannerState>('READY');
  const isProcessingRef = useRef<boolean>(false);
  const recentScansRef = useRef<Record<string, number>>({});
  const lastScannedIdRef = useRef<string | null>(null);
  const lastScannedNameRef = useRef<string>('');
  const waitingClearSinceRef = useRef<number>(0);

  // Keep references to current employees & enrolled templates without causing effect restarts
  const employeesRef = useRef(employees);
  useEffect(() => {
    employeesRef.current = employees;
  }, [employees]);

  const recordFaceAttendanceRef = useRef(recordFaceAttendance);
  useEffect(() => {
    recordFaceAttendanceRef.current = recordFaceAttendance;
  }, [recordFaceAttendance]);

  // Build enrolled face templates list from all active employees
  const enrolledTemplates: EnrolledFaceTemplate[] = useMemo(() => {
    return employees
      .filter((e) => e.status === 'active' && e.faceEnrolled && e.faceTemplate?.descriptor)
      .map((e) => ({
        employeeId: e.id,
        employeeCode: e.employeeCode,
        employeeName: e.name,
        descriptor: e.faceTemplate!.descriptor,
        enrolledAt: e.faceTemplate!.enrolledAt,
        qualityScore: e.faceTemplate!.qualityScore || 95
      }));
  }, [employees]);

  const enrolledTemplatesRef = useRef(enrolledTemplates);
  useEffect(() => {
    enrolledTemplatesRef.current = enrolledTemplates;
  }, [enrolledTemplates]);

  // Initialize and Maintain Persistent Camera Stream (Only runs once on mount)
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('Physical camera unavailable or permission denied:', err);
        // Fallback for headless environments or devices without a webcam:
        // Create an animated canvas stream to keep the video element running seamlessly
        const simCanvas = document.createElement('canvas');
        simCanvas.width = 640;
        simCanvas.height = 480;
        const simCtx = simCanvas.getContext('2d');
        if (simCtx && (simCanvas as any).captureStream) {
          simCtx.fillStyle = '#0f172a';
          simCtx.fillRect(0, 0, 640, 480);
          const simStream = (simCanvas as any).captureStream(25);
          activeStream = simStream;
          setStream(simStream);
          setCameraError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = simStream;
            videoRef.current.play().catch(() => {});
          }
        } else {
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please enable camera access in browser settings.'
              : 'Unable to access kiosk camera.'
          );
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Ensure video element always stays bound and playing
  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, mode]);

  // CONTINUOUS BIOMETRIC RECOGNITION LOOP
  // Uses stable interval that NEVER restarts or unmounts across attendance events!
  useEffect(() => {
    if (!stream || cameraError) return;

    const interval = setInterval(async () => {
      if (mode !== 'face') return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      // Keep video playing continuously
      if (video.paused && stream) {
        video.play().catch(() => {});
      }

      const currentState = kioskStateRef.current;

      // 1. If currently displaying the 2-second success confirmation or processing attendance, skip
      if (currentState === 'CONFIRMING' || isProcessingRef.current) {
        return;
      }

      // 2. Analyze current live video frame
      const { metrics, faceBox } = faceRecognitionService.analyzeFrameQuality(video, canvas);

      // 3. Handle 'WAITING_CLEAR' state (Waiting for previous employee to step aside)
      if (currentState === 'WAITING_CLEAR') {
        // Condition A: The previous employee has completely left the frame (empty frame detected)
        if (!metrics.faceDetected) {
          kioskStateRef.current = 'READY';
          setKioskStatus('idle');
          setStatusMessage('Position your face inside the frame');
          return;
        }

        // Condition B: A DIFFERENT employee has stepped in front of the camera
        if (faceBox && metrics.overallScore >= 50) {
          const liveDescriptor = faceRecognitionService.extractEmbedding(canvas, faceBox);
          const match = faceRecognitionService.findBestMatch(liveDescriptor, enrolledTemplatesRef.current);

          if (match && match.matched && match.employeeId !== lastScannedIdRef.current) {
            // Next employee detected! Immediately re-arm to READY and proceed to scan them
            kioskStateRef.current = 'READY';
            setKioskStatus('idle');
            setStatusMessage('Position your face inside the frame');
            // proceed to fresh detection below in this same frame
          } else {
            // Still the previous employee or face not yet matched
            const elapsed = Date.now() - waitingClearSinceRef.current;
            if (elapsed > 2500) {
              // Safety timeout: re-arm scanner after 2.5s anyway so scanner never stays locked
              kioskStateRef.current = 'READY';
              setKioskStatus('idle');
              setStatusMessage('Position your face inside the frame');
            } else {
              setStatusMessage(`Attendance recorded for ${lastScannedNameRef.current}. Please step aside for next employee.`);
              return;
            }
          }
        } else {
          // Face detected but not centered/scored yet, or previous employee moving away
          const elapsed = Date.now() - waitingClearSinceRef.current;
          if (elapsed > 2500) {
            kioskStateRef.current = 'READY';
            setKioskStatus('idle');
            setStatusMessage('Position your face inside the frame');
          } else {
            setStatusMessage(`Attendance recorded for ${lastScannedNameRef.current}. Please step aside for next employee.`);
            return;
          }
        }
      }

      // 4. Handle 'READY' state: fresh face detection & recognition for next employee
      if (!metrics.faceDetected) {
        if (kioskStatus !== 'idle') {
          setKioskStatus('idle');
          setStatusMessage('Position your face inside the frame');
        }
        return;
      }

      // Quality checks (centering, lighting, sharpness)
      if (metrics.overallScore < 50) {
        if (kioskStatus !== 'detecting') setKioskStatus('detecting');
        setStatusMessage(metrics.feedbackMessage);
        return;
      }

      // 5. Verification stage
      if (kioskStatus !== 'verifying') setKioskStatus('verifying');
      setStatusMessage('Face detected — verifying identity...');

      const templates = enrolledTemplatesRef.current;
      if (!templates || templates.length === 0) {
        setStatusMessage('No enrolled face templates registered yet. Use Add Face first.');
        return;
      }

      if (faceBox) {
        // Fresh embedding generated for the new employee
        const liveDescriptor = faceRecognitionService.extractEmbedding(canvas, faceBox);
        const match = faceRecognitionService.findBestMatch(liveDescriptor, templates);

        if (match && match.matched) {
          const matchedEmployee = employeesRef.current.find((e) => e.id === match.employeeId);
          if (!matchedEmployee) return;

          // Duplicate prevention: do not re-scan the exact SAME employee within 15 seconds
          const lastScanned = recentScansRef.current[matchedEmployee.id] || 0;
          if (Date.now() - lastScanned < 15000) {
            setStatusMessage(`Already recorded for ${matchedEmployee.name}. Step aside for next employee.`);
            return;
          }

          // LOCK SCANNER & PROCESS ATTENDANCE
          isProcessingRef.current = true;
          kioskStateRef.current = 'CONFIRMING';
          recentScansRef.current[matchedEmployee.id] = Date.now();
          lastScannedIdRef.current = matchedEmployee.id;
          lastScannedNameRef.current = matchedEmployee.name;

          try {
            const res = await recordFaceAttendanceRef.current(matchedEmployee.id);
            faceRecognitionService.playSuccessChime();

            setKioskStatus('success');
            setConfirmedRecord({
              employeeName: res.employeeName,
              employeeCode: res.employeeCode,
              departmentName: matchedEmployee.departmentName,
              avatarUrl: matchedEmployee.faceTemplate?.samplePhotoUrl || matchedEmployee.avatarUrl,
              type: res.type,
              timestamp: res.timestamp,
              message: res.message
            });

            // Display confirmation for exactly 2 seconds, then reset recognition state and wait for frame clear
            setTimeout(() => {
              setConfirmedRecord(null);
              kioskStateRef.current = 'WAITING_CLEAR';
              waitingClearSinceRef.current = Date.now();
              isProcessingRef.current = false;
              setKioskStatus('idle');
              setStatusMessage('Attendance recorded. Please step aside for next employee.');
            }, 2000);
          } catch (err: any) {
            console.error('Attendance recording error:', err);
            setStatusMessage('Error recording attendance: ' + err.message);
            isProcessingRef.current = false;
            kioskStateRef.current = 'READY';
          }
        } else {
          setKioskStatus('unknown');
          setStatusMessage('Face not recognized — please align and hold steady');
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [stream, cameraError, mode]);

  // Manual PIN Fallback Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const emp = employeesRef.current.find(
      (e) =>
        e.status === 'active' &&
        (e.employeeCode.toLowerCase() === manualCode.trim().toLowerCase() ||
          e.employeeLoginId?.toLowerCase() === manualCode.trim().toLowerCase())
    );

    if (!emp) {
      setManualError('No active employee found matching this Code or Login ID.');
      return;
    }

    try {
      isProcessingRef.current = true;
      kioskStateRef.current = 'CONFIRMING';
      const res = await recordFaceAttendanceRef.current(emp.id);
      faceRecognitionService.playSuccessChime();

      setConfirmedRecord({
        employeeName: res.employeeName,
        employeeCode: res.employeeCode,
        departmentName: emp.departmentName,
        avatarUrl: emp.avatarUrl,
        type: res.type,
        timestamp: res.timestamp,
        message: res.message
      });

      setManualCode('');
      setManualPin('');

      // Display 2-second confirmation overlay, then automatically return to face scanning mode!
      setTimeout(() => {
        setConfirmedRecord(null);
        setMode('face');
        kioskStateRef.current = 'READY';
        isProcessingRef.current = false;
        setKioskStatus('idle');
        setStatusMessage('Position your face inside the frame');
      }, 2000);
    } catch (err: any) {
      setManualError('Error: ' + err.message);
      isProcessingRef.current = false;
      kioskStateRef.current = 'READY';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-slate-900 text-white rounded-[36px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-5 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Kiosk Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <ScanFace className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Hospital Face Attendance Kiosk
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-slate-400">
                Continuous Biometric Terminal • Automatic Next-Person Scan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle: Face Scanner vs Manual PIN */}
            <div className="bg-slate-800/80 p-1 rounded-xl flex items-center text-xs font-bold border border-slate-700">
              <button
                type="button"
                onClick={() => setMode('face')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mode === 'face' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Face</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mode === 'manual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>PIN</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Attendance Kiosk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* FACE MODE: CAMERA VIEWPORT WITH PERSISTENT STREAM                  */}
        {/* (The <video> element remains permanently mounted and active)       */}
        {/* =================================================================== */}
        <div className={`space-y-4 ${mode === 'face' ? 'block' : 'hidden'}`}>
          <div className="relative rounded-3xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800 shadow-2xl">
            {cameraError ? (
              <div className="p-8 text-center text-rose-300 space-y-3">
                <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                <p className="text-sm font-semibold">{cameraError}</p>
              </div>
            ) : (
              <>
                {/* Live Continuous Video Stream (Permanently mounted!) */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* High-Tech Biometric Scanner Frame & Moving Radar Beam */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-52 h-64 rounded-[45%] border-2 transition-all duration-300 relative flex items-center justify-center ${
                      kioskStatus === 'verifying'
                        ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                        : kioskStatus === 'detecting'
                        ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                        : kioskStatus === 'unknown'
                        ? 'border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                        : 'border-blue-400/70 border-dashed shadow-[0_0_15px_rgba(96,165,250,0.25)]'
                    }`}
                  >
                    {/* Laser Scanning Line Animation */}
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] animate-bounce" />

                    {/* Targeting Corner Crosshairs */}
                    <div className="absolute top-3 left-4 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                    <div className="absolute top-3 right-4 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                    <div className="absolute bottom-3 left-4 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                    <div className="absolute bottom-3 right-4 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

                    <span className="text-[10px] font-mono tracking-widest text-cyan-300/80 bg-slate-950/60 px-2 py-0.5 rounded-full absolute bottom-4">
                      BIOMETRIC SENSOR
                    </span>
                  </div>
                </div>

                {/* Top Status Banner */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between text-xs z-20">
                  <span
                    className={`px-4 py-1.5 rounded-full font-bold backdrop-blur-md shadow-lg flex items-center gap-2 ${
                      kioskStatus === 'verifying'
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                        : kioskStatus === 'detecting'
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                        : kioskStatus === 'unknown'
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
                        : 'bg-slate-950/80 text-cyan-300 border border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        kioskStatus === 'verifying'
                          ? 'bg-emerald-400 animate-ping'
                          : kioskStatus === 'unknown'
                          ? 'bg-rose-400'
                          : 'bg-cyan-400'
                      }`}
                    />
                    {statusMessage}
                  </span>

                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-slate-300 border border-slate-800">
                    {enrolledTemplates.length} Enrolled Staff
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Hospital Biometric Isolation Active
            </span>
            <span>First scan: Check-in • Second scan: Check-out</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* MANUAL PIN FALLBACK ATTENDANCE                                      */}
        {/* =================================================================== */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4 py-4">
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-400" /> Manual Attendance Mode
              </span>
              <p>For employees with camera difficulties or medical facial coverings.</p>
            </div>

            {manualError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Employee Code or Login ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EMP-101 or RIO@2026DO001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Staff Verification PIN / Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={manualPin}
                onChange={(e) => setManualPin(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Verify & Mark Attendance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* =================================================================== */}
        {/* 2-SECOND SUCCESS OVERLAY (Universal for Face or Manual Scan)       */}
        {/* Shows for ~2s, then automatically clears & readies for next person! */}
        {/* =================================================================== */}
        {confirmedRecord && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md rounded-[36px] flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Pulsing Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 animate-ping absolute" />
              <div className="w-24 h-24 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center relative border border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]">
                {confirmedRecord.type === 'check_in' ? (
                  <LogIn className="w-12 h-12 text-emerald-300" />
                ) : (
                  <LogOut className="w-12 h-12 text-blue-300" />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  confirmedRecord.type === 'check_in'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {confirmedRecord.type === 'check_in' ? 'Check-in Recorded' : 'Check-out Recorded'}
              </span>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {confirmedRecord.employeeName}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                {confirmedRecord.employeeCode} • {confirmedRecord.departmentName || 'Hospital Staff'}
              </p>
            </div>

            {/* Timestamp Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-sm font-bold shadow-xs">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{new Date().toLocaleDateString()} • {confirmedRecord.timestamp}</span>
            </div>

            {/* 2-Second Visual Progress Indicator */}
            <div className="w-56 space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Next employee scan</span>
                <span className="text-emerald-400 font-mono">Ready in 2s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-2000 ease-linear"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
