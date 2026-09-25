import { useCallback, useState } from "react";
import { authService } from "@/features/auth/services/authService";
import { useAuth } from "@/features/auth/hooks/useAuth";
import FaceCamera from "./FaceCamera";
import FaceFrameResults from "./FaceFrameResults";
import { getFaceLoginFailure } from "../utils/faceMessages";

export default function FaceLoginPanel() {
  const { setSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [frames, setFrames] = useState([]);

  const handleCapture = useCallback(
    async (capturedFrames) => {
      setLoading(true);
      setMessage("");
      setFrames([]);

      try {
        const session = await authService.faceLogin(capturedFrames);
        setFrames(Array.isArray(session.faceFrames) ? session.faceFrames : []);
        setLoading(false);
        setSession(session);
      } catch (error) {
        const failure = getFaceLoginFailure(error);
        setFrames(failure.frames);
        setMessage(failure.message);
        setLoading(false);
      }
    },
    [setSession],
  );

  return (
    <div className="space-y-4">
      <FaceCamera
        captureCount={3}
        onCapture={handleCapture}
        disabled={loading}
        actionLabel={
          message ? "Retry with 3 New Frames" : "Capture 3 Frames and Sign In"
        }
        busyLabel="Verifying face..."
      />

      <FaceFrameResults frames={frames} />

      {message && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}
