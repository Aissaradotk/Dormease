import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import PageHeaderTabs from "../components/PageHeaderTabs";
const API = "http://119.59.102.161:3007";
const STATUS_COLOR = { pending:"warning", verified:"available", rejected:"occupied" };

const T = {
  th: {
    page_title: "🪪 การยืนยันตัวตนผู้เช่า (Resident Verifications)",
    page_subtitle: "ตรวจสอบข้อมูลและเอกสารระบุตัวตนของผู้เข้าพักก่อนอนุมัติ",
    refresh: "🔄 รีเฟรช",
    th_name: "ชื่อ",
    th_type: "ประเภท",
    th_id: "เลขบัตร/พาสปอร์ต",
    th_nat: "สัญชาติ",
    th_room: "ห้อง",
    th_status: "สถานะ",
    th_action: "การกระทำ",
    loading: "⏳ กำลังโหลด...",
    empty: "ไม่มีรายการยืนยันตัวตน",
    btn_view: "👁 ดูข้อมูล",
    btn_verify: "✅ อนุมัติ",
    btn_reject: "❌ ปฏิเสธ",
    type_thai: "🇹🇭 คนไทย",
    type_foreigner: "🌍 ต่างชาติ",
    lbl_name: "ชื่อ-นามสกุล",
    lbl_type: "ประเภทผู้พักอาศัย",
    lbl_nat_id: "เลขบัตรประชาชน",
    lbl_passport: "เลขที่หนังสือเดินทาง (Passport No.)",
    lbl_nat: "สัญชาติ",
    lbl_dob: "วันเกิด",
    lbl_phone: "เบอร์โทร",
    lbl_room: "ห้อง",
    lbl_reason: "เหตุผลที่ปฏิเสธ",
    lbl_verified_by: "อนุมัติโดย",
    lbl_verified_at: "อนุมัติเมื่อ",
    btn_verify_resident: "✅ ยืนยันการตรวจสอบ (อนุมัติ)",
    reject_modal_title: "ปฏิเสธการยืนยันตัวตน",
    reject_reason_label: "ระบุเหตุผลที่ปฏิเสธ *",
    reject_ph: "เช่น ข้อมูลไม่ถูกต้อง / เลขบัตรไม่ตรง / ภาพไม่ชัดเจน",
    cancel: "ยกเลิก",
    confirm_reject: "ยืนยันการปฏิเสธ",
    alert_specify_reason: "กรุณาระบุเหตุผล",
  },
  en: {
    page_title: "🪪 Resident Verifications",
    page_subtitle: "Review resident identification documents before approval",
    refresh: "🔄 Refresh",
    th_name: "Name",
    th_type: "Type",
    th_id: "ID / Passport",
    th_nat: "Nationality",
    th_room: "Room",
    th_status: "Status",
    th_action: "Action",
    loading: "⏳ Loading...",
    empty: "No verification records",
    btn_view: "👁 View",
    btn_verify: "✅ Verify",
    btn_reject: "❌ Reject",
    type_thai: "🇹🇭 Thai",
    type_foreigner: "🌍 Foreigner",
    lbl_name: "Full Name",
    lbl_type: "Resident Type",
    lbl_nat_id: "National ID",
    lbl_passport: "Passport No.",
    lbl_nat: "Nationality",
    lbl_dob: "Date of Birth",
    lbl_phone: "Phone",
    lbl_room: "Room",
    lbl_reason: "Rejection Reason",
    lbl_verified_by: "Verified by",
    lbl_verified_at: "Verified at",
    btn_verify_resident: "✅ Verify Resident",
    reject_modal_title: "Reject Verification",
    reject_reason_label: "Rejection Reason *",
    reject_ph: "e.g. Invalid document details / ID mismatch / blurry image",
    cancel: "Cancel",
    confirm_reject: "Confirm Reject",
    alert_specify_reason: "Please specify a reason",
  },
};

