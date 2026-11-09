import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n";
import DormInfoModal from "./DormInfoModal";

export default function Layout() {
  const { profile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDormInfo, setShowDormInfo] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function handleNavClick() {
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }

  const isOwner = profile?.role === "owner";
  const isTenant = profile?.role === "tenant";

  return (
    <div className="app-shell">
      {/* Mobile Top Header */}
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <div className="mobile-brand" onClick={() => navigate(isOwner ? "/dashboard" : "/my-room")}>
          DormEase
        </div>

        <div className="mobile-header-actions">
          {/* Mobile Language Toggle */}
          <button
            type="button"
            className="mobile-lang-btn"
            onClick={() => setLang(lang === "th" ? "en" : "th")}
            title={lang === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
          >
            {lang === "th" ? "🇬🇧" : "🇹🇭"}
          </button>

          <button
            type="button"
            className="btn-emergency-pill"
            onClick={() => setShowDormInfo(true)}
            title={t(lang, "emergency_label")}
          >
            {t(lang, "btn_emergency_pill")}
          </button>
          <button
            type="button"
            className="mobile-theme-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="สลับโหมดสว่าง/ทึบ"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop show"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">DormEase</div>

          {/* Theme Toggle */}
          <div className="theme-toggle-pills" role="group" aria-label="Theme selector">
            <button
              type="button"
              className={`theme-pill ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
              title="เปลี่ยนเป็นโหมดทึบ"
            >
              🌙 ทึบ
            </button>
            <button
              type="button"
              className={`theme-pill ${theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
              title="เปลี่ยนเป็นโหมดสว่าง"
            >
              ☀️ สว่าง
            </button>
          </div>

          {/* Language Toggle */}
          <div className="theme-toggle-pills lang-toggle-pills" role="group" aria-label="Language selector">
            <button
              type="button"
              className={`theme-pill ${lang === "th" ? "active" : ""}`}
              onClick={() => setLang("th")}
              title="ภาษาไทย"
            >
              🇹🇭 ไทย
            </button>
            <button
              type="button"
              className={`theme-pill ${lang === "en" ? "active" : ""}`}
              onClick={() => setLang("en")}
              title="English"
            >
              🇬🇧 ENG
            </button>
          </div>
        </div>

        {/* Emergency Quick Action Button */}
        <div className="sidebar-emergency-box">
          <button
            type="button"
            className="btn-sidebar-emergency"
            onClick={() => {
              setShowDormInfo(true);
              setMobileMenuOpen(false);
            }}
          >
            <span className="emergency-icon-pulse">🚨</span>
            <div className="btn-emergency-text">
              <strong>{t(lang, "emergency_label")}</strong>
              <small>{t(lang, "emergency_sub")}</small>
            </div>
          </button>
        </div>

        {/* Sidebar Quick Search */}
        <div className="sidebar-search-box">
          <div className="sidebar-search-input-wrap">
            <span className="sidebar-search-icon">🔍</span>
            <input
              type="text"
              className="sidebar-search-input"
              placeholder={t(lang, "nav_search_placeholder")}
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
            />
            {navSearch && (
              <button
                type="button"
                className="sidebar-search-clear"
                onClick={() => setNavSearch("")}
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <nav>
          {isOwner && (() => {
            const ownerGroups = [
              {
                id: "overview",
                title: t(lang, "cat_overview"),
                items: [
                  { to: "/dashboard", label: t(lang, "nav_dashboard") },
                  { to: "/rooms", label: t(lang, "nav_rooms") },
                  { to: "/tenants", label: t(lang, "nav_tenants") },
                ],
              },
              {
                id: "finance",
                title: t(lang, "cat_finance"),
                items: [
                  { to: "/monthly-bills", label: t(lang, "nav_monthly_bills") },
                  { to: "/payments", label: t(lang, "nav_payments") },
                  { to: "/admin/move-in-payments", label: t(lang, "nav_move_in_payments") },
                  { to: "/admin/initial-fees", label: t(lang, "nav_initial_fees") },
                ],
              },
              {
                id: "requests",
                title: t(lang, "cat_requests"),
                items: [
                  { to: "/bookings", label: t(lang, "nav_bookings") },
                  { to: "/admin/resident-verifications", label: t(lang, "nav_resident_verifications") },
                  { to: "/repairs", label: t(lang, "nav_repairs") },
                  { to: "/move-outs", label: t(lang, "nav_move_outs") },
                  { to: "/residence-certificates", label: t(lang, "nav_residence_certificates") },
                ],
              },
              {
                id: "announcements",
                title: t(lang, "cat_announcements"),
                items: [
                  { to: "/notifications", label: t(lang, "nav_notifications") },
                ],
              },
            ];

            const q = navSearch.trim().toLowerCase();
            const filteredGroups = ownerGroups
              .map((g) => ({
                ...g,
                items: g.items.filter(
                  (item) =>
                    !q ||
                    item.label.toLowerCase().includes(q) ||
                    item.to.toLowerCase().includes(q)
                ),
              }))
              .filter((g) => g.items.length > 0);

            if (filteredGroups.length === 0) {
              return (
                <div style={{ padding: "16px 14px", color: "var(--ink-muted)", fontSize: 13, textAlign: "center" }}>
                  {t(lang, "nav_no_menu_found")}
                </div>
              );
            }

            return filteredGroups.map((g) => (
              <div key={g.id} className="nav-category-group">
                <div className="nav-category-header">
                  <span className="nav-category-title-wrap">{g.title}</span>
                  <span className="nav-category-badge">{g.items.length}</span>
                </div>
                {g.items.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={handleNavClick}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ));
          })()}

          {isTenant && (() => {
            const tenantGroups = [
              {
                id: "living",
                title: t(lang, "cat_my_living"),
                items: [
                  { to: "/my-room", label: t(lang, "nav_my_room") },
                  { to: "/move-in", label: t(lang, "nav_move_in") },
                ],
              },
              {
                id: "finance",
                title: t(lang, "cat_tenant_finance"),
                items: [
                  { to: "/my-bills", label: t(lang, "nav_my_bills") },
                  { to: "/my-payments", label: t(lang, "nav_my_payments") },
                  { to: "/deposit-payment", label: t(lang, "nav_deposit_payment") },
                ],
              },
              {
                id: "requests",
                title: t(lang, "cat_tenant_requests"),
                items: [
                  { to: "/my-repairs", label: t(lang, "nav_my_repairs") },
                  { to: "/my-move-out", label: t(lang, "nav_my_move_out") },
                  { to: "/residence-certificate", label: t(lang, "nav_residence_certificate") },
                  { to: "/book-room", label: t(lang, "nav_book_room") },
                ],
              },
              {
                id: "announcements",
                title: t(lang, "cat_announcements"),
                items: [
                  { to: "/my-notifications", label: t(lang, "nav_my_notifications") },
                ],
              },
            ];

            const q = navSearch.trim().toLowerCase();
            const filteredGroups = tenantGroups
              .map((g) => ({
                ...g,
                items: g.items.filter(
                  (item) =>
                    !q ||
                    item.label.toLowerCase().includes(q) ||
                    item.to.toLowerCase().includes(q)
                ),
              }))
              .filter((g) => g.items.length > 0);

            if (filteredGroups.length === 0) {
              return (
                <div style={{ padding: "16px 14px", color: "var(--ink-muted)", fontSize: 13, textAlign: "center" }}>
                  {t(lang, "nav_no_menu_found")}
                </div>
              );
            }

            return filteredGroups.map((g) => (
              <div key={g.id} className="nav-category-group">
                <div className="nav-category-header">
                  <span className="nav-category-title-wrap">{g.title}</span>
                  <span className="nav-category-badge">{g.items.length}</span>
                </div>
                {g.items.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={handleNavClick}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ));
          })()}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            {profile?.full_name || "..."}
            <span>{isOwner ? t(lang, "role_owner") : t(lang, "role_tenant")}</span>
          </div>
          <button className="btn-ghost" onClick={handleLogout}>
            {t(lang, "logout")}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {isOwner ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">📊</span>
              <span className="m-nav-label">{t(lang, "m_nav_overview")}</span>
            </NavLink>
            <NavLink to="/rooms" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">🚪</span>
              <span className="m-nav-label">{t(lang, "m_nav_rooms")}</span>
            </NavLink>
            <NavLink to="/tenants" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">👥</span>
              <span className="m-nav-label">{t(lang, "m_nav_tenants")}</span>
            </NavLink>
            <NavLink to="/monthly-bills" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">🧾</span>
              <span className="m-nav-label">{t(lang, "m_nav_bills")}</span>
            </NavLink>
            <NavLink to="/payments" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">💳</span>
              <span className="m-nav-label">{t(lang, "m_nav_payment")}</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/my-room" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">🏠</span>
              <span className="m-nav-label">{t(lang, "m_nav_my_room")}</span>
            </NavLink>
            <NavLink to="/my-bills" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">🧾</span>
              <span className="m-nav-label">{t(lang, "m_nav_my_bills")}</span>
            </NavLink>
            <NavLink to="/my-payments" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">💳</span>
              <span className="m-nav-label">{t(lang, "m_nav_pay")}</span>
            </NavLink>
            <NavLink to="/my-repairs" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">🔧</span>
              <span className="m-nav-label">{t(lang, "m_nav_repair")}</span>
            </NavLink>
            <NavLink to="/my-notifications" className={({ isActive }) => `m-nav-item ${isActive ? "active" : ""}`}>
              <span className="m-nav-icon">🔔</span>
              <span className="m-nav-label">{t(lang, "m_nav_news")}</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Emergency & Dormitory Rules Modal */}
      {showDormInfo && (
        <DormInfoModal onClose={() => setShowDormInfo(false)} />
      )}
    </div>
  );
}
