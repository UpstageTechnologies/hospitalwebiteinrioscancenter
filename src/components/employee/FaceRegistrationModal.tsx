import React, { useEffect, useRef, useState } from 'react';
import type { Employee } from '../../types/employee';
import { useHospital } from '../../context/HospitalContext';
import { faceRecognitionService, type FaceBox, type FaceQualityMetrics } from '../../services/faceRecognitionService';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Sparkles,
  Lock,
  Eye,
  Sliders,
  Check
} from 'lucide-react';

interface FaceRegistrationModalProps {
  employee: Employee;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FaceRegistrationModal: React.FC<FaceRegistrationModalProps> = ({
  employee,
  onClose,
  onSuccess
}) => {
  const { enrollEmployeeFace, deleteEmployeeFace } = useHospital();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(
    employee.faceTemplate?.samplePhotoUrl || employee.avatarUrl || null
  );

  const [qualityMetrics, setQualityMetrics] = useState<FaceQualityMetrics>({
    faceDetected: false,
    isCentered: false,
    isGoodSize: false,
    brightnessOk: false,
    sharpnessOk: false,
    singleFace: false,
    overallScore: 0,
    feedbackMessage: 'Starting biometric camera...'
  });

  const [activeFaceBox, setActiveFaceBox] = useState<FaceBox | null>(null);
  const [enrollmentStep, setEnrollmentStep] = useState<number>(0); // 0 = ready, 1-3 = multi-capture, 4 = done

  // Start Camera Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in browser settings.'
            : 'Unable to start camera. Please verify device camera is connected.'
        );
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Continuous Face Quality & Position Analysis
  useEffect(() => {
    if (!stream || cameraError) return;

    let animId: number;
    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) return;

      const { metrics, faceBox } = faceRecognitionService.analyzeFrameQuality(
        videoRef.current,
        canvasRef.current
      );

      setQualityMetrics(metrics);
      if (faceBox) setActiveFaceBox(faceBox);
    }, 120);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, [stream, cameraError]);

  // Execute Quality-Checked Multi-Capture Enrollment
  const handleEnrollFace = async () => {
    if (!consentGiven) {
      alert('Informed employee consent is required before biometric enrollment.');
      return;
    }
    if (!qualityMetrics.faceDetected || qualityMetrics.overallScore < 60) {
      alert('Please align face inside the oval guide under suitable lighting before capture.');
      return;
    }
    if (!canvasRef.current || !activeFaceBox) return;

    setIsCapturing(true);
    setEnrollmentStep(1);

    try {
      const descriptors: number[][] = [];
      let thumbnail = '';

      // Capture 3 consecutive frames with micro-interval for variance robustness
      for (let step = 1; step <= 3; step++) {
        setEnrollmentStep(step);
        await new Promise((r) => setTimeout(r, 220));

        if (canvasRef.current && videoRef.current) {
          const { faceBox } = faceRecognitionService.analyzeFrameQuality(
            videoRef.current,
            canvasRef.current
          );
          const currentBox = faceBox || activeFaceBox;
          const desc = faceRecognitionService.extractEmbedding(canvasRef.current, currentBox);
          descriptors.push(desc);

          if (step === 2) {
            thumbnail = faceRecognitionService.captureFaceThumbnail(canvasRef.current, currentBox);
          }
        }
      }

      // Average the 3 descriptors for maximum matching accuracy
      const averagedDescriptor = new Array(128).fill(0);
      descriptors.forEach((d) => {
        for (let i = 0; i < 128; i++) {
          averagedDescriptor[i] += d[i] / descriptors.length;
        }
      });

      // L2 re-normalization
      let normSq = 0;
      for (let i = 0; i < 128; i++) normSq += averagedDescriptor[i] * averagedDescriptor[i];
      const norm = Math.sqrt(normSq) || 1;
      for (let i = 0; i < 128; i++) averagedDescriptor[i] = Number((averagedDescriptor[i] / norm).toFixed(5));

      setCapturedThumbnail(thumbnail);

      // Save into Hospital Context & Firestore
      await enrollEmployeeFace(employee.id, averagedDescriptor, thumbnail, qualityMetrics.overallScore);

      setEnrollmentStep(4);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Enrollment error:', err);
      alert('Error enrolling face: ' + (err.message || 'Unknown error'));
      setEnrollmentStep(0);
    } finally {
      setIsCapturing(false);
    }
  };

  // Remove Biometric Enrollment
  const handleDeleteFace = async () => {
    if (!confirm(`Are you sure you want to delete biometric face enrollment for ${employee.name}?`)) return;
    await deleteEmployeeFace(employee.id);
    setCapturedThumbnail(null);
    onClose();
  };

  const isAlreadyEnrolled = Boolean(employee.faceEnrolled && employee.faceTemplate);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAlreadyEnrolled ? 'Update Face Biometrics' : 'Employee Face Registration'}
              </h3>
              <p className="text-xs text-slate-500">
                {employee.name} • <span className="font-mono font-bold text-slate-700">{employee.employeeCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Enrollment Notice */}
        {isAlreadyEnrolled && (
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Biometric Template Registered</span>
                <span className="text-[11px] text-emerald-700 block">
                  Enrolled on {new Date(employee.faceTemplate!.enrolledAt).toLocaleDateString()} • Quality: {employee.faceTemplate!.qualityScore || 95}%
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDeleteFace}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Remove biometric template"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Camera Viewport & Face Overlay */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center shadow-inner">
          {cameraError ? (
            <div className="p-6 text-center text-rose-300 space-y-2">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-xs font-semibold">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Face Positioning Oval Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-200 relative flex items-center justify-center ${
                    qualityMetrics.overallScore >= 75
                      ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                      : qualityMetrics.faceDetected
                      ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                      : 'border-slate-400/60 border-dashed'
                  }`}
                >
                  {/* Subtle Target Reticle */}
                  <div className="w-2 h-2 rounded-full bg-white/70" />

                  {/* Corner Guidance Brackets */}
                  <span className="absolute top-2 left-6 text-white/50 text-[10px] font-mono">EYES</span>
                  <span className="absolute bottom-3 text-white/50 text-[10px] font-mono">CHIN</span>
                </div>
              </div>

              {/* Real-time Quality Badge & Feedback Overlay */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between text-[11px]">
                <span
                  className={`px-3 py-1 rounded-full font-bold backdrop-blur-md shadow-xs flex items-center gap-1.5 ${
                    qualityMetrics.overallScore >= 75
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : qualityMetrics.faceDetected
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900/80 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      qualityMetrics.overallScore >= 75 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {qualityMetrics.feedbackMessage}
                </span>

                <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-slate-900/80 text-white border border-slate-700">
                  {qualityMetrics.overallScore}% Quality
                </span>
              </div>

              {/* Multi-Capture Progress Overlay */}
              {isCapturing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                  <span className="text-white font-bold text-sm">
                    {enrollmentStep === 4 ? 'Enrollment Complete!' : `Capturing Sample ${enrollmentStep} of 3...`}
                  </span>
                  <span className="text-xs text-slate-400">Hold steady while template generates</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quality Diagnostics Pills */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              qualityMetrics.faceDetected && qualityMetrics.isCentered
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                qualityMetrics.faceDetected && qualityMetrics.isCentered ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <span className="text-[11px] font-semibold">Face Centered</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              qualityMetrics.brightnessOk
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${qualityMetrics.brightnessOk ? 'text-emerald-600' : 'text-slate-400'}`}
            />
            <span className="text-[11px] font-semibold">Good Lighting</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              qualityMetrics.sharpnessOk
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${qualityMetrics.sharpnessOk ? 'text-emerald-600' : 'text-slate-400'}`}
            />
            <span className="text-[11px] font-semibold">Clarity & Focus</span>
          </div>
        </div>

        {/* Informed Consent Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-slate-600 leading-snug">
            <strong>Employee Consent:</strong> I confirm employee consent for facial template extraction and storage in accordance with hospital security and data privacy policies.
          </span>
        </label>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isCapturing || !consentGiven || qualityMetrics.overallScore < 50}
            onClick={handleEnrollFace}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
              qualityMetrics.overallScore >= 70 && consentGiven
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isAlreadyEnrolled ? 'Update Face Template' : 'Capture & Enroll Face'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
