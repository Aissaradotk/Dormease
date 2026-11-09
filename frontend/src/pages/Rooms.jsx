import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    pageTitle: "ห้องพัก (Rooms)",
    pageSubtitle: "จัดการห้องพัก เพิ่ม แก้ไข และตรวจสอบสถานะห้องว่าง",
    addRoom: "เพิ่มห้อง",
    searchPlaceholder: "🔍 ค้นหาเลขห้อง หรือ ประเภทห้อง...",
    allStatus: "สถานะทั้งหมด",
    onlyAvailable: "เฉพาะห้องว่าง",
    onlyOccupied: "เฉพาะห้องไม่ว่าง",
    clearFilter: "✕ ล้างการค้นหา",
    loading: "กำลังโหลดข้อมูลห้องพัก...",
    thRoomNumber: "หมายเลขห้อง",
    thRoomType: "ประเภทห้อง",
    thFloor: "ชั้น",
    thPrice: "ราคาต่อเดือน",
    thStatus: "สถานะ",
    thActions: "จัดการ",
    emptySearch: "ไม่พบห้องพักที่ตรงกับเงื่อนไขการค้นหา",
    emptyRooms: "ยังไม่มีข้อมูลห้องพัก กดปุ่ม \"+ เพิ่มห้อง\" เพื่อเริ่มต้น",
    roomPrefix: "ห้อง",
    standardType: "ห้องพักมาตรฐาน",
    floorPrefix: "ชั้น",
    perMonth: "฿/เดือน",
    available: "ว่าง",
    occupied: "ไม่ว่าง",
    edit: "แก้ไข",
    delete: "ลบ",
    deleteConfirm: "ยืนยันการลบห้องนี้?",
    editTitle: "แก้ไขข้อมูลห้องพัก",
    newTitle: "เพิ่มห้องพักใหม่",
    lblRoomNumber: "หมายเลขห้อง *",
    lblRoomType: "ประเภทห้อง",
    lblFloor: "ชั้น",
    lblSize: "ขนาดห้อง",
    lblPrice: "ราคาค่าเช่าต่อเดือน (บาท) *",
    lblDesc: "รายละเอียดและสิ่งอำนวยความสะดวก",
    lblStatus: "สถานะห้องพัก",
    optAvailable: "ว่าง (Available)",
    optOccupied: "ไม่ว่าง / มีผู้เช่า (Occupied)",
    btnCancel: "ยกเลิก",
    btnSaveEdit: "บันทึกการแก้ไข",
    btnAddRoom: "เพิ่มห้องพัก",
  },
  en: {
    pageTitle: "Rooms",
    pageSubtitle: "Manage dormitory rooms, add, edit, and check availability",
    addRoom: "Add Room",
    searchPlaceholder: "🔍 Search room number or type...",
    allStatus: "All Statuses",
    onlyAvailable: "Available Only",
    onlyOccupied: "Occupied Only",
    clearFilter: "✕ Clear Filter",
    loading: "Loading rooms data...",
    thRoomNumber: "Room No.",
    thRoomType: "Room Type",
    thFloor: "Floor",
    thPrice: "Monthly Rent",
    thStatus: "Status",
    thActions: "Actions",
    emptySearch: "No rooms match your search criteria",
    emptyRooms: "No rooms found. Click \"+ Add Room\" to begin.",
    roomPrefix: "Room",
    standardType: "Standard Room",
    floorPrefix: "Floor",
    perMonth: "฿/mo",
    available: "Available",
    occupied: "Occupied",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this room?",
    editTitle: "Edit Room Information",
    newTitle: "Add New Room",
    lblRoomNumber: "Room Number *",
    lblRoomType: "Room Type",
    lblFloor: "Floor",
    lblSize: "Room Size",
    lblPrice: "Monthly Rent (THB) *",
    lblDesc: "Description & Amenities",
    lblStatus: "Room Status",
    optAvailable: "Available",
    optOccupied: "Occupied",
    btnCancel: "Cancel",
    btnSaveEdit: "Save Changes",
    btnAddRoom: "Add Room",
  },
};

const empty = { room_number: "", room_type: "", price: "", floor: "", size: "", description: "" };

