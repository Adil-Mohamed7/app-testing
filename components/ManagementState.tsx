"use client";

type ManagementStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const MANAGEMENT_TECHNICAL_TITLE = "Data temporarily unavailable";
export const MANAGEMENT_TECHNICAL_MESSAGE =
  "The dashboard cannot display this section right now because the source sheet is unavailable or contains invalid formula results. Please refresh after the sheet has been reviewed.";

export default function ManagementState({
  title = MANAGEMENT_TECHNICAL_TITLE,
  message = MANAGEMENT_TECHNICAL_MESSAGE,
  actionLabel,
  onAction,
}: ManagementStateProps) {
  return (
    <div className="management-state glass-card">
      <div className="management-state-icon">!</div>
      <div>
        <p className="management-state-title">{title}</p>
        <p className="management-state-message">{message}</p>
      </div>
      {actionLabel && onAction && (
        <button type="button" className="management-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
