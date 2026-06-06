import { Check, X } from "lucide-react";

type TimelineItem = {
  status?: string;
};

const STEPS: Array<{ key: string; label: string }> = [
  { key: "applied", label: "Applied" },
  { key: "under-review", label: "Under Review" },
  { key: "screening", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
];

const stepIndex = (status?: string) => STEPS.findIndex((step) => step.key === status);

type ApplicationStepTrackerProps = {
  status?: string;
  timeline?: TimelineItem[];
  className?: string;
};

/**
 * Horizontal progress tracker shared by the candidate and client dashboards so
 * an application's stage is shown the same way for both sides. Progress is
 * linear: every step up to the current status is marked complete, even if the
 * client skipped intermediate stages.
 */
export const ApplicationStepTracker = ({ status, timeline, className }: ApplicationStepTrackerProps) => {
  const isRejected = status === "rejected";

  // How far the application progressed. For a rejected application we fall back
  // to the furthest stage recorded in the timeline.
  const reachedFromTimeline = (timeline || []).reduce((furthest, item) => {
    const index = stepIndex(item.status);
    return index > furthest ? index : furthest;
  }, 0);

  const currentIndex = isRejected ? reachedFromTimeline : Math.max(stepIndex(status), 0);

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Application progress</p>
        {isRejected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
            <X className="h-3 w-3" /> Not selected
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start">
        {STEPS.map((step, index) => {
          const isDone = !isRejected && index < currentIndex;
          const isCurrent = !isRejected && index === currentIndex;

          let circleClass = "border-slate-200 bg-slate-100 text-slate-400";
          if (isDone) {
            circleClass = "border-emerald-500 bg-emerald-500 text-white";
          } else if (isCurrent) {
            circleClass = "border-[#264a7f] bg-[#264a7f] text-white";
          } else if (isRejected && index <= currentIndex) {
            circleClass = "border-red-300 bg-red-50 text-red-500";
          }

          const leftActive = index <= currentIndex;
          const rightActive = index < currentIndex;
          const lineColor = isRejected ? "bg-red-200" : "bg-emerald-500";

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={`h-1 flex-1 rounded-full ${index === 0 ? "opacity-0" : leftActive ? lineColor : "bg-slate-200"}`}
                />
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${circleClass}`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div
                  className={`h-1 flex-1 rounded-full ${index === STEPS.length - 1 ? "opacity-0" : rightActive ? lineColor : "bg-slate-200"}`}
                />
              </div>
              <span
                className={`mt-2 text-center text-[11px] leading-tight ${
                  isCurrent ? "font-bold text-[#264a7f]" : isDone ? "font-medium text-slate-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationStepTracker;
