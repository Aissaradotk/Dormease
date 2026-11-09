import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    page_title: "กล่องรับแจ้งซ่อมของลูกบ้าน (Repairs)",
    tab_all: "ทั้งหมด",
    tab_pending: "⏳ รอดำเนินการ",
    tab_in_progress: "🛠 กำลังซ่อม",
    tab_completed: "✅ แก้ไขแล้ว",
    loading: "กำลังโหลดรายการแจ้งซ่อม...",
    room: "ห้อง",
    unspecified: "ไม่ระบุ",
    reporter: "ผู้แจ้ง",
    phone: "โทร",
    reported_date: "วันที่แจ้ง",
    status_completed: "✅ แก้ไขแล้ว",
    status_in_progress: "🛠 กำลังซ่อม",
    status_pending: "⏳ รอดำเนินการ",
    status_cancelled: "❌ ยกเลิกงานซ่อม",
    manage_btn: "จัดการงานซ่อม",
    problem_desc: "รายละเอียดปัญหา:",
    tech_note: "บันทึกช่าง / เจ้าของหอ:",
    empty: "ไม่มีรายการแจ้งซ่อมในสถานะนี้",
    modal_manage: "จัดการงานซ่อม",
    change_status: "เปลี่ยนสถานะงานซ่อม *",
    status_opt_pending: "⏳ รอดำเนินการ",
    status_opt_in_progress: "🛠 กำลังดำเนินการ (ช่างเข้าซ่อม)",
    status_opt_completed: "✅ แก้ไขเรียบร้อยแล้ว",
    status_opt_cancelled: "❌ ยกเลิกงานซ่อม",
    tech_note_label: "บันทึกการแก้ไข / หมายเหตุช่าง",
    tech_note_ph: "เช่น เปลี่ยนหลอดไฟ LED เรียบร้อย, เปลี่ยนก๊อกน้ำใหม่, นัดช่างแอร์เข้าวันเสาร์...",
    saving: "กำลังบันทึก...",
    save_btn: "บันทึกและแจ้งเตือนลูกบ้าน",
    cancel: "ยกเลิก",
    success_alert: "อัปเดตสถานะงานซ่อมเรียบร้อยแล้ว",
  },
  en: {
    page_title: "Tenant Repair Requests",
    tab_all: "All",
    tab_pending: "⏳ Pending",
    tab_in_progress: "🛠 In Progress",
    tab_completed: "✅ Completed",
    loading: "Loading repair requests...",
    room: "Room",
    unspecified: "Unspecified",
    reporter: "Reported by",
    phone: "Phone",
    reported_date: "Report Date",
    status_completed: "✅ Completed",
    status_in_progress: "🛠 In Progress",
    status_pending: "⏳ Pending",
    status_cancelled: "❌ Cancelled",
    manage_btn: "Manage Repair",
    problem_desc: "Problem Details:",
    tech_note: "Technician / Owner Note:",
    empty: "No repair requests in this status",
    modal_manage: "Manage Repair",
    change_status: "Update Repair Status *",
    status_opt_pending: "⏳ Pending",
    status_opt_in_progress: "🛠 In Progress (Technician Assigned)",
    status_opt_completed: "✅ Completed / Resolved",
    status_opt_cancelled: "❌ Cancelled",
    tech_note_label: "Repair Log / Technician Note",
    tech_note_ph: "e.g. LED bulb replaced, scheduled technician for Saturday...",
    saving: "Saving...",
    save_btn: "Save & Notify Tenant",
    cancel: "Cancel",
    success_alert: "Repair status updated successfully",
  },
};

const CATEGORY_MAP = {
  electricity: { th: "⚡ ระบบไฟฟ้า", en: "⚡ Electrical" },
  plumbing: { th: "💧 ประปา/สุขภัณฑ์", en: "💧 Plumbing" },
  air_conditioner: { th: "❄️ เครื่องปรับอากาศ", en: "❄️ Air Conditioner" },
  furniture: { th: "🪑 เฟอร์นิเจอร์", en: "🪑 Furniture" },
  appliance: { th: "📺 เครื่องใช้ไฟฟ้า", en: "📺 Appliances" },
  structural: { th: "🚪 โครงสร้าง/ประตู/หน้าต่าง", en: "🚪 Structural/Doors" },
  other: { th: "🔧 อื่นๆ", en: "🔧 Other" },
};

