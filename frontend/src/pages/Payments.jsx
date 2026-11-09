import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";
import SlipModal from "../components/SlipModal";
import PaymentSimulatorModal from "../components/PaymentSimulatorModal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    pageTitle: "รายการชำระเงิน (Payments)",
    pageSubtitle: "บันทึกและตรวจสอบประวัติการชำระเงิน พร้อมสลิปโอนเงิน",
    addPayment: "+ บันทึกค่าเช่า",
    loading: "กำลังโหลด...",
    thTenant: "ผู้เช่า",
    thRoom: "ห้อง",
    thPeriod: "งวด",
    thAmount: "จำนวนเงิน",
    thStatus: "สถานะ",
    thSlip: "สลิปโอนเงิน",
    thActions: "การจัดการ",
    roomPrefix: "ห้อง",
    baht: "บาท",
    paid: "✓ ชำระแล้ว",
    pendingReview: "🟡 รอตรวจสอบ",
    slipRejected: "✕ สลิปไม่ผ่าน",
    unpaid: "● ยังไม่ชำระ",
    viewSlip: "ดูสลิป",
    noSlip: "- ยังไม่แนบ -",
    edit: "แก้ไข",
    delete: "ลบ",
    deleteConfirm: "ยืนยันการลบรายการนี้?",
    empty: "ยังไม่มีข้อมูลการชำระเงิน",
    editTitle: "แก้ไขรายการชำระเงิน",
    newTitle: "บันทึกค่าเช่า",
    lblTenant: "ผู้เช่า",
    selectTenant: "-- เลือกผู้เช่า --",
    lblPeriod: "งวด (เช่น 2026-07)",
    lblAmount: "จำนวนเงิน",
    lblStatus: "สถานะ",
    optUnpaid: "ยังไม่ชำระ",
    optPaid: "ชำระแล้ว",
    btnSave: "บันทึก",
    slipModalTitle: (tenant, period) => `สลิปโอนเงิน ผู้เช่า: ${tenant} (งวด ${period})`,
  },
  en: {
    pageTitle: "Payments",
    pageSubtitle: "Record and verify payment history and transfer slips",
    addPayment: "+ Record Payment",
    loading: "Loading...",
    thTenant: "Tenant",
    thRoom: "Room",
    thPeriod: "Period",
    thAmount: "Amount",
    thStatus: "Status",
    thSlip: "Transfer Slip",
    thActions: "Actions",
    roomPrefix: "Room",
    baht: "THB",
    paid: "✓ Paid",
    pendingReview: "🟡 Pending Review",
    slipRejected: "✕ Slip Rejected",
    unpaid: "● Unpaid",
    viewSlip: "View Slip",
    noSlip: "- None -",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this payment record?",
    empty: "No payment records found",
    editTitle: "Edit Payment Record",
    newTitle: "Record Payment",
    lblTenant: "Tenant",
    selectTenant: "-- Select Tenant --",
    lblPeriod: "Period (e.g. 2026-07)",
    lblAmount: "Amount (THB)",
    lblStatus: "Status",
    optUnpaid: "Unpaid",
    optPaid: "Paid",
    btnSave: "Save",
    slipModalTitle: (tenant, period) => `Payment Slip: ${tenant} (Period ${period})`,
  },
};

const empty = { tenant_id: "", amount: "", period: "", status: "unpaid" };

