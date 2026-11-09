import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import BillSlipModal from "../components/BillSlipModal";
import SlipModal from "../components/SlipModal";
import P2PUploadModal from "../components/P2PUploadModal";
import PageHeaderTabs from "../components/PageHeaderTabs";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    page_title: "การชำระเงินและแนบสลิป (Payments & Slips)",
    page_subtitle: "ชำระค่าเช่าผ่านระบบพร้อมเพย์ (ยอดล็อกตามบิล) และแนบสลิปผ่านคอม หรือส่งตรงจากมือถือแบบ P2P",
    loading: "กำลังโหลดข้อมูลการชำระเงิน...",
    sec_active_bills: "บิลค่าใช้จ่ายประจำงวด (ยอดเงินล็อกตามบิล)",
    period_title: (period, room) => `งวดประจำเดือน ${period} (ห้อง ${room})`,
    room_type_lbl: "ประเภทห้อง:",
    default_room_type: "ห้องมาตรฐาน",
    status_paid: "✓ ชำระแล้ว",
    status_waiting: "🟡 รอตรวจสอบ",
    status_rejected: "✕ สลิปไม่ผ่าน",
    status_unpaid: "● รอชำระเงิน",
    banner_paid_title: "การชำระเงินงวดนี้เสร็จสมบูรณ์เรียบร้อยแล้ว",
    banner_paid_verified: (date) => `ตรวจสอบและอนุมัติเมื่อ: ${date}`,
    banner_paid_by: (name) => ` (โดย ${name})`,
    banner_paid_approved: "ได้รับการอนุมัติเรียบร้อยแล้ว",
    banner_waiting_title: "แนบหลักฐานการโอนเงินแล้ว — อยู่ระหว่างรอเจ้าของหอพักตรวจสอบ",
    banner_waiting_desc: (amt) => `ยอดเงินตามบิล ${amt} บาท เมื่อเจ้าของหอพักตรวจสอบยอดเงินถูกต้อง สถานะจะเปลี่ยนเป็น "ชำระแล้ว" โดยอัตโนมัติ`,
    banner_rejected_title: (reason) => `สลิปการโอนเงินไม่ผ่านการตรวจสอบ: ${reason}`,
    banner_rejected_desc: (amt) => `กรุณาตรวจสอบยอดเงินตามบิล (${amt} บาท) แล้วแนบสลิปใหม่อีกครั้ง`,
    rent_lbl: "ค่าเช่าห้องพัก",
    water_lbl: "ค่าน้ำประปา",
    electric_lbl: "ค่าไฟฟ้า",
    other_fees_lbl: "ค่าส่วนกลาง/อื่นๆ",
    step1_title: "ขั้นตอนที่ 1: สแกนชำระเงินผ่านพร้อมเพย์ (PromptPay)",
    locked_badge: (amt) => `🔒 ระบบล็อกยอดเงิน ${amt} ฿`,
    pp_badge: "PromptPay พร้อมเพย์",
    pp_scan_hint: "สแกนจ่ายผ่านแอปธนาคาร",
    acc_name_lbl: "ชื่อบัญชี:",
    pp_num_lbl: "เบอร์พร้อมเพย์:",
    btn_copied: "✓ คัดลอกแล้ว",
    btn_copy: "📋 คัดลอกเบอร์",
    transfer_amt_lbl: "ยอดเงินที่ต้องโอน:",
    baht: "บาท",
    auto_amt_hint: (amt) => `ℹ️ เมื่อสแกน QR Code แอปธนาคารจะขึ้นยอดเงิน ${amt} บาท ให้โดยอัตโนมัติ ไม่ต้องกรอกเอง`,
    step2_title: "ขั้นตอนที่ 2: แนบสลิปการโอนเงิน (Attach Payment Slip)",
    btn_p2p: "ส่งสลิปผ่านมือถือ (P2P)",
    badge_attached: "✓ แนบสลิปแล้ว",
    slip_attached_title: "แนบหลักฐานการโอนเงินแล้ว",
    slip_attached_desc: "เจ้าของหอพักจะตรวจสอบยอดเงินและปรับสถานะเป็น \"ชำระแล้ว\" ให้ท่าน",
    btn_view_attached: "👁️ ดูสลิปที่แนบ",
    btn_replace_slip: "🔄 เปลี่ยนสลิปใหม่",
    slip_selected_title: "เลือกรูปภาพสลิปแล้ว พร้อมส่ง",
    slip_selected_desc: "กดปุ่ม \"ยืนยันส่งสลิป\" เพื่อส่งหลักฐานให้เจ้าของหอพัก",
    btn_confirm_slip: "📤 ยืนยันส่งสลิปโอนเงิน",
    btn_submitting_slip: "กำลังส่งสลิป...",
    btn_cancel: "✕ ยกเลิก",
    upload_box_title: "คลิกที่นี่เพื่อแนบรูปภาพสลิปจากคอมพิวเตอร์",
    upload_box_desc: "รองรับไฟล์รูปภาพ JPG, PNG จากแอปธนาคาร",
    upload_box_p2p: "⚡ หรือ สแกน QR Code ส่งจากโทรศัพท์มือถือ (P2P)",
    btn_view_receipt: "ดูใบเสร็จรับเงิน / พิมพ์",
    btn_view_invoice: "ดูใบแจ้งหนี้ / พิมพ์สลิป",
    btn_view_slip: "ดูสลิปที่แนบ",
    card_footer_paid: "✓ การชำระเงินได้รับการยืนยันและออกใบเสร็จเรียบร้อยแล้ว",
    card_footer_waiting: "⏳ แนบสลิปแล้ว เจ้าของหอจะตรวจสอบและอัปเดตสถานะให้ท่าน",
    card_footer_unpaid: "กรุณาชำระเงินตามยอดในบิลและแนบสลิปการโอนเงิน",
    no_active_bills_title: "คุณไม่มีบิลค้างชำระในขณะนี้",
    no_active_bills_desc: "ขอบคุณที่ชำระค่าบริการตรงเวลา ยอดค่าใช้จ่ายรอบถัดไปจะแสดงเมื่อเจ้าของหอพักออกบิลประจำเดือน",
    sec_history_title: "ประวัติการชำระเงินที่ผ่านมา (Payment History)",
    th_period: "งวดประจำเดือน",
    th_room: "ห้องพัก",
    th_amount: "จำนวนเงินที่ชำระ",
    th_paid_date: "วันที่ชำระ",
    th_status: "สถานะ",
    th_doc_slip: "เอกสาร / สลิป",
    status_paid_pill: "✓ ชำระเรียบร้อย",
    btn_slip_short: "📸 สลิป",
    btn_receipt_short: "📄 ใบเสร็จ",
    no_history: "ยังไม่มีประวัติการชำระเงิน",
    alert_image_only: "กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)",
    alert_slip_error: "เกิดข้อผิดพลาดในการแนบสลิป: ",
    success_attached_pc: (period) => `✓ แนบหลักฐานการโอนเงินงวด ${period} สำเร็จเรียบร้อยแล้ว สถานะเปลี่ยนเป็น "รอตรวจสอบ"`,
    success_attached_p2p: (period) => `✓ ได้รับและแนบสลิปผ่านมือถือ (P2P) งวด ${period} สำเร็จเรียบร้อยแล้ว! สถานะเปลี่ยนเป็น "รอตรวจสอบ"`,
  },
  en: {
    page_title: "Payments & Slips",
    page_subtitle: "Pay rent via PromptPay (locked bill amount) and attach transfer slip from PC or directly from mobile via P2P",
    loading: "Loading payment information...",
    sec_active_bills: "Active Billing Statement (Locked Amount)",
    period_title: (period, room) => `Billing Period ${period} (Room ${room})`,
    room_type_lbl: "Room Type:",
    default_room_type: "Standard Room",
    status_paid: "✓ Paid",
    status_waiting: "🟡 Awaiting Review",
    status_rejected: "✕ Rejected Slip",
    status_unpaid: "● Unpaid",
    banner_paid_title: "Payment for this period is complete and confirmed",
    banner_paid_verified: (date) => `Verified and approved on: ${date}`,
    banner_paid_by: (name) => ` (by ${name})`,
    banner_paid_approved: "Approved and verified",
    banner_waiting_title: "Payment slip attached — waiting for owner review",
    banner_waiting_desc: (amt) => `Bill amount: ${amt} THB. Once the owner verifies your payment, the status will automatically update to "Paid".`,
    banner_rejected_title: (reason) => `Payment slip rejected: ${reason}`,
    banner_rejected_desc: (amt) => `Please verify the billing amount (${amt} THB) and upload a new transfer slip.`,
    rent_lbl: "Room Rent",
    water_lbl: "Water Bill",
    electric_lbl: "Electricity Bill",
    other_fees_lbl: "Common / Other Fees",
    step1_title: "Step 1: Scan & Pay with PromptPay",
    locked_badge: (amt) => `🔒 System-locked Amount: ${amt} ฿`,
    pp_badge: "PromptPay",
    pp_scan_hint: "Scan with any Thai mobile banking app",
    acc_name_lbl: "Account Name:",
    pp_num_lbl: "PromptPay No.:",
    btn_copied: "✓ Copied",
    btn_copy: "📋 Copy Number",
    transfer_amt_lbl: "Amount to transfer:",
    baht: "THB",
    auto_amt_hint: (amt) => `ℹ️ Scanning this QR code will automatically load the exact amount (${amt} THB) in your banking app without typing.`,
    step2_title: "Step 2: Attach Payment Slip",
    btn_p2p: "Send via Mobile (P2P)",
    badge_attached: "✓ Slip Attached",
    slip_attached_title: "Transfer slip has been attached",
    slip_attached_desc: "The owner will inspect the slip and approve your payment shortly",
    btn_view_attached: "👁️ View Slip",
    btn_replace_slip: "🔄 Replace Slip",
    slip_selected_title: "Slip image selected and ready to submit",
    slip_selected_desc: "Click \"Confirm & Submit Slip\" to send proof of payment to the owner",
    btn_confirm_slip: "📤 Confirm & Submit Slip",
    btn_submitting_slip: "Submitting...",
    btn_cancel: "✕ Cancel",
    upload_box_title: "Click here to upload slip image from your computer",
    upload_box_desc: "Supports JPG, PNG images saved from banking apps",
    upload_box_p2p: "⚡ Or Scan QR Code to send from your mobile phone (P2P)",
    btn_view_receipt: "View Receipt / Print",
    btn_view_invoice: "View Invoice / Print",
    btn_view_slip: "View Slip",
    card_footer_paid: "✓ Payment confirmed and official receipt issued",
    card_footer_waiting: "⏳ Slip attached; owner will verify and update your status",
    card_footer_unpaid: "Please pay the amount on the bill and attach your transfer slip",
    no_active_bills_title: "You have no outstanding bills right now",
    no_active_bills_desc: "Thank you for paying on time! Next month's bill will appear when issued by the owner.",
    sec_history_title: "Payment History",
    th_period: "Billing Period",
    th_room: "Room",
    th_amount: "Amount Paid",
    th_paid_date: "Date Paid",
    th_status: "Status",
    th_doc_slip: "Docs / Slip",
    status_paid_pill: "✓ Paid",
    btn_slip_short: "📸 Slip",
    btn_receipt_short: "📄 Receipt",
    no_history: "No payment history found",
    alert_image_only: "Please select an image file only (JPG, PNG, WEBP)",
    alert_slip_error: "Error attaching slip: ",
    success_attached_pc: (period) => `✓ Transfer slip for period ${period} attached successfully! Status is now "Awaiting Review".`,
    success_attached_p2p: (period) => `✓ Transfer slip received via mobile (P2P) for period ${period}! Status is now "Awaiting Review".`,
  },
};

