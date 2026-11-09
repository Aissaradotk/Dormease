import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const T = {
  th: {
    app_subtitle: "ระบบบริหารจัดการหอพักอัจฉริยะ",
    tab_login: "เข้าสู่ระบบ",
    tab_signup: "สมัครสมาชิก (ลูกบ้าน)",
    lbl_email: "อีเมล (Email)",
    ph_email: "เช่น user@example.com",
    lbl_password: "รหัสผ่าน (Password)",
    ph_password: "กรอกรหัสผ่านของคุณ",
    btn_login: "เข้าสู่ระบบ",
    btn_logging_in: "กำลังเข้าสู่ระบบ...",
    reg_badge_title: "สมัครสมาชิกสำหรับลูกบ้าน",
    reg_badge_sub: "เฉพาะผู้เช่าห้องพัก (เจ้าของหอพักใช้บัญชีผู้ดูแลระบบ)",
    lbl_name: "ชื่อ-นามสกุล (Full Name)",
    ph_name: "เช่น สมชาย ใจดี",
    lbl_phone: "เบอร์โทรศัพท์ (Phone Number)",
    ph_phone: "เช่น 0812345678",
    ph_signup_email: "เช่น resident@gmail.com",
    email_hint: "💡 ใช้อีเมลเดียวกับที่แจ้งเจ้าของหอพักไว้ เพื่อให้ระบบเชื่อมโยงห้องพักและบิลค่าเช่าของคุณให้อัตโนมัติ",
    ph_signup_password: "ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร",
    btn_signup: "สมัครสมาชิกสำหรับลูกบ้าน",
    btn_signing_up: "กำลังสมัครสมาชิก...",
    theme_light: "☀️ โหมดสว่าง",
    theme_dark: "🌙 โหมดทึบ",
    err_login: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
    err_signup: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
  },
  en: {
    app_subtitle: "Smart Dormitory Management System",
    tab_login: "Sign In",
    tab_signup: "Register (Tenant)",
    lbl_email: "Email Address",
    ph_email: "e.g. user@example.com",
    lbl_password: "Password",
    ph_password: "Enter your password",
    btn_login: "Sign In",
    btn_logging_in: "Signing in...",
    reg_badge_title: "Tenant Account Registration",
    reg_badge_sub: "For dormitory tenants only (owner uses admin account)",
    lbl_name: "Full Name",
    ph_name: "e.g. John Doe",
    lbl_phone: "Phone Number",
    ph_phone: "e.g. 0812345678",
    ph_signup_email: "e.g. resident@gmail.com",
    email_hint: "💡 Use the email registered with the dormitory owner to automatically link your room and bills.",
    ph_signup_password: "Set password (at least 6 characters)",
    btn_signup: "Register Tenant Account",
    btn_signing_up: "Registering...",
    theme_light: "☀️ Light Mode",
    theme_dark: "🌙 Dark Mode",
    err_login: "Login failed",
    err_signup: "Registration failed",
  },
};

export default function Login() {
  const { lang, setLang } = useLanguage();
  const t = T[lang] || T.th;

  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (user) {
      navigate(user.role === "owner" ? "/dashboard" : "/my-room", { replace: true });
    }
  }, [user, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      setLoading(false);
      navigate(user.role === "owner" ? "/dashboard" : "/my-room");
    } catch (err) {
      setLoading(false);
      setError(err.message || t.err_login);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register({
        full_name: fullName,
        email,
        password,
        phone,
        role: "tenant"
      });
      setLoading(false);
      navigate("/my-room");
    } catch (err) {
      setLoading(false);
      setError(err.message || t.err_signup);
    }
  }

  return (
    <div className="auth-page">
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, alignItems: "center" }}>
        {/* Language Toggle */}
        <div className="theme-toggle-pills lang-toggle-pills" role="group" aria-label="Language selector">
          <button
            type="button"
            className={`theme-pill ${lang === "th" ? "active" : ""}`}
            onClick={() => setLang("th")}
            title="ภาษาไทย"
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            🇹🇭 ไทย
          </button>
          <button
            type="button"
            className={`theme-pill ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}
            title="English"
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            🇬🇧 ENG
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          className="auth-theme-toggle"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
          style={{ position: "static" }}
        >
          {theme === "dark" ? t.theme_light : t.theme_dark}
        </button>
      </div>

      <div className="auth-card">
        <div className="auth-logo notranslate" translate="no">DormEase</div>
        <p className="auth-sub">{t.app_subtitle}</p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "active" : ""}
            onClick={() => { setMode("login"); setError(""); }}
          >
            {t.tab_login}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "active" : ""}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            {t.tab_signup}
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="auth-form" noValidate={false}>
            <div className="form-group">
              <label htmlFor="login-email">{t.lbl_email}</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.ph_email}
                required
                spellCheck="false"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">{t.lbl_password}</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.ph_password}
                required
              />
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="btn-primary auth-submit-btn" disabled={loading} type="submit">
              {loading ? t.btn_logging_in : t.btn_login}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="auth-form" noValidate={false}>
            <div className="tenant-reg-badge">
              <span className="tenant-reg-icon">🏠</span>
              <div>
                <strong>{t.reg_badge_title}</strong>
                <small>{t.reg_badge_sub}</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-fullname">{t.lbl_name}</label>
              <input
                id="signup-fullname"
                name="name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.ph_name}
                required
                spellCheck="false"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-phone">{t.lbl_phone}</label>
              <input
                id="signup-phone"
                name="tel"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.ph_phone}
                pattern="[0-9]{9,10}"
                spellCheck="false"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">{t.lbl_email}</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.ph_signup_email}
                required
                spellCheck="false"
              />
              <p className="hint-text">
                {t.email_hint}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">{t.lbl_password}</label>
              <input
                id="signup-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.ph_signup_password}
                required
              />
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="btn-primary auth-submit-btn" disabled={loading} type="submit">
              {loading ? t.btn_signing_up : t.btn_signup}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
