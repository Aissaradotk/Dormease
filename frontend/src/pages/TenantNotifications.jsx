import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

const CATEGORY_MAP = {
  general: { labelTh: "📢 ประกาศทั่วไป", labelEn: "📢 Announcement", color: "#3b82f6" },
  bill: { labelTh: "🧾 บิลค่าใช้จ่าย", labelEn: "🧾 Monthly Bill", color: "#10b981" },
  repair: { labelTh: "🔧 งานแจ้งซ่อม", labelEn: "🔧 Repair Request", color: "#f59e0b" },
  booking: { labelTh: "📅 การจองห้อง", labelEn: "📅 Room Booking", color: "#8b5cf6" },
  move_out: { labelTh: "📦 แจ้งย้ายออก", labelEn: "📦 Move-out", color: "#ef4444" },
  residence_cert: { labelTh: "📄 ใบรับรองถิ่นที่อยู่", labelEn: "📄 Residence Certificate", color: "#6366f1" },
};

const T = {
  th: {
    pageTitle: "การแจ้งเตือนและข่าวสารหอพัก",
    loading: "กำลังโหลดการแจ้งเตือน...",
    newBadge: "ใหม่",
    markRead: "ทำเครื่องหมายว่าอ่านแล้ว",
    empty: "ไม่มีรายการแจ้งเตือนในขณะนี้",
  },
  en: {
    pageTitle: "Notifications & Dormitory Announcements",
    loading: "Loading notifications...",
    newBadge: "NEW",
    markRead: "Mark as read",
    empty: "No notifications at this time",
  },
};

export default function TenantNotifications() {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;
  const isEn = lang === "en";

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await api.get("/notifications");
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t.pageTitle}</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notifications.map((n) => {
            const cat = CATEGORY_MAP[n.category] || CATEGORY_MAP.general;
            const isRead = Boolean(n.is_read);

            return (
              <div
                key={n.id}
                className="card-box"
                style={{
                  borderLeft: `5px solid ${cat.color}`,
                  background: isRead ? "#fff" : "#f0fdf4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: "bold",
                        color: cat.color,
                        background: "#fff",
                        border: `1px solid ${cat.color}`,
                        padding: "2px 8px",
                        borderRadius: 12,
                      }}
                    >
                      {isEn ? cat.labelEn : cat.labelTh}
                    </span>
                    {!isRead && (
                      <span className="pill occupied" style={{ fontSize: 10, padding: "2px 6px" }}>
                        {t.newBadge}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: "#888" }}>
                      {new Date(n.created_at).toLocaleString(isEn ? "en-US" : "th-TH")}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#111" }}>{n.title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: "#4b5563", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {n.message}
                  </p>
                </div>

                {!isRead && (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: "4px 8px", whiteSpace: "nowrap" }}
                    onClick={() => markAsRead(n.id)}
                  >
                    {t.markRead}
                  </button>
                )}
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="empty-box">{t.empty}</div>
          )}
        </div>
      )}
    </div>
  );
}
