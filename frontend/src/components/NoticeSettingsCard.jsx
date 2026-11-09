import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { getMinDateString, formatThaiDate } from "../lib/dateUtils";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    card_title: "ตั้งค่ากำหนดวันแจ้งล่วงหน้า (Notice Period Settings)",
    summary_in: "แจ้งเข้าพักล่วงหน้า:",
    summary_out: "แจ้งย้ายออกล่วงหน้า:",
    days: "วัน",
    btn_hide: "ซ่อนการตั้งค่า ▲",
    btn_show: "ปรับเปลี่ยนการตั้งค่า ▼",
    saved_success: "บันทึกการตั้งค่าวันแจ้งล่วงหน้าเรียบร้อยแล้ว",
    save_error: "เกิดข้อผิดพลาดในการบันทึก",
    box_in_title: "📥 วันแจ้งเข้าพักล่วงหน้า (Move-in Notice)",
    this_page: "หน้านี้",
    box_in_desc: "กำหนดจำนวนวันที่ลูกบ้านต้องเลือกวันเข้าพักล่วงหน้า",
    cal_in_label: "ปฏิทินของลูกบ้าน:",
    cal_earliest_in: "วันที่เร็วที่สุดที่จองได้คือ",
    box_out_title: "📤 วันแจ้งย้ายออกล่วงหน้า (Move-out Notice)",
    box_out_desc: "กำหนดจำนวนวันที่ลูกบ้านต้องแจ้งย้ายออกล่วงหน้า",
    cal_earliest_out: "วันที่เร็วที่สุดที่ขอย้ายออกได้คือ",
    cancel: "ยกเลิก",
    saving: "กำลังบันทึก...",
    save_btn: "💾 บันทึกการตั้งค่า",
  },
  en: {
    card_title: "Advance Notice Period Settings",
    summary_in: "Move-in Notice:",
    summary_out: "Move-out Notice:",
    days: "days",
    btn_hide: "Hide Settings ▲",
    btn_show: "Change Settings ▼",
    saved_success: "Advance notice settings saved successfully",
    save_error: "An error occurred while saving",
    box_in_title: "📥 Move-in Advance Notice",
    this_page: "This page",
    box_in_desc: "Required number of days in advance for tenants to book a move-in date",
    cal_in_label: "Tenant Calendar:",
    cal_earliest_in: "Earliest selectable check-in date is",
    box_out_title: "📤 Move-out Advance Notice",
    box_out_desc: "Required number of days in advance for tenants to request a move-out date",
    cal_earliest_out: "Earliest selectable move-out date is",
    cancel: "Cancel",
    saving: "Saving...",
    save_btn: "💾 Save Settings",
  },
};

