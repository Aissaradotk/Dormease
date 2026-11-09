import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import NoticeSettingsCard from "../components/NoticeSettingsCard";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    pageTitle: "รายการจองห้องพัก (Bookings)",
    all: "ทั้งหมด",
    pending: "⏳ รออนุมัติ",
    approved: "✅ อนุมัติแล้ว",
    rejected: "❌ ปฏิเสธ",
    completed: "🏁 สิ้นสุด/ย้ายออก",
    cancelled: "🚫 ยกเลิกแล้ว",
    loading: "กำลังโหลดรายการจอง...",
    thRoom: "ห้อง",
    thTenant: "ผู้จอง",
    thPhone: "เบอร์โทร",
    thCheckInDate: "วันที่ต้องการเข้าพัก",
    thNote: "คำขอพิเศษ/หมายเหตุ",
    thStatus: "สถานะ",
    thActions: "การดำเนินการ",
    roomPrefix: "ห้อง",
    statusApproved: "อนุมัติแล้ว",
    statusRejected: "ปฏิเสธ",
    statusCancelled: "ยกเลิกแล้ว",
    statusCompleted: "ย้ายออกแล้ว",
    statusPending: "รออนุมัติ",
    btnApprove: "อนุมัติ",
    btnQuickApprove: "⚡ อนุมัติทันที",
    btnReject: "ปฏิเสธ",
    adminNotePrefix: "โน้ต:",
    empty: "ไม่มีรายการจองห้องพัก",
    modalApproveTitle: (room) => `ยืนยันอนุมัติการจอง ห้อง ${room}`,
    modalRejectTitle: (room) => `ปฏิเสธการจอง ห้อง ${room}`,
    applicant: "ผู้จอง:",
    preferredDate: "วันที่ต้องการเข้าพัก:",
    approveHint: "💡 เมื่ออนุมัติแล้ว ระบบจะเปลี่ยนสถานะห้องพักเป็น \"ไม่ว่าง (Occupied)\" และสร้างข้อมูลผู้เช่าให้อัตโนมัติ",
    lblAdminNote: "หมายเหตุ/ข้อความถึงผู้จอง",
    notePlaceholder: "เช่น ยินดีต้อนรับ สามารถเข้าดูห้องได้ในวัน..., หรือเหตุผลที่ปฏิเสธ",
    btnSaving: "กำลังบันทึก...",
    btnConfirmApprove: "ยืนยันอนุมัติการจอง",
    btnConfirmReject: "ยืนยันปฏิเสธการจอง",
    btnCancel: "ยกเลิก",
    alertApproved: "อนุมัติการจองและอัปเดตห้องพักเรียบร้อยแล้ว",
    alertRejected: "ปฏิเสธการจองเรียบร้อยแล้ว",
  },
  en: {
    pageTitle: "Room Bookings",
    all: "All",
    pending: "⏳ Pending",
    approved: "✅ Approved",
    rejected: "❌ Rejected",
    completed: "🏁 Completed",
    cancelled: "🚫 Cancelled",
    loading: "Loading bookings...",
    thRoom: "Room",
    thTenant: "Applicant",
    thPhone: "Phone",
    thCheckInDate: "Desired Move-in Date",
    thNote: "Special Request / Note",
    thStatus: "Status",
    thActions: "Actions",
    roomPrefix: "Room",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusCancelled: "Cancelled",
    statusCompleted: "Moved Out",
    statusPending: "Pending Approval",
    btnApprove: "Approve",
    btnQuickApprove: "⚡ Quick Approve",
    btnReject: "Reject",
    adminNotePrefix: "Note:",
    empty: "No booking requests found",
    modalApproveTitle: (room) => `Confirm Booking Approval for Room ${room}`,
    modalRejectTitle: (room) => `Reject Booking for Room ${room}`,
    applicant: "Applicant:",
    preferredDate: "Move-in Date:",
    approveHint: "💡 Upon approval, the room will be marked as 'Occupied' and a tenant record will be created automatically.",
    lblAdminNote: "Note / Message to Applicant",
    notePlaceholder: "e.g. Welcome! You may inspect the room on..., or reason for rejection",
    btnSaving: "Saving...",
    btnConfirmApprove: "Confirm Approval",
    btnConfirmReject: "Confirm Rejection",
    btnCancel: "Cancel",
    alertApproved: "Booking approved and room updated successfully",
    alertRejected: "Booking rejected successfully",
  },
};

