import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import Modal from "./Modal";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    modal_title: "📱 แนบสลิปผ่านมือถือ (Peer-to-Peer Direct Transfer)",
    loading: "กำลังสร้าง P2P Session และ QR Code...",
    success_title: "ได้รับรูปภาพสลิปจากมือถือเรียบร้อยแล้ว!",
    success_desc: "ข้อมูลสลิปถูกส่งตรงผ่านระบบ P2P เข้าสู่หน้าจอคอมพิวเตอร์และบันทึกเข้าระบบเรียบร้อย",
    btn_done: "✓ เสร็จสิ้น / ปิดหน้าต่าง",
    connected_msg: "🟢 โทรศัพท์มือถือเชื่อมต่อแล้ว (รอส่งรูปสลิป...)",
    waiting_msg: "⏳ กำลังรอโทรศัพท์มือถือสแกน QR Code...",
    scan_cam: "สแกนด้วยกล้องมือถือ",
    session_code_lbl: "รหัสเชื่อมต่อ (Session Code)",
    room_lbl: "ห้อง",
    period_lbl: "งวด",
    amount_lbl: "ยอด",
    baht: "บาท",
    step1: "1. เปิดแอปกล้องในโทรศัพท์มือถือ แล้วส่องไปที่ QR Code",
    step2: "2. กดเปิดลิงก์ที่ขึ้นบนหน้าจอมือถือ",
    step3: "3. ถ่ายรูปสลิป หรือเลือกจากอัลบั้ม แล้วกดส่งตรงเข้าคอม",
    btn_copied: "✓ คัดลอกลิงก์แล้ว",
    btn_copy: "📋 คัดลอกลิงก์สำหรับเปิดบนมือถือ",
    p2p_encrypted_note: "🔒 ข้อมูลส่งผ่านช่องทางเข้ารหัสแบบ Peer-to-Peer ข้ามอุปกรณ์โดยตรง",
    error_create: "ไม่สามารถสร้าง P2P Session ได้: ",
  },
  en: {
    modal_title: "📱 Mobile to PC Slip Transfer (Peer-to-Peer)",
    loading: "Creating P2P session and QR Code...",
    success_title: "Slip image received from mobile successfully!",
    success_desc: "Slip data transferred directly via P2P to your computer and saved to system.",
    btn_done: "✓ Done / Close Window",
    connected_msg: "🟢 Mobile connected (waiting for slip...)",
    waiting_msg: "⏳ Waiting for mobile phone to scan QR Code...",
    scan_cam: "Scan with phone camera",
    session_code_lbl: "Session Code",
    room_lbl: "Room",
    period_lbl: "Period",
    amount_lbl: "Amount",
    baht: "THB",
    step1: "1. Open camera on your mobile phone and aim at QR Code",
    step2: "2. Tap the link popup that appears on mobile",
    step3: "3. Take a photo or choose slip from gallery and send",
    btn_copied: "✓ Link copied",
    btn_copy: "📋 Copy mobile transfer link",
    p2p_encrypted_note: "🔒 End-to-end encrypted direct Peer-to-Peer transfer",
    error_create: "Unable to create P2P session: ",
  },
};

