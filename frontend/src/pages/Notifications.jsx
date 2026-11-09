import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    page_title: "ประกาศและระบบแจ้งเตือน (Notifications)",
    create_btn: "+ สร้างประกาศใหม่",
    loading: "กำลังโหลดรายการประกาศ...",
    th_category: "ประเภท",
    th_title: "หัวข้อ",
    th_message: "ข้อความ",
    th_recipient: "ผู้รับ",
    th_date: "วันที่สร้าง",
    th_actions: "",
    cat_general: "📢 ทั่วไป",
    cat_bill: "🧾 บิล",
    cat_repair: "🔧 ซ่อม",
    cat_move_out: "📦 ย้ายออก",
    cat_booking: "📅 จอง",
    recipient_all: "👥 ลูกบ้านทุกคน (All)",
    delete_btn: "ลบ",
    delete_confirm: "คุณต้องการลบประกาศนี้ใช่หรือไม่?",
    empty: "ยังไม่มีประวัติการประกาศหรือแจ้งเตือน",
    modal_title: "สร้างประกาศ / การแจ้งเตือนใหม่",
    label_recipient: "ส่งถึง *",
    opt_broadcast: "👥 ส่งถึงลูกบ้านทุกคน (Broadcast)",
    room_prefix: "ห้อง",
    label_category: "หมวดหมู่ประกาศ *",
    opt_cat_general: "📢 ประกาศทั่วไป (General Notice)",
    opt_cat_bill: "🧾 แจ้งเตือนบิล / ค่าใช้จ่าย (Billing)",
    opt_cat_repair: "🔧 แจ้งเตือนงานซ่อมบำรุง (Maintenance)",
    opt_cat_move_out: "📦 ย้ายออก / ตรวจห้อง (Move-out)",
    label_title: "หัวข้อประกาศ *",
    ph_title: "เช่น แจ้งปิดปรับปรุงระบบน้ำประปาชั่วคราว, กำหนดชำระค่าเช่า...",
    label_message: "เนื้อหาข้อความ *",
    ph_message: "กรอกรายละเอียดประกาศหรือคำชี้แจงสำหรับลูกบ้าน...",
    submitting: "กำลังส่ง...",
    btn_submit: "ส่งประกาศ",
    cancel: "ยกเลิก",
    alert_required: "กรุณากรอกหัวข้อและข้อความแจ้งเตือน",
    alert_success: "ส่งประกาศ / การแจ้งเตือนเรียบร้อยแล้ว",
  },
  en: {
    page_title: "Announcements & Notifications",
    create_btn: "+ New Announcement",
    loading: "Loading announcements...",
    th_category: "Category",
    th_title: "Title",
    th_message: "Message",
    th_recipient: "Recipient",
    th_date: "Created Date",
    th_actions: "",
    cat_general: "📢 General",
    cat_bill: "🧾 Bill",
    cat_repair: "🔧 Repair",
    cat_move_out: "📦 Move-out",
    cat_booking: "📅 Booking",
    recipient_all: "👥 All Tenants (Broadcast)",
    delete_btn: "Delete",
    delete_confirm: "Are you sure you want to delete this announcement?",
    empty: "No announcements or notifications yet",
    modal_title: "Create Announcement / Notification",
    label_recipient: "Send To *",
    opt_broadcast: "👥 All Tenants (Broadcast)",
    room_prefix: "Room",
    label_category: "Category *",
    opt_cat_general: "📢 General Notice",
    opt_cat_bill: "🧾 Billing Notice",
    opt_cat_repair: "🔧 Maintenance / Repair",
    opt_cat_move_out: "📦 Move-out / Inspection",
    label_title: "Title *",
    ph_title: "e.g. Scheduled water maintenance, rent due reminder...",
    label_message: "Message Content *",
    ph_message: "Enter announcement details for tenants...",
    submitting: "Sending...",
    btn_submit: "Send Announcement",
    cancel: "Cancel",
    alert_required: "Please enter both title and message content",
    alert_success: "Announcement / notification sent successfully",
  },
};

