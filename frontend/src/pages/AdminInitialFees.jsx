import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import PageHeaderTabs from "../components/PageHeaderTabs";
const API = "http://119.59.102.161:3007";

const T = {
  th: {
    page_title: "💰 กำหนดอัตราค่าแรกเข้าตามขนาดห้อง",
    page_subtitle: "กำหนดอัตราค่าประกันและค่าคีย์การ์ดตามขนาดห้องเพียงครั้งเดียว ระบบจะคำนวณบวกค่าห้องจริงและรวมยอดให้ลูกบ้านจ่ายในรอบเดียวอัตโนมัติ",
    small_room_title: "🏢 ห้องขนาดเล็ก (Small Room)",
    small_room_desc: "ห้องสตูดิโอ / พื้นที่ไม่เกิน 26 ตร.ม.",
    large_room_title: "🏰 ห้องขนาดใหญ่ (Large Room)",
    large_room_desc: "ห้องสวีท, 1 ห้องนอน / พื้นที่มากกว่า 26 ตร.ม.",
    add_item: "+ เพิ่มรายการ",
    base_fees_label: "รายการค่าแรกเข้าพื้นฐาน:",
    empty_fees: "ยังไม่มีรายการ กด \"+ เพิ่มรายการ\" เพื่อกำหนดค่าประกันและค่าคีย์การ์ด",
    total_base_fees: "รวมค่าแรกเข้าพื้นฐาน (ไม่รวมค่าห้อง):",
    status_active: "เปิด",
    status_inactive: "ปิด",
    preview_title: "🔍 ตัวอย่างการคำนวณยอดชำระรวมในรอบเดียว (คำนวณอัตโนมัติตามห้องจริง)",
    preview_subtitle: "เมื่อลูกบ้านเลือกห้องใด ระบบจะดึงราคาห้องจริง + ค่าประกัน + ค่าคีย์การ์ดตามหมวดหมู่ขนาดห้องให้ชำระในรอบเดียวทันที แอดมินไม่ต้องมากรอกรายห้อง",
    th_room: "ห้อง",
    th_type_size: "ประเภท / ขนาด",
    th_cat: "หมวดหมู่ขนาดห้อง",
    th_rent: "ค่าห้องงวดแรก",
    th_deposit: "ค่าประกัน",
    th_keycard: "ค่าคีย์การ์ด",
    th_grand_total: "ยอดรวมชำระในรอบเดียว",
    room_prefix: "ห้อง",
    general_type: "ทั่วไป",
    sqm_unit: "ตร.ม.",
    cat_large_tag: "🏰 ห้องขนาดใหญ่",
    cat_small_tag: "🏢 ห้องขนาดเล็ก",
    modal_add_title: "เพิ่มรายการค่าแรกเข้า",
    modal_edit_title: "แก้ไขรายการค่าแรกเข้า",
    label_cat: "หมวดหมู่ขนาดห้อง *",
    label_fee_name: "ชื่อค่าใช้จ่าย *",
    label_amount: "จำนวนเงิน (บาท) *",
    label_desc: "คำอธิบายเพิ่มเติม",
    desc_ph: "เช่น ค่าประกันความเสียหายห้องพัก",
    amount_ph: "เช่น 3000 หรือ 500",
    checkbox_active: "เปิดใช้งานรายการนี้",
    cancel: "ยกเลิก",
    saving: "⏳ กำลังบันทึก...",
    save_btn: "บันทึกข้อมูล",
    confirm_del: "ยืนยันการลบรายการนี้?",
    fill_required: "กรุณากรอกข้อมูลให้ครบถ้วน",
    save_error: "เกิดข้อผิดพลาดในการบันทึก",
    opt_deposit: "ค่าประกัน",
    opt_keycard: "ค่าคีย์การ์ด",
  },
  en: {
    page_title: "💰 Room Size Move-in Rates",
    page_subtitle: "Configure security deposit and keycard rates by room size once. The system automatically calculates total move-in fees with the room rent for tenants to pay in a single payment.",
    small_room_title: "🏢 Small Room",
    small_room_desc: "Studio room / Size up to 26 sq.m.",
    large_room_title: "🏰 Large Room",
    large_room_desc: "Suite, 1-Bedroom / Size over 26 sq.m.",
    add_item: "+ Add Item",
    base_fees_label: "Standard Move-in Fees:",
    empty_fees: "No items configured. Click \"+ Add Item\" to set deposit and keycard rates.",
    total_base_fees: "Total Initial Fees (Excl. Room Rent):",
    status_active: "Active",
    status_inactive: "Off",
    preview_title: "🔍 Live All-in-One Payment Preview (Auto-calculated from actual rooms)",
    preview_subtitle: "When a tenant chooses any room, the system adds room rent + deposit + keycard for a single checkout. Admin doesn't need to manually calculate per room.",
    th_room: "Room",
    th_type_size: "Type / Size",
    th_cat: "Size Category",
    th_rent: "1st Month Rent",
    th_deposit: "Security Deposit",
    th_keycard: "Keycard Fee",
    th_grand_total: "Single Payment Total",
    room_prefix: "Room",
    general_type: "Standard",
    sqm_unit: "sq.m.",
    cat_large_tag: "🏰 Large Room",
    cat_small_tag: "🏢 Small Room",
    modal_add_title: "Add Move-in Fee Item",
    modal_edit_title: "Edit Move-in Fee Item",
    label_cat: "Room Size Category *",
    label_fee_name: "Fee Name *",
    label_amount: "Amount (THB) *",
    label_desc: "Description",
    desc_ph: "e.g. Room security and damage deposit",
    amount_ph: "e.g. 3000 or 500",
    checkbox_active: "Enable this item",
    cancel: "Cancel",
    saving: "⏳ Saving...",
    save_btn: "Save Changes",
    confirm_del: "Confirm deletion of this item?",
    fill_required: "Please fill in all required fields",
    save_error: "An error occurred while saving",
    opt_deposit: "Security Deposit",
    opt_keycard: "Keycard Fee",
  },
};

