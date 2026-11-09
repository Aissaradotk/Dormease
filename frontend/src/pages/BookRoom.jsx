import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { getMinDateString, formatThaiDate } from "../lib/dateUtils";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    page_title: "ค้นหาและจองห้องพัก",
    tab_search: "🔍 ห้องว่างที่เปิดให้จอง",
    tab_my: "📋 รายการจองของฉัน",
    search_ph: "ค้นหาเลขห้อง, ประเภท, สิ่งอำนวยความสะดวก...",
    budget_ph: "งบประมาณสูงสุด (บาท/เดือน)",
    loading_rooms: "กำลังโหลดข้อมูลห้องว่าง...",
    loading_my: "กำลังโหลดรายการจอง...",
    room_prefix: "ห้อง",
    pill_available: "ห้องว่าง",
    default_type: "ห้องพักมาตรฐาน",
    floor: "ชั้น:",
    size: "ขนาด:",
    default_desc: "สิ่งอำนวยความสะดวกครบครัน พร้อมเข้าอยู่",
    unit_month: "บาท/เดือน",
    btn_book_room: "จองห้องนี้",
    empty_search: "ไม่พบห้องว่างตามเงื่อนไขที่ค้นหา",
    th_room: "ห้อง",
    th_type: "ประเภท",
    th_price: "ราคา/เดือน",
    th_checkin: "วันที่ต้องการเข้าพัก",
    th_phone: "เบอร์ติดต่อ",
    th_status: "สถานะ",
    th_note: "หมายเหตุจากหอพัก",
    th_actions: "",
    status_approved: "อนุมัติแล้ว",
    status_rejected: "ปฏิเสธ",
    status_cancelled: "ยกเลิกแล้ว",
    status_pending: "รอเจ้าของหออนุมัติ",
    btn_pay_deposit: "🛡️ ชำระค่าประกัน",
    btn_cancel: "ยกเลิก",
    empty_my: "ยังไม่มีประวัติการจองห้องพัก",
    modal_title: "แบบฟอร์มจองห้องพัก",
    lbl_rent: "ค่าเช่า:",
    terms_title: "ข้อกำหนดการจอง:",
    terms_notice: "หอพักกำหนดให้แจ้งเข้าพักล่วงหน้าอย่างน้อย",
    days: "วัน",
    earliest_date: "วันที่เร็วที่สุดที่สามารถเลือกเข้าพักได้คือ:",
    onwards: "เป็นต้นไป",
    lbl_checkin: "วันที่ต้องการเข้าพัก *",
    lbl_phone: "เบอร์โทรศัพท์ติดต่อกลับ",
    lbl_special: "ข้อความเพิ่มเติมหรือคำขอพิเศษ",
    ph_special: "เช่น ขอเข้าดูห้องล่วงหน้า, ต้องการเตียงคู่...",
    submitting: "กำลังส่งคำขอ...",
    confirm_book: "ยืนยันการจองห้องพัก",
    cancel: "ยกเลิก",
    alert_specify_date: "กรุณาระบุวันที่ต้องการเข้าพัก",
    alert_notice_days: (days, date) => `หอพักกำหนดให้ต้องแจ้งเข้าพักล่วงหน้าอย่างน้อย ${days} วัน (สามารถเลือกได้ตั้งแต่วันที่ ${date} เป็นต้นไป)`,
    alert_book_success: "ทำการจองห้องพักสำเร็จ! กรุณารอเจ้าของหอพักตรวจสอบและอนุมัติ",
    confirm_cancel_booking: "คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?",
  },
  en: {
    page_title: "Find & Book a Room",
    tab_search: "🔍 Available Rooms",
    tab_my: "📋 My Bookings",
    search_ph: "Search room number, type, amenities...",
    budget_ph: "Max budget (THB/month)",
    loading_rooms: "Loading available rooms...",
    loading_my: "Loading bookings...",
    room_prefix: "Room",
    pill_available: "Available",
    default_type: "Standard Room",
    floor: "Floor:",
    size: "Size:",
    default_desc: "Fully equipped, ready for move-in",
    unit_month: "THB/month",
    btn_book_room: "Book This Room",
    empty_search: "No rooms match your search criteria",
    th_room: "Room",
    th_type: "Type",
    th_price: "Price/mo",
    th_checkin: "Move-in Date",
    th_phone: "Contact Phone",
    th_status: "Status",
    th_note: "Admin Note",
    th_actions: "",
    status_approved: "Approved",
    status_rejected: "Rejected",
    status_cancelled: "Cancelled",
    status_pending: "Pending Approval",
    btn_pay_deposit: "🛡️ Pay Deposit",
    btn_cancel: "Cancel",
    empty_my: "No booking history found",
    modal_title: "Room Booking Form",
    lbl_rent: "Rent:",
    terms_title: "Booking Terms:",
    terms_notice: "The dormitory requires at least",
    days: "days advance notice",
    earliest_date: "Earliest selectable check-in date is:",
    onwards: "onwards",
    lbl_checkin: "Desired Move-in Date *",
    lbl_phone: "Contact Phone Number",
    lbl_special: "Additional Notes or Special Requests",
    ph_special: "e.g. Request room tour, double bed preferred...",
    submitting: "Submitting...",
    confirm_book: "Confirm Room Booking",
    cancel: "Cancel",
    alert_specify_date: "Please specify your desired move-in date",
    alert_notice_days: (days, date) => `The dormitory requires at least ${days} days notice (earliest date is ${date})`,
    alert_book_success: "Room booking request submitted! Please wait for owner review and approval.",
    confirm_cancel_booking: "Are you sure you want to cancel this booking?",
  },
};

