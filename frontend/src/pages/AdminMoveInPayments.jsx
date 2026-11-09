import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import PageHeaderTabs from "../components/PageHeaderTabs";

const API = "http://119.59.102.161:3007";

const STATUS_CONFIG = {
  submitted: { labelTh: "⏳ รอตรวจสอบ", labelEn: "⏳ Pending Review", colorClass: "warning", bg: "rgba(245, 158, 11, 0.15)", text: "#d97706" },
  pending: { labelTh: "🕒 รอดำเนินการ", labelEn: "🕒 Pending", colorClass: "warning", bg: "rgba(245, 158, 11, 0.15)", text: "#d97706" },
  approved: { labelTh: "✅ อนุมัติแล้ว", labelEn: "✅ Approved", colorClass: "available", bg: "rgba(16, 185, 129, 0.15)", text: "#059669" },
  rejected: { labelTh: "❌ ปฏิเสธ", labelEn: "❌ Rejected", colorClass: "occupied", bg: "rgba(239, 68, 68, 0.15)", text: "#dc2626" },
};

export default function AdminMoveInPayments() {
  const { lang } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  function showMessage(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      // Try endpoints with fallback
      const endpoints = [
        `${API}/api/move-in-payments/admin`,
        `${API}/api/move-in-payments`,
        `${API}/api/admin/move-in-payments`
      ];

      let data = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) {
              data = json;
              break;
            }
          }
        } catch {
          // continue fallback
        }
      }

      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch payments error:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleApprove(id) {
    if (!window.confirm(lang === "th" ? "ยืนยันการอนุมัติการชำระเงินนี้?" : "Approve this payment?")) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const endpoints = [
        `${API}/api/move-in-payments/${id}/approve`,
        `${API}/api/admin/move-in-payments/${id}/approve`
      ];

      let success = false;
      let lastError = "";
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { method: "PATCH", headers });
          if (res.ok) {
            success = true;
            break;
          } else {
            const data = await res.json().catch(() => ({}));
            lastError = data.error || `HTTP ${res.status}`;
          }
        } catch (fetchErr) {
          lastError = fetchErr.message;
        }
      }

      if (success) {
        showMessage(lang === "th" ? "อนุมัติการชำระเงินเรียบร้อยแล้ว ✅" : "Payment approved successfully ✅");
        await fetchAll();
        if (selected?.id === id) {
          setSelected(prev => prev ? { ...prev, payment_status: "approved" } : null);
        }
      } else {
        alert((lang === "th" ? "เกิดข้อผิดพลาดในการอนุมัติ: " : "Failed to approve payment: ") + (lastError || ""));
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      return alert(lang === "th" ? "กรุณาระบุเหตุผลในการปฏิเสธ" : "Please enter a rejection reason");
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const endpoints = [
        `${API}/api/move-in-payments/${rejectId}/reject`,
        `${API}/api/admin/move-in-payments/${rejectId}/reject`
      ];

      let success = false;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ reason: rejectReason })
          });
          if (res.ok) {
            success = true;
            break;
          }
        } catch {
          // continue
        }
      }

      if (success) {
        showMessage(lang === "th" ? "ปฏิเสธการชำระเงินเรียบร้อยแล้ว" : "Payment rejected");
        setShowReject(false);
        setRejectReason("");
        setRejectId(null);
        if (selected?.id === rejectId) {
          setSelected(prev => prev ? { ...prev, payment_status: "rejected", rejection_reason: rejectReason } : null);
        }
        await fetchAll();
      } else {
        alert(lang === "th" ? "เกิดข้อผิดพลาดในการปฏิเสธ" : "Failed to reject payment");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Quick statistics
  const stats = useMemo(() => {
    const total = payments.length;
    const submitted = payments.filter(p => p.payment_status === "submitted" || p.payment_status === "pending").length;
    const approved = payments.filter(p => p.payment_status === "approved").length;
    const rejected = payments.filter(p => p.payment_status === "rejected").length;
    const pendingAmount = payments
      .filter(p => p.payment_status === "submitted" || p.payment_status === "pending")
      .reduce((sum, p) => sum + Number(p.paid_amount || p.total_amount || 0), 0);
    return { total, submitted, approved, rejected, pendingAmount };
  }, [payments]);

  // Filtered list
  const filtered = useMemo(() => {
    return payments.filter(p => {
      // Status filter
      if (filterStatus === "submitted" && p.payment_status !== "submitted" && p.payment_status !== "pending") return false;
      if (filterStatus === "approved" && p.payment_status !== "approved") return false;
      if (filterStatus === "rejected" && p.payment_status !== "rejected") return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const room = String(p.room_number || p.room_id || "").toLowerCase();
        const name = String(p.full_name || "").toLowerCase();
        const email = String(p.email || "").toLowerCase();
        const phone = String(p.phone || "").toLowerCase();
        const notes = String(p.notes || "").toLowerCase();
        if (!room.includes(q) && !name.includes(q) && !email.includes(q) && !phone.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [payments, filterStatus, search]);

  const presetReasons = [
    lang === "th" ? "สลิปโอนเงินไม่ชัดเจน / สลิปซ้ำ" : "Slip unclear or duplicate",
    lang === "th" ? "ยอดเงินไม่ตรงกับค่าแรกเข้า/ค่าประกัน" : "Amount mismatch with initial fees",
    lang === "th" ? "ไม่พบรายการโอนเงินในระบบธนาคาร" : "Transaction not found in bank statement",
    lang === "th" ? "ข้อมูลการจองหรือห้องพักไม่ถูกต้อง" : "Booking or room information incorrect",
  ];

  return (
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", paddingBottom: 60 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: "12px 20px",
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#fff",
          borderRadius: 10,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 10,
          animation: "fadeIn 0.2s ease"
        }}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div className="page-head-info">
          <h1 className="page-title">
            {lang === "th" ? "💳 การชำระค่าแรกเข้า / ค่าประกัน" : "💳 Move-in & Deposit Payments"}
          </h1>
          <p className="page-subtitle">
            {lang === "th"
              ? "ตรวจสอบสลิปการโอนเงิน และอนุมัติค่าแรกเข้า/ค่าประกันความเสียหายของผู้เช่า"
              : "Verify bank slips and approve move-in initial fees & security deposits"}
          </p>
        </div>
        <button
          className="btn-ghost btn-sm"
          onClick={fetchAll}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span>🔄</span> {lang === "th" ? "รีเฟรชข้อมูล" : "Refresh"}
        </button>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/monthly-bills", label: lang === "th" ? "บิลประจำเดือน" : "Monthly Bills", icon: "🧾" },
          { path: "/payments", label: lang === "th" ? "ตรวจสลิปค่าห้อง" : "Rent Payments", icon: "💵" },
          { path: "/admin/move-in-payments", label: lang === "th" ? "สลิปค่าแรกเข้า & ประกัน" : "Move-in Slips", icon: "💳" },
          { path: "/admin/initial-fees", label: lang === "th" ? "อัตราค่าแรกเข้า" : "Initial Fees", icon: "⚙️" },
        ]}
      />

      {/* Summary KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <div className="card-shadow" style={{ padding: 18, borderLeft: "4px solid var(--accent, #6366f1)" }}>
          <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 4 }}>
            {lang === "th" ? "📋 รายการทั้งหมด" : "📋 Total Payments"}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{stats.total}</div>
        </div>

        <div className="card-shadow" style={{
          padding: 18,
          borderLeft: "4px solid #f59e0b",
          background: stats.submitted > 0 ? "rgba(245, 158, 11, 0.05)" : "inherit"
        }}>
          <div style={{ fontSize: 13, color: "#d97706", fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⏳ {lang === "th" ? "รอตรวจสอบ" : "Pending Review"}</span>
            {stats.submitted > 0 && (
              <span style={{
                background: "#f59e0b",
                color: "#fff",
                fontSize: 11,
                padding: "2px 7px",
                borderRadius: 999,
                fontWeight: 700
              }}>
                {stats.submitted}
              </span>
            )}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#d97706" }}>{stats.submitted}</div>
        </div>

        <div className="card-shadow" style={{ padding: 18, borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: 13, color: "#059669", marginBottom: 4 }}>
            {lang === "th" ? "✅ อนุมัติแล้ว" : "✅ Approved"}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#059669" }}>{stats.approved}</div>
        </div>

        <div className="card-shadow" style={{ padding: 18, borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 4 }}>
            {lang === "th" ? "❌ ปฏิเสธ" : "❌ Rejected"}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#dc2626" }}>{stats.rejected}</div>
        </div>

        <div className="card-shadow" style={{ padding: 18, borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 4 }}>
            {lang === "th" ? "💰 ยอดเงินรอตรวจสอบ" : "💰 Pending Amount"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#2563eb" }}>
            {stats.pendingAmount.toLocaleString()} ฿
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="card-shadow" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12
        }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "all", label: lang === "th" ? "ทั้งหมด" : "All", count: stats.total },
              { id: "submitted", label: lang === "th" ? "⏳ รอตรวจสอบ" : "⏳ Pending", count: stats.submitted },
              { id: "approved", label: lang === "th" ? "✅ อนุมัติแล้ว" : "✅ Approved", count: stats.approved },
              { id: "rejected", label: lang === "th" ? "❌ ปฏิเสธ" : "❌ Rejected", count: stats.rejected }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: filterStatus === tab.id ? 700 : 500,
                  border: filterStatus === tab.id ? "1px solid var(--accent, #6366f1)" : "1px solid var(--border)",
                  background: filterStatus === tab.id ? "var(--accent, #6366f1)" : "var(--bg-card, #fff)",
                  color: filterStatus === tab.id ? "#fff" : "var(--ink-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease"
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: filterStatus === tab.id ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.06)",
                  color: filterStatus === tab.id ? "#fff" : "inherit"
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 260 }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <input
              type="text"
              className="cert-input"
              style={{ width: "100%", padding: "7px 12px", fontSize: 13 }}
              placeholder={lang === "th" ? "ค้นหาห้อง, ผู้เช่า, เบอร์, อีเมล..." : "Search room, tenant, phone..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="btn-ghost btn-sm"
                style={{ padding: "4px 8px" }}
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card-shadow">
        <div className="table-scroll">
          <table className="data-table dense-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>{lang === "th" ? "วันที่ทำรายการ" : "Date"}</th>
                <th>{lang === "th" ? "ห้องพัก" : "Room"}</th>
                <th>{lang === "th" ? "ผู้เช่า" : "Tenant"}</th>
                <th>{lang === "th" ? "รายละเอียดการชำระ" : "Payment Details"}</th>
                <th style={{ textAlign: "right" }}>{lang === "th" ? "ยอดเงินที่ชำระ" : "Paid Amount"}</th>
                <th style={{ textAlign: "center" }}>{lang === "th" ? "สลิป" : "Slip"}</th>
                <th style={{ textAlign: "center" }}>{lang === "th" ? "สถานะ" : "Status"}</th>
                <th style={{ textAlign: "center", minWidth: 160 }}>{lang === "th" ? "การจัดการ" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="empty-cell" style={{ padding: 40, textAlign: "center" }}>
                    ⏳ {lang === "th" ? "กำลังโหลดข้อมูล..." : "Loading payments..."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-cell" style={{ padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <div style={{ fontWeight: 600, color: "var(--ink-secondary)" }}>
                      {lang === "th" ? "ไม่พบรายการชำระเงิน" : "No payment records found"}
                    </div>
                    {payments.length > 0 && search && (
                      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>
                        {lang === "th" ? "ลองค้นหาด้วยคำอื่น" : "Try a different search keyword"}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const statusConf = STATUS_CONFIG[p.payment_status] || STATUS_CONFIG.submitted;
                  const isSubmitted = p.payment_status === "submitted" || p.payment_status === "pending";
                  const isLarge = (p.notes && p.notes.includes("ขนาดใหญ่")) || (p.room_type && p.room_type.includes("1-Bed"));

                  return (
                    <tr key={p.id} style={{ background: isSubmitted ? "rgba(245, 158, 11, 0.02)" : "inherit" }}>
                      <td style={{ fontWeight: 600, color: "var(--ink-muted)" }}>#{p.id}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        <div>{p.created_at ? new Date(p.created_at).toLocaleDateString("th-TH") : "—"}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                          {p.created_at ? new Date(p.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>
                            {p.room_number || (p.room_id ? `ห้อง ${p.room_id}` : "—")}
                          </span>
                          <span style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: isLarge ? "rgba(139, 92, 246, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: isLarge ? "#7c3aed" : "#2563eb",
                            fontWeight: 600
                          }}>
                            {isLarge ? "🏰 ใหญ่" : "🏢 เล็ก"}
                          </span>
                        </div>
                        {p.room_type && (
                          <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>
                            {p.room_type}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.full_name || "—"}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                          {p.phone ? `📞 ${p.phone}` : ""} {p.email ? `• ✉️ ${p.email}` : ""}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.notes || "-"}>
                          {p.notes || (lang === "th" ? "ชำระค่าแรกเข้า / ประกัน" : "Initial fee / Deposit")}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                          {lang === "th" ? "ช่องทาง: " : "Method: "}
                          <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{p.payment_method || "PromptPay"}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: Number(p.paid_amount) < Number(p.total_amount) ? "#dc2626" : "#059669"
                        }}>
                          {Number(p.paid_amount || p.total_amount || 0).toLocaleString()} ฿
                        </div>
                        {Number(p.total_amount) > Number(p.paid_amount) && (
                          <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                            {lang === "th" ? "จากยอดเต็ม " : "of "} {Number(p.total_amount).toLocaleString()} ฿
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {p.payment_slip ? (
                          <div
                            onClick={() => setShowSlipModal(p.payment_slip)}
                            style={{
                              display: "inline-block",
                              cursor: "pointer",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: 2,
                              background: "#fff",
                              transition: "transform 0.15s ease"
                            }}
                            title={lang === "th" ? "คลิกเพื่อดูสลิปขนาดเต็ม" : "Click to view full slip"}
                          >
                            <img
                              src={p.payment_slip}
                              alt="Slip"
                              style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: statusConf.bg,
                          color: statusConf.text
                        }}>
                          {lang === "th" ? statusConf.labelTh : statusConf.labelEn}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="row-actions" style={{ justifyContent: "center", gap: 6 }}>
                          <button
                            className="btn-ghost btn-sm"
                            onClick={() => setSelected(p)}
                            title={lang === "th" ? "ดูรายละเอียด" : "View details"}
                          >
                            👁️ {lang === "th" ? "ดูข้อมูล" : "View"}
                          </button>
                          {p.payment_status !== "approved" && (
                            <button
                              className="btn-primary btn-sm"
                              onClick={() => handleApprove(p.id)}
                              disabled={actionLoading}
                              style={{ background: "#10b981", borderColor: "#10b981" }}
                              title={lang === "th" ? "อนุมัติการชำระเงิน" : "Approve payment"}
                            >
                              ✅ {lang === "th" ? "อนุมัติ" : "Approve"}
                            </button>
                          )}
                          {p.payment_status !== "rejected" && (
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => { setRejectId(p.id); setShowReject(true); }}
                              disabled={actionLoading}
                              title={lang === "th" ? "ปฏิเสธการชำระเงิน" : "Reject payment"}
                            >
                              ❌ {lang === "th" ? "ปฏิเสธ" : "Reject"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Image Fullscreen Modal */}
      {showSlipModal && (
        <div
          className="cert-detail-overlay"
          onClick={() => setShowSlipModal(null)}
          style={{ zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)" }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowSlipModal(null)}
              style={{
                position: "absolute",
                top: -40,
                right: 0,
                background: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 16
              }}
            >
              ✕
            </button>
            <img
              src={showSlipModal}
              alt="Slip Full"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: 8,
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                display: "block"
              }}
            />
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <a
                href={showSlipModal}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#fff", fontSize: 13, textDecoration: "underline" }}
              >
                🔗 {lang === "th" ? "เปิดรูปภาพในแท็บใหม่" : "Open in new tab"}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="cert-detail-overlay"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="cert-detail-panel" style={{ maxWidth: 560 }}>
            <div className="cert-detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>
                  {lang === "th" ? `รายการชำระค่าแรกเข้า #${selected.id}` : `Payment #${selected.id}`}
                </h2>
                <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                  {selected.created_at ? new Date(selected.created_at).toLocaleString("th-TH") : ""}
                </div>
              </div>
              <button
                className="cb-panel-close"
                onClick={() => setSelected(null)}
                style={{ background: "rgba(0,0,0,.08)", color: "var(--ink-primary)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div className="cert-detail-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {/* Status Banner */}
              <div style={{
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                background: STATUS_CONFIG[selected.payment_status]?.bg || "rgba(0,0,0,0.05)",
                color: STATUS_CONFIG[selected.payment_status]?.text || "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <span style={{ fontWeight: 700 }}>
                  {lang === "th" ? STATUS_CONFIG[selected.payment_status]?.labelTh : STATUS_CONFIG[selected.payment_status]?.labelEn}
                </span>
                {selected.approved_by && (
                  <span style={{ fontSize: 11 }}>
                    {lang === "th" ? `โดย ${selected.approved_by}` : `By ${selected.approved_by}`}
                  </span>
                )}
              </div>

              {/* Info Rows */}
              <div className="cert-detail-row">
                <span className="cert-detail-label">{lang === "th" ? "ห้องพัก" : "Room"}</span>
                <span className="cert-detail-value" style={{ fontWeight: 700 }}>
                  {selected.room_number || (selected.room_id ? `ห้อง ${selected.room_id}` : "—")}
                  {selected.room_type ? ` (${selected.room_type})` : ""}
                </span>
              </div>

              <div className="cert-detail-row">
                <span className="cert-detail-label">{lang === "th" ? "ชื่อผู้เช่า" : "Tenant"}</span>
                <span className="cert-detail-value">{selected.full_name || "—"}</span>
              </div>

              <div className="cert-detail-row">
                <span className="cert-detail-label">{lang === "th" ? "เบอร์โทรศัพท์" : "Phone"}</span>
                <span className="cert-detail-value">{selected.phone || "—"}</span>
              </div>

              <div className="cert-detail-row">
                <span className="cert-detail-label">{lang === "th" ? "อีเมล" : "Email"}</span>
                <span className="cert-detail-value">{selected.email || "—"}</span>
              </div>

              <div className="cert-detail-row">
                <span className="cert-detail-label">{lang === "th" ? "วันที่กำหนดเข้าอยู่" : "Check-in Date"}</span>
                <span className="cert-detail-value">
                  {selected.check_in_date ? new Date(selected.check_in_date).toLocaleDateString("th-TH") : "—"}
                </span>
              </div>

              <hr style={{ margin: "14px 0", border: "none", borderTop: "1px solid var(--border)" }} />

              <div className="cert-detail-row">
                <span className="cert-detail-label">{lang === "th" ? "ยอดเงินรวมทั้งสิ้น" : "Total Amount"}</span>
                <span className="cert-detail-value" style={{ fontWeight: 600 }}>
                  {Number(selected.total_amount).toLocaleString()} ฿
                </span>
              </div>

              <div className="cert-detail-row">
                <span className="cert-detail-label">{lang === "th" ? "ยอดเงินที่ชำระจริง" : "Paid Amount"}</span>
                <span className="cert-detail-value" style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: Number(selected.paid_amount) < Number(selected.total_amount) ? "#dc2626" : "#059669"
                }}>
                  {Number(selected.paid_amount).toLocaleString()} ฿
                </span>
              </div>

              <div className="cert-detail-row">
                <span className="cert-detail-label">{lang === "th" ? "ช่องทางการชำระ" : "Payment Method"}</span>
                <span className="cert-detail-value" style={{ textTransform: "capitalize" }}>
                  {selected.payment_method || "PromptPay"}
                </span>
              </div>

              {selected.notes && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg-card, #f8fafc)", borderRadius: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: "var(--ink-secondary)", marginBottom: 4 }}>
                    {lang === "th" ? "บันทึก / รายละเอียด:" : "Notes / Breakdown:"}
                  </div>
                  <div style={{ color: "var(--ink-primary)" }}>{selected.notes}</div>
                </div>
              )}

              {selected.rejection_reason && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(239, 68, 68, 0.08)", borderRadius: 8, fontSize: 13, borderLeft: "3px solid #ef4444" }}>
                  <div style={{ fontWeight: 600, color: "#dc2626", marginBottom: 2 }}>
                    {lang === "th" ? "เหตุผลในการปฏิเสธ:" : "Rejection Reason:"}
                  </div>
                  <div style={{ color: "#dc2626" }}>{selected.rejection_reason}</div>
                </div>
              )}

              {/* Slip Preview */}
              {selected.payment_slip && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{lang === "th" ? "🧾 สลิปการโอนเงิน:" : "🧾 Payment Slip:"}</span>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => setShowSlipModal(selected.payment_slip)}
                      style={{ fontSize: 12, padding: "2px 8px" }}
                    >
                      🔍 {lang === "th" ? "ดูรูปขยาย" : "Zoom"}
                    </button>
                  </div>
                  <div style={{ textAlign: "center", background: "#f1f5f9", padding: 8, borderRadius: 8 }}>
                    <img
                      src={selected.payment_slip}
                      alt="Payment Slip"
                      onClick={() => setShowSlipModal(selected.payment_slip)}
                      style={{
                        maxWidth: "100%",
                        maxHeight: 280,
                        borderRadius: 6,
                        cursor: "pointer",
                        border: "1px solid var(--border)"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="cert-detail-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              {selected.payment_status !== "approved" && (
                <button
                  className="btn-primary"
                  onClick={() => handleApprove(selected.id)}
                  disabled={actionLoading}
                  style={{ background: "#10b981", borderColor: "#10b981" }}
                >
                  ✅ {lang === "th" ? "อนุมัติการชำระเงิน" : "Approve Payment"}
                </button>
              )}
              {selected.payment_status !== "rejected" && (
                <button
                  className="btn-danger"
                  onClick={() => { setRejectId(selected.id); setShowReject(true); }}
                  disabled={actionLoading}
                >
                  ❌ {lang === "th" ? "ปฏิเสธ" : "Reject"}
                </button>
              )}
              <button className="btn-ghost" onClick={() => setSelected(null)}>
                {lang === "th" ? "ปิดหน้าต่าง" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showReject && (
        <div
          className="cert-detail-overlay"
          onClick={e => { if (e.target === e.currentTarget) setShowReject(false); }}
        >
          <div className="cert-detail-panel" style={{ maxWidth: 460 }}>
            <div className="cert-detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 17, color: "#dc2626" }}>
                ❌ {lang === "th" ? "ปฏิเสธการชำระเงิน" : "Reject Payment"}
              </h2>
              <button
                className="cb-panel-close"
                onClick={() => setShowReject(false)}
                style={{ background: "rgba(0,0,0,.08)", color: "var(--ink-primary)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div className="cert-detail-body">
              <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 0 }}>
                {lang === "th"
                  ? "กรุณาระบุเหตุผลเพื่อให้ลูกบ้านทราบและดำเนินการแก้ไข หรือเลือกจากข้อความสำเร็จรูป:"
                  : "Please provide a reason for the resident to take corrective action, or pick a preset:"}
              </p>

              {/* Preset Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {presetReasons.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(p)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 16,
                      fontSize: 12,
                      background: rejectReason === p ? "#ef4444" : "var(--bg-card, #f1f5f9)",
                      color: rejectReason === p ? "#fff" : "var(--ink-primary)",
                      border: "1px solid var(--border)",
                      cursor: "pointer"
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <label className="cert-label" style={{ fontWeight: 600 }}>
                {lang === "th" ? "เหตุผลในการปฏิเสธ *" : "Reason *"}
              </label>
              <textarea
                className="cert-input cert-textarea"
                rows={4}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder={lang === "th" ? "พิมพ์เหตุผลที่ต้องการแจ้งผู้เช่า..." : "Type rejection reason..."}
                style={{ width: "100%", padding: 10, borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <div className="cert-detail-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-ghost" onClick={() => setShowReject(false)}>
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                className="btn-danger"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? "⏳..." : (lang === "th" ? "ยืนยันการปฏิเสธ" : "Confirm Reject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
