import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { getMinDateString, formatThaiDate } from "../lib/dateUtils";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    pageTitle: "ระบบแจ้งย้ายออกจากห้องพัก",
    loading: "กำลังโหลดข้อมูล...",
    currentRoomTitle: "ข้อมูลห้องพักปัจจุบัน",
    room: "ห้องพัก:",
    roomType: "ประเภทห้อง:",
    checkInDate: "วันที่เข้าพัก:",
    currentStatus: "สถานะปัจจุบัน:",
    active: "พักอยู่",
    movedOut: "ย้ายออกแล้ว",
    pendingWarningTitle: "⚠️ คุณมีคำร้องขอย้ายออกที่อยู่ระหว่างรอการอนุมัติ",
    pendingWarningDesc: "กรุณารอเจ้าของหอพักตรวจสอบและติดต่อกลับเพื่อนัดตรวจห้องพัก",
    formTitle: "กรอกแบบฟอร์มแจ้งย้ายออก",
    ruleNotice: "📢 ข้อกำหนดของหอพัก: ต้องแจ้งย้ายออกล่วงหน้าอย่างน้อย",
    days: "วัน",
    earliestDate: "📅 วันที่เร็วที่สุดที่สามารถเลือกย้ายออกได้คือ:",
    onwards: "เป็นต้นไป",
    lblMoveOutDate: "วันที่ต้องการย้ายออก * (ล่วงหน้าอย่างน้อย",
    lblReason: "เหตุผลในการย้ายออก",
    reasonPlaceholder: "เช่น เรียนจบ, ย้ายที่ทำงาน, กลับภูมิลำเนา...",
    lblBank: "เลขบัญชีธนาคารและชื่อบัญชี (สำหรับโอนคืนเงินประกัน)",
    bankPlaceholder: "เช่น กสิกรไทย 123-4-56789-0 นายสมชาย",
    btnSubmitting: "กำลังส่งข้อมูล...",
    btnSubmit: "ส่งคำร้องขอย้ายออก",
    alreadyMovedOut: "คุณได้ย้ายออกจากห้องพักนี้เรียบร้อยแล้ว",
    noRoomConnected: "ยังไม่พบข้อมูลห้องพักที่เชื่อมต่อกับบัญชีนี้",
    historyTitle: "ประวัติคำร้องขอย้ายออก",
    roomPrefix: "ห้อง",
    statusApproved: "อนุมัติแล้ว",
    statusRejected: "ปฏิเสธ",
    statusPending: "รอเจ้าของหออนุมัติ",
    dateRequested: "วันที่ขอย้ายออก:",
    reasonLabel: "เหตุผล:",
    adminNoteLabel: "หมายเหตุหอพัก:",
    emptyHistory: "ไม่มีประวัติคำร้องแจ้งย้ายออก",
    alertSelectDate: "กรุณาเลือกวันที่ต้องการย้ายออก",
    alertMinDate: (days, dateStr) => `หอพักกำหนดให้ต้องแจ้งย้ายออกล่วงหน้าอย่างน้อย ${days} วัน (สามารถเลือกได้ตั้งแต่วันที่ ${dateStr} เป็นต้นไป)`,
    confirmSubmit: "คุณยืนยันการส่งคำร้องขอย้ายออกจากห้องพักใช่หรือไม่?",
    successSubmit: "ส่งคำร้องขอย้ายออกเรียบร้อยแล้ว เจ้าหน้าที่หอพักจะทำการตรวจสอบ",
  },
  en: {
    pageTitle: "Move-Out Notice System",
    loading: "Loading information...",
    currentRoomTitle: "Current Room Information",
    room: "Room:",
    roomType: "Room Type:",
    checkInDate: "Check-in Date:",
    currentStatus: "Current Status:",
    active: "Active",
    movedOut: "Moved Out",
    pendingWarningTitle: "⚠️ You have a pending move-out request",
    pendingWarningDesc: "Please wait for dormitory administration to review and contact you for room inspection.",
    formTitle: "Submit Move-Out Notice",
    ruleNotice: "📢 Dormitory Policy: Minimum advance notice required:",
    days: "days",
    earliestDate: "📅 Earliest selectable move-out date is:",
    onwards: "onwards",
    lblMoveOutDate: "Intended Move-Out Date * (At least advance",
    lblReason: "Reason for Move-Out",
    reasonPlaceholder: "e.g. Graduation, job relocation, returning home...",
    lblBank: "Bank Account & Account Name (for security deposit refund)",
    bankPlaceholder: "e.g. KBank 123-4-56789-0 John Doe",
    btnSubmitting: "Submitting...",
    btnSubmit: "Submit Move-Out Notice",
    alreadyMovedOut: "You have already completed move-out for this room.",
    noRoomConnected: "No active room found connected to this account.",
    historyTitle: "Move-Out Request History",
    roomPrefix: "Room",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusPending: "Pending Admin Approval",
    dateRequested: "Requested Date:",
    reasonLabel: "Reason:",
    adminNoteLabel: "Admin Note:",
    emptyHistory: "No move-out requests found",
    alertSelectDate: "Please select your intended move-out date",
    alertMinDate: (days, dateStr) => `Dormitory policy requires at least ${days} days advance notice (Earliest allowed: ${dateStr})`,
    confirmSubmit: "Are you sure you want to submit your move-out request?",
    successSubmit: "Move-out request submitted successfully! Dorm administration will review it.",
  },
};