export default function BookRoom() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [tab, setTab] = useState("search");
  const [rooms, setRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [bookingRoom, setBookingRoom] = useState(null);
  const [form, setForm] = useState({ check_in_date: "", contact_phone: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [moveInNoticeDays, setMoveInNoticeDays] = useState(1);

  async function loadData() {
    setLoading(true);
    try {
      const [r, b, s] = await Promise.all([
        api.get("/bookings/available-rooms"),
        api.get("/bookings/my"),
        api.get("/settings/notice-days").catch(() => null),
      ]);
      setRooms(r);
      setMyBookings(b);
      if (s && s.move_in_notice_days !== undefined) {
        setMoveInNoticeDays(s.move_in_notice_days);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const minCheckInDate = getMinDateString(moveInNoticeDays);

  function formatDate(dStr) {
    if (!dStr) return "-";
    if (lang === "en") {
      return new Date(dStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
    return formatThaiDate(dStr);
  }

  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      r.room_number.toLowerCase().includes(search.toLowerCase()) ||
      (r.room_type || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase());
    const matchPrice = maxPrice ? Number(r.price) <= Number(maxPrice) : true;
    return matchSearch && matchPrice;
  });

  async function handleBook(e) {
    e.preventDefault();
    if (!form.check_in_date) {
      alert(t.alert_specify_date);
      return;
    }
    if (form.check_in_date < minCheckInDate) {
      alert(t.alert_notice_days(moveInNoticeDays, formatDate(minCheckInDate)));
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        room_id: bookingRoom.id,
        check_in_date: form.check_in_date,
        contact_phone: form.contact_phone,
        note: form.note,
      });
      alert(t.alert_book_success);
      setBookingRoom(null);
      setForm({ check_in_date: "", contact_phone: "", note: "" });
      setTab("my");
      loadData();
    } catch (err) {
      alert(err.message);
    }
    setSubmitting(false);
  }

  async function handleCancel(id) {
    if (!confirm(t.confirm_cancel_booking)) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t.page_title}</h1>
        <div className="tab-buttons">
          <button
            className={`btn-tab ${tab === "search" ? "active" : ""}`}
            onClick={() => setTab("search")}
          >
            {t.tab_search} ({rooms.length})
          </button>
          <button
            className={`btn-tab ${tab === "my" ? "active" : ""}`}
            onClick={() => setTab("my")}
          >
            {t.tab_my} ({myBookings.length})
          </button>
        </div>
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

      {tab === "search" && (
        <div>
          {/* แถบตัวกรองค้นหา */}
          <div className="filter-bar">
            <input
              type="text"
              placeholder={t.search_ph}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="number"
              placeholder={t.budget_ph}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ maxWidth: 220 }}
            />
          </div>

          {loading ? (
            <p>{t.loading_rooms}</p>
          ) : (
            <div className="room-grid">
              {filteredRooms.map((r) => (
                <div key={r.id} className="room-card">
                  <div className="room-card-header">
                    <span className="room-num">{t.room_prefix} {r.room_number}</span>
                    <span className="pill available">{t.pill_available}</span>
                  </div>
                  <div className="room-card-body">
                    <p className="room-type">{r.room_type || t.default_type}</p>
                    <div className="room-specs">
                      <span>{t.floor} {r.floor || "-"}</span>
                      <span>{t.size} {r.size || "-"}</span>
                    </div>
                    <p className="room-desc">{r.description || t.default_desc}</p>
                    <div className="room-price-tag">
                      {Number(r.price).toLocaleString()} <span>{t.unit_month}</span>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: "100%", marginTop: 12 }}
                    onClick={() => setBookingRoom(r)}
                  >
                    {t.btn_book_room}
                  </button>
                </div>
              ))}

              {filteredRooms.length === 0 && (
                <div className="empty-box" style={{ gridColumn: "1 / -1" }}>
                  {t.empty_search}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "my" && (
        <div>
          {loading ? (
            <p>{t.loading_my}</p>
          ) : (
            <table className="data-table dense-table">
              <thead>
                <tr>
                  <th>{t.th_room}</th>
                  <th>{t.th_type}</th>
                  <th>{t.th_price}</th>
                  <th>{t.th_checkin}</th>
                  <th>{t.th_phone}</th>
                  <th>{t.th_status}</th>
                  <th>{t.th_note}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.id}>
                    <td><b>{t.room_prefix} {b.room_number}</b></td>
                    <td>{b.room_type}</td>
                    <td>{Number(b.price).toLocaleString()} {lang === "en" ? "THB" : "บาท"}</td>
                    <td>{b.check_in_date ? b.check_in_date.slice(0, 10) : "-"}</td>
                    <td>{b.contact_phone || "-"}</td>
                    <td>
                      <span
                        className={`pill ${
                          b.status === "approved"
                            ? "available"
                            : b.status === "rejected" || b.status === "cancelled"
                            ? "occupied"
                            : "pending"
                        }`}
                      >
                        {b.status === "approved"
                          ? t.status_approved
                          : b.status === "rejected"
                          ? t.status_rejected
                          : b.status === "cancelled"
                          ? t.status_cancelled
                          : t.status_pending}
                      </span>
                    </td>
                    <td>{b.admin_note || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {(b.status === "approved" || b.status === "pending") && (
                          <Link to={`/deposit-payment?booking_id=${b.id}`} className="btn-primary btn-sm" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>
                            {t.btn_pay_deposit}
                          </Link>
                        )}
                        {b.status === "pending" && (
                          <button className="btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                            {t.btn_cancel}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {myBookings.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-cell">
                      {t.empty_my}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* โมดอลจองห้องพัก */}
      {bookingRoom && (
        <Modal title={`${t.modal_title} ${bookingRoom.room_number}`} onClose={() => setBookingRoom(null)}>
          <form onSubmit={handleBook}>
            <div className="card-box" style={{ marginBottom: 16 }}>
              <p><b>{t.th_room}:</b> {bookingRoom.room_number} ({bookingRoom.room_type})</p>
              <p><b>{t.lbl_rent}</b> {Number(bookingRoom.price).toLocaleString()} {t.unit_month}</p>
              <p><b>{t.floor}</b> {bookingRoom.floor || "-"} | <b>{t.size}</b> {bookingRoom.size || "-"}</p>
            </div>

            {/* แถบแจ้งเตือนกำหนดวันจองล่วงหน้า */}
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--primary-light, #e8f3ef)",
                border: "1px solid var(--primary-border, #a9cfc4)",
                fontSize: 13,
                color: "var(--ink-primary)",
                lineHeight: 1.5,
              }}
            >
              ℹ️ <b>{t.terms_title}</b> {t.terms_notice} <b>{moveInNoticeDays} {t.days}</b><br />
              📅 {t.earliest_date} <b style={{ color: "var(--primary, #0f5144)" }}>{formatDate(minCheckInDate)}</b> {t.onwards}
            </div>

            <label>{t.lbl_checkin} ({t.terms_notice} {moveInNoticeDays} {t.days})</label>
            <input
              type="date"
              required
              min={minCheckInDate}
              value={form.check_in_date}
              onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
            />

            <label>{t.lbl_phone}</label>
            <input
              type="tel"
              placeholder="08x-xxx-xxxx"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            />

            <label>{t.lbl_special}</label>
            <textarea
              rows="3"
              placeholder={t.ph_special}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? t.submitting : t.confirm_book}
              </button>
              <button className="btn-ghost" type="button" onClick={() => setBookingRoom(null)}>
                {t.cancel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
