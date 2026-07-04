import { Modal } from "antd";

interface KickRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  kickReason: string;
  setKickReason: (v: string) => void;
}

export default function KickRequestModal({ open, onClose, onSubmit, submitting, kickReason, setKickReason }: KickRequestModalProps) {
  return (
    <Modal
      title="Request Member Kick"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      okText="Submit Request"
      okButtonProps={{ danger: true, loading: submitting, disabled: !kickReason.trim() }}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnHidden
      centered
    >
      <div style={{ paddingTop: "0.5rem" }}>
        <p style={{ marginBottom: "1rem", color: "var(--color-text-2)" }}>
          Since your team is already approved, you cannot kick members directly. You must submit a request with a reason to the assigned Judge for approval.
        </p>
        <div className="form-group">
          <label className="form-label" htmlFor="kickReasonInput">Reason for Kick</label>
          <textarea
            id="kickReasonInput"
            className="form-input"
            rows={3}
            placeholder="Provide a clear reason for kicking this member..."
            value={kickReason}
            onChange={(e) => setKickReason(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>
    </Modal>
  );
}