const CATEGORIES = [
  { id: 1, key: "small", th_name: "🏢 ห้องขนาดเล็ก (Small Room)", en_name: "🏢 Small Room (Studio / ≤ 26 sq.m.)" },
  { id: 2, key: "large", th_name: "🏰 ห้องขนาดใหญ่ (Large Room)", en_name: "🏰 Large Room (Suite / > 26 sq.m.)" },
];

export default function AdminInitialFees() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [fees, setFees] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    room_type_id: "1",
    fee_name: "ค่าประกัน",
    amount: "",
    description: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [fRes, rRes] = await Promise.all([
        fetch(`${API}/api/initial-fees`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/rooms`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const fData = await fRes.json();
      const rData = await rRes.json();
      setFees(Array.isArray(fData) ? fData : []);
      setRooms(Array.isArray(rData) ? rData : []);
    } catch {
      setFees([]);
      setRooms([]);
    }
    setLoading(false);
  }

  function getCategoryForRoom(room) {
    const sizeNum = parseFloat(room.size) || 0;
    const isLarge = sizeNum > 26 ||
                    /suite|1-bedroom|corner|vip|deluxe|ใหญ่/i.test(room.room_type || "") ||
                    (Number(room.price) >= 4000);
    return isLarge ? 2 : 1;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.fee_name || !form.amount) return alert(t.fill_required);
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = editItem ? `${API}/api/initial-fees/${editItem.id}` : `${API}/api/initial-fees`;
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          room_type_id: Number(form.room_type_id),
          fee_name: form.fee_name,
          amount: Number(form.amount),
          description: form.description,
          is_active: form.is_active,
        }),
      });
      if (res.ok) {
        fetchData();
        closeModal();
      } else {
        const d = await res.json();
        alert(d.error || t.save_error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm(t.confirm_del)) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/api/initial-fees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      room_type_id: String(item.room_type_id),
      fee_name: item.fee_name,
      amount: String(item.amount),
      description: item.description || "",
      is_active: !!item.is_active,
    });
    setShowModal(true);
  }

  function openNew(categoryId = 1) {
    setEditItem(null);
    setForm({
      room_type_id: String(categoryId),
      fee_name: "ค่าประกัน",
      amount: "",
      description: "",
      is_active: true,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditItem(null);
  }

  function getFeeDisplayName(rawName) {
    if (lang === "en") {
      if (rawName.includes("ประกัน") || rawName.toLowerCase().includes("deposit")) return "Security Deposit";
      if (rawName.includes("คีย์การ์ด") || rawName.toLowerCase().includes("keycard")) return "Keycard Fee";
    }
    return rawName;
  }

  // แยกค่าใช้จ่ายตามหมวดหมู่ขนาดห้อง 1 (เล็ก) และ 2 (ใหญ่)
  const smallFees = fees.filter(f => Number(f.room_type_id) === 1);
  const largeFees = fees.filter(f => Number(f.room_type_id) === 2);

  const smallTotal = smallFees.filter(f => f.is_active).reduce((sum, f) => sum + Number(f.amount), 0);
  const largeTotal = largeFees.filter(f => f.is_active).reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div>
      <div className="page-head">
        <div className="page-head-info">
          <h1 className="page-title">{t.page_title}</h1>
          <p className="page-subtitle">{t.page_subtitle}</p>
        </div>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/monthly-bills", label: lang === "th" ? "บิลประจำเดือน" : "Monthly Bills", icon: "🧾" },
          { path: "/payments", label: lang === "th" ? "ตรวจสลิปค่าห้อง" : "Rent Payments", icon: "💵" },
          { path: "/admin/move-in-payments", label: lang === "th" ? "สลิปค่าแรกเข้า & ประกัน" : "Move-in Slips", icon: "💳" },
          { path: "/admin/initial-fees", label: lang === "th" ? "อัตราค่าแรกเข้า" : "Initial Fees", icon: "⚙️" },
        ]}
      />

      {/* สองการ์ดหลัก: ห้องขนาดเล็ก vs ห้องขนาดใหญ่ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24, marginBottom: 32 }}>
        {/* การ์ด 1: ห้องขนาดเล็ก */}
        <div className="card-shadow" style={{ padding: 0, overflow: "hidden", border: "1.5px solid var(--border)" }}>
          <div style={{ padding: "18px 22px", background: "var(--primary-light)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 17, margin: "0 0 4px", fontWeight: 700, color: "var(--ink-primary)" }}>
                {t.small_room_title}
              </h2>
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                {t.small_room_desc}
              </span>
            </div>
            <button className="btn-primary btn-sm" onClick={() => openNew(1)}>
              {t.add_item}
            </button>
          </div>

          <div style={{ padding: "20px 22px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 8 }}>{t.base_fees_label}</div>
              {smallFees.length === 0 ? (
                <div style={{ padding: 16, background: "var(--surface-alt)", borderRadius: 8, textAlign: "center", color: "var(--ink-muted)", fontSize: 13 }}>
                  {t.empty_fees}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {smallFees.map(f => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{getFeeDisplayName(f.fee_name)}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{f.description || "—"}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: 15 }}>
                          {Number(f.amount).toLocaleString()} ฿
                        </span>
                        <span className={`pill ${f.is_active ? "available" : "occupied"}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                          {f.is_active ? t.status_active : t.status_inactive}
                        </span>
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(f)}>✏️</button>
                        <button className="btn-danger btn-sm" onClick={() => handleDelete(f.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: "14px 16px", background: "var(--surface-alt)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px dashed var(--border)" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.total_base_fees}</span>
              <strong style={{ fontSize: 17, color: "var(--primary)" }}>{smallTotal.toLocaleString()} ฿</strong>
            </div>
          </div>
        </div>

        {/* การ์ด 2: ห้องขนาดใหญ่ */}
        <div className="card-shadow" style={{ padding: 0, overflow: "hidden", border: "1.5px solid var(--border)" }}>
          <div style={{ padding: "18px 22px", background: "var(--primary-light)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 17, margin: "0 0 4px", fontWeight: 700, color: "var(--ink-primary)" }}>
                {t.large_room_title}
              </h2>
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                {t.large_room_desc}
              </span>
            </div>
            <button className="btn-primary btn-sm" onClick={() => openNew(2)}>
              {t.add_item}
            </button>
          </div>

          <div style={{ padding: "20px 22px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 8 }}>{t.base_fees_label}</div>
              {largeFees.length === 0 ? (
                <div style={{ padding: 16, background: "var(--surface-alt)", borderRadius: 8, textAlign: "center", color: "var(--ink-muted)", fontSize: 13 }}>
                  {t.empty_fees}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {largeFees.map(f => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{getFeeDisplayName(f.fee_name)}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{f.description || "—"}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: 15 }}>
                          {Number(f.amount).toLocaleString()} ฿
                        </span>
                        <span className={`pill ${f.is_active ? "available" : "occupied"}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                          {f.is_active ? t.status_active : t.status_inactive}
                        </span>
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(f)}>✏️</button>
                        <button className="btn-danger btn-sm" onClick={() => handleDelete(f.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: "14px 16px", background: "var(--surface-alt)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px dashed var(--border)" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.total_base_fees}</span>
              <strong style={{ fontSize: 17, color: "var(--primary)" }}>{largeTotal.toLocaleString()} ฿</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ตาราง Live Preview: แสดงห้องจริงในหอพักและการคำนวณยอดรวมในรอบเดียว */}
      <div className="card-shadow" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 4px", fontWeight: 700 }}>
            {t.preview_title}
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: 0 }}>
            {t.preview_subtitle}
          </p>
        </div>

        <div className="table-scroll">
          <table className="data-table dense-table">
            <thead>
              <tr>
                <th>{t.th_room}</th>
                <th>{t.th_type_size}</th>
                <th>{t.th_cat}</th>
                <th>{t.th_rent}</th>
                <th>{t.th_deposit}</th>
                <th>{t.th_keycard}</th>
                <th>{t.th_grand_total}</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                const catId = getCategoryForRoom(room);
                const isLarge = catId === 2;
                const deposit = isLarge
                  ? (largeFees.find(f => f.fee_name.includes("ประกัน") && f.is_active)?.amount || 5000)
                  : (smallFees.find(f => f.fee_name.includes("ประกัน") && f.is_active)?.amount || 3000);
                const keycard = isLarge
                  ? (largeFees.find(f => f.fee_name.includes("คีย์การ์ด") && f.is_active)?.amount || 500)
                  : (smallFees.find(f => f.fee_name.includes("คีย์การ์ด") && f.is_active)?.amount || 300);
                const rent = Number(room.price) || 0;
                const grandTotal = rent + Number(deposit) + Number(keycard);

                return (
                  <tr key={room.id}>
                    <td><strong style={{ fontSize: 15 }}>{t.room_prefix} {room.room_number}</strong></td>
                    <td>
                      <div>{room.room_type || t.general_type}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{room.size || `24 ${t.sqm_unit}`}</div>
                    </td>
                    <td>
                      <span className={`pill ${isLarge ? "info" : "available"}`}>
                        <span className="status-dot" />
                        {isLarge ? t.cat_large_tag : t.cat_small_tag}
                      </span>
                    </td>
                    <td>{rent.toLocaleString()} ฿</td>
                    <td>{Number(deposit).toLocaleString()} ฿</td>
                    <td>{Number(keycard).toLocaleString()} ฿</td>
                    <td>
                      <strong style={{ color: "var(--primary)", fontSize: 15 }}>
                        {grandTotal.toLocaleString()} ฿
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal เพิ่ม / แก้ไขค่าแรกเข้า */}
      {showModal && (
        <div className="cert-detail-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="cert-detail-panel" style={{ maxWidth: 440 }}>
            <div className="cert-detail-header">
              <h2>{editItem ? t.modal_edit_title : t.modal_add_title}</h2>
              <button className="cb-panel-close" onClick={closeModal} style={{ background:"rgba(0,0,0,.1)", color:"var(--ink-primary)" }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="cert-detail-body">
                {/* เลือกหมวดหมู่ขนาดห้อง */}
                <div className="cert-field" style={{ marginBottom: 14 }}>
                  <label className="cert-label">{t.label_cat}</label>
                  <select
                    className="cert-input"
                    value={form.room_type_id}
                    onChange={e => setForm(f => ({ ...f, room_type_id: e.target.value }))}
                    required
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{lang === "en" ? c.en_name : c.th_name}</option>
                    ))}
                  </select>
                </div>

                {/* เลือกชื่อค่าใช้จ่าย: ค่าประกัน หรือ ค่าคีย์การ์ด */}
                <div className="cert-field" style={{ marginBottom: 14 }}>
                  <label className="cert-label">{t.label_fee_name}</label>
                  <select
                    className="cert-input"
                    value={form.fee_name}
                    onChange={e => setForm(f => ({ ...f, fee_name: e.target.value }))}
                    required
                  >
                    <option value="ค่าประกัน">{t.opt_deposit}</option>
                    <option value="ค่าคีย์การ์ด">{t.opt_keycard}</option>
                  </select>
                </div>

                <div className="cert-field" style={{ marginBottom: 14 }}>
                  <label className="cert-label">{t.label_amount}</label>
                  <input
                    type="number"
                    className="cert-input"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder={t.amount_ph}
                    required
                    min="0"
                  />
                </div>

                <div className="cert-field" style={{ marginBottom: 14 }}>
                  <label className="cert-label">{t.label_desc}</label>
                  <input
                    type="text"
                    className="cert-input"
                    value={form.description}
                    placeholder={t.desc_ph}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  {t.checkbox_active}
                </label>
              </div>

              <div className="cert-detail-footer">
                <button type="button" className="btn-ghost" onClick={closeModal}>{t.cancel}</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t.saving : t.save_btn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
