import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import NoticeSettingsCard from "../components/NoticeSettingsCard";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    page_title: "รายการแจ้งย้ายออกของลูกบ้าน (Move-outs)",
    tab_all: "ทั้งหมด",
    tab_pending: "⏳ รอดำเนินการ",
    tab_approved: "✅ อนุมัติแล้ว",
    tab_rejected: "❌ ปฏิเสธ",
    loading: "กำลังโหลดรายการแจ้งย้ายออก...",
    th_room: "ห้อง",
    th_tenant: "ผู้เช่า",
    th_phone: "เบอร์โทร",
    th_move_out_date: "วันที่ขอย้ายออก",
    th_reason: "เหตุผล",
    th_bank: "บัญชีคืนเงินประกัน",
    th_status: "สถานะ",
    th_actions: "",
    status_approved: "อนุมัติแล้ว",
    status_rejected: "ปฏิเสธ",
    status_pending: "รออนุมัติ",
    btn_approve: "อนุมัติ",
    btn_quick_approve: "⚡ อนุมัติทันที",
    btn_reject: "ปฏิเสธ",
    note_prefix: "โน้ต:",
    empty: "ไม่มีรายการแจ้งย้ายออก",
    modal_title_approve: "อนุมัติการย้ายออก ห้อง",
    modal_title_reject: "ปฏิเสธคำร้องย้ายออก ห้อง",
    tenant_label: "ผู้เช่า:",
    room_label: "ห้อง",
    date_label: "วันที่ขอย้ายออก:",
    bank_label: "บัญชีโอนคืนเงินประกัน:",
    auto_vacate_hint: "💡 เมื่ออนุมัติแล้ว ระบบจะปลดสถานะห้องพักให้กลับมาเป็น 'ห้องว่าง (Available)' โดยอัตโนมัติ เพื่อให้เปิดรับผู้เช่าใหม่ได้ทันที",
    note_label: "หมายเหตุ/บันทึกถึงผู้เช่า",
    note_ph: "เช่น นัดตรวจเช็คสภาพห้องวันที่..., รายละเอียดการหักค่าทำความสะอาด/โอนคืนเงินประกัน",
    saving: "กำลังบันทึก...",
    confirm_approve: "ยืนยันอนุมัติการย้ายออก",
    confirm_reject: "ยืนยันปฏิเสธคำร้อง",
    cancel: "ยกเลิก",
    alert_approved: "อนุมัติการย้ายออกและปรับสถานะห้องเป็น 'ว่าง' เรียบร้อยแล้ว",
    alert_rejected: "ปฏิเสธคำร้องขอย้ายออกเรียบร้อยแล้ว",
  },
  en: {
    page_title: "Tenant Move-Out Requests",
    tab_all: "All",
    tab_pending: "⏳ Pending",
    tab_approved: "✅ Approved",
    tab_rejected: "❌ Rejected",
    loading: "Loading move-out requests...",
    th_room: "Room",
    th_tenant: "Tenant",
    th_phone: "Phone",
    th_move_out_date: "Requested Move-Out Date",
    th_reason: "Reason",
    th_bank: "Deposit Refund Account",
    th_status: "Status",
    th_actions: "",
    status_approved: "Approved",
    status_rejected: "Rejected",
    status_pending: "Pending",
    btn_approve: "Approve",
    btn_quick_approve: "⚡ Quick Approve",
    btn_reject: "Reject",
    note_prefix: "Note:",
    empty: "No move-out requests found",
    modal_title_approve: "Approve Move-Out - Room",
    modal_title_reject: "Reject Move-Out - Room",
    tenant_label: "Tenant:",
    room_label: "Room",
    date_label: "Move-Out Date:",
    bank_label: "Refund Account:",
    auto_vacate_hint: "💡 Upon approval, the room will automatically be released and set to 'Available' for new tenants.",
    note_label: "Notes / Message to Tenant",
    note_ph: "e.g. Room inspection scheduled for..., deposit refund deduction details...",
    saving: "Saving...",
    confirm_approve: "Confirm Move-Out Approval",
    confirm_reject: "Confirm Request Rejection",
    cancel: "Cancel",
    alert_approved: "Move-out approved and room status set to 'Available' successfully",
    alert_rejected: "Move-out request rejected successfully",
  },
};

