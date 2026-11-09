import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const CATEGORIES_DATA = {
  th: ["ไฟฟ้า", "ประปา/ห้องน้ำ", "เครื่องปรับอากาศ", "เฟอร์นิเจอร์/ประตูหน้าต่าง", "อินเทอร์เน็ต", "อื่นๆ"],
  en: ["Electrical", "Plumbing / Bathroom", "Air Conditioner", "Furniture / Doors & Windows", "Internet", "Other"],
};

const T = {
  th: {
    pageTitle: "ระบบแจ้งซ่อมบำรุง",
    newRepair: "+ แจ้งซ่อมใหม่",
    loading: "กำลังโหลดรายการแจ้งซ่อม...",
    room: "ห้อง:",
    myRoom: "ห้องพักของฉัน",
    reportedAt: "วันที่แจ้ง:",
    statusCompleted: "✅ แก้ไขแล้ว",
    statusInProgress: "🛠 กำลังดำเนินการ",
    statusPending: "⏳ รอดำเนินการ",
    adminNote: "บันทึกจากเจ้าของหอ:",
    emptyRepairs: "ยังไม่มีประวัติการแจ้งซ่อม",
    modalTitle: "แบบฟอร์มแจ้งซ่อม",
    lblCategory: "หมวดหมู่ปัญหา *",
    lblTitle: "หัวข้อปัญหา / สิ่งที่ชำรุด *",
    titlePlaceholder: "เช่น ไฟห้องน้ำดับ, ก๊อกน้ำรั่วซึม, แอร์ไม่เย็น",
    lblDesc: "รายละเอียดปัญหาเพิ่มเติม",
    descPlaceholder: "ระบุอาการเพิ่มเติม หรือช่วงเวลาที่สะดวกให้ช่างเข้าซ่อม...",
    btnSubmitting: "กำลังส่งข้อมูล...",
    btnSubmit: "ส่งเรื่องแจ้งซ่อม",
    btnCancel: "ยกเลิก",
    successMsg: "ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว เจ้าหน้าที่หอพักจะดำเนินการโดยเร็ว",
    errTitle: "กรุณากรอกหัวข้อปัญหา",
  },
  en: {
    pageTitle: "Maintenance & Repair Requests",
    newRepair: "+ Report Repair",
    loading: "Loading repair requests...",
    room: "Room:",
    myRoom: "My Room",
    reportedAt: "Reported on:",
    statusCompleted: "✅ Resolved",
    statusInProgress: "🛠 In Progress",
    statusPending: "⏳ Pending",
    adminNote: "Admin Note:",
    emptyRepairs: "No repair requests recorded yet",
    modalTitle: "Repair Request Form",
    lblCategory: "Problem Category *",
    lblTitle: "Issue Title / Defect *",
    titlePlaceholder: "e.g. Bathroom light out, leaking faucet, AC not cooling",
    lblDesc: "Additional Details",
    descPlaceholder: "Specify additional symptoms or preferred times for repair...",
    btnSubmitting: "Submitting...",
    btnSubmit: "Submit Repair Request",
    btnCancel: "Cancel",
    successMsg: "Repair request submitted! Dorm staff will process it shortly.",
    errTitle: "Please enter the issue title",
  },
};

export default function TenantRepairs() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const categories = CATEGORIES_DATA[lang] || CATEGORIES_DATA.th;

  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ category: "ไฟฟ้า", title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  async function loadRepairs() {
    setLoading(true);
    try {
      const data = await api.get("/repairs/my");
      setRepairs(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadRepairs();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) {
      alert(t.errTitle);
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/repairs", form);
      alert(t.successMsg);
      setOpenModal(false);
      setForm({ category: "ไฟฟ้า", title: "", description: "" });
      loadRepairs();
    } catch (err) {
      alert(err.message);
    }
    setSubmitting(false);
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t.pageTitle}</h1>
        <button className="btn-primary" onClick={() => setOpenModal(true)}>
          {t.newRepair}
        </button>
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
        <div className="repair-list">
          {repairs.map((r) => (
            <div key={r.id} className="card-box" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="pill category-pill">{r.category}</span>
                  <h3 style={{ margin: "6px 0 4px", fontSize: 16 }}>{r.title}</h3>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {t.room} <b>{r.room_number || t.myRoom}</b> | {t.reportedAt}{" "}
                    {new Date(r.created_at).toLocaleDateString(lang === "en" ? "en-US" : "th-TH")}
                  </div>
                </div>
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
                    ? t.statusCompleted
                    : r.status === "in_progress"
                    ? t.statusInProgress
                    : t.statusPending}
                </span>
              </div>

              {r.description && (
                <p style={{ margin: "10px 0 0", fontSize: 14, color: "#444", background: "#f8faf9", padding: 10, borderRadius: 6 }}>
                  {r.description}
                </p>
              )}

              {r.admin_note && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#2d7a5b", background: "#eef8f3", padding: "6px 10px", borderRadius: 6 }}>
                  <b>{t.adminNote}</b> {r.admin_note}
                </div>
              )}
            </div>
          ))}

          {repairs.length === 0 && (
            <div className="empty-box">{t.emptyRepairs}</div>
          )}
        </div>
      )}

      {openModal && (
        <Modal title={t.modalTitle} onClose={() => setOpenModal(false)}>
          <form onSubmit={handleSubmit}>
            <label>{t.lblCategory}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label>{t.lblTitle}</label>
            <input
              type="text"
              required
              placeholder={t.titlePlaceholder}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label>{t.lblDesc}</label>
            <textarea
              rows="4"
              placeholder={t.descPlaceholder}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? t.btnSubmitting : t.btnSubmit}
              </button>
              <button className="btn-ghost" type="button" onClick={() => setOpenModal(false)}>
                {t.btnCancel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