export default function Bookings() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const [activeAction, setActiveAction] = useState(null); // { booking, action: 'approved'|'rejected' }
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await api.get("/bookings");
      setBookings(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  async function handleQuickApprove(b) {
    if (!window.confirm(lang === "th" ? `ยืนยันอนุมัติการจอง ห้อง ${b.room_number} (${b.user_name}) ทันที?` : `Quick approve booking for Room ${b.room_number}?`)) return;
    try {
      await api.put(`/bookings/${b.id}/status`, {
        status: "approved",
        admin_note: "อนุมัติเรียบร้อยแล้ว (Quick Approved)",
      });
      showToast(t.alertApproved, "success");
      loadBookings();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleStatusSubmit(e) {
    e.preventDefault();
    if (!activeAction) return;
    setSubmitting(true);
    try {
      await api.put(`/bookings/${activeAction.booking.id}/status`, {
        status: activeAction.action,
        admin_note: adminNote,
      });
      showToast(
        activeAction.action === "approved"
          ? t.alertApproved
          : t.alertRejected,
        "success"
      );
      setActiveAction(null);
      setAdminNote("");
      loadBookings();
    } catch (err) {
      showToast(err.message, "error");
    }
    setSubmitting(false);
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: "12px 20px",
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#fff",
          borderRadius: 10,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 10,
          animation: "fadeIn 0.2s ease"
        }}>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="page-head">
        <h1>{t.pageTitle}</h1>
        <div className="tab-buttons">
          <button className={`btn-tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            {t.all} ({bookings.length})
          </button>
          <button className={`btn-tab ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
            {t.pending} ({bookings.filter((b) => b.status === "pending").length})
          </button>
          <button className={`btn-tab ${filter === "approved" ? "active" : ""}`} onClick={() => setFilter("approved")}>
            {t.approved} ({bookings.filter((b) => b.status === "approved").length})
          </button>
          <button className={`btn-tab ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>
            {t.rejected} ({bookings.filter((b) => b.status === "rejected").length})
          </button>
          <button className={`btn-tab ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>
            {t.completed} ({bookings.filter((b) => b.status === "completed").length})
          </button>
          {bookings.some((b) => b.status === "cancelled") && (
            <button className={`btn-tab ${filter === "cancelled" ? "active" : ""}`} onClick={() => setFilter("cancelled")}>
              {t.cancelled} ({bookings.filter((b) => b.status === "cancelled").length})
            </button>
          )}
        </div>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/bookings", label: lang === "th" ? "การจองห้องพัก" : "Bookings", icon: "📅" },
          { path: "/admin/resident-verifications", label: lang === "th" ? "ยืนยันตัวตน" : "Verifications", icon: "🪪" },
          { path: "/repairs", label: lang === "th" ? "รายการแจ้งซ่อม" : "Repairs", icon: "🔧" },
          { path: "/move-outs", label: lang === "th" ? "แจ้งย้ายออก" : "Move-Outs", icon: "📦" },
          { path: "/residence-certificates", label: lang === "th" ? "ใบรับรองที่พัก" : "Certificates", icon: "📄" },
        ]}
      />

      {/* แผงควบคุมกำหนดวันแจ้งล่วงหน้าสำหรับ Admin */}
      <NoticeSettingsCard highlight="move_in" />

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <table className="data-table dense-table">
          <thead>
            <tr>
              <th>{t.thRoom}</th>
              <th>{t.thTenant}</th>
              <th>{t.thPhone}</th>
              <th>{t.thCheckInDate}</th>
              <th>{t.thNote}</th>
              <th>{t.thStatus}</th>
              <th>{t.thActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>
                  <b>{t.roomPrefix} {b.room_number}</b>
                  <div style={{ fontSize: 12, color: "#666" }}>{b.room_type}</div>
                </td>
                <td>
                  <div>{b.user_name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{b.user_email}</div>
                </td>
                <td>{b.contact_phone || b.user_phone || "-"}</td>
                <td>{b.check_in_date ? b.check_in_date.slice(0, 10) : "-"}</td>
                <td>{b.note || "-"}</td>
                <td>
                  <span
                    className={`pill ${
                      b.status === "approved"
                        ? "available"
                        : b.status === "rejected" || b.status === "cancelled"
                        ? "occupied"
                        : b.status === "completed"
                        ? "completed"
                        : "pending"
                    }`}
                    style={
                      b.status === "completed"
                        ? { background: "rgba(100, 116, 139, 0.15)", color: "#475569", border: "1px solid #cbd5e1" }
                        : undefined
                    }
                  >
                    {b.status === "approved"
                      ? t.statusApproved
                      : b.status === "rejected"
                      ? t.statusRejected
                      : b.status === "cancelled"
                      ? t.statusCancelled
                      : b.status === "completed"
                      ? t.statusCompleted
                      : t.statusPending}
                  </span>
                </td>
                <td className="row-actions">
                  {b.status === "pending" && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        className="btn-primary"
                        style={{ padding: "4px 8px", fontSize: 12, background: "#10b981", borderColor: "#10b981" }}
                        title="อนุมัติทันที 1-Click"
                        onClick={() => handleQuickApprove(b)}
                      >
                        {t.btnQuickApprove}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        onClick={() => setActiveAction({ booking: b, action: "approved" })}
                      >
                        {t.btnApprove}...
                      </button>
                      <button
                        className="btn-danger"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        onClick={() => setActiveAction({ booking: b, action: "rejected" })}
                      >
                        {t.btnReject}
                      </button>
                    </div>
                  )}
                  {b.admin_note && (
                    <span style={{ fontSize: 12, color: "#777", display: "block", marginTop: 4 }}>
                      {t.adminNotePrefix} {b.admin_note}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-cell">
                  {t.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* โมดอลยืนยันการอนุมัติหรือปฏิเสธ */}
      {activeAction && (
        <Modal
          title={
            activeAction.action === "approved"
              ? t.modalApproveTitle(activeAction.booking.room_number)
              : t.modalRejectTitle(activeAction.booking.room_number)
          }
          onClose={() => setActiveAction(null)}
        >
          <form onSubmit={handleStatusSubmit}>
            <p>
              {t.applicant} <b>{activeAction.booking.user_name}</b> ({activeAction.booking.user_email})
            </p>
            <p>
              {t.preferredDate} <b>{activeAction.booking.check_in_date?.slice(0, 10)}</b>
            </p>
            {activeAction.action === "approved" && (
              <p style={{ color: "#2d7a5b", fontSize: 13, background: "#eef8f3", padding: 8, borderRadius: 6 }}>
                {t.approveHint}
              </p>
            )}

            <label>{t.lblAdminNote}</label>
            <textarea
              rows="3"
              placeholder={t.notePlaceholder}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className={activeAction.action === "approved" ? "btn-primary" : "btn-danger"}
                type="submit"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting
                  ? t.btnSaving
                  : activeAction.action === "approved"
                  ? t.btnConfirmApprove
                  : t.btnConfirmReject}
              </button>
              <button className="btn-ghost" type="button" onClick={() => setActiveAction(null)}>
                {t.btnCancel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
