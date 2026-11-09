import { useState } from "react";
import Modal from "./Modal";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    default_title: "หลักฐานการโอนเงิน (Payment Slip)",
    room_lbl: "ห้องพัก",
    room_prefix: "ห้อง",
    tenant_lbl: "ผู้เช่า",
    period_lbl: "งวดประจำเดือน",
    amount_lbl: "ยอดที่ต้องชำระ",
    baht: "บาท",
    reject_reason_lbl: "ระบุเหตุผลในการปฏิเสธสลิป (จะส่งแจ้งเตือนไปยังลูกบ้าน):",
    reject_ph: "เช่น ยอดเงินไม่ตรงตามบิล หรือรูปสลิปไม่ชัดเจน",
    cancel: "ยกเลิก",
    confirm_reject: "ยืนยันปฏิเสธสลิป",
    saving: "กำลังบันทึก...",
    btn_download: "💾 ดาวน์โหลดรูปสลิป",
    btn_reject: "✕ ปฏิเสธสลิป (แจ้งแก้ไข)",
    btn_approve: "✓ ยืนยันการชำระเงิน (อนุมัติ)",
    btn_close: "ปิดหน้าต่าง",
  },
  en: {
    default_title: "Payment Transfer Slip",
    room_lbl: "Room",
    room_prefix: "Room",
    tenant_lbl: "Tenant",
    period_lbl: "Billing Period",
    amount_lbl: "Amount Due",
    baht: "THB",
    reject_reason_lbl: "Specify reason for rejecting slip (will notify tenant):",
    reject_ph: "e.g. Amount does not match bill, or blurry slip image",
    cancel: "Cancel",
    confirm_reject: "Confirm Slip Rejection",
    saving: "Saving...",
    btn_download: "💾 Download Slip Image",
    btn_reject: "✕ Reject Slip (Request re-upload)",
    btn_approve: "✓ Verify Payment (Approve)",
    btn_close: "Close",
  },
};

export default function SlipModal({
  slipImage,
  title,
  details = null,
  onApprove = null,
  onReject = null,
  approving = false,
  rejecting = false,
  onClose,
}) {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    lang === "en" ? "Amount does not match bill, or blurry slip" : "ยอดเงินไม่ตรงตามบิล หรือรูปสลิปไม่ชัดเจน"
  );

  if (!slipImage) return null;

  function handleConfirmReject() {
    if (onReject) {
      onReject(rejectReason);
    }
  }

  const modalTitle = title || t.default_title;

  return (
    <Modal title={modalTitle} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {details && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              background: "var(--surface-alt)",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 13,
            }}
          >
            {details.room_number && (
              <div>
                <span style={{ color: "var(--ink-muted)", display: "block", fontSize: 11 }}>{t.room_lbl}</span>
                <strong>{t.room_prefix} {details.room_number}</strong>
              </div>
            )}
            {details.tenant_name && (
              <div>
                <span style={{ color: "var(--ink-muted)", display: "block", fontSize: 11 }}>{t.tenant_lbl}</span>
                <strong>{details.tenant_name}</strong>
              </div>
            )}
            {details.period && (
              <div>
                <span style={{ color: "var(--ink-muted)", display: "block", fontSize: 11 }}>{t.period_lbl}</span>
                <strong>{details.period}</strong>
              </div>
            )}
            {details.amount !== undefined && (
              <div>
                <span style={{ color: "var(--ink-muted)", display: "block", fontSize: 11 }}>{t.amount_lbl}</span>
                <strong style={{ color: "#dc2626", fontSize: 15 }}>
                  {Number(details.amount).toLocaleString()} {t.baht}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* รูปสลิป */}
        <div
          style={{
            textAlign: "center",
            background: "#18181b",
            padding: 16,
            borderRadius: 12,
            maxHeight: "65vh",
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={slipImage}
            alt="Payment Slip"
            style={{
              maxWidth: "100%",
              maxHeight: "58vh",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          />
        </div>

        {/* Panel ปฏิเสธสลิป */}
        {showRejectInput && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", display: "block", marginBottom: 6 }}>
              {t.reject_reason_lbl}
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.reject_ph}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #fca5a5", marginBottom: 10, fontSize: 13 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setShowRejectInput(false)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={handleConfirmReject}
                style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >
                {rejecting ? t.saving : t.confirm_reject}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <a
            href={slipImage}
            download={`slip-${details?.room_number || "payment"}-${details?.period || "bill"}.jpg`}
            className="btn-ghost btn-sm"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            {t.btn_download}
          </a>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {onReject && !showRejectInput && (
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setShowRejectInput(true)}
                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
              >
                {t.btn_reject}
              </button>
            )}

            {onApprove && (
              <button
                type="button"
                className="btn-primary"
                disabled={approving || rejecting}
                onClick={onApprove}
                style={{ background: "#16a34a", borderColor: "#16a34a" }}
              >
                {approving ? t.saving : t.btn_approve}
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={onClose}>
              {t.btn_close}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
