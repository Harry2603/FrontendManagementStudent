import { CheckCircle2, XCircle } from "lucide-react";
import { getFaceFrameMessage } from "../utils/faceMessages";

export default function FaceFrameResults({
  frames,
  title = "Frame Results",
  itemLabel = "Frame",
}) {
  if (!Array.isArray(frames) || frames.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <ul className="space-y-2" aria-label={title}>
        {frames.map((frame, index) => {
          const accepted =
            typeof frame.accepted === "boolean"
              ? frame.accepted
              : frame.status === "Success";
          const number = frame.frameNumber ?? index + 1;
          const Icon = accepted ? CheckCircle2 : XCircle;

          return (
            <li
              key={number + "-" + index}
              className={
                "flex items-start gap-2 rounded p-2 text-sm " +
                (accepted
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700")
              }
            >
              <Icon className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
              <span>
                <span className="font-medium">
                  {itemLabel} {number}:
                </span>{" "}
                {getFaceFrameMessage(frame.status)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
