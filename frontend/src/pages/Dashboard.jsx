import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

export default function Dashboard() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/stats").then(setStats).catch((e) => setError(e.message));
    api.get("/rooms").then(data => {
      setRooms(Array.isArray(data) ? data : []);
      setLoadingRooms(false);
    }).catch(() => setLoadingRooms(false));
  }, []);

  if (error) return <div className="form-error">{error}</div>;
  if (!stats) return <div>{lang === "en" ? "Loading dashboard..." : "กำลังโหลด..."}</div>;

  // เฉพาะห้องที่มีผู้เช่าอยู่ (เมื่อย้ายออกแล้วห้องจะปรับเป็น available และหายไปจากตารางนี้ทันที)
  const occupiedRooms = rooms.filter(r => r.status === "occupied");

  const isEn = lang === "en";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {isEn
              ? "Overview of dormitory rooms, active tenants, and revenue status"
              : "ภาพรวมสถานะห้องพัก ผู้เช่า และรายรับประจำหอพัก"}
          </p>
        </div>
      </div>

      {/* แถบแจ้งเตือนเมื่อมีคำร้องขอใบรับรองถิ่นที่อยู่รออนุมัติ */}
      {stats.pendingCerts > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--warning-bg, #fffbeb)",
            border: "1px solid var(--warning-border, #fde68a)",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 20,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <div>
              <b style={{ color: "var(--ink-primary)", fontSize: 15 }}>
                {isEn
                  ? `There are ${stats.pendingCerts} Certificate of Residence request(s) awaiting review`
                  : `มีคำร้องขอใบรับรองถิ่นที่อยู่รอการตรวจสอบ ${stats.pendingCerts} รายการ`}
              </b>
              <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}>
                {isEn
                  ? "Please review and approve foreign resident certificate requests"
                  : "กรุณาตรวจสอบและอนุมัติเอกสารสำหรับผู้พักอาศัยชาวต่างชาติ"}
              </div>
            </div>
          </div>
          <Link
            to="/residence-certificates"
            className="btn-primary btn-sm"
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            {isEn ? "Review Requests →" : "ไปที่หน้าตรวจสอบ →"}
          </Link>
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span>{stats.totalRooms}</span>
          <label>{isEn ? "Total Rooms" : "ห้องทั้งหมด"}</label>
        </div>
        <div className="stat-card good">
          <span>{stats.availableRooms}</span>
          <label>{isEn ? "Available Rooms" : "ห้องว่าง"}</label>
        </div>
        <div className="stat-card">
          <span>{stats.occupiedRooms}</span>
          <label>{isEn ? "Occupied Rooms" : "ห้องมีผู้เช่า"}</label>
        </div>
        <div className="stat-card">
          <span>{stats.totalTenants}</span>
          <label>{isEn ? "Total Tenants" : "ผู้เช่าทั้งหมด"}</label>
        </div>
        <div className="stat-card warn">
          <span>{stats.unpaidPayments}</span>
          <label>{isEn ? "Unpaid Bills" : "รายการยังไม่ชำระ"}</label>
        </div>
      </div>

      {/* ตารางแสดงห้องที่มีผู้เช่าปัจจุบัน — เมื่อย้ายออกแล้วจะหายไปทันที */}
      <div className="card-shadow" style={{ padding: 24, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>
              🏠 {isEn ? "Occupied Rooms" : "รายชื่อห้องที่มีผู้เช่าปัจจุบัน"} ({occupiedRooms.length} {isEn ? "rooms" : "ห้อง"})
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: "4px 0 0" }}>
              {isEn
                ? "Showing currently occupied rooms only (vacated rooms are removed immediately)"
                : "แสดงเฉพาะห้องที่มีการเช่าอยู่จริง (เมื่อผู้เช่าย้ายออก ห้องจะออกจากตารางนี้ทันที)"}
            </p>
          </div>
          <Link to="/rooms" className="btn-ghost btn-sm" style={{ textDecoration: "none" }}>
            {isEn ? "Manage All Rooms →" : "จัดการห้องทั้งหมด →"}
          </Link>
        </div>

        {loadingRooms ? (
          <p style={{ color: "var(--ink-muted)" }}>{isEn ? "Loading rooms..." : "กำลังโหลดรายชื่อห้อง..."}</p>
        ) : occupiedRooms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-muted)" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🚪</div>
            <p style={{ margin: 0, fontSize: 14 }}>
              {isEn
                ? "No occupied rooms at the moment (all tenants have moved out)"
                : "ยังไม่มีห้องที่มีผู้เช่าในขณะนี้ (หรือผู้เช่าย้ายออกหมดแล้ว)"}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isEn ? "Room" : "ห้อง"}</th>
                  <th>{isEn ? "Type" : "ประเภท"}</th>
                  <th>{isEn ? "Floor" : "ชั้น"}</th>
                  <th>{isEn ? "Rent (THB/month)" : "ค่าเช่า (บาท/เดือน)"}</th>
                  <th>{isEn ? "Status" : "สถานะ"}</th>
                  <th>{isEn ? "Action" : "การจัดการ"}</th>
                </tr>
              </thead>
              <tbody>
                {occupiedRooms.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ fontSize: 15 }}>{isEn ? "Room" : "ห้อง"} {r.room_number}</strong>
                    </td>
                    <td>{r.room_type || "-"}</td>
                    <td>{r.floor || "-"}</td>
                    <td>{Number(r.price).toLocaleString()}</td>
                    <td>
                      <span className="pill occupied">{isEn ? "Occupied" : "มีผู้เช่า"}</span>
                    </td>
                    <td>
                      <Link to="/rooms" className="btn-ghost btn-sm" style={{ textDecoration: "none" }}>
                        {isEn ? "View Room →" : "ดูข้อมูลห้อง →"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