export default function Repairs() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedRepair, setSelectedRepair] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("completed");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadRepairs() {
    setLoading(true);
    try {
      const data = await api.get("/repairs");
      setRepairs(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadRepairs();
  }, []);

  const filtered = repairs.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  async function handleUpdateStatus(e) {
    e.preventDefault();
    if (!selectedRepair) return;
    setSubmitting(true);
    try {
      await api.put(`/repairs/${selectedRepair.id}`, {
        status: updateStatus,
        admin_note: adminNote,
      });
      alert(t.success_alert);
      setSelectedRepair(null);
      setAdminNote("");
      loadRepairs();
    } catch (err) {
      alert(err.message);
    }
    setSubmitting(false);
  }

  function getCategoryName(cat) {
    const found = CATEGORY_MAP[cat];
    if (found) return found[lang] || found.th;
    return cat;
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t.page_title}</h1>
        <div className="tab-buttons">
          <button className={`btn-tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            {t.tab_all} ({repairs.length})
          </button>
          <button className={`btn-tab ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
            {t.tab_pending} ({repairs.filter((r) => r.status === "pending").length})
          </button>
          <button className={`btn-tab ${filter === "in_progress" ? "active" : ""}`} onClick={() => setFilter("in_progress")}>
            {t.tab_in_progress} ({repairs.filter((r) => r.status === "in_progress").length})
          </button>
          <button className={`btn-tab ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>
            {t.tab_completed} ({repairs.filter((r) => r.status === "completed").length})
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

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <div className="repair-grid">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="card-box"
              style={{
                borderLeft:
                  r.status === "completed"
                    ? "5px solid #2d7a5b"
                    : r.status === "in_progress"
                    ? "5px solid #e2a03f"
                    : "5px solid #d9534f",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="pill category-pill">{getCategoryName(r.category)}</span>
                  <span style={{ marginLeft: 8, fontWeight: "bold", fontSize: 16 }}>
                    {t.room} {r.room_number || t.unspecified}
                  </span>
                  <h3 style={{ margin: "6px 0 4px", fontSize: 17 }}>{r.title}</h3>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {t.reporter}: <b>{r.user_name}</b> | {t.phone}: {r.user_phone || "-"} | {t.reported_date}:{" "}
                    {new Date(r.created_at).toLocaleString(lang === "en" ? "en-US" : "th-TH")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    className={`pill ${
                      r.status === "completed"
                        ? "available"
                        : r.status === "in_progress"
                        ? "pending"
                        : "occupied"
                    }`}
                  >
                    {r.status === "completed"
                      ? t.status_completed
                      : r.status === "in_progress"
                      ? t.status_in_progress
                      : t.status_pending}
                  </span>
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn-primary"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() => {
                        setSelectedRepair(r);
                        setUpdateStatus(r.status === "pending" ? "in_progress" : "completed");
                        setAdminNote(r.admin_note || "");
                      }}
                    >
                      {t.manage_btn}
                    </button>
                  </div>
                </div>
              </div>

              {r.description && (
                <div
                  style={{
                    margin: "12px 0 0",
                    background: "var(--surface-alt, #f7f9f8)",
                    padding: 10,
                    borderRadius: 6,
                    fontSize: 14,
                    color: "var(--ink-primary, #333)",
                  }}
                >
                  <b>{t.problem_desc}</b> {r.description}
                </div>
              )}

              {r.admin_note && (
                <div
                  style={{
                    marginTop: 8,
                    background: "var(--primary-light, #eef8f3)",
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "var(--primary, #2d7a5b)",
                  }}
                >
                  <b>{t.tech_note}</b> {r.admin_note}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="empty-box">{t.empty}</div>
          )}
        </div>
      )}

      {/* โมดอลอัปเดตสถานะงานแจ้งซ่อม */}
      {selectedRepair && (
        <Modal
          title={`${t.modal_manage}: ${selectedRepair.title} (${t.room} ${selectedRepair.room_number || "-"})`}
          onClose={() => setSelectedRepair(null)}
        >
          <form onSubmit={handleUpdateStatus}>
            <p>
              {t.reporter}: <b>{selectedRepair.user_name}</b> | {t.phone}: <b>{selectedRepair.user_phone || "-"}</b>
            </p>
            <p style={{ background: "var(--surface-alt, #f8f9fa)", padding: 8, borderRadius: 6, fontSize: 13 }}>
              {selectedRepair.description || selectedRepair.title}
            </p>

            <label>{t.change_status}</label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
            >
              <option value="pending">{t.status_opt_pending}</option>
              <option value="in_progress">{t.status_opt_in_progress}</option>
              <option value="completed">{t.status_opt_completed}</option>
              <option value="cancelled">{t.status_opt_cancelled}</option>
            </select>

            <label>{t.tech_note_label}</label>
            <textarea
              rows="3"
              placeholder={t.tech_note_ph}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? t.saving : t.save_btn}
              </button>
              <button className="btn-ghost" type="button" onClick={() => setSelectedRepair(null)}>
                {t.cancel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
