import { NavLink } from "react-router-dom";

export default function PageHeaderTabs({ tabs = [] }) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <nav className="page-header-tabs" aria-label="Page navigation tabs">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end ?? false}
          className={({ isActive }) => `header-tab-item ${isActive ? "active" : ""}`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
          {typeof tab.count === "number" && tab.count > 0 && (
            <span className="header-tab-badge">{tab.count}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
