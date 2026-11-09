import { useEffect, useState } from "react";
import { api } from "../lib/api";
import BillSlipModal from "../components/BillSlipModal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    pageTitle: "บิลค่าใช้จ่ายประจำเดือน (ค่าน้ำ-ค่าไฟ-ค่าห้อง)",
    loading: "กำลังโหลดข้อมูลบิล...",
    paid: "✓ ชำระแล้ว",
    pendingReview: "🟡 รอตรวจสอบ",
    slipRejected: "✕ สลิปไม่ผ่าน",
    unpaid: "● ยังไม่ชำระ",
    periodMonth: "งวดเดือน",
    room: "ห้อง",
    roomRent: "ค่าห้องพัก",
    waterFee: "ค่าน้ำประปา",
    electricFee: "ค่าไฟฟ้า",
    otherFees: "ค่าบริการอื่นๆ",
    paidAt: "ชำระเมื่อ:",
    payInstruction: "กรุณาชำระเงินตามช่องทางที่หอพักกำหนด",
    btnViewReceipt: "📄 ดูใบเสร็จ / QR ชำระเงิน",
    total: "ยอดรวม:",
    emptyBills: "ยังไม่มีรายการบิลค่าใช้จ่าย",
  },
  en: {
    pageTitle: "Monthly Bills (Water, Electricity, Rent)",
    loading: "Loading bills data...",
    paid: "✓ Paid",
    pendingReview: "🟡 Pending Review",
    slipRejected: "✕ Slip Rejected",
    unpaid: "● Unpaid",
    periodMonth: "Billing Period",
    room: "Room",
    roomRent: "Room Rent",
    waterFee: "Water Utility",
    electricFee: "Electricity",
    otherFees: "Other Fees",
    paidAt: "Paid at:",
    payInstruction: "Please make payment via dormitory official channels",
    btnViewReceipt: "📄 View Receipt / Payment QR",
    total: "Total:",
    emptyBills: "No bills recorded yet",
  },
};

export default function TenantBills() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBillForSlip, setSelectedBillForSlip] = useState(null);

  async function loadBills(isSilent = false) {
    if (!isSilent) setLoading(true);
    try {
      const data = await api.get("/bills/my");
      setBills(data);
    } catch (err) {
      if (!isSilent) setError(err.message);
    }
    if (!isSilent) setLoading(false);
  }

  useEffect(() => {
    loadBills();

    // Auto-reload on window focus & periodic silent polling (every 4 seconds)
    const onFocus = () => loadBills(true);
    window.addEventListener("focus", onFocus);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadBills(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <div className="page-head">
        <h1>{t.pageTitle}</h1>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/my-bills", label: lang === "th" ? "บิลค่าห้องเดือนนี้" : "My Monthly Bill", icon: "🧾" },
          { path: "/my-payments", label: lang === "th" ? "ประวัติการชำระ / สลิป" : "Payment History", icon: "💳" },
          { path: "/deposit-payment", label: lang === "th" ? "ชำระค่าแรกเข้า & ค่าประกัน" : "Security Deposit", icon: "🛡️" },
        ]}
      />

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <div>
          <div className="bill-cards-grid" style={{ display: "grid", gap: 16 }}>
            {bills.map((b) => {
              const s = (b.status || "unpaid").toLowerCase();
              const isPaid = s === "paid" || s === "approved";
              const isReview = s === "waiting_review" || s === "submitted" || (Boolean(b.slip_image) && !isPaid && !s.includes("reject"));
              const isRejected = s === "rejected";

              const borderColor = isPaid ? "#2d7a5b" : isReview ? "#f59e0b" : "#dc2626";
              const badgeLabel = isPaid ? t.paid : isReview ? t.pendingReview : isRejected ? t.slipRejected : t.unpaid;
              const badgeClass = isPaid ? "pill available" : isReview ? "pill" : "pill occupied";
              const badgeStyle = isReview ? { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", fontWeight: 700 } : { fontWeight: 700 };

              return (
                <div
                  key={b.id}
                  className="card-box"
                  style={{
                    borderLeft: `6px solid ${borderColor}`,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: "bold" }}>{t.periodMonth} {b.period}</span>
                      <span style={{ marginLeft: 10, color: "#666", fontSize: 14 }}>
                        ({t.room} {b.room_number})
                      </span>
                    </div>
                    <span className={badgeClass} style={badgeStyle}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, margin: "14px 0" }}>
                    <div style={{ background: "#f8faf9", padding: "10px 14px", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "#666" }}>{t.roomRent}</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>
                        {Number(b.room_price).toLocaleString()} ฿
                      </div>
                    </div>

                    <div style={{ background: "#f8faf9", padding: "10px 14px", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "#666" }}>{t.waterFee}</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#0284c7" }}>
                        {Number(b.water_price).toLocaleString()} ฿
                      </div>
                    </div>

                    <div style={{ background: "#f8faf9", padding: "10px 14px", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "#666" }}>{t.electricFee}</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#d97706" }}>
                        {Number(b.electric_price).toLocaleString()} ฿
                      </div>
                    </div>

                    {Number(b.other_fees) > 0 && (
                      <div style={{ background: "#f8faf9", padding: "10px 14px", borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: "#666" }}>{t.otherFees}</div>
                        <div style={{ fontSize: 16, fontWeight: "bold", color: "#6b7280" }}>
                          {Number(b.other_fees).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px dashed #e5e7eb", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      {isPaid && b.paid_at
                        ? `${t.paidAt} ${new Date(b.paid_at).toLocaleDateString(lang === "en" ? "en-US" : "th-TH")}`
                        : t.payInstruction}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setSelectedBillForSlip(b)}
                        style={{ border: "1px solid #d1d5db" }}
                      >
                        {t.btnViewReceipt}
                      </button>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: "bold", color: "#111" }}>
                          {t.total}{" "}
                          <span style={{ color: isPaid ? "#2d7a5b" : "#dc2626", fontSize: 20 }}>
                            {Number(b.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                          </span>
                        </div>
                        {Number(b.total_amount) % 1 !== 0 && !isPaid && (
                          <div style={{ fontSize: 11.5, color: "#4338ca", background: "#e0e7ff", padding: "2px 8px", borderRadius: 4, marginTop: 4, fontWeight: 700, display: "inline-block" }}>
                            💡 ยอดล็อกเศษสตางค์ (.{((Number(b.total_amount) % 1).toFixed(2)).slice(2)} ฿) โอนตรงยอดหรือสแกน QR อนุมัติทันที
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {bills.length === 0 && (
              <div className="empty-box">{t.emptyBills}</div>
            )}
          </div>
        </div>
      )}

      {selectedBillForSlip && (
        <BillSlipModal
          bill={selectedBillForSlip}
          onClose={() => setSelectedBillForSlip(null)}
        />
      )}
    </div>
  );
}
