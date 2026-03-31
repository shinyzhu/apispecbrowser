import { useState } from "react";
import type { NavItem, ViewTarget } from "../types";

interface SidebarProps {
  items: NavItem[];
  activeId: string | null;
  onSelect: (target: ViewTarget) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function methodClass(method: string): string {
  return `method-badge method-${method.toLowerCase()}`;
}

function NavEntry({
  item,
  activeId,
  onSelect,
}: {
  item: NavItem;
  activeId: string | null;
  onSelect: (target: ViewTarget) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (item.type === "section") {
    return (
      <div className="nav-section">
        <button
          className={`nav-section-header ${expanded ? "expanded" : ""}`}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span className="chevron">{expanded ? "▼" : "▶"}</span>
          {item.label}
        </button>
        {expanded && item.children && (
          <ul className="nav-list">
            {item.children.map((child) => (
              <NavEntry
                key={child.id}
                item={child}
                activeId={activeId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    );
  }

  function handleClick() {
    if (item.type === "info") {
      onSelect({ kind: "info" });
    } else if (item.type === "endpoint" && item.method && item.path) {
      onSelect({ kind: "endpoint", method: item.method, path: item.path });
    } else if (item.type === "schema") {
      onSelect({ kind: "schema", name: item.label });
    }
  }

  return (
    <li>
      <button
        className={`nav-item ${activeId === item.id ? "active" : ""}`}
        onClick={handleClick}
        title={item.type === "endpoint" ? `${item.method?.toUpperCase()} ${item.path}` : item.label}
      >
        {item.method && (
          <span className={methodClass(item.method)}>
            {item.method.toUpperCase()}
          </span>
        )}
        <span className="nav-item-label">{item.label}</span>
      </button>
    </li>
  );
}

export default function Sidebar({
  items,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  function filterItems(navItems: NavItem[], query: string): NavItem[] {
    if (!query) return navItems;
    const lower = query.toLowerCase();
    return navItems
      .map((item) => {
        if (item.children) {
          const filtered = item.children.filter(
            (child) =>
              child.label.toLowerCase().includes(lower) ||
              (child.path && child.path.toLowerCase().includes(lower)) ||
              (child.method && child.method.toLowerCase().includes(lower))
          );
          if (filtered.length > 0) {
            return { ...item, children: filtered, label: item.label.replace(/\(\d+\)$/, `(${filtered.length})`) };
          }
          return null;
        }
        if (item.label.toLowerCase().includes(lower)) return item;
        return null;
      })
      .filter((item): item is NavItem => item !== null);
  }

  const filteredItems = filterItems(items, searchQuery);

  return (
    <aside className="sidebar">
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
          aria-label="Search navigation"
        />
      </div>
      <nav className="sidebar-nav">
        {filteredItems.map((item) => (
          <NavEntry
            key={item.id}
            item={item}
            activeId={activeId}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </aside>
  );
}