export default function Payments() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);

  async function load(isSilent = false) {
    if (!isSilent) setLoading(true);
    try {
      const [p, t] = await Promise.all([api.get("/payments"), api.get("/tenants")]);
      setPayments(p);
      setTenants(t);
    } catch (e) {
      if (!isSilent) setError(e.message);
    }
    if (!isSilent) setLoading(false);
  }

  useEffect(() => {
    load();

    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        load(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, []);

  function openNew() {
    setForm(empty);
    setEditing({});
  }
  function openEdit(p) {
    setForm(p);
    setEditing(p);
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing?.id) await api.put(`/payments/${editing.id}`, form);
      else await api.post("/payments", form);
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await api.del(`/payments/${id}`);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function togglePaid(p) {
    try {
      await api.put(`/payments/${p.id}`, { ...p, status: p.status === "paid" ? "unpaid" : "paid" });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t.pageTitle}</h1>
          <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>{t.pageSubtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowSimulator(true)}
            style={{
              background: "linear-gradient(135deg, #06c755 0%, #05a346 100%)",
              color: "#ffffff",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
              padding: "8px 14px",
              borderRadius: 8,
              boxShadow: "0 2px 6px rgba(6, 199, 85, 0.3)",
              cursor: "pointer",
            }}
          >
            <span>🧪</span>
            <span>{lang === "en" ? "Payment Simulator" : "จำลองตรวจเงินเข้า (LINE Connext)"}</span>
          </button>
          <button className="btn-primary" onClick={openNew}>
            {t.addPayment}
          </button>
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

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table dense-table">
            <thead>
              <tr>
                <th>{t.thTenant}</th>
                <th>{t.thRoom}</th>
                <th>{t.thPeriod}</th>
                <th>{t.thAmount}</th>
                <th>{t.thStatus}</th>
                <th>{t.thSlip}</th>
                <th>{t.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.tenants?.full_name || "-"}</b></td>
                  <td>{t.roomPrefix} {p.tenants?.rooms?.room_number || "-"}</td>
                  <td>{p.period}</td>
                  <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                    {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t.baht}
                    {(Number(p.amount) % 1 !== 0) && (
                      <span
                        title="เศษสตางค์ระบุตัวตน"
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          background: "#e0e7ff",
                          color: "#3730a3",
                          border: "1px solid #c7d2fe",
                          padding: "1px 5px",
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        .{((Number(p.amount) % 1).toFixed(2)).slice(2)} ฿
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {(() => {
                        const s = (p.status || "unpaid").toLowerCase();
                        if (s === "paid" || s === "approved") {
                          return (
                            <button className="pill clickable available" onClick={() => togglePaid(p)} style={{ fontWeight: 700 }}>
                              {t.paid}
                            </button>
                          );
                        }
                        if (s === "waiting_review" || s === "submitted") {
                          return (
                            <button className="pill clickable" style={{ background: "#fef3c7", color: "#92400e", border: "1.5px solid #fde68a", fontWeight: 700 }} onClick={() => togglePaid(p)}>
                              {t.pendingReview}
                            </button>
                          );
                        }
                        if (s === "rejected") {
                          return (
                            <button className="pill clickable occupied" style={{ background: "#fee2e2", color: "#991b1b", border: "1.5px solid #fca5a5", fontWeight: 700 }} onClick={() => togglePaid(p)}>
                              {t.slipRejected}
                            </button>
                          );
                        }
                        return (
                          <button className="pill clickable occupied" onClick={() => togglePaid(p)} style={{ fontWeight: 700 }}>
                            {t.unpaid}
                          </button>
                        );
                      })()}

                      {(p.payment_source || "").toLowerCase().includes("line") && (
                        <span
                          style={{
                            background: "rgba(6, 199, 85, 0.12)",
                            color: "#059669",
                            border: "1px solid #10b981",
                            fontSize: 10.5,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                          title="Auto-matched via LINE Connext Notification"
                        >
                          💬 LINE Connext
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {p.slip_image ? (
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() =>
                          setViewingSlip({
                            slipImage: p.slip_image,
                            details: {
                              tenant_name: p.tenants?.full_name,
                              room_number: p.tenants?.rooms?.room_number,
                              period: p.period,
                              amount: p.amount,
                            },
                          })
                        }
                        style={{
                          background: "#ecfdf5",
                          color: "#047857",
                          border: "1.5px solid #10b981",
                          fontWeight: 700,
                          borderRadius: 6,
                          padding: "4px 10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                        }}
                      >
                        <span>📸</span>
                        <span>{t.viewSlip}</span>
                      </button>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>{t.noSlip}</span>
                    )}
                  </td>
                  <td className="row-actions">
                    <button className="btn-ghost" onClick={() => openEdit(p)}>
                      {t.edit}
                    </button>
                    <button className="btn-danger" onClick={() => remove(p.id)}>
                      {t.delete}
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    {t.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? t.editTitle : t.newTitle} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <label>{t.lblTenant}</label>
            <select required value={form.tenant_id || ""} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}>
              <option value="">{t.selectTenant}</option>
              {tenants.map((tItem) => (
                <option key={tItem.id} value={tItem.id}>
                  {tItem.full_name} {tItem.rooms ? `(${t.roomPrefix} ${tItem.rooms.room_number})` : ""}
                </option>
              ))}
            </select>
            <label>{t.lblPeriod}</label>
            <input required placeholder="YYYY-MM" value={form.period || ""} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            <label>{t.lblAmount}</label>
            <input required type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <label>{t.lblStatus}</label>
            <select value={form.status || "unpaid"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="unpaid">{t.optUnpaid}</option>
              <option value="paid">{t.optPaid}</option>
            </select>
            <button className="btn-primary" type="submit" style={{ marginTop: 12 }}>
              {t.btnSave}
            </button>
          </form>
        </Modal>
      )}

      {viewingSlip && (
        <SlipModal
          slipImage={viewingSlip.slipImage}
          details={viewingSlip.details}
          title={t.slipModalTitle(viewingSlip.details?.tenant_name || "", viewingSlip.details?.period || "")}
          onClose={() => setViewingSlip(null)}
        />
      )}

      <PaymentSimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        onPaymentMatched={load}
        pendingPayments={payments.filter(
          (p) =>
            (p.status || "").toLowerCase() === "unpaid" ||
            (p.status || "").toLowerCase() === "waiting_review"
        )}
      />
    </div>
  );
}
