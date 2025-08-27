import React, { useEffect, useMemo } from "react";
import "../App.css";

/**
 * Dashboard page shows overview of budget vs. spending with minimal card UI,
 * arranged per design notes:
 * - Row 1: Total Budget vs. Spent + Daily Allowance vs. Spent (two-column row)
 * - Row 2: Remaining Funds (single card centered)
 * - Category Breakdown: horizontal bars, then a centered Pie Chart
 */

// Basic in-file horizontal bar chart (canvas) to keep bundle light.
function MiniBarChart({ data, colors, width = 600, height = 260, label = "Breakdown" }) {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Padding/layout
    const padding = { top: 24, right: 16, bottom: 24, left: 120 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(1, ...data.map((d) => d.value));
    const barGap = 10;
    const barH = Math.max(10, Math.min(28, (chartH - barGap * (data.length - 1)) / data.length));

    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell";
    ctx.textBaseline = "middle";

    data.forEach((d, i) => {
      const y = padding.top + i * (barH + barGap);
      const w = (d.value / maxVal) * chartW;

      // Label
      ctx.fillStyle = "#3d3d3d";
      ctx.fillText(d.label, 10, y + barH / 2);

      // Track
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(padding.left, y, chartW, barH);

      // Bar
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(padding.left, y, w, barH);

      // Value (at end of bar)
      ctx.fillStyle = "#0a0a0a";
      ctx.fillText(`$${Math.round(d.value).toLocaleString()}`, padding.left + w + 8, y + barH / 2);
    });

    // Title
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "bold 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell";
    ctx.fillText(label, padding.left, 16);
  }, [data, colors, width, height, label]);

  return <canvas aria-label={label} role="img" ref={canvasRef} />;
}

// Minimal Pie Chart using canvas; centered via parent wrapper.
function MiniPieChart({ data, colors, size = 300, label = "Category Shares" }) {
  const canvasRef = React.useRef(null);
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = (size / 2) * 0.9;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw pie
    let start = -Math.PI / 2;
    data.forEach((d, i) => {
      const slice = (d.value / total) * Math.PI * 2;
      const end = start + slice;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      start = end;
    });

    // Inner hole to create donut look (optional, improves aesthetics)
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "bold 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy);
  }, [data, colors, size, label, total]);

  return <canvas aria-label={`${label}. Total ${total}.`} role="img" ref={canvasRef} />;
}