export default function MoveOuts() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [moveOuts, setMoveOuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const [activeItem, setActiveItem] = useState(null);
  const [actionType, setActionType] = useState("approved");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadMoveOuts() {
    setLoading(true);
    try {
      const data = await api.get("/move-outs");
      setMoveOuts(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMoveOuts();
  }, []);

  const filtered = moveOuts.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  async function handleQuickApprove(m) {
    if (!window.confirm(lang === "th" 
      ? `ยืนยันอนุมัติการย้ายออก ห้อง ${m.room_number} (${m.tenant_name}) ทันที?\n(ระบบจะปลดห้องให้ว่าง และอัปเดตสถานะให้อัตโนมัติ)`
      : `Quick approve move-out for Room ${m.room_number}?`
    )) return;

    try {
      await api.put(`/move-outs/${m.id}/status`, {
        status: "approved",
        admin_note: "อนุมัติการย้ายออกเรียบร้อยแล้ว (Quick Approved)",
      });
      showToast(t.alert_approved, "success");
      loadMoveOuts();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleStatusSubmit(e) {
    e.preventDefault();
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await api.put(`/move-outs/${activeItem.id}/status`, {
        status: actionType,
        admin_note: adminNote,
      });
      showToast(actionType === "approved" ? t.alert_approved : t.alert_rejected, "success");
      setActiveItem(null);
      setAdminNote("");
      loadMoveOuts();
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
        <h1>{t.page_title}</h1>
        <div className="tab-buttons">
          <button className={`btn-tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            {t.tab_all} ({moveOuts.length})
          </button>
          <button className={`btn-tab ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
            {t.tab_pending} ({moveOuts.filter((m) => m.status === "pending").length})
          </button>
          <button className={`btn-tab ${filter === "approved" ? "active" : ""}`} onClick={() => setFilter("approved")}>
            {t.tab_approved} ({moveOuts.filter((m) => m.status === "approved").length})
          </button>
          <button className={`btn-tab ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>
            {t.tab_rejected} ({moveOuts.filter((m) => m.status === "rejected").length})
          </button>
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
      <NoticeSettingsCard highlight="move_out" />

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <table className="data-table dense-table">
          <thead>
            <tr>
              <th>{t.th_room}</th>
              <th>{t.th_tenant}</th>
              <th>{t.th_phone}</th>
              <th>{t.th_move_out_date}</th>
              <th>{t.th_reason}</th>
              <th>{t.th_bank}</th>
              <th>{t.th_status}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>
                  <b>{t.room_label} {m.room_number}</b>
                  <div style={{ fontSize: 11, color: "#666" }}>{m.room_type}</div>
                </td>
                <td>
                  <div><b>{m.tenant_name}</b></div>
                  <div style={{ fontSize: 12, color: "#666" }}>{m.tenant_email}</div>
                </td>
                <td>{m.tenant_phone || "-"}</td>
                <td><b>{m.move_out_date?.slice(0, 10)}</b></td>
                <td>{m.reason || "-"}</td>
                <td>{m.bank_account || "-"}</td>
                <td>
                  <span
                    className={`pill ${
                      m.status === "approved"
                        ? "available"
                        : m.status === "rejected"
                        ? "occupied"
                        : "pending"
                    }`}
                  >
                    {m.status === "approved"
                      ? t.status_approved
                      : m.status === "rejected"
                      ? t.status_rejected
                      : t.status_pending}
                  </span>
                </td>
                <td className="row-actions">
                  {m.status === "pending" && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        className="btn-primary"
                        style={{ padding: "4px 8px", fontSize: 12, background: "#10b981", borderColor: "#10b981" }}
                        title="อนุมัติทันที 1-Click"
                        onClick={() => handleQuickApprove(m)}
                      >
                        {t.btn_quick_approve}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        onClick={() => {
                          setActiveItem(m);
                          setActionType("approved");
                        }}
                      >
                        {t.btn_approve}...
                      </button>
                      <button
                        className="btn-danger"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        onClick={() => {
                          setActiveItem(m);
                          setActionType("rejected");
                        }}
                      >
                        {t.btn_reject}
                      </button>
                    </div>
                  )}
                  {m.admin_note && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      {t.note_prefix} {m.admin_note}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-cell">
                  {t.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* โมดอลอนุมัติหรือปฏิเสธคำร้องย้ายออก */}
      {activeItem && (
        <Modal
          title={
            actionType === "approved"
              ? `${t.modal_title_approve} ${activeItem.room_number}`
              : `${t.modal_title_reject} ${activeItem.room_number}`
          }
          onClose={() => setActiveItem(null)}
        >
          <form onSubmit={handleStatusSubmit}>
            <p>{t.tenant_label} <b>{activeItem.tenant_name}</b> ({t.room_label} {activeItem.room_number})</p>
            <p>{t.date_label} <b>{activeItem.move_out_date?.slice(0, 10)}</b></p>
            {activeItem.bank_account && (
              <p>{t.bank_label} <b>{activeItem.bank_account}</b></p>
            )}

            {actionType === "approved" && (
              <div style={{ background: "#eef8f3", color: "#2d7a5b", padding: 10, borderRadius: 6, fontSize: 13, margin: "12px 0" }}>
                {t.auto_vacate_hint}
              </div>
            )}

            <label>{t.note_label}</label>
            <textarea
              rows="3"
              placeholder={t.note_ph}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className={actionType === "approved" ? "btn-primary" : "btn-danger"}
                type="submit"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting
                  ? t.saving
                  : actionType === "approved"
                  ? t.confirm_approve
                  : t.confirm_reject}
              </button>
              <button className="btn-ghost" type="button" onClick={() => setActiveItem(null)}>
                {t.cancel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
