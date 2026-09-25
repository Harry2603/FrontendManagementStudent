import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";

const FRAME_GAP_MS = 500;
const MAX_CAPTURE_WIDTH = 1280;

const getCameraErrorMessage = (error) => {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "Camera access was denied. Grant permission and try again.";
  }

  if (
    error?.name === "NotFoundError" ||
    error?.name === "DevicesNotFoundError"
  ) {
    return "No camera was found on this device.";
  }

  if (error?.name === "NotReadableError") {
    return "The camera is being used by another application.";
  }

  return "Unable to open the camera. Check your device and try again.";
};

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const captureVideoFrame = (video) =>
  new Promise((resolve, reject) => {
    if (!video?.videoWidth || !video?.videoHeight) {
      reject(new Error("Camera frame is not ready."));
      return;
    }

    const scale = Math.min(1, MAX_CAPTURE_WIDTH / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Canvas is not available."));
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("The camera frame could not be captured.")),
      "image/jpeg",
      0.9,
    );
  });

export default function FaceCamera({
  captureCount = 1,
  onCapture,
  disabled = false,
  actionLabel = "Capture",
  busyLabel = "Processing...",
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(false);
  const cameraRequestRef = useRef(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraLoading(false);
      setCameraError(
        "This browser does not support camera access. Use a modern browser over HTTPS or localhost.",
      );
      return;
    }

    setCameraReady(false);
    setCameraLoading(true);
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (
        !mountedRef.current ||
        requestId !== cameraRequestRef.current ||
        !videoRef.current
      ) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (error) {
      if (mountedRef.current && requestId === cameraRequestRef.current) {
        setCameraError(getCameraErrorMessage(error));
      }
    } finally {
      if (mountedRef.current && requestId === cameraRequestRef.current) {
        setCameraLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const startTimer = window.setTimeout(startCamera, 0);

    return () => {
      window.clearTimeout(startTimer);
      mountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || capturing || disabled) return;

    setCapturing(true);
    setCameraError("");
    setCaptureProgress(0);

    try {
      const frames = [];
      for (let index = 0; index < captureCount; index += 1) {
        if (!mountedRef.current) return;
        frames.push(await captureVideoFrame(videoRef.current));
        setCaptureProgress(index + 1);
        if (index < captureCount - 1) await wait(FRAME_GAP_MS);
      }
      await onCapture(frames);
    } catch {
      if (mountedRef.current) {
        setCameraError("Unable to capture an image from the camera. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setCapturing(false);
        setCaptureProgress(0);
      }
    }
  }, [captureCount, capturing, disabled, onCapture]);

  const busy = capturing || disabled;

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900">
        <video
          ref={videoRef}
          muted
          playsInline
          onCanPlay={() => setCameraReady(true)}
          className="h-full w-full -scale-x-100 object-cover"
          aria-label="Face camera preview"
        />

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.28)]"
          aria-hidden="true"
        />

        {cameraLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-sm text-white">
            Starting camera...
          </div>
        )}
      </div>

      <p className="text-center text-sm text-gray-600">
        Look straight ahead, center your face, and stay close to the camera.
      </p>

      {cameraError && (
        <div className="space-y-2 rounded bg-red-50 p-3 text-sm text-red-700">
          <p role="alert">{cameraError}</p>
          <button
            type="button"
            onClick={startCamera}
            className="inline-flex items-center gap-1 font-medium text-red-700 hover:underline"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try Camera Again
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleCapture}
        disabled={!cameraReady || busy}
        className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Camera size={18} aria-hidden="true" />
        {busy
          ? capturing && captureCount > 1
            ? "Capturing " + captureProgress + "/" + captureCount + "..."
            : busyLabel
          : actionLabel}
      </button>
    </div>
  );
}
