import React from "react";
import "../App.css";

/**
 * Minimal top navigation bar with links to Trip Tracker and Dashboard.
 * Uses native anchors; App manages light client-side routing to avoid extra deps.
 */

// PUBLIC_INTERFACE
export default function NavBar() {
  return (
    <nav className="navbar" style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: "linear-gradient(180deg, rgba(255,255,255,0.9), #fff)",
      borderBottom: "1px solid var(--gray-100)",
      backdropFilter: "blur(6px)"
    }}>
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0"
      }}>
        <a href="/" className="title" style={{ fontWeight: 800 }}>
          Trip Tracker
        </a>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="chip" href="/" title="Trip Tracker">Tracker</a>
          <a className="chip" href="/dashboard" title="Dashboard">Dashboard</a>
        </div>
      </div>
    </nav>
  );
}
