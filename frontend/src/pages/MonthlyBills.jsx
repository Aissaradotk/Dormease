import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import BillSlipModal from "../components/BillSlipModal";
import SlipModal from "../components/SlipModal";
import PaymentSimulatorModal from "../components/PaymentSimulatorModal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    pageTitle: "รายงานค่าใช้จ่ายประจำเดือน (ค่าน้ำ-ค่าไฟ-ค่าห้อง)",
    pageSubtitle: "คำนวณ ออกบิลค่าใช้จ่ายรายห้อง และตรวจสอบสลิปการโอนเงินของลูกบ้าน",
    periodLabel: "งวดประจำเดือน:",
    btnSaveAll: "💾 บันทึกทุกห้อง",
    savingAll: "กำลังบันทึก...",
    statTotalRooms: "ห้องพักทั้งหมด",
    statTotalBilled: "ยอดรวมบิลทั้งสิ้น",
    statPaid: "ชำระแล้ว",
    statUnpaid: "ค้างชำระ",
    searchPlaceholder: "🔍 ค้นหาหมายเลขห้อง หรือ ชื่อผู้เช่า...",
    clearSearch: "✕ ล้างการค้นหา",
    loading: "กำลังโหลดข้อมูลบิล...",
    thRoom: "ห้อง",
    thTenant: "ผู้เช่า",
    thRoomPrice: "ค่าห้อง (฿)",
    thWater: "ค่าน้ำ (฿)",
    thElectric: "ค่าไฟ (฿)",
    thOther: "ค่าอื่นๆ (฿)",
    thTotal: "ยอดรวม (฿)",
    thStatus: "สถานะ",
    thSlip: "สลิปที่แนบ",
    thActions: "การจัดการ",
    emptySearch: "ไม่พบห้องที่ตรงกับการค้นหา",
    emptyRooms: "ยังไม่มีข้อมูลห้องพัก",
    vacant: "ห้องว่าง",
    paid: "✓ ชำระแล้ว",
    pendingReview: "🟡 รอตรวจสอบ",
    slipRejected: "✕ สลิปไม่ผ่าน",
    unpaid: "● ยังไม่ชำระ",
    viewSlip: "ดูสลิป",
    noSlip: "- ยังไม่แนบ -",
    btnInvoice: "📄 ใบแจ้งหนี้",
    btnSaveRow: "💾 บันทึก",
    btnSaving: "...",
    btnRandomDecimals: "🎲 สุ่มทศนิยมไม่ซ้ำ (<1 ฿)",
    btnResetDecimals: "↺ ล้างทศนิยม (.00)",
    btnNotifyAll: "📢 แจ้งบิลทุกลูกค้า",
    btnNotifyRow: "🔔 แจ้งบิล",
    btnNotifying: "กำลังแจ้ง...",
    tooltipRandom: "สุ่มเศษสตางค์ 0.01 - 0.99 ฿ ให้แต่ละบิลไม่ซ้ำกัน เพื่อตรวจจับยอดเงินโอนอัตโนมัติ",
    tooltipReset: "ล้างเศษทศนิยมคืนค่าเป็นจำนวนเต็ม (.00)",
    tooltipNotifyAll: "ส่งแจ้งเตือนบิลยอดเงินประจำงวดนี้ไปยังผู้เช่าทุกห้องที่ยังไม่ชำระเงิน",
  },
  en: {
    pageTitle: "Monthly Expense Report (Rent & Utilities)",
    pageSubtitle: "Calculate and generate monthly room bills, and verify tenant payment slips",
    periodLabel: "Billing Period:",
    btnSaveAll: "💾 Save All Rooms",
    savingAll: "Saving...",
    statTotalRooms: "Total Rooms",
    statTotalBilled: "Total Invoiced",
    statPaid: "Paid",
    statUnpaid: "Outstanding",
    searchPlaceholder: "🔍 Search room number or tenant name...",
    clearSearch: "✕ Clear Search",
    loading: "Loading bills data...",
    thRoom: "Room",
    thTenant: "Tenant",
    thRoomPrice: "Rent (฿)",
    thWater: "Water (฿)",
    thElectric: "Electric (฿)",
    thOther: "Other (฿)",
    thTotal: "Total (฿)",
    thStatus: "Status",
    thSlip: "Attached Slip",
    thActions: "Actions",
    emptySearch: "No matching rooms found",
    emptyRooms: "No room data available",
    vacant: "Vacant",
    paid: "✓ Paid",
    pendingReview: "🟡 Pending Review",
    slipRejected: "✕ Slip Rejected",
    unpaid: "● Unpaid",
    viewSlip: "View Slip",
    noSlip: "- None -",
    btnInvoice: "📄 Invoice",
    btnSaveRow: "💾 Save",
    btnSaving: "...",
    btnRandomDecimals: "🎲 Random Decimals (<1 ฿)",
    btnResetDecimals: "↺ Reset Decimals (.00)",
    btnNotifyAll: "📢 Notify All Tenants",
    btnNotifyRow: "🔔 Notify Bill",
    btnNotifying: "Sending...",
    tooltipRandom: "Randomize unique decimals 0.01 - 0.99 THB for auto payment reconciliation",
    tooltipReset: "Reset decimals back to .00",
    tooltipNotifyAll: "Send bill notifications to all unpaid tenants",
  },
};

