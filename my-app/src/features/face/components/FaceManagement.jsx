import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FaceCamera from "./FaceCamera";
import FaceFrameResults from "./FaceFrameResults";
import { faceService } from "../services/faceService";
import { getFaceManagementError } from "../utils/faceMessages";

const EMPTY_STATUS = {
  isRegistered: false,
  registeredAt: null,
  modelName: null,
};

const formatRegisteredAt = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function FaceManagement() {
  const [status, setStatus] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [deleting, setDeleting] = useState(false);

  const loadStatus = useCallback(async () => {
    setPageLoading(true);
    setPageError("");

    try {
      setStatus(await faceService.getStatus());
    } catch (error) {
      setPageError(getFaceManagementError(error));
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(loadStatus, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadStatus]);

  const showMessage = useCallback((text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const handleStart = useCallback(
    async (event) => {
      event.preventDefault();
      if (!password.trim()) {
        setPasswordError("Please enter your current password.");
        return;
      }

      setProcessing(true);
      setPasswordError("");
      setMessage("");

      try {
        const registration = await faceService.startRegistration(password);
        setSession(registration);
        setAttempts([]);
        setPassword("");
      } catch (error) {
        showMessage(getFaceManagementError(error));
      } finally {
        setProcessing(false);
      }
    },
    [password, showMessage],
  );

  const handleCapture = useCallback(
    async ([frame]) => {
      if (!session || !frame) return;

      setProcessing(true);
      setMessage("");

      try {
        const result = await faceService.uploadFrame(session.sessionId, frame);
        setAttempts((current) => [
          ...current,
          {
            frameNumber: current.length + 1,
            status: result.status,
            accepted: result.accepted,
          },
        ]);

        const complete =
          result.isComplete ||
          (result.requiredCount > 0 &&
            result.acceptedCount >= result.requiredCount);

        if (!complete) return;

        try {
          const confirmed = await faceService.confirmRegistration(
            session.sessionId,
          );
          setStatus({
            isRegistered: confirmed.registered,
            registeredAt: confirmed.registeredAt,
            modelName: confirmed.modelName,
          });
          setSession(null);
          showMessage("Face ID registered successfully.", "success");
        } catch (error) {
          const code = error?.response?.data?.code;
          if (
            code === "FaceAlreadyRegistered" ||
            error?.response?.status === 404
          ) {
            setSession(null);
          }
          showMessage(getFaceManagementError(error));
        }
      } catch (error) {
        showMessage(getFaceManagementError(error));
      } finally {
        setProcessing(false);
      }
    },
    [session, showMessage],
  );

  const handleCancel = useCallback(async () => {
    if (!session) return;

    setProcessing(true);
    setMessage("");
    try {
      await faceService.cancelRegistration(session.sessionId);
      setSession(null);
      setAttempts([]);
      showMessage("Face ID registration was canceled.", "success");
    } catch (error) {
      setSession(null);
      setAttempts([]);
      showMessage(getFaceManagementError(error));
    } finally {
      setProcessing(false);
    }
  }, [session, showMessage]);

  const handleDelete = useCallback(
    async (event) => {
      event.preventDefault();
      if (!password.trim()) {
        setPasswordError("Please enter your current password.");
        return;
      }

      setDeleting(true);
      setPasswordError("");
      setMessage("");

      try {
        await faceService.deleteFace(password);
        setStatus(EMPTY_STATUS);
        setPassword("");
        showMessage("Face ID deleted.", "success");
      } catch (error) {
        showMessage(getFaceManagementError(error));
      } finally {
        setDeleting(false);
      }
    },
    [password, showMessage],
  );

  if (pageLoading) {
    return (
      <div className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        Loading Face ID status...
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="space-y-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p role="alert" className="text-sm text-red-600">
          {pageError}
        </p>
        <div className="max-w-xs">
          <Button variant="secondary" onClick={loadStatus}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const acceptedCount = attempts.filter((item) => item.accepted).length;
  const requiredFrames = session?.requiredFrames ?? 3;

  return (
    <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <ShieldCheck size={22} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Face ID</h2>
        </div>
      </div>

      {message && (
        <p
          role={messageType === "error" ? "alert" : "status"}
          className={
            "rounded p-3 text-sm " +
            (messageType === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700")
          }
        >
          {message}
        </p>
      )}

      {session ? (
        <div className="space-y-4">
          <div className="rounded bg-blue-50 p-3 text-sm text-blue-800">
            Accepted {acceptedCount}/{requiredFrames} valid frames. Rejected
            frames do not remove previously accepted frames.
          </div>

          <FaceCamera
            onCapture={handleCapture}
            disabled={processing}
            actionLabel={
              "Capture Frame " +
              Math.min(acceptedCount + 1, requiredFrames) +
              "/" +
              requiredFrames
            }
            busyLabel={
              acceptedCount + 1 >= requiredFrames
                ? "Confirming Face ID..."
                : "Checking frame..."
            }
          />

          <FaceFrameResults
            frames={attempts}
            title="Capture Results"
            itemLabel="Attempt"
          />

          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={processing}
          >
            Cancel Registration
          </Button>
        </div>
      ) : status?.isRegistered ? (
        <form onSubmit={handleDelete} className="space-y-4" noValidate>
          <div className="rounded bg-green-50 p-3 text-sm text-green-800">
            <p className="font-medium">Face ID is active</p>
            {status.modelName && <p>Model: {status.modelName}</p>}
            {formatRegisteredAt(status.registeredAt) && (
              <p>Registered at: {formatRegisteredAt(status.registeredAt)}</p>
            )}
          </div>

          <Input
            name="face-delete-password"
            label="Current Password to Delete Face ID"
            type="password"
            autoComplete="current-password"
            value={password}
            error={passwordError}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
              setMessage("");
            }}
          />

          <Button type="submit" loading={deleting}>
            Delete Face ID
          </Button>
        </form>
      ) : (
        <form onSubmit={handleStart} className="space-y-4" noValidate>
          <p className="text-sm text-slate-600">
            Confirm your password, then capture three valid face frames.
          </p>

          <Input
            name="face-register-password"
            label="Current Password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={passwordError}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
              setMessage("");
            }}
          />

          <Button type="submit" loading={processing}>
            Start Face ID Registration
          </Button>
        </form>
      )}
    </section>
  );
}