export default function AdminResidentVerifications() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [verifs, setVerifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const urls = [
        `${API}/api/resident-verifications/admin`,
        `${API}/api/resident-verifications`,
        `${API}/api/admin/resident-verifications`
      ];
      let data = null;
      for (const u of urls) {
        try {
          const res = await fetch(u, { headers });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) { data = json; break; }
          }
        } catch {}
      }
      setVerifs(Array.isArray(data) ? data : []);
    } catch { setVerifs([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleApprove(id) {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const urls = [
        `${API}/api/resident-verifications/${id}/approve`,
        `${API}/api/admin/resident-verifications/${id}/approve`
      ];
      for (const u of urls) {
        try {
          const res = await fetch(u, { method:"PATCH", headers });
          if (res.ok) break;
        } catch {}
      }
      await fetchAll();
      if (selected?.id === id) setSelected(s => ({ ...s, status:"verified" }));
    } finally { setActionLoading(false); }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return alert(t.alert_specify_reason);
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type":"application/json", Authorization: `Bearer ${token}` };
      const body = JSON.stringify({ reason: rejectReason });
      const urls = [
        `${API}/api/resident-verifications/${rejectId}/reject`,
        `${API}/api/admin/resident-verifications/${rejectId}/reject`
      ];
      for (const u of urls) {
        try {
          const res = await fetch(u, { method:"PATCH", headers, body });
          if (res.ok) break;
        } catch {}
      }
      setShowReject(false); setRejectReason(""); setRejectId(null);
      await fetchAll();
    } finally { setActionLoading(false); }
  }

  const Row = ({ label, value }) => (
    <div className="cert-detail-row">
      <span className="cert-detail-label">{label}</span>
      <span className="cert-detail-value">{value || "—"}</span>
    </div>
  );

  return (
    <div>
      <div className="page-head">
        <div className="page-head-info">
          <h1 className="page-title">{t.page_title}</h1>
          <p className="page-subtitle">{t.page_subtitle}</p>
        </div>
        <button className="btn-ghost btn-sm" onClick={fetchAll} disabled={loading}>{t.refresh}</button>
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

      <div className="card-shadow">
        <div className="table-scroll">
          <table className="data-table dense-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t.th_name}</th>
                <th>{t.th_type}</th>
                <th>{t.th_id}</th>
                <th>{t.th_nat}</th>
                <th>{t.th_room}</th>
                <th>{t.th_status}</th>
                <th>{t.th_action}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-cell">{t.loading}</td></tr>
              ) : verifs.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">{t.empty}</td></tr>
              ) : (
                verifs.map(v => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>
                      <div style={{ fontWeight:600 }}>{v.first_name} {v.last_name}</div>
                      <div style={{ fontSize:11, color:"var(--ink-muted)" }}>{v.email}</div>
                    </td>
                    <td>
                      <span className="pill info">
                        <span className="status-dot"/>
                        {v.resident_type === "thai" ? t.type_thai : t.type_foreigner}
                      </span>
                    </td>
                    <td style={{ fontFamily:"monospace", fontSize:12 }}>{v.national_id || v.passport_no || "—"}</td>
                    <td>{v.nationality || (v.resident_type === "thai" ? (lang === "en" ? "Thai" : "ไทย") : "—")}</td>
                    <td>{v.room_number || `Booking #${v.booking_id}`}</td>
                    <td>
                      <span className={`pill ${STATUS_COLOR[v.status]||"warning"}`}>
                        <span className="status-dot"/>{v.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-ghost btn-sm" onClick={() => setSelected(v)}>{t.btn_view}</button>
                        {v.status !== "verified" && (
                          <button className="btn-primary btn-sm" onClick={() => handleApprove(v.id)} disabled={actionLoading}>{t.btn_verify}</button>
                        )}
                        {v.status !== "rejected" && (
                          <button className="btn-danger btn-sm" onClick={() => { setRejectId(v.id); setShowReject(true); }}>{t.btn_reject}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="cert-detail-overlay" onClick={e => { if (e.target===e.currentTarget) setSelected(null); }}>
          <div className="cert-detail-panel">
            <div className="cert-detail-header">
              <h2>Verification #{selected.id}</h2>
              <button className="cb-panel-close" onClick={() => setSelected(null)} style={{ background:"rgba(0,0,0,.1)", color:"var(--ink-primary)" }}>✕</button>
            </div>
            <div className="cert-detail-body">
              <span className={`pill ${STATUS_COLOR[selected.status]||"warning"}`} style={{ marginBottom:12, display:"inline-flex" }}>
                <span className="status-dot"/>{selected.status}
              </span>
              <Row label={t.lbl_name} value={`${selected.first_name} ${selected.last_name}`} />
              <Row label={t.lbl_type} value={selected.resident_type === "thai" ? t.type_thai : t.type_foreigner} />
              {selected.resident_type === "thai" ? (
                <Row label={t.lbl_nat_id} value={selected.national_id} />
              ) : (
                <>
                  <Row label={t.lbl_passport} value={selected.passport_no} />
                  <Row label={t.lbl_nat} value={selected.nationality} />
                  <Row label={t.lbl_dob} value={selected.date_of_birth?.slice(0,10)} />
                </>
              )}
              <Row label={t.lbl_phone} value={selected.phone} />
              <Row label={t.lbl_room} value={selected.room_number || `Booking #${selected.booking_id}`} />
              {selected.status === "rejected" && <Row label={t.lbl_reason} value={selected.rejection_reason} />}
              {selected.status === "verified" && (
                <>
                  <Row label={t.lbl_verified_by} value={selected.verified_by} />
                  <Row label={t.lbl_verified_at} value={selected.verified_at?.slice(0,16)} />
                </>
              )}
            </div>
            <div className="cert-detail-footer" style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              {selected.status !== "verified" && (
                <button className="btn-primary" onClick={() => handleApprove(selected.id)} disabled={actionLoading}>{t.btn_verify_resident}</button>
              )}
              {selected.status !== "rejected" && (
                <button className="btn-danger" onClick={() => { setRejectId(selected.id); setShowReject(true); }}>{t.btn_reject}</button>
              )}
              <button className="btn-ghost" onClick={() => setSelected(null)}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="cert-detail-overlay" onClick={e => { if (e.target===e.currentTarget) setShowReject(false); }}>
          <div className="cert-detail-panel" style={{ maxWidth:440 }}>
            <div className="cert-detail-header">
              <h2>{t.reject_modal_title}</h2>
              <button className="cb-panel-close" onClick={() => setShowReject(false)} style={{ background:"rgba(0,0,0,.1)", color:"var(--ink-primary)" }}>✕</button>
            </div>
            <div className="cert-detail-body">
              <label className="cert-label">{t.reject_reason_label}</label>
              <textarea className="cert-input cert-textarea" rows={4} value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder={t.reject_ph} />
            </div>
            <div className="cert-detail-footer">
              <button className="btn-ghost" onClick={() => setShowReject(false)}>{t.cancel}</button>
              <button className="btn-danger" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}>{actionLoading ? "⏳..." : t.confirm_reject}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