export default function NoticeSettingsCard({ highlight = "all", onSettingsSaved }) {
  const { lang } = useLanguage();
  const t = T[lang] || T.th;

  const [settings, setSettings] = useState({
    move_in_notice_days: 1,
    move_out_notice_days: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isOpen, setIsOpen] = useState(false);

  async function fetchSettings() {
    try {
      setLoading(true);
      const data = await api.get("/settings/notice-days");
      if (data) {
        setSettings({
          move_in_notice_days: data.move_in_notice_days ?? 1,
          move_out_notice_days: data.move_out_notice_days ?? 30,
        });
      }
    } catch (err) {
      console.error("Failed to load notice days settings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = {
        move_in_notice_days: Math.max(0, parseInt(settings.move_in_notice_days, 10) || 0),
        move_out_notice_days: Math.max(0, parseInt(settings.move_out_notice_days, 10) || 0),
      };

      const res = await api.put("/settings/notice-days", payload);
      setMessage({ text: t.saved_success, type: "success" });
      setSettings({
        move_in_notice_days: res.move_in_notice_days,
        move_out_notice_days: res.move_out_notice_days,
      });

      if (onSettingsSaved) {
        onSettingsSaved(res);
      }

      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    } catch (err) {
      setMessage({ text: err.message || t.save_error, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const minMoveInStr = getMinDateString(settings.move_in_notice_days);
  const minMoveOutStr = getMinDateString(settings.move_out_notice_days);

  function formatDate(dStr) {
    if (!dStr) return "-";
    if (lang === "en") {
      return new Date(dStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
    return formatThaiDate(dStr);
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg, 12px)",
        padding: "16px 20px",
        marginBottom: 20,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink-primary)" }}>
              {t.card_title}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}>
              {t.summary_in} <b>{settings.move_in_notice_days} {t.days}</b> | {t.summary_out}{" "}
              <b>{settings.move_out_notice_days} {t.days}</b>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-ghost btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 4 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? t.btn_hide : t.btn_show}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSave} style={{ marginTop: 18, borderTop: "1px solid var(--border-light, #eee)", paddingTop: 16 }}>
          {message.text && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13.5,
                background: message.type === "success" ? "var(--success-bg, #ecfdf5)" : "var(--danger-bg, #fef2f2)",
                color: message.type === "success" ? "var(--success, #059669)" : "var(--danger, #dc2626)",
                border: `1px solid ${message.type === "success" ? "var(--success-border, #a7f3d0)" : "var(--danger-border, #fecaca)"}`,
              }}
            >
              {message.type === "success" ? "✅ " : "❌ "}
              {message.text}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {/* กล่องตั้งค่าแจ้งเข้าพัก */}
            <div
              style={{
                border: highlight === "move_in" ? "2px solid var(--primary, #0f5144)" : "1px solid var(--border)",
                background: highlight === "move_in" ? "var(--primary-light, #f0fdf8)" : "var(--surface-alt, #fafafa)",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-primary)" }}>
                  {t.box_in_title}
                </span>
                {highlight === "move_in" && (
                  <span className="pill available" style={{ fontSize: 11, padding: "2px 8px" }}>
                    {t.this_page}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input
                  type="number"
                  min="0"
                  max="365"
                  required
                  value={settings.move_in_notice_days}
                  onChange={(e) =>
                    setSettings({ ...settings, move_in_notice_days: e.target.value })
                  }
                  style={{
                    width: 100,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    fontSize: 15,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                />
                <span style={{ fontSize: 14, color: "var(--ink-secondary)" }}>{t.days}</span>
              </div>

              <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.5 }}>
                {t.box_in_desc}
              </p>

              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "var(--surface)",
                  border: "1px dashed var(--border)",
                  fontSize: 12,
                  color: "var(--ink-secondary)",
                }}
              >
                📅 <b>{t.cal_in_label}</b> {t.cal_earliest_in}{" "}
                <b style={{ color: "var(--primary, #0f5144)" }}>{formatDate(minMoveInStr)}</b>
              </div>
            </div>

            {/* กล่องตั้งค่าแจ้งย้ายออก */}
            <div
              style={{
                border: highlight === "move_out" ? "2px solid var(--primary, #0f5144)" : "1px solid var(--border)",
                background: highlight === "move_out" ? "var(--primary-light, #f0fdf8)" : "var(--surface-alt, #fafafa)",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-primary)" }}>
                  {t.box_out_title}
                </span>
                {highlight === "move_out" && (
                  <span className="pill available" style={{ fontSize: 11, padding: "2px 8px" }}>
                    {t.this_page}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input
                  type="number"
                  min="0"
                  max="365"
                  required
                  value={settings.move_out_notice_days}
                  onChange={(e) =>
                    setSettings({ ...settings, move_out_notice_days: e.target.value })
                  }
                  style={{
                    width: 100,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    fontSize: 15,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                />
                <span style={{ fontSize: 14, color: "var(--ink-secondary)" }}>{t.days}</span>
              </div>

              <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.5 }}>
                {t.box_out_desc}
              </p>

              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "var(--surface)",
                  border: "1px dashed var(--border)",
                  fontSize: 12,
                  color: "var(--ink-secondary)",
                }}
              >
                📅 <b>{t.cal_in_label}</b> {t.cal_earliest_out}{" "}
                <b style={{ color: "var(--primary, #0f5144)" }}>{formatDate(minMoveOutStr)}</b>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                fetchSettings();
                setIsOpen(false);
              }}
            >
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary btn-sm" disabled={saving || loading}>
              {saving ? t.saving : t.save_btn}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