export default function Notifications() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [notifications, setNotifications] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    category: "general",
    user_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [notifs, tList] = await Promise.all([
        api.get("/notifications/all"),
        api.get("/tenants"),
      ]);
      setNotifications(notifs);
      setTenants(tList);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    if (!form.title || !form.message) {
      alert(t.alert_required);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/notifications", {
        title: form.title,
        message: form.message,
        category: form.category,
        user_id: form.user_id ? Number(form.user_id) : null,
      });
      alert(t.alert_success);
      setOpenModal(false);
      setForm({ title: "", message: "", category: "general", user_id: "" });
      loadData();
    } catch (err) {
      alert(err.message);
    }
    setSubmitting(false);
  }

  async function handleDelete(id) {
    if (!confirm(t.delete_confirm)) return;
    try {
      await api.del(`/notifications/${id}`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  function getCategoryLabel(cat) {
    switch (cat) {
      case "general": return t.cat_general;
      case "bill": return t.cat_bill;
      case "repair": return t.cat_repair;
      case "move_out": return t.cat_move_out;
      case "booking": return t.cat_booking;
      default: return cat;
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t.page_title}</h1>
        <button className="btn-primary" onClick={() => setOpenModal(true)}>
          {t.create_btn}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.th_category}</th>
              <th>{t.th_title}</th>
              <th>{t.th_message}</th>
              <th>{t.th_recipient}</th>
              <th>{t.th_date}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id}>
                <td style={{ whiteSpace: "nowrap" }}>
                  <span className="pill" style={{ background: "#e5e7eb", color: "#374151" }}>
                    {getCategoryLabel(n.category)}
                  </span>
                </td>
                <td style={{ fontWeight: "bold" }}>{n.title}</td>
                <td style={{ maxWidth: 350, fontSize: 13, color: "#444" }}>{n.message}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {n.user_id ? (
                    <span style={{ color: "#2563eb" }}>👤 {n.target_user_name || `User #${n.user_id}`}</span>
                  ) : (
                    <span style={{ color: "#16a34a", fontWeight: "bold" }}>{t.recipient_all}</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: "#777", whiteSpace: "nowrap" }}>
                  {new Date(n.created_at).toLocaleString(lang === "en" ? "en-US" : "th-TH")}
                </td>
                <td className="row-actions">
                  <button className="btn-danger" onClick={() => handleDelete(n.id)}>
                    {t.delete_btn}
                  </button>
                </td>
              </tr>
            ))}

            {notifications.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-cell">
                  {t.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* โมดอลสร้างประกาศ */}
      {openModal && (
        <Modal title={t.modal_title} onClose={() => setOpenModal(false)}>
          <form onSubmit={handleSend}>
            <label>{t.label_recipient}</label>
            <select
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            >
              <option value="">{t.opt_broadcast}</option>
              {tenants
                .filter((tn) => tn.user_id)
                .map((tn) => (
                  <option key={tn.user_id} value={tn.user_id}>
                    👤 {tn.full_name} ({t.room_prefix} {tn.rooms?.room_number || "-"})
                  </option>
                ))}
            </select>

            <label>{t.label_category}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="general">{t.opt_cat_general}</option>
              <option value="bill">{t.opt_cat_bill}</option>
              <option value="repair">{t.opt_cat_repair}</option>
              <option value="move_out">{t.opt_cat_move_out}</option>
            </select>

            <label>{t.label_title}</label>
            <input
              type="text"
              required
              placeholder={t.ph_title}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label>{t.label_message}</label>
            <textarea
              rows="5"
              required
              placeholder={t.ph_message}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? t.submitting : t.btn_submit}
              </button>
              <button className="btn-ghost" type="button" onClick={() => setOpenModal(false)}>
                {t.cancel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
