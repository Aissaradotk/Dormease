import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export default function P2PMobileUpload() {
  const [searchParams] = useSearchParams();
  const sessionCode = (searchParams.get("session") || "").toUpperCase();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [p2pStatus, setP2pStatus] = useState("กำลังเชื่อมต่อ P2P...");

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!sessionCode) {
      setError("ไม่พบรหัส Session กรุณาสแกน QR Code ใหม่อีกครั้ง");
      setLoading(false);
      return;
    }

    async function init() {
      try {
        await api.post(`/p2p/connect/${sessionCode}`).catch(() => {});
        const res = await api.get(`/p2p/session/${sessionCode}`);
        setSession(res.session);
        setP2pStatus("🟢 เชื่อมต่อกับคอมพิวเตอร์แล้ว");
        initWebRTC();
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูล Session ได้: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [sessionCode]);

  function initWebRTC() {
    try {
      const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      pc.ondatachannel = (e) => {
        dataChannelRef.current = e.channel;
        e.channel.onopen = () => {
          setP2pStatus("⚡ P2P Direct Connected");
        };
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          api.post(`/p2p/signal/${sessionCode}`, {
            from: "mobile",
            data: { type: "candidate", candidate: e.candidate },
          }).catch(() => {});
        }
      };

      // Poll signals from desktop
      const interval = setInterval(async () => {
        try {
          const json = await api.get(`/p2p/signal/${sessionCode}?from=desktop`);
          if (json.signals) {
            for (const s of json.signals) {
              const data = s.data;
              if (data.type === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(data));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                api.post(`/p2p/signal/${sessionCode}`, { from: "mobile", data: answer });
              } else if (data.type === "candidate") {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
            }
          }
        } catch (e) {}
      }, 1500);

      return () => clearInterval(interval);
    } catch (e) {
      console.log("WebRTC mobile init fallback:", e);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPreview(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSend() {
    if (!preview) return;
    setSending(true);
    setError("");

    // 1. ส่งผ่าน P2P DataChannel
    const dc = dataChannelRef.current;
    if (dc && dc.readyState === "open") {
      try {
        dc.send(JSON.stringify({ type: "slip_data", data: preview }));
      } catch (e) {}
    }

    // 2. ส่งผ่าน API เพื่อความชัวร์และบันทึกลงระบบทันที
    try {
      await api.post(`/p2p/transfer/${sessionCode}`, { slip_image: preview });
      setSentSuccess(true);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการส่ง: " + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 16,
        fontFamily: "'Prompt', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          marginTop: 10,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#fff",
            padding: "24px 20px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>⚡ DormEase P2P Transfer</h1>
          <p style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
            แนบสลิปผ่านมือถือ ส่งตรงเข้าหน้าจอคอมพิวเตอร์
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.2)",
              padding: "4px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              marginTop: 10,
            }}
          >
            {p2pStatus}
          </div>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
              กำลังโหลดข้อมูล Session...
            </div>
          ) : sentSuccess ? (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>
                ส่งสลิปเข้าคอมพิวเตอร์สำเร็จแล้ว!
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
                รูปภาพสลิปของคุณปรากฏบนหน้าจอคอมพิวเตอร์เรียบร้อยแล้ว ท่านสามารถดูต่อที่คอมพิวเตอร์ได้เลย
              </p>
            </div>
          ) : (
            <>
              {session && (
                <div
                  style={{
                    background: "#f1f5f9",
                    borderRadius: 12,
                    padding: "14px 16px",
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#64748b" }}>ห้องพัก / งวด</span>
                    <strong>ห้อง {session.room_number} (งวด {session.period})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ color: "#64748b" }}>ยอดเงินตามบิล</span>
                    <strong style={{ color: "#dc2626", fontSize: 18, fontWeight: 800 }}>
                      {Number(session.amount).toLocaleString()} บาท
                    </strong>
                  </div>
                </div>
              )}

              {preview ? (
                <div style={{ textAlign: "center", background: "#0f172a", borderRadius: 12, padding: 12 }}>
                  <img
                    src={preview}
                    alt="ตัวอย่างสลิป"
                    style={{ maxHeight: 240, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      🔄 เปลี่ยนรูปภาพ
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "#f8fafc",
                    border: "2px dashed #0284c7",
                    borderRadius: 14,
                    padding: "32px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0284c7" }}>
                    ถ่ายภาพสลิป หรือ เลือกจากอัลบั้ม
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    สลิปการโอนเงินจากแอปธนาคาร
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              {preview && (
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleSend}
                  style={{
                    background: "#0284c7",
                    color: "#fff",
                    border: "none",
                    padding: 15,
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    width: "100%",
                    cursor: sending ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
                  }}
                >
                  {sending ? "📡 กำลังส่งข้อมูลเข้าคอมพิวเตอร์..." : "🚀 ส่งสลิปเข้าหน้าจอคอมพิวเตอร์"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
