import React from "react";
import "../App.css";
import appIcon from "../assets/app-icon.png";

/**
 * Minimal top navigation bar with links to Trip Setup, Expense Logging, and Dashboard.
 * Uses native anchors; App manages light client-side routing to avoid extra deps.
 */

// PUBLIC_INTERFACE
export default function NavBar() {
  return (
    <nav
      className="navbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "linear-gradient(180deg, rgba(255,255,255,0.9), #fff)",
        borderBottom: "1px solid var(--gray-100)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 0",
        }}
      >
        <a
          href="/"
          className="title"
          style={{
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
          title="Trip Tracker"
        >
          <img
            src={appIcon}
            alt=""
            aria-hidden="true"
            style={{
              width: 28,
              height: 28,
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
          <span>Trip Tracker</span>
        </a>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="chip" href="/" title="Trip Tracker">
            Setup
          </a>
          <a className="chip" href="/expenses" title="Expense Logging">
            Expenses
          </a>
          <a className="chip" href="/dashboard" title="Dashboard">
            Dashboard
          </a>
          <a className="chip" href="/group" title="Group Travel Mode">
            Group
          </a>
        </div>
      </div>
    </nav>
  );
}
