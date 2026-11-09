import { useState, useEffect } from "react";
import Modal from "./Modal";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

export default function PaymentSimulatorModal({ isOpen, onClose, onPaymentMatched, pendingPayments = [] }) {
  const { lang } = useLanguage();
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("krungthai");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("quick"); // 'quick' | 'custom' | 'logs'
  const [listenerStatus, setListenerStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      checkStatus();
      if (pendingPayments.length > 0 && !amount) {
        setAmount(String(pendingPayments[0].amount || ""));
      }
    }
  }, [isOpen, pendingPayments]);

  async function checkStatus() {
    try {
      const res = await api.get("/payment/notification/status");
      setListenerStatus(res);
    } catch (e) {
      setListenerStatus({ status: "error", message: e.message });
    }
  }

  async function loadLogs() {
    try {
      const logs = await api.get("/payment/notification/logs");
      setRecentLogs(Array.isArray(logs) ? logs : []);
    } catch {}
  }

  async function handleSimulate(customAmount, isDuplicate = false) {
    const amt = parseFloat(customAmount || amount);
    if (!amt && !isDuplicate) {
      alert(lang === "en" ? "Please enter an amount" : "กรุณาระบุจำนวนเงิน");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        amount: amt || 4000,
        bank,
        source: "line_connext",
        force_duplicate: isDuplicate,
        raw_message: `[LINE Desktop Notification] Krungthai Connext: เงินเข้า ${amt || 4000} บาท จาก บัญชี xxx-x-xx123-x`,
      };

      const res = await api.post("/payment/notification/test", payload);
      setResult(res);

      if (res.status === "PAID" && onPaymentMatched) {
        onPaymentMatched();
      }

      loadLogs();
    } catch (err) {
      setResult({
        status: "ERROR",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal title={lang === "en" ? "🧪 Payment Auto-Match Simulator (LINE Connext)" : "🧪 ระบบจำลองตรวจเงินเข้าอัตโนมัติ (LINE Connext / Windows Notification)"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Banner ข้อมูลการเชื่อมต่อ */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(6, 199, 85, 0.08) 0%, rgba(0, 59, 100, 0.08) 100%)",
            border: "1.5px solid #06c755",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>💬</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>
                {lang === "en" ? "Krungthai Connext • LINE Desktop Notification" : "การตรวจจับการแจ้งเตือน LINE Desktop (Krungthai Connext)"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                {lang === "en"
                  ? "Extracts deposit amount from Windows Notification -> Matches Invoice -> Auto-approves to PAID"
                  : "อ่านการแจ้งเตือนเงินเข้าบน Windows ➔ ส่งเข้า API เดิม ➔ จับคู่ Invoice ที่รอชำระ ➔ อนุมัติ PAID ทันที"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
            <strong style={{ color: "#059669" }}>Engine Active</strong>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
          <button
            type="button"
            className={`btn-sm ${activeTab === "quick" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("quick")}
            style={{ fontWeight: 700 }}
          >
            ⚡ {lang === "en" ? "One-Click Quick Test" : "ทดสอบด่วนคลิกเดียว (ตามรายการจริง)"}
          </button>
          <button
            type="button"
            className={`btn-sm ${activeTab === "custom" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("custom")}
            style={{ fontWeight: 700 }}
          >
            ⌨️ {lang === "en" ? "Custom Amount" : "ระบุยอดเงินเอง"}
          </button>
          <button
            type="button"
            className={`btn-sm ${activeTab === "logs" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("logs")}
            style={{ fontWeight: 700 }}
          >
            📋 {lang === "en" ? `Match Logs (${recentLogs.length})` : `ประวัติการจับคู่ (${recentLogs.length})`}
          </button>
        </div>

        {/* Tab 1: One-Click Quick Test */}
        {activeTab === "quick" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-secondary)", marginBottom: 8 }}>
                🎯 {lang === "en" ? "Choose pending payment to test matching:" : "เลือกรายการค่าเช่าที่รอชำระ เพื่อทดสอบการจับคู่เงินเข้าจริง:"}
              </div>
              {pendingPayments.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "var(--ink-muted)", padding: "10px", background: "var(--surface-alt)", borderRadius: 8 }}>
                  {lang === "en" ? "No unpaid payments found currently" : "ขณะนี้ไม่มีรายการค้างชำระในระบบ (สามารถทดสอบด้วยปุ่มจำลองด้านล่างได้)"}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
                  {pendingPayments.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSimulate(p.amount)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #86efac",
                        background: "#f0fdf4",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#166534", fontWeight: 700 }}>
                          ห้อง {p.tenants?.rooms?.room_number || "-"} ({p.tenants?.full_name || "ผู้เช่า"})
                        </span>
                        <span style={{ fontSize: 10.5, background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: 4 }}>
                          งวด {p.period}
                        </span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d", marginTop: 4 }}>
                        ฿{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>
                        ▶ คลิกจำลองเงินเข้ายอดนี้
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Test edge cases */}
            <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-secondary)", marginBottom: 8 }}>
                🧪 {lang === "en" ? "Test Edge Cases (Verification & Safety):" : "ทดสอบกรณีพิเศษ (ความปลอดภัยและการป้องกันผิดพลาด):"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSimulate(3699)}
                  className="btn-ghost btn-sm"
                  style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fef2f2" }}
                >
                  ❌ {lang === "en" ? "Unmatched Amount (฿3,699)" : "ยอดไม่ตรงกับบิล (฿3,699) ➔ MANUAL_REVIEW"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSimulate(null, true)}
                  className="btn-ghost btn-sm"
                  style={{ borderColor: "#93c5fd", color: "#1d4ed8", background: "#eff6ff" }}
                >
                  🛡️ {lang === "en" ? "Duplicate Notification Test" : "ทดสอบส่งซ้ำ ➔ DUPLICATE (ป้องกันคิดเงินซ้ำ)"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSimulate(99999)}
                  className="btn-ghost btn-sm"
                  style={{ borderColor: "#fde68a", color: "#b45309", background: "#fffbeb" }}
                >
                  🔍 {lang === "en" ? "No Invoice Exists (฿99,999)" : "ไม่พบบิลรอชำระ (฿99,999) ➔ MANUAL_REVIEW"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await api.post("/payment/notification/reset-demo", { bill_id: 2 });
                      alert("รีเซ็ตบิลห้อง 333 เป็นยังไม่ชำระเรียบร้อยแล้ว!");
                      if (onPaymentMatched) onPaymentMatched();
                    } catch (e) {
                      alert("รีเซ็ตไม่สำเร็จ: " + e.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="btn-ghost btn-sm"
                  style={{ borderColor: "#cbd5e1", color: "#475569", background: "#f8fafc" }}
                >
                  🔄 {lang === "en" ? "Reset Room 333 to Unpaid" : "รีเซ็ตบิลห้อง 333 (฿3,700) เป็น 'ยังไม่ชำระ'"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Custom Amount Form */}
        {activeTab === "custom" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSimulate();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: 4 }}>
                  {lang === "en" ? "Deposit Amount (THB):" : "ยอดเงินที่โอนเข้า (บาท):"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="เช่น 3700 หรือ 4000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 15, fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: 4 }}>
                  {lang === "en" ? "Bank / Notification Channel:" : "ธนาคาร / ช่องทางแจ้งเตือน:"}
                </label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14 }}
                >
                  <option value="krungthai">Krungthai Connext (KTB กรุงไทย)</option>
                  <option value="scb">SCB Connect (ไทยพาณิชย์)</option>
                  <option value="kbank">KBank Live / K PLUS (กสิกรไทย)</option>
                  <option value="bbl">Bangkok Bank (BBL กรุงเทพ)</option>
                  <option value="ttb">ttb connect (ทีทีบี)</option>
                  <option value="krungsri">Krungsri Simple (กรุงศรี)</option>
                  <option value="gsb">GSB Society (ออมสิน)</option>
                  <option value="promptpay">PromptPay (พร้อมเพย์)</option>
                </select>
              </div>
            </div>

            {/* Notification Preview Box */}
            <div
              style={{
                background: "var(--surface-alt)",
                border: "1px dashed var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12.5,
              }}
            >
              <div style={{ fontWeight: 700, color: "#06c755", display: "flex", alignItems: "center", gap: 6 }}>
                <span>💬</span> LINE Desktop Notification Preview:
              </div>
              <div style={{ fontFamily: "monospace", marginTop: 4, color: "var(--ink-primary)" }}>
                <strong>Krungthai Connext:</strong> เงินเข้า {Number(amount || 0).toLocaleString()} บาท จาก บัญชี xxx-x-xx123-x เข้าบัญชี 099-614-4478
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                background: "linear-gradient(135deg, #06c755 0%, #05a346 100%)",
                border: "none",
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>⏳ {lang === "en" ? "Processing & Matching..." : "กำลังส่งและจับคู่ยอดเงิน..."}</>
              ) : (
                <>🚀 {lang === "en" ? "Simulate Notification & Match" : "ส่งข้อมูลจำลองและจับคู่บิลทันที"}</>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Recent Match Logs */}
        {activeTab === "logs" && (
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {recentLogs.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--ink-muted)", padding: 20, fontSize: 13 }}>
                {lang === "en" ? "No notification match logs yet" : "ยังไม่มีประวัติการจับคู่"}
              </div>
            ) : (
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>วันเวลา</th>
                    <th>ยอดเงิน</th>
                    <th>ผลลัพธ์</th>
                    <th>ห้องที่จับคู่</th>
                    <th>รหัสแจ้งเตือน</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toLocaleTimeString("th-TH")}
                      </td>
                      <td style={{ fontWeight: 700 }}>฿{Number(log.amount).toLocaleString()}</td>
                      <td>
                        {log.match_status === "PAID" && (
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                            ✓ PAID
                          </span>
                        )}
                        {log.match_status === "MANUAL_REVIEW" && (
                          <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                            ⚠ REVIEW
                          </span>
                        )}
                        {log.match_status === "duplicate" && (
                          <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                            DUPLICATE
                          </span>
                        )}
                      </td>
                      <td>{log.room_number ? `ห้อง ${log.room_number}` : "-"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 10.5, color: "var(--ink-muted)" }}>
                        {log.notification_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Live Simulation Result Display */}
        {result && (
          <div
            style={{
              borderRadius: 10,
              padding: "14px 18px",
              marginTop: 6,
              border:
                result.status === "PAID"
                  ? "1.5px solid #86efac"
                  : result.status === "duplicate"
                  ? "1.5px solid #93c5fd"
                  : "1.5px solid #fde68a",
              background:
                result.status === "PAID"
                  ? "#ecfdf5"
                  : result.status === "duplicate"
                  ? "#eff6ff"
                  : "#fffbeb",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>
                  {result.status === "PAID" ? "✅" : result.status === "duplicate" ? "🛡️" : "⚠️"}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color:
                        result.status === "PAID"
                          ? "#065f46"
                          : result.status === "duplicate"
                          ? "#1e40af"
                          : "#92400e",
                    }}
                  >
                    ผลการประมวลผล: {result.status}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-primary)", marginTop: 2 }}>
                    {result.message}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background:
                    result.status === "PAID"
                      ? "#dcfce7"
                      : result.status === "duplicate"
                      ? "#dbeafe"
                      : "#fef3c7",
                  color:
                    result.status === "PAID"
                      ? "#15803d"
                      : result.status === "duplicate"
                      ? "#1d4ed8"
                      : "#b45309",
                }}
              >
                {result.status}
              </div>
            </div>

            {result.status === "PAID" && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #a7f3d0", fontSize: 12.5, color: "#047857", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>🏠 ห้อง: <strong>{result.room_number || "-"}</strong></span>
                <span>👤 ผู้เช่า: <strong>{result.tenant_name || "-"}</strong></span>
                <span>📅 งวด: <strong>{result.period || "-"}</strong></span>
                <span>💰 ยอดที่จับคู่: <strong>฿{Number(result.amount).toLocaleString()}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Windows Listener Info Footer */}
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-muted)",
            borderTop: "1px solid var(--border)",
            paddingTop: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            🖥️ <strong>Windows Desktop Listener:</strong> โฟลเดอร์ <code>payment-listener</code> (สคริปต์ <code>run_listener.bat</code> พร้อมใช้งาน)
          </span>
          <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
            {lang === "en" ? "Close" : "ปิดหน้าต่าง"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
