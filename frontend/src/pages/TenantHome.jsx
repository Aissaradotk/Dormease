import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    loading: "กำลังโหลดข้อมูล...",
    title: "ห้องของฉัน",
    movedOutTitle: "คุณได้ทำการย้ายออกจากห้องพักเรียบร้อยแล้ว",
    noRoomTitle: "ยังไม่มีห้องพักที่กำลังเช่าอยู่ในขณะนี้",
    movedOutDesc: "ข้อมูลการเช่าห้องพักเดิมถูกปิดและยกเลิกแล้ว ไม่มีห้องพักที่ค้างอยู่ในระบบ หากต้องการเข้าพักใหม่ สามารถจองห้องพักใหม่ได้ทันที",
    noRoomDesc: "ยังไม่พบข้อมูลห้องพักที่เชื่อมต่อกับบัญชีของคุณ หรือคำร้องการเข้าพักอยู่ระหว่างดำเนินการ",
    payDeposit: "🛡️ ชำระค่าประกันห้องพัก",
    bookRoom: "🔍 จองห้องพักใหม่",
    viewMoveIn: "🏠 ดูสถานะการเข้าพัก",
    room: "ห้อง:",
    notAssigned: "ยังไม่ได้จับคู่ห้อง",
    roomType: "ประเภทห้อง:",
    floor: "ชั้น:",
    rent: "ค่าเช่า:",
    rentUnit: "บาท/เดือน",
    checkInDate: "วันที่เข้าพัก:",
    status: "สถานะ:",
    occupied: "พักอยู่",
  },
  en: {
    loading: "Loading room data...",
    title: "My Room",
    movedOutTitle: "You have completed your move-out",
    noRoomTitle: "No active room rental at the moment",
    movedOutDesc: "Your previous rental record has been closed and cleared. If you wish to stay again, you can book a new room anytime.",
    noRoomDesc: "No room is currently linked to your account, or your application is still being processed.",
    payDeposit: "🛡️ Pay Security Deposit",
    bookRoom: "🔍 Book a New Room",
    viewMoveIn: "🏠 View Move-in Status",
    room: "Room:",
    notAssigned: "Not assigned yet",
    roomType: "Room Type:",
    floor: "Floor:",
    rent: "Rent:",
    rentUnit: "THB/month",
    checkInDate: "Check-in Date:",
    status: "Status:",
    occupied: "Active Tenant",
  },
};

export default function TenantHome() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const [tenant, setTenant] = useState(undefined);
  const [hasBooking, setHasBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/tenants/me").then(setTenant).catch((e) => setError(e.message));
    api.get("/bookings/my").then((res) => {
      const valid = Array.isArray(res) && res.some(b => b.status === "approved" || b.status === "confirmed" || b.status === "pending");
      setHasBooking(valid);
    }).catch(() => setHasBooking(false));
  }, []);

  if (error) return <div className="form-error">{error}</div>;
  if (tenant === undefined) return <div>{t.loading}</div>;

  // หากไม่มีผู้เช่า หรือสถานะคือ 'moved_out' (ย้ายออกแล้ว) หรือไม่มีห้องพักที่ผูกอยู่ ให้ห้องหายไป
  const hasActiveRoom = tenant && tenant.status === "active" && tenant.rooms && tenant.room_id;

  if (!hasActiveRoom) {
    return (
      <div className="page-container">
        <h1>{t.title}</h1>
        <PageHeaderTabs
          tabs={[
            { path: "/my-room", label: lang === "th" ? "ห้องพักของฉัน" : "My Room", icon: "🏠" },
            { path: "/move-in", label: lang === "th" ? "ขั้นตอนเข้าอยู่ & กุญแจ" : "Move-in Steps", icon: "🔑" },
          ]}
        />
        <div className="card-box" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🚪</div>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: "var(--ink-primary)" }}>
            {tenant?.status === "moved_out"
              ? t.movedOutTitle
              : t.noRoomTitle}
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 14, marginBottom: 24, maxWidth: 440, margin: "0 auto 24px" }}>
            {tenant?.status === "moved_out"
              ? t.movedOutDesc
              : t.noRoomDesc}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {hasBooking ? (
              <>
                <Link to="/deposit-payment" className="btn-primary" style={{ textDecoration: "none" }}>
                  {t.payDeposit}
                </Link>
                <Link to="/move-in" className="btn-ghost" style={{ textDecoration: "none" }}>
                  {t.viewMoveIn}
                </Link>
                <Link to="/book-room" className="btn-ghost" style={{ textDecoration: "none" }}>
                  {t.bookRoom}
                </Link>
              </>
            ) : (
              <>
                <Link to="/book-room" className="btn-primary" style={{ textDecoration: "none" }}>
                  {t.bookRoom}
                </Link>
                <Link to="/move-in" className="btn-ghost" style={{ textDecoration: "none" }}>
                  {t.viewMoveIn}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>{t.title}</h1>
      <PageHeaderTabs
        tabs={[
          { path: "/my-room", label: lang === "th" ? "ห้องพักของฉัน" : "My Room", icon: "🏠" },
          { path: "/move-in", label: lang === "th" ? "ขั้นตอนเข้าอยู่ & กุญแจ" : "Move-in Steps", icon: "🔑" },
        ]}
      />
      <div className="card-box">
        <p>
          <b>{t.room}</b> {tenant.rooms?.room_number || t.notAssigned}
        </p>
        <p>
          <b>{t.roomType}</b> {tenant.rooms?.room_type || "-"}
        </p>
        <p>
          <b>{t.floor}</b> {tenant.rooms?.floor || "-"}
        </p>
        <p>
          <b>{t.rent}</b> {tenant.rooms?.price ? `${Number(tenant.rooms.price).toLocaleString()} ${t.rentUnit}` : "-"}
        </p>
        <p>
          <b>{t.checkInDate}</b> {tenant.start_date || "-"}
        </p>
        <p>
          <b>{t.status}</b> <span className="pill available"><span className="status-dot" />{t.occupied}</span>
        </p>
      </div>
    </div>
  );
}