// PUBLIC_INTERFACE
export default function Dashboard() {
  // Demo data; in future connect to real store/backend
  const totalBudget = 1500;
  const spentTotal = 620;
  const dailyAllowance = 120;
  const spentToday = 85;

  const categories = useMemo(
    () => [
      { label: "Food", value: 240 },
      { label: "Transport", value: 120 },
      { label: "Shopping", value: 140 },
      { label: "Entertainment", value: 90 },
      { label: "Misc", value: 30 },
    ],
    []
  );

  const remaining = Math.max(0, totalBudget - spentTotal);
  const colors = ["#ffd600", "#22c55e", "#f43f5e", "#3b82f6", "#6b7280"];

  useEffect(() => {
    document.title = "Dashboard - Trip Overview";
  }, []);

  const formatCurrency = (n) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

  // Derived percentages for dotted progress (for visual cue; no dependency)
  const utilizationTotal = Math.round((spentTotal / totalBudget) * 100);
  const utilizationToday = Math.round((spentToday / dailyAllowance) * 100);

  return (
    <div className="App travel">
      {/* Soft hero */}
      <section className="hero" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.9), #fff)" }}>
        <div className="hero-overlay" style={{ display: "none" }} />
        <div className="hero-content container">
          <h1 className="headline">Dashboard</h1>
          <p className="subtext">
            Overview of your budget and spending. Keep track of your daily allowance and category breakdown.
          </p>
          <div className="accent-legend" aria-hidden="true">
            <span className="chip chip-yellow">Budget</span>
            <span className="chip chip-green">Remaining</span>
            <span className="chip chip-pink">Spent</span>
            <span className="chip chip-blue">Today</span>
          </div>
        </div>
      </section>

      {/* Floating metrics card */}
      <div className="floating-card-wrapper">
        <div className="card floating-card">
          <div className="card-header">
            <h2 className="card-title">Overview</h2>
            <p className="card-subtext">Quick snapshot of your trip finances.</p>
          </div>

          {/* Overview cards grid per layout_mapping_and_implementation.md */}
          <section className="overview" style={{ padding: "0 4px", background: "transparent" }} aria-labelledby="overview-h">
            <h2 id="overview-h" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
              Overview
            </h2>
            <div
              className="cards"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {/* Total Budget vs Spent (left of row 1) */}
              <article className="card" style={{ padding: 16 }} aria-live="polite">
                <h3 className="info-title">Total Budget vs. Spent</h3>
                <p className="info-text">
                  Budget: <strong>{formatCurrency(totalBudget)}</strong> — Spent:{" "}
                  <strong style={{ color: "var(--pink)" }}>{formatCurrency(spentTotal)}</strong>
                </p>

                {/* Dotted progress box */}
                <div
                  className="dotted-box"
                  style={{
                    border: "2px dotted rgba(28,28,28,0.6)",
                    borderRadius: 14,
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                  aria-label={`Utilization ${utilizationTotal} percent`}
                >
                  <div className="progress-bg" style={{ background: "var(--gray-100)", height: 8, borderRadius: 8, width: "100%" }}>
                    <div
                      className="progress-fill"
                      style={{
                        background: "var(--black)",
                        height: "100%",
                        borderRadius: 8,
                        width: `${utilizationTotal}%`,
                        transition: "width 260ms ease",
                      }}
                    />
                  </div>
                </div>

                <div className="footer-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="summary-label">Utilization</span>
                  <span className="pill" style={{ background: "var(--gray-100)", padding: "4px 10px", borderRadius: 999, fontWeight: 800 }}>
                    {utilizationTotal}%
                  </span>
                </div>
              </article>

              {/* Daily Allowance vs Spent (right of row 1) */}
              <article className="card" style={{ padding: 16 }}>
                <h3 className="info-title">Daily Allowance vs. Spent</h3>
                <p className="info-text">
                  Daily Allowance: <strong>{formatCurrency(dailyAllowance)}</strong> — Today:{" "}
                  <strong style={{ color: "var(--blue)" }}>{formatCurrency(spentToday)}</strong>
                </p>

                <div
                  className="dotted-box"
                  style={{
                    border: "2px dotted rgba(28,28,28,0.6)",
                    borderRadius: 14,
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                  aria-label={`Today's utilization ${utilizationToday} percent`}
                >
                  <div className="progress-bg" style={{ background: "var(--gray-100)", height: 8, borderRadius: 8, width: "100%" }}>
                    <div
                      className="progress-fill"
                      style={{
                        background: "var(--black)",
                        height: "100%",
                        borderRadius: 8,
                        width: `${utilizationToday}%`,
                        transition: "width 260ms ease",
                      }}
                    />
                  </div>
                </div>

                <div className="footer-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="summary-label">Today’s Utilization</span>
                  <span className="pill" style={{ background: "var(--gray-100)", padding: "4px 10px", borderRadius: 999, fontWeight: 800 }}>
                    {utilizationToday}%
                  </span>
                </div>
              </article>

              {/* Remaining Funds (row 2 centered, full width container with max-width) */}
              <article
                className="card"
                style={{
                  padding: 16,
                  gridColumn: "1 / -1",
                  maxWidth: 520,
                  margin: "0 auto",
                  width: "100%",
                }}
              >
                <h3 className="info-title">Remaining Funds</h3>
                <p className="info-text">
                  Remaining: <strong style={{ color: "var(--green)" }}>{formatCurrency(remaining)}</strong>
                </p>

                <div
                  className="dotted-box"
                  style={{
                    border: "2px dotted rgba(28,28,28,0.6)",
                    borderRadius: 14,
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span className="pill" style={{ background: "var(--gray-100)", padding: "4px 10px", borderRadius: 999, fontWeight: 800 }}>
                    Cushion
                  </span>
                  <span className="summary-value accent" style={{ color: "var(--blue)", fontWeight: 800 }}>
                    {remaining > 0 ? "On Track" : "Exceeded"}
                  </span>
                </div>
              </article>
            </div>

            {/* Responsive rules inline for simplicity; mirror from notes */}
            <style>{`
              @media (max-width: 767px) {
                .overview .cards { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </section>

          {/* Category Breakdown with bars then centered Pie Chart */}
          <section className="card" style={{ marginTop: 16, padding: 16 }} aria-labelledby="cat-h">
            <div className="card-header" style={{ padding: "0 0 8px 0" }}>
              <h3 id="cat-h" className="card-title" style={{ fontSize: "1.1rem" }}>
                Category Breakdown
              </h3>
              <p className="card-subtext">Food, Transport, Shopping, Entertainment, Misc.</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <MiniBarChart data={categories} colors={colors} width={800} height={260} label="Spending by Category" />
            </div>

            {/* Centered Pie Chart wrapper below the bars */}
            <div
              className="pie-wrapper"
              style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "16px 0 4px" }}
            >
              <MiniPieChart data={categories} colors={colors} size={300} label="Category Shares" />
            </div>
          </section>

          <div className="actions" style={{ marginTop: 18 }}>
            <a className="btn-secondary" href="/" title="Back to Trip Setup">
              ← Back to Trip Setup
            </a>
          </div>
        </div>
      </div>

      <footer className="footer container">
        <p className="footer-text">Stay on top of your travel spending with clear insights.</p>
      </footer>
    </div>
  );
}
