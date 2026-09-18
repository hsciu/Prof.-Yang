"use client";

import { useState } from "react";
import styles from "./Sidebar.module.css";

export default function Sidebar({ items, activeId, onSelect }) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button className={styles.expandButton} onClick={() => setCollapsed(false)}>
        ☰ 歷史紀錄
      </button>
    );
  }

  const grouped = items.reduce((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => {
    const latestA = Math.max(...grouped[a].map((i) => new Date(i.createdAt).getTime()));
    const latestB = Math.max(...grouped[b].map((i) => new Date(i.createdAt).getTime()));
    return latestB - latestA;
  });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span>歷史紀錄</span>
        <button className={styles.collapseButton} onClick={() => setCollapsed(true)}>
          ‹
        </button>
      </div>

      {items.length === 0 && <p className={styles.hint}>還沒有紀錄</p>}

      {categories.map((category) => (
        <details key={category} className={styles.categoryGroup} open>
          <summary>{category}</summary>
          <ul className={styles.itemList}>
            {grouped[category].map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.historyItem} ${
                    item.id === activeId ? styles.historyItemActive : ""
                  }`}
                  onClick={() => onSelect(item.id)}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </aside>
  );
}
