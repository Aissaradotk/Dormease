import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    pageTitle: "ผู้เช่า (Tenants)",
    addTenant: "+ เพิ่มผู้เช่า",
    loading: "กำลังโหลด...",
    thName: "ชื่อ-นามสกุล",
    thPhone: "เบอร์โทร",
    thRoom: "ห้อง",
    thStatus: "สถานะ",
    thActions: "การดำเนินการ",
    active: "พักอยู่",
    movedOut: "ย้ายออกแล้ว",
    edit: "แก้ไข",
    delete: "ลบ",
    deleteConfirm: "ยืนยันการลบผู้เช่านี้?",
    empty: "ยังไม่มีข้อมูลผู้เช่า",
    editTitle: "แก้ไขข้อมูลผู้เช่า",
    newTitle: "เพิ่มผู้เช่าใหม่",
    lblName: "ชื่อ-นามสกุล",
    lblPhone: "เบอร์โทร",
    lblEmail: "อีเมล (สำหรับเชื่อมบัญชีผู้เช่าอัตโนมัติ)",
    lblRoom: "จับคู่ห้องพัก",
    unspecified: "-- ไม่ระบุ --",
    roomAvailable: "ว่าง",
    roomOccupied: "ไม่ว่าง",
    lblStartDate: "วันที่เข้าพัก",
    lblStatus: "สถานะ",
    btnSave: "บันทึก",
  },
  en: {
    pageTitle: "Tenants",
    addTenant: "+ Add Tenant",
    loading: "Loading...",
    thName: "Full Name",
    thPhone: "Phone",
    thRoom: "Room",
    thStatus: "Status",
    thActions: "Actions",
    active: "Active",
    movedOut: "Moved Out",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this tenant?",
    empty: "No tenants recorded yet",
    editTitle: "Edit Tenant",
    newTitle: "Add New Tenant",
    lblName: "Full Name",
    lblPhone: "Phone",
    lblEmail: "Email (for auto account binding)",
    lblRoom: "Assign Room",
    unspecified: "-- None --",
    roomAvailable: "Available",
    roomOccupied: "Occupied",
    lblStartDate: "Check-in Date",
    lblStatus: "Status",
    btnSave: "Save",
  },
};

const empty = { full_name: "", phone: "", email: "", room_id: "", start_date: "" };

export default function Tenants() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  async function load() {
    setLoading(true);
    try {
      const [tData, rData] = await Promise.all([api.get("/tenants"), api.get("/rooms")]);
      setTenants(tData);
      setRooms(rData);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(empty);
    setEditing({});
  }
  function openEdit(tItem) {
    setForm({ ...tItem, room_id: tItem.room_id || "" });
    setEditing(tItem);
  }

  async function save(e) {
    e.preventDefault();
    try {
      const payload = { ...form, room_id: form.room_id || null };
      if (editing?.id) await api.put(`/tenants/${editing.id}`, payload);
      else await api.post("/tenants", payload);
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await api.del(`/tenants/${id}`);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t.pageTitle}</h1>
        <button className="btn-primary" onClick={openNew}>
          {t.addTenant}
        </button>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/rooms", label: lang === "th" ? "ผังห้องพักทั้งหมด" : "Room Layout", icon: "🚪" },
          { path: "/tenants", label: lang === "th" ? "ทะเบียนผู้เช่า" : "Tenants List", icon: "👥" },
        ]}
      />

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <table className="data-table dense-table">
          <thead>
            <tr>
              <th>{t.thName}</th>
              <th>{t.thPhone}</th>
              <th>{t.thRoom}</th>
              <th>{t.thStatus}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tItem) => (
              <tr key={tItem.id}>
                <td>{tItem.full_name}</td>
                <td>{tItem.phone}</td>
                <td>{tItem.rooms?.room_number || "-"}</td>
                <td>
                  <span className={`pill ${tItem.status === "active" ? "available" : "occupied"}`}>
                    {tItem.status === "active" ? t.active : t.movedOut}
                  </span>
                </td>
                <td className="row-actions">
                  <button className="btn-ghost" onClick={() => openEdit(tItem)}>
                    {t.edit}
                  </button>
                  <button className="btn-danger" onClick={() => remove(tItem.id)}>
                    {t.delete}
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-cell">
                  {t.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing.id ? t.editTitle : t.newTitle} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <label>{t.lblName}</label>
            <input required value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <label>{t.lblPhone}</label>
            <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <label>{t.lblEmail}</label>
            <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label>{t.lblRoom}</label>
            <select value={form.room_id || ""} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
              <option value="">{t.unspecified}</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} ({r.status === "available" ? t.roomAvailable : t.roomOccupied})
                </option>
              ))}
            </select>
            <label>{t.lblStartDate}</label>
            <input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            {editing.id && (
              <>
                <label>{t.lblStatus}</label>
                <select value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">{t.active}</option>
                  <option value="moved_out">{t.movedOut}</option>
                </select>
              </>
            )}
            <button className="btn-primary" type="submit">
              {t.btnSave}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
