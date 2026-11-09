import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n";

const API_BASE = "http://119.59.102.161:3007";

function renderMarkdown(text) {
  if (!text) return "";
  let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/^[•\-] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (m) => `<ul class="cb-list">${m}</ul>`);
  html = html.replace(/\n/g, "<br/>");
  return html;
}

export default function ChatbotWidget() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiPrompts, setApiPrompts] = useState({ th: [], en: [] });

  // Gemini AI Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(
    localStorage.getItem("gemini_api_key") || ""
  );
  const [showKeyText, setShowKeyText] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(
    Boolean(localStorage.getItem("gemini_api_key"))
  );
  const [settingsTesting, setSettingsTesting] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevLangRef = useRef(lang);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current && !showSettings) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, showSettings]);

  // Fetch quick prompts & Gemini config on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/chatbot/quick-prompts`)
      .then((r) => r.json())
      .then((d) => {
        setApiPrompts({
          th: d?.th?.slice(0, 5) || [],
          en: d?.en?.slice(0, 5) || [],
        });
      })
      .catch(() => {});

    // Check remote config for saved Gemini Key
    fetch(`${API_BASE}/api/chatbot/config`)
      .then((r) => r.json())
      .then((d) => {
        if (d.hasGeminiKey) {
          setHasGeminiKey(true);
        }
      })
      .catch(() => {});
  }, []);

  // When language changes while panel is open — update greeting
  useEffect(() => {
    if (lang !== prevLangRef.current) {
      prevLangRef.current = lang;
      if (isOpen && messages.length > 0) {
        setMessages((prev) => {
          const rest = prev.filter((m) => m.role !== "assistant" || prev.indexOf(m) > 0);
          return [{ role: "assistant", content: buildGreeting() }, ...rest.slice(1)];
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const buildGreeting = () => {
    const name = user?.full_name?.split(" ")[0] || (lang === "en" ? "there" : "คุณ");
    return t(lang, "cb_greeting", name);
  };

  const currentChips =
    apiPrompts[lang]?.length > 0
      ? apiPrompts[lang]
      : t(lang, "cb_quick_prompts");

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasGreeted) {
      setHasGreeted(true);
      setMessages([{ role: "assistant", content: buildGreeting() }]);
    }
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Test Gemini API Key
  const handleTestGeminiKey = async () => {
    const key = geminiKeyInput.trim();
    if (!key) {
      setSettingsFeedback({
        type: "error",
        text: "กรุณากรอก Gemini API Key ก่อนทำการทดสอบ",
      });
      return;
    }
    setSettingsTesting(true);
    setSettingsFeedback(null);
    try {
      const resp = await fetch(`${API_BASE}/api/chatbot/test-gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemini_api_key: key }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setSettingsFeedback({
          type: "success",
          text: `✅ ${data.message} (${data.model})`,
        });
      } else {
        setSettingsFeedback({
          type: "error",
          text: `❌ ${data.error || "เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบความถูกต้องของ API Key"}`,
        });
      }
    } catch (err) {
      setSettingsFeedback({
        type: "error",
        text: `❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`,
      });
    } finally {
      setSettingsTesting(false);
    }
  };

  // Save Gemini Key
  const handleSaveGeminiKey = async () => {
    const key = geminiKeyInput.trim();
    setSettingsSaving(true);
    setSettingsFeedback(null);
    try {
      const resp = await fetch(`${API_BASE}/api/chatbot/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemini_api_key: key }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (key) {
          localStorage.setItem("gemini_api_key", key);
          setHasGeminiKey(true);
          setSettingsFeedback({
            type: "success",
            text: "✅ บันทึก Google Gemini API Key สำเร็จ! ระบบจะใช้ Gemini AI ตอบคำถาม",
          });
        } else {
          localStorage.removeItem("gemini_api_key");
          setHasGeminiKey(false);
          setSettingsFeedback({
            type: "success",
            text: "ล้าง API Key เรียบร้อยแล้ว (กลับไปใช้ Smart AI Engine)",
          });
        }
      } else {
        throw new Error(data.error || "ไม่สามารถบันทึกได้");
      }
    } catch (err) {
      setSettingsFeedback({
        type: "error",
        text: `❌ ไม่สามารถบันทึกได้: ${err.message}`,
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const sendMessage = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      const userMsg = { role: "user", content: msg };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setLoading(true);

      try {
        const history = updated.slice(-8).map((m) => ({ role: m.role, content: m.content }));
        const langHint =
          lang === "en"
            ? " (Please respond in English)"
            : "";

        const savedGeminiKey = localStorage.getItem("gemini_api_key") || undefined;

        const resp = await fetch(`${API_BASE}/api/chatbot/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
          body: JSON.stringify({
            message: msg + langHint,
            history,
            gemini_api_key: savedGeminiKey,
          }),
        });

        const data = await resp.json();
        if (data.reply) {
          if (data.hasGeminiKey !== undefined) {
            setHasGeminiKey(Boolean(data.hasGeminiKey));
          }
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.reply,
              provider: data.provider || (data.hasGeminiKey ? "Google Gemini" : "DormEase Smart AI"),
            },
          ]);
        } else {
          throw new Error(data.error || "No response");
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: t(lang, "cb_error") },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, lang]
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: buildGreeting() }]);
    setInput("");
  };

  return (
    <>
      {/* Slide-in Panel */}
      <div className={`cb-panel ${isOpen ? "cb-panel-open" : ""}`}>
        {/* Header */}
        <div className="cb-panel-header">
          <div className="cb-panel-header-info">
            <span className="cb-panel-title">{t(lang, "cb_panel_title")}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span
                className={`cb-ai-badge ${
                  hasGeminiKey ? "cb-ai-badge-gemini" : "cb-ai-badge-smart"
                }`}
                title={
                  hasGeminiKey
                    ? "กำลังใช้งาน Google Gemini AI"
                    : "กำลังใช้งาน DormEase Smart Engine (เรียลไทม์)"
                }
              >
                {hasGeminiKey ? "✨ Gemini AI" : "⚡ Smart Engine"}
              </span>
              <span className="cb-panel-subtitle">{t(lang, "cb_panel_subtitle")}</span>
            </div>
          </div>
          <div className="cb-panel-header-actions">
            {/* Gemini Settings Button */}
            <button
              className="cb-panel-close"
              onClick={() => {
                setShowSettings(!showSettings);
                setSettingsFeedback(null);
              }}
              title="ตั้งค่า Google Gemini API Key"
              aria-label="Gemini Settings"
              style={{
                background: showSettings ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>

            {/* Clear Chat Button */}
            <button
              className="cb-panel-close"
              onClick={clearChat}
              title={lang === "en" ? "New chat" : "เริ่มใหม่"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
            </button>

            {/* Close Button */}
            <button
              className="cb-panel-close"
              onClick={() => setIsOpen(false)}
              aria-label="ปิด"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Gemini Settings Overlay Modal */}
        {showSettings && (
          <div className="cb-settings-overlay">
            <div className="cb-settings-header">
              <span className="cb-settings-title">
                <span>⚙️</span> ตั้งค่า Google Gemini AI
              </span>
              <button
                className="cb-settings-close"
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>
            <div className="cb-settings-desc">
              ระบบเชื่อมต่อ <strong>Google Gemini (gemini-1.5-flash / gemini-2.0)</strong> เพื่อตอบคำถามหอพักและเช็คบิลอย่างแม่นยำ
              <br />
              👉{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="cb-settings-link"
              >
                รับ API Key ฟรีที่ Google AI Studio
              </a>
            </div>
            <div className="cb-settings-input-group">
              <input
                className="cb-settings-input"
                type={showKeyText ? "text" : "password"}
                placeholder="วาง Gemini API Key (AIzaSy...)"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
              />
              <button
                type="button"
                className="cb-settings-toggle-vis"
                onClick={() => setShowKeyText(!showKeyText)}
                title={showKeyText ? "ซ่อนคีย์" : "แสดงคีย์"}
              >
                {showKeyText ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="cb-settings-buttons">
              <button
                type="button"
                className="cb-btn-secondary"
                onClick={handleTestGeminiKey}
                disabled={settingsTesting || !geminiKeyInput.trim()}
              >
                {settingsTesting ? "กำลังทดสอบ..." : "ทดสอบเชื่อมต่อ"}
              </button>
              <button
                type="button"
                className="cb-btn-primary"
                onClick={handleSaveGeminiKey}
                disabled={settingsSaving}
              >
                {settingsSaving ? "กำลังบันทึก..." : "บันทึกคีย์"}
              </button>
            </div>
            {settingsFeedback && (
              <div
                className={`cb-settings-msg ${
                  settingsFeedback.type === "success"
                    ? "cb-settings-msg-success"
                    : "cb-settings-msg-error"
                }`}
              >
                {settingsFeedback.text}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="cb-panel-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`cb-pmsg cb-pmsg-${msg.role}`}>
              {msg.role === "assistant" && (
                <div className="cb-pmsg-ava">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
              )}
              <div className="cb-pbubble">
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                {msg.role === "assistant" && msg.provider && (
                  <span className="cb-provider-tag">
                    {msg.provider.includes("Gemini") ? "✨ " : "⚡ "}
                    {msg.provider}
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="cb-pmsg cb-pmsg-assistant">
              <div className="cb-pmsg-ava">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div className="cb-pbubble cb-ptype">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Chips */}
        <div className="cb-panel-chips">
          {currentChips.map((c, i) => (
            <button
              key={`${lang}-${i}`}
              className="cb-pchip"
              onClick={() => sendMessage(c)}
              disabled={loading}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="cb-panel-input-row">
          <input
            ref={inputRef}
            className="cb-panel-input"
            type="text"
            placeholder={t(lang, "cb_placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            className="cb-panel-send"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            {t(lang, "cb_send")}
          </button>
        </div>
      </div>

      {/* Tab Toggle */}
      <button
        className={`cb-tab ${isOpen ? "cb-tab-open" : ""}`}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        aria-label="Toggle DormEase AI"
        title="DormEase AI Assistant (Google Gemini)"
      >
        {isOpen ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        )}
        {!isOpen && <span className="cb-tab-label">AI</span>}
      </button>
    </>
  );
}
