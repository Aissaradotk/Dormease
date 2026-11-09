import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import PageHeaderTabs from "../components/PageHeaderTabs";

const T = {
  th: {
    pageTitle: "📄 คำร้องขอใบรับรองถิ่นที่อยู่",
    pageSubtitle: "ตรวจสอบและอนุมัติคำร้องขอหนังสือรับรองถิ่นที่อยู่สำหรับผู้เช่าชาวต่างชาติ",
    refresh: "🔄 รีเฟรช",
    all: "ทั้งหมด",
    pending: "รอตรวจสอบ",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธแล้ว",
    colId: "ลำดับ",
    colApplicant: "ผู้ยื่นคำร้อง",
    colPassport: "เลขพาสปอร์ต",
    colNationality: "สัญชาติ",
    colDate: "วันที่ยื่นเรื่อง",
    colStatus: "สถานะ",
    colAction: "การดำเนินการ",
    empty: "ไม่พบรายการคำร้องขอใบรับรองถิ่นที่อยู่",
    btnView: "👁️ ดูข้อมูล",
    btnApprove: "✅ อนุมัติ",
    btnReject: "❌ ปฏิเสธ",
    loading: "กำลังโหลดข้อมูล...",
    detailTitle: "รายละเอียดคำขอใบรับรอง",
    fullName: "ชื่อ-นามสกุล",
    passportNo: "เลขหนังสือเดินทาง",
    nationality: "สัญชาติ",
    dob: "วันเดือนปีเกิด",
    address: "ที่อยู่หอพัก",
    checkinDate: "วันที่เข้าพัก",
    appDate: "วันที่ยื่นคำร้อง",
    phone: "เบอร์โทรศัพท์",
    signature: "ลายมือชื่อผู้ยื่น",
    approvedBy: "อนุมัติโดย",
    approvedAt: "วันที่อนุมัติ",
    rejectReason: "เหตุผลที่ปฏิเสธ",
    rejectModalTitle: "ระบุเหตุผลการปฏิเสธคำร้องขอ",
    rejectPrompt: "กรุณาระบุเหตุผลในการปฏิเสธคำร้องขอ *",
    rejectPlaceholder: "เช่น ข้อมูลหนังสือเดินทางไม่ชัดเจน หรือไม่ตรงกับเอกสารจริง",
    btnCancel: "ยกเลิก",
    btnConfirmReject: "ยืนยันการปฏิเสธ",
    rejecting: "กำลังปฏิเสธ...",
    approving: "กำลังอนุมัติ...",
    approveConfirm: "ยืนยันการอนุมัติคำร้องขอใบรับรองถิ่นที่อยู่ฉบับนี้ใช่หรือไม่?",
    statusPending: "🟡 รอการตรวจสอบ",
    statusApproved: "🟢 อนุมัติแล้ว",
    statusRejected: "🔴 ปฏิเสธแล้ว",
    errorLoad: "เกิดข้อผิดพลาดในการโหลดข้อมูลคำร้องขอ",
    btnRetry: "ลองใหม่",
  },
  en: {
    pageTitle: "📄 Certificate of Residence Requests",
    pageSubtitle: "Manage and approve foreign resident certificate applications",
    refresh: "🔄 Refresh",
    all: "All",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    colId: "No.",
    colApplicant: "Applicant",
    colPassport: "Passport No.",
    colNationality: "Nationality",
    colDate: "Application Date",
    colStatus: "Status",
    colAction: "Action",
    empty: "No applications found",
    btnView: "👁️ View",
    btnApprove: "✅ Approve",
    btnReject: "❌ Reject",
    loading: "Loading applications...",
    detailTitle: "Application Details",
    fullName: "Full Name",
    passportNo: "Passport No.",
    nationality: "Nationality",
    dob: "Date of Birth",
    address: "Dorm Address",
    checkinDate: "Check-in Date",
    appDate: "Application Date",
    phone: "Phone Number",
    signature: "Signature",
    approvedBy: "Approved By",
    approvedAt: "Approved At",
    rejectReason: "Rejection Reason",
    rejectModalTitle: "Reject Application",
    rejectPrompt: "Reason for rejection *",
    rejectPlaceholder: "e.g. Invalid passport information or address does not match",
    btnCancel: "Cancel",
    btnConfirmReject: "Confirm Reject",
    rejecting: "Rejecting...",
    approving: "Approving...",
    approveConfirm: "Are you sure you want to approve this Certificate of Residence?",
    statusPending: "🟡 Pending",
    statusApproved: "🟢 Approved",
    statusRejected: "🔴 Rejected",
    errorLoad: "Failed to load applications",
    btnRetry: "Retry",
  },
};