export default function MonthlyBills() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [period, setPeriod] = useState(currentMonth);
  const [data, setData] = useState({ rooms: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRows, setEditingRows] = useState({});
  const [dirtyRooms, setDirtyRooms] = useState(new Set());
  const dirtyRoomsRef = useRef(new Set());
  const [toastMessage, setToastMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBillForSlip, setSelectedBillForSlip] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [approving, setApproving] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // 'randomize' | 'reset' | 'notifyAll' | null
  const [notifyingRoomId, setNotifyingRoomId] = useState(null);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }

  // แปลงตัวเลขให้ไม่มี .00 รกตา เพื่อให้พิมพ์แก้ไขได้ทันที
  function cleanVal(val) {
    if (val == null || val === "") return "";
    const num = Number(val);
    return isNaN(num) ? "" : String(num);
  }

  async function loadBills(m, isSilent = false) {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get(`/bills/monthly?period=${m || period}`);
      
      // กรองห้องให้มีเพียง 1 รายการต่อ 1 room_id ป้องกันแถวซ้ำอย่างเด็ดขาด
      const uniqueRooms = [];
      const seenRoomIds = new Set();
      (res.rooms || []).forEach((r) => {
        if (!seenRoomIds.has(r.room_id)) {
          seenRoomIds.add(r.room_id);
          uniqueRooms.push(r);
        }
      });
      setData({ ...res, rooms: uniqueRooms });

      // เตรียม state สำหรับแก้ไขแต่ละแถว (ไม่ล้างค่าแถวที่ผู้ใช้กำลังพิมพ์แก้ไขอยู่)
      setEditingRows((prev) => {
        const next = { ...prev };
        uniqueRooms.forEach((r) => {
          // ถ้าห้องนี้อยู่ใน dirtyRoomsRef (ผู้ใช้กำลังพิมพ์อยู่) ห้ามเขียนทับตัวเลขเด็ดขาด!
          if (dirtyRoomsRef.current.has(r.room_id) && next[r.room_id]) {
            next[r.room_id].status = r.bill_status;
            return;
          }

          next[r.room_id] = {
            room_price: cleanVal(r.room_price),
            water_price: cleanVal(r.water_price),
            electric_price: cleanVal(r.electric_price),
            other_fees: cleanVal(r.other_fees),
            status: r.bill_status,
          };
        });
        return next;
      });
    } catch (err) {
      if (!isSilent) setError(err.message);
    }
    if (!isSilent) setLoading(false);
  }

  useEffect(() => {
    loadBills(period);

    // Auto-reload on window focus & periodic silent polling (เฉพาะเมื่อไม่มีการพิมพ์ค้างไว้)
    const onFocus = () => {
      if (dirtyRoomsRef.current.size === 0) {
        loadBills(period, true);
      }
    };
    window.addEventListener("focus", onFocus);

    const interval = setInterval(() => {
      const activeTag = document.activeElement ? document.activeElement.tagName : "";
      const isInputActive = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
      if (document.visibilityState === "visible" && !isInputActive && dirtyRoomsRef.current.size === 0) {
        loadBills(period, true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [period]); // สังเกต: พึ่งพาเฉพาะ period เท่านั้น การพิมพ์ตัวเลขจะไม่ทำให้ useEffect รันใหม่เด็ดขาด!

  function handleChange(roomId, field, val) {
    dirtyRoomsRef.current.add(roomId);
    setDirtyRooms(new Set(dirtyRoomsRef.current));
    setEditingRows((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: val,
      },
    }));
  }

  async function handleSaveRow(room) {
    setSavingId(room.room_id);
    const row = editingRows[room.room_id] || {};
    try {
      await api.post("/bills/save", {
        room_id: room.room_id,
        tenant_id: room.tenant_id,
        period,
        room_price: row.room_price,
        water_price: row.water_price,
        electric_price: row.electric_price,
        other_fees: row.other_fees,
        status: row.status,
      });

      dirtyRoomsRef.current.delete(room.room_id);
      setDirtyRooms(new Set(dirtyRoomsRef.current));

      const rPrice = Number(row.room_price ?? room.room_price) || 0;
      const wPrice = Number(row.water_price ?? room.water_price) || 0;
      const ePrice = Number(row.electric_price ?? room.electric_price) || 0;
      const oFees = Number(row.other_fees ?? room.other_fees) || 0;
      const rowTotal = rPrice + wPrice + ePrice + oFees;

      showToast(`✓ บันทึกบิลห้อง ${room.room_number} สำเร็จ (${rowTotal.toLocaleString()} บาท)`);
      loadBills(period, true);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    }
    setSavingId(null);
  }

  async function handleSaveAll() {
    if (!confirm(`ยืนยันบันทึกบิลทุกห้องสำหรับงวด ${period}?`)) return;
    setSavingId("all");
    try {
      for (const room of data.rooms) {
        const row = editingRows[room.room_id] || {};
        await api.post("/bills/save", {
          room_id: room.room_id,
          tenant_id: room.tenant_id,
          period,
          room_price: row.room_price,
          water_price: row.water_price,
          electric_price: row.electric_price,
          other_fees: row.other_fees,
          status: row.status,
        });
      }
      dirtyRoomsRef.current.clear();
      setDirtyRooms(new Set());
      showToast("✓ บันทึกบิลทุกห้องเรียบร้อยแล้ว!");
      loadBills(period);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    }
    setSavingId(null);
  }

  // สุ่มทศนิยมเศษสตางค์ไม่ซ้ำกัน (< 1 ฿) ให้ทุกบิลที่ยังไม่ชำระ
  async function handleRandomizeDecimals() {
    if (!confirm(lang === "en"
      ? `Randomize unique satang decimals (0.01 - 0.99 THB) for unpaid bills in period ${period}?\n(Each bill will increase by no more than 1 baht, enabling instant automated payment matching)`
      : `ต้องการสุ่มเศษสตางค์ทศนิยม (0.01 - 0.99 บาท ไม่ซ้ำกัน) ให้บิลที่ค้างชำระในงวด ${period} ใช่หรือไม่?\n(แต่ละห้องจะมียอดเพิ่มขึ้นไม่เกิน 1 บาท ช่วยให้ระบบตรวจจับยอดเงินโอนและอนุมัติบิลอัตโนมัติทันที)`
    )) return;

    setLoadingAction("randomize");
    try {
      const res = await api.post("/bills/randomize-decimals", { period });
      dirtyRoomsRef.current.clear();
      setDirtyRooms(new Set());
      showToast(`✓ ${res.message || "สุ่มทศนิยมสำเร็จ"}`);
      await loadBills(period);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการสุ่มทศนิยม: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  }

  // ล้างเศษทศนิยมคืนค่าเป็นจำนวนเต็ม (.00)
  async function handleResetDecimals() {
    if (!confirm(lang === "en"
      ? `Reset satang decimals back to integers (.00) for unpaid bills in period ${period}?`
      : `ต้องการล้างเศษทศนิยมของบิลที่ค้างชำระในงวด ${period} คืนค่าเป็นจำนวนเต็ม (.00) ใช่หรือไม่?`
    )) return;

    setLoadingAction("reset");
    try {
      const res = await api.post("/bills/reset-decimals", { period });
      dirtyRoomsRef.current.clear();
      setDirtyRooms(new Set());
      showToast(`✓ ${res.message || "ล้างทศนิยมสำเร็จ"}`);
      await loadBills(period);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการล้างทศนิยม: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  }

  // ส่งแจ้งเตือนบิลไปยังผู้เช่าทุกห้องที่ยังไม่ชำระ
  async function handleNotifyAll() {
    if (!confirm(lang === "en"
      ? `Confirm sending bill notification for period ${period} to all unpaid tenants?`
      : `ยืนยันการส่งการแจ้งเตือนบิลประจำงวด ${period} ไปยังผู้เช่าทุกห้องที่ยังไม่ชำระเงิน?`
    )) return;

    setLoadingAction("notifyAll");
    try {
      const res = await api.post("/bills/notify", { period, notify_all: true });
      showToast(`✓ ${res.message || "ส่งแจ้งเตือนบิลสำเร็จ"}`);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการส่งแจ้งเตือน: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  }

  // ส่งแจ้งเตือนบิลรายห้อง
  async function handleNotifyRow(room) {
    setNotifyingRoomId(room.room_id);
    try {
      const res = await api.post("/bills/notify", {
        room_id: room.room_id,
        bill_id: room.bill_id,
        period,
      });
      showToast(`✓ แจ้งเตือนบิลห้อง ${room.room_number} สำเร็จเรียบร้อยแล้ว`);
    } catch (err) {
      alert(`เกิดข้อผิดพลาดในการแจ้งเตือนห้อง ${room.room_number}: ` + err.message);
    } finally {
      setNotifyingRoomId(null);
    }
  }

  // อนุมัติการชำระเงินจากหน้าดูสลิป
  async function handleApproveFromModal(room, row) {
    setApproving(true);
    try {
      if (room.bill_id) {
        await api.post("/bills/approve", { bill_id: room.bill_id });
      } else {
        await api.post("/bills/approve", { room_id: room.room_id, period });
      }
      setViewingSlip(null);
      alert(`ยืนยันการชำระเงินห้อง ${room.room_number} เรียบร้อยแล้ว!`);
      loadBills(period);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอนุมัติ: " + err.message);
    } finally {
      setApproving(false);
    }
  }

  // ปฏิเสธสลิปจากหน้าดูสลิป
  async function handleRejectFromModal(room, reason) {
    try {
      if (room.bill_id) {
        await api.post("/bills/reject", { bill_id: room.bill_id, reason });
      } else {
        await api.post("/bills/save", {
          room_id: room.room_id,
          tenant_id: room.tenant_id,
          period,
          status: "rejected",
        });
      }
      setViewingSlip(null);
      alert(`ปฏิเสธสลิปห้อง ${room.room_number} เรียบร้อยแล้ว`);
      loadBills(period);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการปฏิเสธ: " + err.message);
    }
  }

  // สลับสถานะชำระเงินอย่างรวดเร็ว (Toggle Status & Sync DB)
  async function handleToggleStatus(r) {
    const currentStatus = (editingRows[r.room_id]?.status ?? r.bill_status ?? "unpaid").toLowerCase();
    const nextStatus = (currentStatus === "paid" || currentStatus === "approved") ? "unpaid" : "paid";

    handleChange(r.room_id, "status", nextStatus);

    if (r.bill_id) {
      try {
        await api.put(`/bills/${r.bill_id}/status`, { status: nextStatus });
        loadBills(period);
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: " + err.message);
      }
    } else {
      // ถ้ายังไม่มีบิล ให้บันทึกบิลใหม่
      const row = editingRows[r.room_id] || {};
      try {
        await api.post("/bills/save", {
          room_id: r.room_id,
          tenant_id: r.tenant_id,
          period,
          room_price: row.room_price ?? r.room_price,
          water_price: row.water_price ?? r.water_price,
          electric_price: row.electric_price ?? r.electric_price,
          other_fees: row.other_fees ?? r.other_fees,
          status: nextStatus,
        });
        loadBills(period);
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
      }
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t.pageTitle}</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            {t.pageSubtitle}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ margin: 0, fontWeight: "bold" }}>{t.periodLabel}</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: 160 }}
          />

          {/* สุ่มเศษสตางค์ทศนิยมไม่ซ้ำกัน */}
          <button
            type="button"
            onClick={handleRandomizeDecimals}
            disabled={loadingAction !== null || loading}
            title={t.tooltipRandom}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 8,
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: loadingAction === "randomize" ? 0.7 : 1,
            }}
          >
            <span>{loadingAction === "randomize" ? "⏳" : "🎲"}</span>
            <span>{loadingAction === "randomize" ? (lang === "en" ? "Randomizing..." : "กำลังสุ่ม...") : t.btnRandomDecimals}</span>
          </button>

          {/* ส่งแจ้งเตือนบิลไปยังผู้เช่าทุกห้อง */}
          <button
            type="button"
            onClick={handleNotifyAll}
            disabled={loadingAction !== null || loading}
            title={t.tooltipNotifyAll}
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#ffffff",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 8,
              boxShadow: "0 2px 6px rgba(217, 119, 6, 0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: loadingAction === "notifyAll" ? 0.7 : 1,
            }}
          >
            <span>{loadingAction === "notifyAll" ? "⏳" : "📢"}</span>
            <span>{loadingAction === "notifyAll" ? (lang === "en" ? "Notifying..." : "กำลังแจ้ง...") : t.btnNotifyAll}</span>
          </button>

          {/* ล้างเศษทศนิยม (.00) */}
          <button
            type="button"
            onClick={handleResetDecimals}
            disabled={loadingAction !== null || loading}
            title={t.tooltipReset}
            style={{
              background: "#ffffff",
              color: "#4b5563",
              border: "1.5px solid #d1d5db",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontWeight: 600,
              padding: "8px 10px",
              borderRadius: 8,
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: loadingAction === "reset" ? 0.7 : 1,
            }}
          >
            <span>{loadingAction === "reset" ? "⏳" : "↺"}</span>
            <span>{loadingAction === "reset" ? (lang === "en" ? "Resetting..." : "กำลังล้าง...") : t.btnResetDecimals}</span>
          </button>

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
              padding: "8px 12px",
              borderRadius: 8,
              boxShadow: "0 2px 6px rgba(6, 199, 85, 0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span>🧪</span>
            <span>{lang === "en" ? "Simulator" : "จำลองเงินเข้า"}</span>
          </button>

          <button
            className="btn-primary"
            onClick={handleSaveAll}
            disabled={savingId === "all" || loading}
          >
            {savingId === "all" ? t.savingAll : t.btnSaveAll}
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

      {/* การ์ดสรุปยอดรวมประจำงวดเดือน */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="num">{data.summary?.totalRooms || 0}</div>
          <div className="lbl">{t.statTotalRooms}</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: "#2563eb" }}>
            {Number(data.summary?.totalBilled || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
          </div>
          <div className="lbl">{t.statTotalBilled}</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: "#16a34a" }}>
            {Number(data.summary?.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
          </div>
          <div className="lbl">{t.statPaid}</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: "#dc2626" }}>
            {Number(data.summary?.totalUnpaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
          </div>
          <div className="lbl">{t.statUnpaid}</div>
        </div>
      </div>

      {/* ค้นหาห้อง / ผู้เช่า */}
      <div className="table-filter-bar" style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div className="search-input-wrap" style={{ flex: 1, maxWidth: 360 }}>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-search"
            style={{ width: "100%" }}
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setSearchQuery("")}
          >
            {t.clearSearch}
          </button>
        )}
      </div>

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table className="data-table dense-table">
            <thead>
              <tr>
                <th>{t.thRoom}</th>
                <th>{t.thTenant}</th>
                <th style={{ textAlign: "center" }}>{t.thRoomPrice}</th>
                <th style={{ textAlign: "center" }}>{t.thWater}</th>
                <th style={{ textAlign: "center" }}>{t.thElectric}</th>
                <th style={{ textAlign: "center" }}>{t.thOther}</th>
                <th>{t.thTotal}</th>
                <th>{t.thStatus}</th>
                <th>{t.thSlip}</th>
                <th>{t.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredRooms = (data.rooms || []).filter((r) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  const matchRoom = String(r.room_number || "").toLowerCase().includes(q);
                  const matchTenant = String(r.tenant_name || "").toLowerCase().includes(q);
                  return matchRoom || matchTenant;
                });

                if (filteredRooms.length === 0) {
                  return (
                    <tr>
                      <td colSpan="10" className="empty-cell" style={{ textAlign: "center", padding: 24, color: "#888" }}>
                        {searchQuery ? `${t.emptySearch} "${searchQuery}"` : t.emptyRooms}
                      </td>
                    </tr>
                  );
                }

                return filteredRooms.map((r) => {
                  const row = editingRows[r.room_id] || {};
                  const rPrice = Number(row.room_price ?? r.room_price) || 0;
                  const wPrice = Number(row.water_price ?? r.water_price) || 0;
                  const ePrice = Number(row.electric_price ?? r.electric_price) || 0;
                  const oFees = Number(row.other_fees ?? r.other_fees) || 0;
                  const rowTotal = Number((rPrice + wPrice + ePrice + oFees).toFixed(2));
                  const isPaid = row.status === "paid";
                  const hasSlip = Boolean(r.slip_image);

                  return (
                    <tr key={r.room_id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <b>{t.thRoom} {r.room_number}</b>
                        {dirtyRooms.has(r.room_id) && (
                          <span style={{ marginLeft: 6, fontSize: 10.5, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                            *แก้ไข
                          </span>
                        )}
                        <div style={{ fontSize: 11, color: "#666" }}>{r.room_type}</div>
                      </td>
                      <td>
                        {r.tenant_name ? (
                          <div>
                            <div><b>{r.tenant_name}</b></div>
                            <div style={{ fontSize: 11, color: "#666" }}>{r.tenant_phone || "-"}</div>
                          </div>
                        ) : (
                          <span className="pill" style={{ background: "#eee", color: "#666" }}>
                            {t.vacant}
                          </span>
                        )}
                      </td>
                      <td style={{ width: 80, textAlign: "center" }}>
                        <input
                          type="number"
                          step="any"
                          className="table-num-input"
                          value={row.room_price ?? ""}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleChange(r.room_id, "room_price", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveRow(r);
                            }
                          }}
                        />
                      </td>
                      <td style={{ width: 70, textAlign: "center" }}>
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          className="table-num-input"
                          value={row.water_price ?? ""}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleChange(r.room_id, "water_price", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveRow(r);
                            }
                          }}
                        />
                      </td>
                      <td style={{ width: 70, textAlign: "center" }}>
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          className="table-num-input"
                          value={row.electric_price ?? ""}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleChange(r.room_id, "electric_price", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveRow(r);
                            }
                          }}
                        />
                      </td>
                      <td style={{ width: 70, textAlign: "center" }}>
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          className="table-num-input"
                          value={row.other_fees ?? ""}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleChange(r.room_id, "other_fees", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveRow(r);
                            }
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: "bold", fontSize: 15, color: "#1f2937", whiteSpace: "nowrap" }}>
                        {rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                        {(rowTotal % 1 !== 0) && (
                          <span
                            title={lang === "en" ? "Unique satang decimal for automatic payment reconciliation" : "เศษสตางค์ไม่ซ้ำเพื่อระบุตัวตนการโอนอัตโนมัติ"}
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
                            .{((rowTotal % 1).toFixed(2)).slice(2)} ฿
                          </span>
                        )}
                      </td>
                      <td>
                        {(() => {
                          const s = (row.status ?? r.bill_status ?? "unpaid").toLowerCase();
                          if (s === "paid" || s === "approved") {
                            return (
                              <button
                                className="pill clickable available"
                                onClick={() => handleToggleStatus(r)}
                                style={{ fontWeight: 700 }}
                              >
                                {t.paid}
                              </button>
                            );
                          }
                          if (s === "waiting_review" || s === "submitted") {
                            return (
                              <button
                                className="pill clickable"
                                style={{ background: "#fef3c7", color: "#92400e", border: "1.5px solid #fde68a", cursor: "pointer", fontWeight: 700 }}
                                onClick={() => handleToggleStatus(r)}
                              >
                                {t.pendingReview}
                              </button>
                            );
                          }
                          if (s === "rejected") {
                            return (
                              <button
                                className="pill clickable occupied"
                                style={{ background: "#fee2e2", color: "#991b1b", border: "1.5px solid #fca5a5", cursor: "pointer", fontWeight: 700 }}
                                onClick={() => handleToggleStatus(r)}
                              >
                                {t.slipRejected}
                              </button>
                            );
                          }
                          return (
                            <button
                              className="pill clickable occupied"
                              onClick={() => handleToggleStatus(r)}
                              style={{ fontWeight: 700 }}
                            >
                              {t.unpaid}
                            </button>
                          );
                        })()}
                      </td>
                      {/* คอลัมน์สลิปที่แนบมา */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        {hasSlip ? (
                          <button
                            type="button"
                            className="btn-sm"
                            onClick={() =>
                              setViewingSlip({
                                slipImage: r.slip_image,
                                details: {
                                  room_number: r.room_number,
                                  tenant_name: r.tenant_name,
                                  period,
                                  amount: rowTotal,
                                },
                                room: r,
                                row,
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
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() =>
                              setSelectedBillForSlip({
                                ...r,
                                period,
                                room_price: row.room_price ?? r.room_price,
                                water_price: row.water_price ?? r.water_price,
                                electric_price: row.electric_price ?? r.electric_price,
                                other_fees: row.other_fees ?? r.other_fees,
                                status: row.status ?? r.bill_status,
                              })
                            }
                          >
                            {t.btnInvoice}
                          </button>
                          <button
                            type="button"
                            className="btn-sm"
                            onClick={() => handleNotifyRow(r)}
                            disabled={notifyingRoomId === r.room_id}
                            title={lang === "en" ? "Send bill notification to this tenant" : "ส่งการแจ้งเตือนบิลนี้ไปยังผู้เช่า"}
                            style={{
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1.5px solid #bfdbfe",
                              fontWeight: 700,
                              borderRadius: 6,
                              padding: "4px 8px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span>{notifyingRoomId === r.room_id ? "⏳" : "🔔"}</span>
                            <span>{notifyingRoomId === r.room_id ? t.btnNotifying : t.btnNotifyRow}</span>
                          </button>
                          <button
                            className="btn-primary btn-sm"
                            disabled={savingId === r.room_id}
                            onClick={() => handleSaveRow(r)}
                            style={dirtyRooms.has(r.room_id) ? {
                              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                              boxShadow: "0 2px 8px rgba(22, 163, 74, 0.35)",
                              fontWeight: 800,
                            } : {}}
                            title={dirtyRooms.has(r.room_id) ? "มีการแก้ไขที่ยังไม่ได้บันทึก (กด Enter หรือคลิกเพื่อบันทึก)" : ""}
                          >
                            {savingId === r.room_id ? t.btnSaving : (dirtyRooms.has(r.room_id) ? "💾 บันทึก *" : t.btnSaveRow)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 99999,
            background: "linear-gradient(135deg, #0f5144 0%, #166534 100%)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
            fontWeight: 700,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bill Slip Modal (Official Invoice) */}
      {selectedBillForSlip && (
        <BillSlipModal
          bill={selectedBillForSlip}
          onClose={() => setSelectedBillForSlip(null)}
          onBillUpdated={(updated) => {
            loadBills(period, true);
          }}
          canEdit={true}
        />
      )}

      {/* Modal ดูสลิปที่ลูกบ้านแนบมา และสามารถอนุมัติการชำระได้ทันที */}
      {viewingSlip && (
        <SlipModal
          slipImage={viewingSlip.slipImage}
          details={viewingSlip.details}
          title={`ตรวจสอบสลิปโอนเงิน ห้อง ${viewingSlip.details?.room_number || ""} งวด ${viewingSlip.details?.period || ""}`}
          onApprove={() => handleApproveFromModal(viewingSlip.room, viewingSlip.row)}
          onReject={(reason) => handleRejectFromModal(viewingSlip.room, reason)}
          approving={approving}
          onClose={() => setViewingSlip(null)}
        />
      )}

      {/* Modal ระบบจำลองตรวจเงินเข้าอัตโนมัติ (LINE Connext) */}
      <PaymentSimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        onPaymentMatched={() => loadBills(period)}
        pendingPayments={(data.rooms || [])
          .filter((r) => {
            const s = (editingRows[r.room_id]?.status ?? r.bill_status ?? "unpaid").toLowerCase();
            return s === "unpaid" || s === "waiting_review";
          })
          .map((r) => {
            const row = editingRows[r.room_id] || {};
            const total =
              (Number(row.room_price ?? r.room_price) || 0) +
              (Number(row.water_price ?? r.water_price) || 0) +
              (Number(row.electric_price ?? r.electric_price) || 0) +
              (Number(row.other_fees ?? r.other_fees) || 0);
            return {
              id: r.bill_id || r.room_id,
              amount: total || r.total_amount || 0,
              period: period,
              tenants: {
                full_name: r.tenant_name || "ผู้เช่า",
                rooms: { room_number: r.room_number },
              },
            };
          })}
      />
    </div>
  );
}