export default function P2PUploadModal({ bill, onSlipReceived, onClose }) {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileConnected, setMobileConnected] = useState(false);
  const [receivedSlip, setReceivedSlip] = useState(null);
  const [copied, setCopied] = useState(false);
  const [p2pMode, setP2pMode] = useState("Signaling / WebRTC");

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const pollTimerRef = useRef(null);
  const lastSignalIdRef = useRef(0);

  const roomPrice = Number(bill.room_price || 0);
  const waterPrice = Number(bill.water_price || 0);
  const electricPrice = Number(bill.electric_price || 0);
  const otherFees = Number(bill.other_fees || 0);
  const total = Number(bill.total_amount ?? (roomPrice + waterPrice + electricPrice + otherFees));

  useEffect(() => {
    let isMounted = true;

    async function createSession() {
      try {
        setLoading(true);
        const res = await api.post("/p2p/session", {
          bill_id: bill.id,
          room_number: bill.room_number,
          period: bill.period,
          amount: total,
        });

        if (isMounted) {
          setSession(res);
          setLoading(false);
          startListening(res.sessionCode);
        }
      } catch (err) {
        if (isMounted) {
          setError(t.error_create + err.message);
          setLoading(false);
        }
      }
    }

    createSession();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (e) {}
      }
    };
  }, [bill.id]);

  function startListening(code) {
    initWebRTC(code);

    pollTimerRef.current = setInterval(async () => {
      try {
        const sigRes = await api.get(
          `/p2p/signal/${code}?from=mobile&since=${lastSignalIdRef.current}`
        );

        if (sigRes.mobileConnected && !mobileConnected) {
          setMobileConnected(true);
        }

        if (sigRes.signals && sigRes.signals.length > 0) {
          for (const s of sigRes.signals) {
            lastSignalIdRef.current = Math.max(lastSignalIdRef.current, s.id);
            handleRemoteSignal(s.data);
          }
        }

        if (sigRes.hasSlip || sigRes.status === "transferred") {
          const transRes = await api.get(`/p2p/transfer/${code}`);
          if (transRes.slip_image) {
            handleComplete(transRes.slip_image);
          }
        }
      } catch (e) {}
    }, 1200);
  }

  function initWebRTC(code) {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      peerConnectionRef.current = pc;

      const dc = pc.createDataChannel("p2p-slip-transfer", { ordered: true });
      dataChannelRef.current = dc;

      let incomingChunks = [];

      dc.onopen = () => {
        setP2pMode("Direct WebRTC (P2P)");
      };

      dc.onmessage = (event) => {
        try {
          if (typeof event.data === "string") {
            const parsed = JSON.parse(event.data);
            if (parsed.type === "chunk") {
              incomingChunks[parsed.index] = parsed.data;
            } else if (parsed.type === "complete") {
              const fullDataUrl = incomingChunks.join("");
              handleComplete(fullDataUrl);
            }
          }
        } catch (err) {}
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          api.post(`/p2p/signal/${code}`, {
            from: "pc",
            data: { type: "candidate", candidate: event.candidate },
          }).catch(() => {});
        }
      };

      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        api.post(`/p2p/signal/${code}`, {
          from: "pc",
          data: { type: "offer", sdp: offer },
        }).catch(() => {});
      });
    } catch (e) {
      setP2pMode("Server Fallback");
    }
  }

  async function handleRemoteSignal(data) {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (data.type === "answer" && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } else if (data.type === "candidate" && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (err) {}
  }

  function handleComplete(slipDataUrl) {
    if (receivedSlip) return;
    setReceivedSlip(slipDataUrl);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (onSlipReceived) {
      onSlipReceived(slipDataUrl);
    }
  }

  function handleCopyLink() {
    if (!session?.uploadUrl) return;
    navigator.clipboard.writeText(session.uploadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const qrImageUrl = session?.uploadUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        session.uploadUrl
      )}`
    : "";

  return (
    <Modal title={t.modal_title} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: 30, color: "var(--ink-muted)" }}>
            {t.loading}
          </div>
        ) : receivedSlip ? (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--success)" }}>
              {t.success_title}
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 4, marginBottom: 16 }}>
              {t.success_desc}
            </p>

            <div
              style={{
                display: "inline-block",
                background: "#18181b",
                padding: 10,
                borderRadius: 12,
                boxShadow: "var(--shadow-md)",
                marginBottom: 18,
              }}
            >
              <img
                src={receivedSlip}
                alt="P2P Transfer Slip"
                style={{ maxHeight: 240, maxWidth: "100%", borderRadius: 8, display: "block" }}
              />
            </div>

            <div>
              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{ padding: "10px 24px" }}
              >
                {t.btn_done}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                background: mobileConnected ? "#ecfdf5" : "var(--surface-alt)",
                border: mobileConnected ? "1.5px solid #86efac" : "1px solid var(--border)",
                padding: "10px 16px",
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: mobileConnected ? "#22c55e" : "#f59e0b",
                    display: "inline-block",
                    boxShadow: mobileConnected
                      ? "0 0 8px rgba(34, 197, 94, 0.6)"
                      : "0 0 8px rgba(245, 158, 11, 0.5)",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: mobileConnected ? "#15803d" : "var(--ink-secondary)" }}>
                  {mobileConnected ? t.connected_msg : t.waiting_msg}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--ink-muted)", background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: 4 }}>
                {p2pMode}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                padding: "10px 0",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  textAlign: "center",
                }}
              >
                <img
                  src={qrImageUrl}
                  alt="QR Code P2P"
                  width="190"
                  height="190"
                  style={{ display: "block", borderRadius: 8 }}
                />
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 6, fontWeight: 600 }}>
                  {t.scan_cam}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    background: "var(--surface-alt)",
                    border: "1px solid var(--border)",
                    padding: "12px 14px",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginBottom: 4 }}>
                    {t.session_code_lbl}
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: 3,
                      color: "var(--primary)",
                    }}
                  >
                    {session?.sessionCode}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-secondary)", marginTop: 4 }}>
                    {t.room_lbl} {bill.room_number} • {t.period_lbl} {bill.period} • {t.amount_lbl} {total.toLocaleString()} {t.baht}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "var(--ink-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div>{t.step1}</div>
                  <div>{t.step2}</div>
                  <div>{t.step3}</div>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={handleCopyLink}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {copied ? t.btn_copied : t.btn_copy}
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--ink-muted)",
                textAlign: "center",
                borderTop: "1px solid var(--border)",
                paddingTop: 12,
              }}
            >
              {t.p2p_encrypted_note}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