const STATUS_COLORS = {
  pending: "warning",
  approved: "available",
  rejected: "occupied",
};

export default function AdminResidenceCertificates() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/residence-certificates/admin/list");
      setCerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch certs error:", err);
      setError(err.message || t.errorLoad);
      setCerts([]);
    } finally {
      setLoading(false);
    }
  }, [t.errorLoad]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function fetchDetail(id) {
    try {
      const data = await api.get(`/residence-certificates/admin/detail/${id}`);
      setSelected(data);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleApprove(id) {
    if (!confirm(t.approveConfirm)) return;
    setActionLoading(true);
    try {
      await api.patch(`/residence-certificates/admin/approve/${id}`);
      await fetchAll();
      if (selected?.id === id) {
        setSelected((s) => ({ ...s, status: "approved" }));
      }
      alert(lang === "th" ? "อนุมัติคำร้องขอใบรับรองเรียบร้อยแล้ว" : "Application approved successfully");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      return alert(lang === "th" ? "กรุณาระบุเหตุผลในการปฏิเสธ" : "Please provide a rejection reason.");
    }
    setActionLoading(true);
    try {
      await api.patch(`/residence-certificates/admin/reject/${rejectingId}`, { reason: rejectReason });
      setShowRejectModal(false);
      setRejectReason("");
      setRejectingId(null);
      if (selected?.id === rejectingId) {
        setSelected((s) => ({ ...s, status: "rejected", rejection_reason: rejectReason }));
      }
      await fetchAll();
      alert(lang === "th" ? "ปฏิเสธคำร้องขอเรียบร้อยแล้ว" : "Application rejected");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function openReject(id) {
    setRejectingId(id);
    setRejectReason("");
    setShowRejectModal(true);
  }

  const filteredCerts = certs.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const countPending = certs.filter((c) => c.status === "pending").length;
  const countApproved = certs.filter((c) => c.status === "approved").length;
  const countRejected = certs.filter((c) => c.status === "rejected").length;

  const Row = ({ label, value }) => (
    <div className="cert-detail-row">
      <span className="cert-detail-label">{label}</span>
      <span className="cert-detail-value">{value || "—"}</span>
    </div>
  );

  return (
    <div className="cert-page">
      {/* Header with Title and Language Switcher */}
      <div className="page-head">
        <div className="page-head-info">
          <h1 className="page-title">{t.pageTitle}</h1>
          <p className="page-subtitle">{t.pageSubtitle}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn-ghost btn-sm" onClick={fetchAll} disabled={loading}>
            {t.refresh}
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

      {error && (
        <div className="form-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span>{error}</span>
          <button className="btn-ghost btn-sm" onClick={fetchAll}>{t.btnRetry}</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tab-buttons" style={{ marginBottom: 16 }}>
        <button
          className={`btn-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          {t.all} ({certs.length})
        </button>
        <button
          className={`btn-tab ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          ⏳ {t.pending} ({countPending})
        </button>
        <button
          className={`btn-tab ${filter === "approved" ? "active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          ✅ {t.approved} ({countApproved})
        </button>
        <button
          className={`btn-tab ${filter === "rejected" ? "active" : ""}`}
          onClick={() => setFilter("rejected")}
        >
          ❌ {t.rejected} ({countRejected})
        </button>
      </div>

      {/* Data Table */}
      <div className="card-shadow">
        <div className="table-scroll">
          <table className="data-table dense-table">
            <thead>
              <tr>
                <th>{t.colId}</th>
                <th>{t.colApplicant}</th>
                <th>{t.colPassport}</th>
                <th>{t.colNationality}</th>
                <th>{t.colDate}</th>
                <th>{t.colStatus}</th>
                <th style={{ textAlign: "right" }}>{t.colAction}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="empty-cell">{t.loading}</td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">{t.empty}</td>
                </tr>
              ) : (
                filteredCerts.map((c) => (
                  <tr key={c.id}>
                    <td><b>#{c.id}</b></td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.full_name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                        {c.user_display_name || c.email}
                      </div>
                    </td>
                    <td><span style={{ fontFamily: "monospace", fontSize: 13 }}>{c.passport_no}</span></td>
                    <td>{c.nationality}</td>
                    <td>{c.application_date?.slice(0, 10)}</td>
                    <td>
                      <span className={`pill ${STATUS_COLORS[c.status]}`}>
                        <span className="status-dot" />
                        {c.status === "pending"
                          ? t.statusPending
                          : c.status === "approved"
                          ? t.statusApproved
                          : t.statusRejected}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-ghost btn-sm" onClick={() => fetchDetail(c.id)}>
                          {t.btnView}
                        </button>
                        {c.status === "pending" && (
                          <>
                            <button
                              className="btn-primary btn-sm"
                              onClick={() => handleApprove(c.id)}
                              disabled={actionLoading}
                            >
                              {t.btnApprove}
                            </button>
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => openReject(c.id)}
                              disabled={actionLoading}
                            >
                              {t.btnReject}
                            </button>
                          </>
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

      {/* Detail Modal / Panel */}
      {selected && (
        <div
          className="cert-detail-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="cert-detail-panel">
            <div className="cert-detail-header">
              <h2>{t.detailTitle} #{selected.id}</h2>
              <button
                className="cb-panel-close"
                onClick={() => setSelected(null)}
                style={{ background: "rgba(0,0,0,.08)", color: "var(--ink-primary)" }}
              >
                ✕
              </button>
            </div>

            <div className="cert-detail-body">
              <div style={{ marginBottom: 16 }}>
                <span className={`pill ${STATUS_COLORS[selected.status]}`}>
                  <span className="status-dot" />
                  {selected.status === "pending"
                    ? t.statusPending
                    : selected.status === "approved"
                    ? t.statusApproved
                    : t.statusRejected}
                </span>
              </div>

              <Row label={t.fullName} value={selected.full_name} />
              <Row label={t.passportNo} value={selected.passport_no} />
              <Row label={t.nationality} value={selected.nationality} />
              <Row label={t.dob} value={selected.date_of_birth?.slice(0, 10)} />
              <Row label={t.address} value={selected.address} />
              <Row label={t.checkinDate} value={selected.check_in_date?.slice(0, 10)} />
              <Row label={t.appDate} value={selected.application_date?.slice(0, 10)} />
              <Row label={t.phone} value={selected.phone} />
              <Row label={t.signature} value={selected.signature} />

              {selected.status === "approved" && (
                <>
                  <Row label={t.approvedBy} value={selected.approved_by} />
                  <Row label={t.approvedAt} value={selected.approved_at?.slice(0, 19).replace("T", " ")} />
                </>
              )}

              {selected.status === "rejected" && (
                <Row label={t.rejectReason} value={selected.rejection_reason} />
              )}
            </div>

            <div className="cert-detail-footer">
              <button className="btn-ghost" onClick={() => setSelected(null)}>
                {t.btnCancel}
              </button>

              {selected.status === "pending" && (
                <>
                  <button
                    className="btn-danger"
                    onClick={() => openReject(selected.id)}
                    disabled={actionLoading}
                  >
                    {t.btnReject}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleApprove(selected.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? t.approving : t.btnApprove}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div
          className="cert-detail-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRejectModal(false);
          }}
        >
          <div className="cert-detail-panel" style={{ maxWidth: 440 }}>
            <div className="cert-detail-header">
              <h2>{t.rejectModalTitle}</h2>
              <button
                className="cb-panel-close"
                onClick={() => setShowRejectModal(false)}
                style={{ background: "rgba(0,0,0,.08)", color: "var(--ink-primary)" }}
              >
                ✕
              </button>
            </div>
            <div className="cert-detail-body">
              <label className="cert-label">{t.rejectPrompt}</label>
              <textarea
                className="cert-input cert-textarea"
                rows={4}
                placeholder={t.rejectPlaceholder}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="cert-detail-footer">
              <button className="btn-ghost" onClick={() => setShowRejectModal(false)}>
                {t.btnCancel}
              </button>
              <button
                className="btn-danger"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? t.rejecting : t.btnConfirmReject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
