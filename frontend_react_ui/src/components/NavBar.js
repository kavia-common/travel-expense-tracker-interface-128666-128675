import React from "react";
import "../App.css";

/**
 * Minimal top navigation bar with links to Trip Setup, Expense Logging, and Dashboard.
 * Uses native anchors; App manages light client-side routing to avoid extra deps.
 *
 * Enhancement: Adds travel and savings icons near the "Trip Tracker" title using inline SVGs
 * to keep the bundle light and preserve the clean/minimal aesthetic.
 */

// Small inline SVG icons to avoid external dependency
function PlaneIcon({ size = 18, color = "#0a0a0a" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M10.5 12.5L3 9.5l1-1.8 7 2.2 6.8-6.8c.6-.6 1.6-.6 2.2 0s.6 1.6 0 2.2L13.2 12l2.2 7-1.8 1-3-7.5L8 19l-1.5-1.5 4-6z"
        fill={color}
        opacity="0.9"
      />
    </svg>
  );
}

function PiggyBankIcon({ size = 18, color = "#0a0a0a" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M19 8.5c.6 0 1.1.5 1.1 1.1S19.6 10.7 19 10.7s-1.1-.5-1.1-1.1S18.4 8.5 19 8.5z"
        fill={color}
      />
      <path
        d="M7 8.5C7.8 6.4 10 5 12.5 5c.5 0 1 .1 1.5.2V4c0-.6.4-1 1-1s1 .4 1 1v1.6c2 .9 3.4 2.8 3.9 5h1.1c.6 0 1 .4 1 1v2.9c0 .6-.4 1-1 1h-1.1c-.4 1.7-1.4 3.1-2.8 4H14l-.7 1.4c-.2.4-.6.6-1 .6H9.5c-.4 0-.8-.2-1-.6L7.8 19H7c-2.8 0-5-2.2-5-5 0-2.3 1.6-4.3 3.7-4.9.6-.2 1.3-.3 2-.3h.3z"
        fill={color}
        opacity="0.9"
      />
    </svg>
  );
}

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
            color: "var(--black)",
          }}
          aria-label="Trip Tracker home"
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              paddingRight: 6,
              borderRight: "1px solid var(--gray-100)",
            }}
          >
            <PlaneIcon size={18} />
            <PiggyBankIcon size={18} />
          </span>
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