export default function TenantPayments() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [checkingBillId, setCheckingBillId] = useState(null);
  const [selectedBillForSlip, setSelectedBillForSlip] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [p2pBillModal, setP2pBillModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadingId, setUploadingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({}); // { [billId]: dataUrl }
  const fileInputRefs = useRef({});

  async function handleConfirmPaid(billId) {
    setCheckingBillId(billId);
    try {
      const res = await api.post("/bills/confirm-paid", { bill_id: billId });
      if (res && (res.status === "paid" || res.success)) {
        setSuccessMsg(lang === "en" ? "✓ Payment verified and approved successfully!" : "✓ ตรวจสอบยอดเงินสำเร็จ! อนุมัติการชำระเงินเรียบร้อยแล้ว");
        setTimeout(() => setSuccessMsg(""), 6000);
        await loadData(true);
      }
    } catch (err) {
      setError(err.message || (lang === "en" ? "Failed to verify payment" : "เกิดข้อผิดพลาดในการตรวจสอบยอดเงิน"));
      setTimeout(() => setError(""), 6000);
    } finally {
      setCheckingBillId(null);
    }
  }

  const PROMPTPAY_NUMBER = "0996144478";
  const PROMPTPAY_FORMATTED = "099-614-4478";
  const PROMPTPAY_NAME = "หอพัก DormEase (PromptPay)";

  async function loadData(isSilent = false) {
    if (!isSilent) setLoading(true);
    try {
      const [billsData, paymentsData] = await Promise.all([
        api.get("/bills/my").catch(() => []),
        api.get("/payments/me").catch(() => [])
      ]);
      setBills(billsData || []);
      setPayments(paymentsData || []);
    } catch (err) {
      if (!isSilent) setError(err.message);
    }
    if (!isSilent) setLoading(false);
  }

  useEffect(() => {
    loadData();

    const onFocus = () => loadData(true);
    window.addEventListener("focus", onFocus);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, []);

  function handleCopyPromptPay() {
    navigator.clipboard.writeText(PROMPTPAY_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // แปลงและบีบอัดรูปภาพให้เหมาะสมก่อนส่ง
  function handleFileChange(billId, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t.alert_image_only);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setSelectedFiles((prev) => ({ ...prev, [billId]: compressedDataUrl }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ส่งสลิปไปยัง Backend
  async function handleSubmitSlip(bill) {
    const slipData = selectedFiles[bill.id];
    if (!slipData) return;

    setUploadingId(bill.id);
    setError("");
    try {
      await api.post("/bills/attach-slip", {
        bill_id: bill.id,
        slip_image: slipData,
      });

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, slip_image: slipData, status: "waiting_review", bill_status: "waiting_review", reject_reason: null }
            : b
        )
      );

      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[bill.id];
        return copy;
      });

      setSuccessMsg(t.success_attached_pc(bill.period));
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err) {
      alert(t.alert_slip_error + err.message);
    } finally {
      setUploadingId(null);
    }
  }

  // รับสลิปที่ส่งมาจากมือถือผ่านระบบ P2P
  function handleP2PSlipReceived(billId, slipData, period) {
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? { ...b, slip_image: slipData, status: "waiting_review", bill_status: "waiting_review", reject_reason: null }
          : b
      )
    );
    setSuccessMsg(t.success_attached_p2p(period));
    setTimeout(() => setSuccessMsg(""), 6000);
  }

  function handleCancelFile(billId) {
    setSelectedFiles((prev) => {
      const copy = { ...prev };
      delete copy[billId];
      return copy;
    });
    if (fileInputRefs.current[billId]) {
      fileInputRefs.current[billId].value = "";
    }
  }

  function getBillStatusInfo(bill) {
    const rawStatus = (bill.status || bill.bill_status || "unpaid").toLowerCase();

    if (rawStatus === "paid" || rawStatus === "approved") {
      return {
        key: "paid",
        label: t.status_paid,
        color: "#15803d",
        bg: "#dcfce7",
        border: "#86efac",
        cardBorder: "#10b981",
      };
    }

    if (rawStatus === "waiting_review" || rawStatus === "submitted" || (bill.slip_image && rawStatus !== "rejected")) {
      return {
        key: "waiting_review",
        label: t.status_waiting,
        color: "#92400e",
        bg: "#fef3c7",
        border: "#fde68a",
        cardBorder: "#f59e0b",
      };
    }

    if (rawStatus === "rejected") {
      return {
        key: "rejected",
        label: t.status_rejected,
        color: "#991b1b",
        bg: "#fee2e2",
        border: "#fca5a5",
        cardBorder: "#ef4444",
      };
    }

    return {
      key: "unpaid",
      label: t.status_unpaid,
      color: "#dc2626",
      bg: "#fee2e2",
      border: "#fca5a5",
      cardBorder: "var(--danger, #dc2626)",
    };
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  const activeBills = bills.filter((b) => {
    const s = (b.status || b.bill_status || "unpaid").toLowerCase();
    const isPaid = s === "paid" || s === "approved";
    if (!isPaid) return true;
    if (b.period === currentMonth) return true;
    return false;
  });

  const displayActiveBills = activeBills.length > 0 ? activeBills : (bills.length > 0 ? [bills[0]] : []);

  const paidBills = bills.filter((b) => {
    const s = (b.status || b.bill_status || "").toLowerCase();
    return s === "paid" || s === "approved";
  });

  return (
    <div className="page-container notranslate" translate="no">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.page_title}</h1>
          <p className="page-subtitle">{t.page_subtitle}</p>
        </div>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/my-bills", label: lang === "th" ? "บิลค่าห้องเดือนนี้" : "My Monthly Bill", icon: "🧾" },
          { path: "/my-payments", label: lang === "th" ? "ประวัติการชำระ / สลิป" : "Payment History", icon: "💳" },
          { path: "/deposit-payment", label: lang === "th" ? "ชำระค่าแรกเข้า & ค่าประกัน" : "Security Deposit", icon: "🛡️" },
        ]}
      />

      {error && <div className="form-error" role="alert">{error}</div>}
      {successMsg && (
        <div
          className="form-success"
          style={{
            background: "#ecfdf5",
            color: "#065f46",
            padding: "14px 18px",
            borderRadius: 10,
            marginBottom: 16,
            border: "1px solid #a7f3d0",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="page-loading">{t.loading}</div>
      ) : (
        <div className="payments-content" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* ส่วนที่ 1: บิลค่าใช้จ่ายประจำงวด */}
          <section className="payment-active-section">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🧾</span>
              <span>{t.sec_active_bills}</span>
            </h2>

            {displayActiveBills.length > 0 ? (
              <div style={{ display: "grid", gap: 20 }}>
                {displayActiveBills.map((bill) => {
                  const statusInfo = getBillStatusInfo(bill);
                  const isPaid = statusInfo.key === "paid";
                  const isWaitingReview = statusInfo.key === "waiting_review";
                  const isRejected = statusInfo.key === "rejected";
                  const rPrice = Number(bill.room_price || 0);
                  const wPrice = Number(bill.water_price || 0);
                  const ePrice = Number(bill.electric_price || 0);
                  const oFees = Number(bill.other_fees || 0);
                  const total = Number(bill.total_amount ?? (rPrice + wPrice + ePrice + oFees));
                  const qrUrl = `https://promptpay.io/${PROMPTPAY_NUMBER}/${total}.png`;
                  const hasAttachedSlip = Boolean(bill.slip_image);
                  const hasSelectedFile = Boolean(selectedFiles[bill.id]);

                  return (
                    <div
                      key={bill.id}
                      className="card-shadow"
                      style={{
                        padding: 24,
                        borderTop: `4px solid ${statusInfo.cardBorder}`,
                        background: "var(--surface)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: 12,
                          borderBottom: "1px solid var(--border)",
                          paddingBottom: 12,
                          marginBottom: 16,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-primary)" }}>
                            {t.period_title(bill.period, bill.room_number)}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}>
                            {t.room_type_lbl} {bill.room_type || t.default_room_type}
                          </div>
                        </div>

                        {/* ป้ายสถานะ */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span
                            className="pill"
                            style={{
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              border: `1.5px solid ${statusInfo.border}`,
                              fontSize: 13,
                              padding: "5px 14px",
                              fontWeight: 700,
                              borderRadius: 99,
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* การแจ้งเตือนตามสถานะ */}
                      {isPaid && (
                        <div
                          style={{
                            background: "#ecfdf5",
                            border: "1.5px solid #a7f3d0",
                            borderRadius: 10,
                            padding: "14px 18px",
                            color: "#065f46",
                            marginBottom: 18,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span style={{ fontSize: 24 }}>🎉</span>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>
                              {t.banner_paid_title}
                            </div>
                            <div style={{ fontSize: 13, color: "#047857", marginTop: 2 }}>
                              {bill.paid_at ? t.banner_paid_verified(new Date(bill.paid_at).toLocaleString(lang === "en" ? "en-US" : "th-TH")) : t.banner_paid_approved}
                              {bill.approved_by_name ? t.banner_paid_by(bill.approved_by_name) : ""}
                            </div>
                          </div>
                        </div>
                      )}

                      {isWaitingReview && (
                        <div
                          style={{
                            background: "#fffbeb",
                            border: "1.5px solid #fde68a",
                            borderRadius: 10,
                            padding: "12px 16px",
                            color: "#92400e",
                            marginBottom: 18,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span style={{ fontSize: 24 }}>⏳</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>
                              {t.banner_waiting_title}
                            </div>
                            <div style={{ fontSize: 12.5, color: "#b45309", marginTop: 2 }}>
                              {t.banner_waiting_desc(total.toLocaleString())}
                            </div>
                          </div>
                        </div>
                      )}

                      {isRejected && (
                        <div
                          style={{
                            background: "#fef2f2",
                            border: "1.5px solid #fecaca",
                            borderRadius: 10,
                            padding: "12px 16px",
                            color: "#991b1b",
                            marginBottom: 18,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span style={{ fontSize: 24 }}>⚠️</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>
                              {t.banner_rejected_title(bill.reject_reason || (lang === "en" ? "Invalid amount or unclear slip" : "ยอดเงินไม่ถูกต้อง หรือภาพสลิปไม่ชัดเจน"))}
                            </div>
                            <div style={{ fontSize: 12.5, color: "#b91c1c", marginTop: 2 }}>
                              {t.banner_rejected_desc(total.toLocaleString())}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* รายการค่าใช้จ่าย */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 18 }}>
                        <div style={{ background: "var(--surface-alt)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 11.5, color: "var(--ink-muted)", display: "block" }}>{t.rent_lbl}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-primary)" }}>{rPrice.toLocaleString()} ฿</span>
                        </div>
                        <div style={{ background: "var(--surface-alt)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 11.5, color: "var(--ink-muted)", display: "block" }}>{t.water_lbl}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#0284c7" }}>{wPrice.toLocaleString()} ฿</span>
                        </div>
                        <div style={{ background: "var(--surface-alt)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 11.5, color: "var(--ink-muted)", display: "block" }}>{t.electric_lbl}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#d97706" }}>{ePrice.toLocaleString()} ฿</span>
                        </div>
                        {oFees > 0 && (
                          <div style={{ background: "var(--surface-alt)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                            <span style={{ fontSize: 11.5, color: "var(--ink-muted)", display: "block" }}>{t.other_fees_lbl}</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-secondary)" }}>{oFees.toLocaleString()} ฿</span>
                          </div>
                        )}
                      </div>

                      {/* แสดงขั้นตอนชำระเงินเฉพาะกรณีที่ยังไม่ได้ชำระ */}
                      {!isPaid && (
                        <>
                          {/* กล่อง PromptPay ล็อกยอดตามบิล */}
                          <div className="promptpay-box-payment" style={{ background: "linear-gradient(135deg, rgba(15, 81, 68, 0.04) 0%, rgba(0, 59, 100, 0.04) 100%)", border: "1.5px solid var(--primary-border)", borderRadius: 12, padding: 18, marginBottom: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, borderBottom: "1px solid var(--border)", paddingBottom: 10, marginBottom: 14 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 20 }}>📱</span>
                                <strong style={{ fontSize: 15, color: "var(--primary)" }}>{t.step1_title}</strong>
                              </div>
                              <div style={{ fontSize: 12, background: "var(--primary-light)", color: "var(--primary)", padding: "4px 10px", borderRadius: 99, fontWeight: 700 }}>
                                {t.locked_badge(total.toLocaleString())}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                              {/* QR Code */}
                              <div style={{ textAlign: "center", background: "#ffffff", padding: 10, borderRadius: 10, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                                <div style={{ background: "#003b64", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, marginBottom: 6 }}>
                                  {t.pp_badge}
                                </div>
                                <div style={{ minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {!imgError ? (
                                    <img
                                      src={qrUrl}
                                      alt={`PromptPay QR ${total} THB`}
                                      width="140"
                                      height="140"
                                      style={{ borderRadius: 6, display: "block" }}
                                      onError={() => setImgError(true)}
                                    />
                                  ) : (
                                    <div style={{ width: 140, height: 140, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#666", textAlign: "center", padding: 8 }}>
                                      {t.pp_num_lbl}<br /><strong>{PROMPTPAY_FORMATTED}</strong>
                                    </div>
                                  )}
                                </div>
                                <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 4 }}>{t.pp_scan_hint}</div>
                              </div>

                              {/* รายละเอียดบัญชี */}
                              <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 13, color: "var(--ink-muted)", minWidth: 80 }}>{t.acc_name_lbl}</span>
                                  <strong style={{ fontSize: 14, color: "var(--ink-primary)" }}>{PROMPTPAY_NAME}</strong>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 13, color: "var(--ink-muted)", minWidth: 80 }}>{t.pp_num_lbl}</span>
                                  <span style={{ fontFamily: "monospace", fontSize: 17, fontWeight: 800, color: "var(--primary)" }}>{PROMPTPAY_FORMATTED}</span>
                                  <button type="button" className="btn-copy-pp" onClick={handleCopyPromptPay} title="Copy PromptPay number">
                                    {copied ? t.btn_copied : t.btn_copy}
                                  </button>
                                </div>

                                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                                  <span style={{ fontSize: 13, color: "var(--ink-muted)", minWidth: 80 }}>{t.transfer_amt_lbl}</span>
                                  <span style={{ fontSize: 24, fontWeight: 900, color: "#dc2626" }}>
                                    {total.toLocaleString()} <span style={{ fontSize: 15, fontWeight: 600 }}>{t.baht}</span>
                                  </span>
                                </div>

                                <div style={{ fontSize: 12, color: "var(--ink-secondary)", background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 8, marginTop: 4 }}>
                                  {t.auto_amt_hint(total.toLocaleString())}
                                </div>
                              </div>
                            </div>

                            {/* แถบตรวจจับยอดเงินเข้า & ปุ่มยืนยันเมื่อโอนแล้ว */}
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }}></span>
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#065f46" }}>
                                  {lang === "en" ? "Auto-detecting LINE / Bank deposit alert..." : "ระบบกำลังตรวจจับยอดเงินเข้าจาก LINE / ธนาคารอัตโนมัติ"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleConfirmPaid(bill.id)}
                                disabled={checkingBillId === bill.id}
                                style={{
                                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "9px 18px",
                                  borderRadius: 8,
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  cursor: "pointer",
                                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                                  transition: "transform 0.1s ease",
                                }}
                                title="Click to verify immediately after transfer"
                              >
                                <span>{checkingBillId === bill.id ? "⏳" : "⚡"}</span>
                                <span>
                                  {checkingBillId === bill.id
                                    ? (lang === "en" ? "Verifying payment..." : "กำลังตรวจสอบยอดเงิน...")
                                    : (lang === "en" ? "I have paid (Verify Now)" : "ฉันโอนเงินแล้ว (ตรวจสอบทันที)")}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* ส่วนแนบสลิปการโอนเงิน */}
                          <div
                            className="slip-upload-section"
                            style={{
                              background: hasAttachedSlip ? "#f0fdf4" : "var(--surface-alt)",
                              border: hasAttachedSlip ? "1.5px solid #86efac" : "1.5px dashed var(--border)",
                              borderRadius: 12,
                              padding: 18,
                              marginBottom: 16,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 20 }}>📸</span>
                                <strong style={{ fontSize: 15, color: hasAttachedSlip ? "#166534" : "var(--ink-primary)" }}>
                                  {t.step2_title}
                                </strong>
                              </div>

                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => setP2pBillModal(bill)}
                                  style={{
                                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    fontSize: 12.5,
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                                  }}
                                  title="Send slip from mobile directly via P2P"
                                >
                                  <span>⚡</span>
                                  <span>{t.btn_p2p}</span>
                                </button>

                                {hasAttachedSlip && (
                                  <span style={{ fontSize: 12, background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: 99, fontWeight: 700 }}>
                                    {t.badge_attached}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* กรณีที่แนบสลิปไปแล้ว */}
                            {hasAttachedSlip && !hasSelectedFile && (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                  <img
                                    src={bill.slip_image}
                                    alt="Payment Slip"
                                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "2px solid #86efac", cursor: "pointer" }}
                                    onClick={() => setViewingSlip({ slipImage: bill.slip_image, details: { room_number: bill.room_number, period: bill.period, amount: total } })}
                                    title="Click to view slip"
                                  />
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>
                                      {t.slip_attached_title}
                                    </div>
                                    <div style={{ fontSize: 12.5, color: "#4b5563", marginTop: 2 }}>
                                      {t.slip_attached_desc}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    type="button"
                                    className="btn-ghost btn-sm"
                                    onClick={() => setViewingSlip({ slipImage: bill.slip_image, details: { room_number: bill.room_number, period: bill.period, amount: total } })}
                                    style={{ background: "#ffffff", borderColor: "#86efac", color: "#166534" }}
                                  >
                                    {t.btn_view_attached}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-ghost btn-sm"
                                    onClick={() => fileInputRefs.current[bill.id]?.click()}
                                    style={{ background: "#ffffff", borderColor: "var(--border)" }}
                                  >
                                    {t.btn_replace_slip}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* กรณีเลือกรูปใหม่ และกำลังรอส่ง */}
                            {hasSelectedFile && (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                  <img
                                    src={selectedFiles[bill.id]}
                                    alt="Slip preview"
                                    style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: "2px solid var(--primary)" }}
                                  />
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>
                                      {t.slip_selected_title}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                                      {t.slip_selected_desc}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    type="button"
                                    className="btn-primary btn-sm"
                                    disabled={uploadingId === bill.id}
                                    onClick={() => handleSubmitSlip(bill)}
                                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                                  >
                                    {uploadingId === bill.id ? t.btn_submitting_slip : t.btn_confirm_slip}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-ghost btn-sm"
                                    disabled={uploadingId === bill.id}
                                    onClick={() => handleCancelFile(bill.id)}
                                  >
                                    {t.btn_cancel}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* กรณีที่ยังไม่มีสลิป และยังไม่ได้เลือกรูป */}
                            {!hasAttachedSlip && !hasSelectedFile && (
                              <div
                                onClick={() => fileInputRefs.current[bill.id]?.click()}
                                style={{
                                  padding: "16px 20px",
                                  textAlign: "center",
                                  cursor: "pointer",
                                  borderRadius: 8,
                                  background: "var(--surface)",
                                  border: "1px dashed var(--border)",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
                                  {t.upload_box_title}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>
                                  {t.upload_box_desc}
                                </div>

                                <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setP2pBillModal(bill);
                                    }}
                                    style={{
                                      background: "rgba(2, 132, 199, 0.08)",
                                      color: "var(--primary)",
                                      border: "1px solid var(--primary-border)",
                                      fontWeight: 700,
                                      borderRadius: 8,
                                      padding: "6px 14px",
                                      fontSize: 12.5,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <span>⚡</span>
                                    <span>{t.upload_box_p2p}</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Hidden file input */}
                            <input
                              type="file"
                              accept="image/*"
                              ref={(el) => (fileInputRefs.current[bill.id] = el)}
                              style={{ display: "none" }}
                              onChange={(e) => handleFileChange(bill.id, e)}
                            />
                          </div>
                        </>
                      )}

                      {/* ปุ่มการทำงานด้านล่างการ์ด */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, paddingTop: 6 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setSelectedBillForSlip(bill)}
                            style={{ border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            <span>📄</span>
                            <span>{isPaid ? t.btn_view_receipt : t.btn_view_invoice}</span>
                          </button>
                          {isPaid && bill.slip_image && (
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => setViewingSlip({ slipImage: bill.slip_image, details: { room_number: bill.room_number, period: bill.period, amount: total } })}
                              style={{ border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", gap: 6 }}
                            >
                              <span>📸</span>
                              <span>{t.btn_view_slip}</span>
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                          {isPaid
                            ? t.card_footer_paid
                            : isWaitingReview
                            ? t.card_footer_waiting
                            : t.card_footer_unpaid}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card-shadow" style={{ padding: 28, textAlign: "center", background: "var(--surface)", borderLeft: "5px solid var(--success)" }}>
                <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>🎉</span>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--success)" }}>{t.no_active_bills_title}</div>
                <p style={{ fontSize: 13.5, color: "var(--ink-muted)", margin: "6px 0 0" }}>
                  {t.no_active_bills_desc}
                </p>
              </div>
            )}
          </section>

          {/* ส่วนที่ 2: ประวัติการชำระเงินที่ผ่านมา */}
          <section className="payment-history-section card-shadow" style={{ padding: 20, background: "var(--surface)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>📜</span>
              <span>{t.sec_history_title}</span>
            </h2>

            <div className="table-scroll">
              <table className="data-table dense-table">
                <thead>
                  <tr>
                    <th>{t.th_period}</th>
                    <th>{t.th_room}</th>
                    <th>{t.th_amount}</th>
                    <th>{t.th_paid_date}</th>
                    <th>{t.th_status}</th>
                    <th style={{ textAlign: "right" }}>{t.th_doc_slip}</th>
                  </tr>
                </thead>
                <tbody>
                  {paidBills.map((b) => (
                    <tr key={b.id}>
                      <td><b>{b.period}</b></td>
                      <td>ห้อง {b.room_number}</td>
                      <td style={{ fontWeight: 700, color: "var(--success)" }}>
                        {Number(b.total_amount).toLocaleString()} ฿
                      </td>
                      <td style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                        {b.paid_at ? new Date(b.paid_at).toLocaleDateString(lang === "en" ? "en-US" : "th-TH") : (lang === "en" ? "Paid" : "ชำระแล้ว")}
                      </td>
                      <td>
                        <span className="pill available">{t.status_paid_pill}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          {b.slip_image && (
                            <button
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => setViewingSlip({ slipImage: b.slip_image, details: { room_number: b.room_number, period: b.period, amount: b.total_amount } })}
                              title={lang === "en" ? "View attached slip" : "ดูสลิปที่แนบมา"}
                            >
                              {t.btn_slip_short}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => setSelectedBillForSlip(b)}
                          >
                            {t.btn_receipt_short}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paidBills.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-cell" style={{ textAlign: "center", padding: 20, color: "var(--ink-muted)" }}>
                        {t.no_history}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Bill Slip Modal (Official Invoice/Receipt) */}
      {selectedBillForSlip && (
        <BillSlipModal
          bill={selectedBillForSlip}
          onClose={() => setSelectedBillForSlip(null)}
        />
      )}

      {/* Modal ดูรูปสลิปการโอนเงินขนาดเต็ม */}
      {viewingSlip && (
        <SlipModal
          slipImage={viewingSlip.slipImage}
          details={viewingSlip.details}
          onClose={() => setViewingSlip(null)}
        />
      )}

      {/* Modal แนบสลิปผ่านมือถือแบบ Peer-to-Peer (P2P) */}
      {p2pBillModal && (
        <P2PUploadModal
          bill={p2pBillModal}
          onSlipReceived={(slipData) => handleP2PSlipReceived(p2pBillModal.id, slipData, p2pBillModal.period)}
          onClose={() => setP2pBillModal(null)}
        />
      )}
    </div>
  );
}