export default function Rooms() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, object = edit
  const [form, setForm] = useState(empty);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    setLoading(true);
    try {
      setRooms(await api.get("/rooms"));
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

  function openEdit(r) {
    setForm(r);
    setEditing(r);
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing?.id) await api.put(`/rooms/${editing.id}`, form);
      else await api.post("/rooms", form);
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    if (!confirm("ยืนยันการลบห้องนี้?")) return;
    try {
      await api.del(`/rooms/${id}`);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="page-container">
      {/* Header จัดวางแบบ Flexbox justify-content: space-between แยกฝั่งซ้ายสุดและขวาสุด */}
      <div className="page-head rooms-head">
        <div className="page-head-info">
          <h1 className="page-title">{t.pageTitle}</h1>
          <p className="page-subtitle">{t.pageSubtitle}</p>
        </div>
        <button className="btn-primary btn-add-room" onClick={openNew}>
          <svg
            className="btn-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {t.addRoom}
        </button>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/rooms", label: lang === "th" ? "ผังห้องพักทั้งหมด" : "Room Layout", icon: "🚪" },
          { path: "/tenants", label: lang === "th" ? "ทะเบียนผู้เช่า" : "Tenants List", icon: "👥" },
        ]}
      />

      {error && <div className="form-error">{error}</div>}

      {/* Toolbar ค้นหาและคัดกรองสถานะห้อง */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink-primary)",
              fontSize: 13.5
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--ink-primary)",
            fontSize: 13.5
          }}
        >
          <option value="all">{t.allStatus}</option>
          <option value="available">{t.onlyAvailable}</option>
          <option value="occupied">{t.onlyOccupied}</option>
        </select>
        {(searchQuery || statusFilter !== "all") && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
          >
            {t.clearFilter}
          </button>
        )}
      </div>

      {loading ? (
        <div className="page-loading">{t.loading}</div>
      ) : (
        <div className="table-scroll card-shadow">
          <table className="data-table rooms-table">
            <thead>
              <tr>
                <th style={{ width: "16%" }}>{t.thRoomNumber}</th>
                <th style={{ width: "26%" }}>{t.thRoomType}</th>
                <th style={{ width: "12%" }}>{t.thFloor}</th>
                <th style={{ width: "18%" }}>{t.thPrice}</th>
                <th style={{ width: "14%" }}>{t.thStatus}</th>
                <th style={{ width: "14%", textAlign: "right" }}>{t.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredRooms = rooms.filter((r) => {
                  if (statusFilter !== "all" && r.status !== statusFilter) return false;
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const matchNum = String(r.room_number || "").toLowerCase().includes(q);
                    const matchType = String(r.room_type || "").toLowerCase().includes(q);
                    const matchFloor = String(r.floor || "").includes(q);
                    if (!matchNum && !matchType && !matchFloor) return false;
                  }
                  return true;
                });

                if (filteredRooms.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="empty-cell" style={{ textAlign: "center", padding: 28, color: "var(--ink-muted)" }}>
                        {searchQuery || statusFilter !== "all"
                          ? t.emptySearch
                          : t.emptyRooms}
                      </td>
                    </tr>
                  );
                }

                return filteredRooms.map((r) => (
                  <tr key={r.id} className="room-table-row">
                    <td>
                      <span className="room-badge">
                        {t.roomPrefix} {r.room_number}
                      </span>
                    </td>
                    <td>
                      <div className="room-type-text">{r.room_type || t.standardType}</div>
                      {r.size && <span className="room-size-muted">{r.size}</span>}
                    </td>
                    <td>
                      <span className="room-floor-tag">{t.floorPrefix} {r.floor || "-"}</span>
                    </td>
                    <td>
                      <div className="room-price-cell">
                        <span className="price-amount">{Number(r.price || 0).toLocaleString()}</span>
                        <span className="price-unit">{t.perMonth}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${r.status}`}>
                        <span className="status-dot"></span>
                        {r.status === "available" ? t.available : t.occupied}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(r)} title={t.edit}>
                          {t.edit}
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => remove(r.id)} title={t.delete}>
                          {t.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? t.editTitle : t.newTitle} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <label>{t.lblRoomNumber}</label>
            <input
              required
              placeholder="101, 102"
              value={form.room_number || ""}
              onChange={(e) => setForm({ ...form, room_number: e.target.value })}
            />

            <label>{t.lblRoomType}</label>
            <input
              placeholder="Studio, 1 Bedroom"
              value={form.room_type || ""}
              onChange={(e) => setForm({ ...form, room_type: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>{t.lblFloor}</label>
                <input
                  type="number"
                  placeholder="1, 2"
                  value={form.floor || ""}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                />
              </div>
              <div>
                <label>{t.lblSize}</label>
                <input
                  placeholder="24 sq.m."
                  value={form.size || ""}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
              </div>
            </div>

            <label>{t.lblPrice}</label>
            <input
              type="number"
              required
              placeholder="3500"
              value={form.price || ""}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <label>{t.lblDesc}</label>
            <textarea
              rows="3"
              placeholder="Air conditioner, bed, wardrobe..."
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {editing.id && (
              <>
                <label>{t.lblStatus}</label>
                <select
                  value={form.status || "available"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="available">{t.optAvailable}</option>
                  <option value="occupied">{t.optOccupied}</option>
                </select>
              </>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn-primary" type="submit" style={{ flex: 1, margin: 0 }}>
                {editing.id ? t.btnSaveEdit : t.btnAddRoom}
              </button>
              <button className="btn-ghost" type="button" onClick={() => setEditing(null)}>
                {t.btnCancel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