export default function TenantMoveOut() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const [tenant, setTenant] = useState(undefined);
  const [moveOuts, setMoveOuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ move_out_date: "", reason: "", bank_account: "" });
  const [submitting, setSubmitting] = useState(false);
  const [moveOutNoticeDays, setMoveOutNoticeDays] = useState(30);

  async function loadData() {
    setLoading(true);
    try {
      const [tData, m, s] = await Promise.all([
        api.get("/tenants/me"),
        api.get("/move-outs/my"),
        api.get("/settings/notice-days").catch(() => null),
      ]);
      setTenant(tData);
      setMoveOuts(m);
      if (s && s.move_out_notice_days !== undefined) {
        setMoveOutNoticeDays(s.move_out_notice_days);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const minMoveOutDate = getMinDateString(moveOutNoticeDays);
  const displayMinDate = lang === "en" ? minMoveOutDate : formatThaiDate(minMoveOutDate);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.move_out_date) {
      alert(t.alertSelectDate);
      return;
    }
    if (form.move_out_date < minMoveOutDate) {
      alert(t.alertMinDate(moveOutNoticeDays, displayMinDate));
      return;
    }
    if (!confirm(t.confirmSubmit)) return;

    setSubmitting(true);
    try {
      await api.post("/move-outs", form);
      alert(t.successSubmit);
      setForm({ move_out_date: "", reason: "", bank_account: "" });
      loadData();
    } catch (err) {
      alert(err.message);
    }
    setSubmitting(false);
  }

  const hasPending = moveOuts.some((m) => m.status === "pending");

  return (
    <div>
      <div className="page-head">
        <h1>{t.pageTitle}</h1>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/my-repairs", label: lang === "th" ? "แจ้งซ่อมบำรุง" : "Repair Request", icon: "🔧" },
          { path: "/my-move-out", label: lang === "th" ? "แจ้งย้ายออก" : "Move-Out Request", icon: "📦" },
          { path: "/residence-certificate", label: lang === "th" ? "ขอใบรับรองที่พัก" : "Residence Certificate", icon: "📄" },
          { path: "/book-room", label: lang === "th" ? "จองห้องพักใหม่" : "Book New Room", icon: "🔍" },
        ]}
      />

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {/* ข้อมูลห้องพักปัจจุบัน */}
          <div className="card-box">
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>{t.currentRoomTitle}</h2>
            {tenant ? (
              <div>
                <p><b>{t.room}</b> {tenant.rooms?.room_number || "-"}</p>
                <p><b>{t.roomType}</b> {tenant.rooms?.room_type || "-"}</p>
                <p><b>{t.checkInDate}</b> {tenant.start_date || "-"}</p>
                <p>
                  <b>{t.currentStatus}</b>{" "}
                  <span className={`pill ${tenant.status === "active" ? "available" : "occupied"}`}>
                    {tenant.status === "active" ? t.active : t.movedOut}
                  </span>
                </p>

                {hasPending ? (
                  <div style={{ marginTop: 20, background: "#fef3c7", padding: 14, borderRadius: 8, border: "1px solid #f59e0b" }}>
                    <h3 style={{ color: "#92400e", margin: "0 0 6px", fontSize: 15 }}>
                      {t.pendingWarningTitle}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#78350f" }}>
                      {t.pendingWarningDesc}
                    </p>
                  </div>
                ) : tenant.status === "active" ? (
                  <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: 16, borderTop: "1px solid #eee", paddingTop: 14 }}>
                      {t.formTitle}
                    </h3>

                    {/* แถบแจ้งเตือนกำหนดแจ้งย้ายออกล่วงหน้า */}
                    <div
                      style={{
                        marginBottom: 14,
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: "var(--warning-bg, #fffbeb)",
                        border: "1px solid var(--warning-border, #fde68a)",
                        fontSize: 13,
                        color: "var(--ink-primary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {t.ruleNotice} <b>{moveOutNoticeDays} {t.days}</b><br />
                      {t.earliestDate} <b style={{ color: "var(--warning, #d97706)" }}>{displayMinDate}</b> {t.onwards}
                    </div>

                    <label>{t.lblMoveOutDate} {moveOutNoticeDays} {t.days})</label>
                    <input
                      type="date"
                      required
                      min={minMoveOutDate}
                      value={form.move_out_date}
                      onChange={(e) => setForm({ ...form, move_out_date: e.target.value })}
                    />

                    <label>{t.lblReason}</label>
                    <textarea
                      rows="3"
                      placeholder={t.reasonPlaceholder}
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />

                    <label>{t.lblBank}</label>
                    <input
                      type="text"
                      placeholder={t.bankPlaceholder}
                      value={form.bank_account}
                      onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                    />

                    <button className="btn-primary" type="submit" disabled={submitting} style={{ width: "100%", marginTop: 14 }}>
                      {submitting ? t.btnSubmitting : t.btnSubmit}
                    </button>
                  </form>
                ) : (
                  <p style={{ color: "#666" }}>{t.alreadyMovedOut}</p>
                )}
              </div>
            ) : (
              <div className="empty-box">{t.noRoomConnected}</div>
            )}
          </div>

          {/* ประวัติคำร้องแจ้งย้ายออก */}
          <div className="card-box">
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>{t.historyTitle}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {moveOuts.map((m) => (
                <div
                  key={m.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 12,
                    background: "#f9fafb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b>{t.roomPrefix} {m.room_number}</b>
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
                        ? t.statusApproved
                        : m.status === "rejected"
                        ? t.statusRejected
                        : t.statusPending}
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 2px", fontSize: 13, color: "#555" }}>
                    <b>{t.dateRequested}</b> {m.move_out_date?.slice(0, 10)}
                  </p>
                  {m.reason && (
                    <p style={{ margin: "2px 0", fontSize: 13, color: "#666" }}>
                      <b>{t.reasonLabel}</b> {m.reason}
                    </p>
                  )}
                  {m.admin_note && (
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#2d7a5b", background: "#eef8f3", padding: "4px 8px", borderRadius: 4 }}>
                      <b>{t.adminNoteLabel}</b> {m.admin_note}
                    </p>
                  )}
                </div>
              ))}

              {moveOuts.length === 0 && (
                <div className="empty-box">{t.emptyHistory}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
