import React, { useEffect, useMemo } from "react";
import "../App.css";

/**
 * Dashboard page shows overview of budget vs. spending with minimal card UI.
 * - Total budget vs. spent
 * - Remaining funds
 * - Daily allowance vs. spent
 * - Category breakdown with a simple bar chart (no external deps)
 */

// Basic in-file chart component to keep bundle light.
// Renders a minimalist horizontal bar chart on a canvas using provided data.
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

    const maxVal = Math.max(1, ...data.map(d => d.value));
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
      { label: "Misc", value: 30 }
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

  // Derived percentages
  const totalUtilizationPct = Math.round((spentTotal / totalBudget) * 100);
  const todaysUtilizationPct = Math.round((spentToday / dailyAllowance) * 100);

  return (
    <div className="App travel">
      {/* Soft hero without photo, consistent spacing */}
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

          {/* Summary stat cards row using dedicated grid and capsules per design notes */}
          <section className="dashboard-summary-row">
            {/* Card 1 */}
            <div className="summary-card card" aria-live="polite">
              <h3 className="summary-card__title">Total Budget vs. Spent</h3>
              <p className="summary-card__meta">
                Budget {formatCurrency(totalBudget)}, Spent{" "}
                <strong style={{ color: "var(--accent-red, #D32F2F)" }}>
                  {formatCurrency(spentTotal)}
                </strong>
              </p>
              <div className="summary-card__capsule">
                <span className="summary-card__label">Utilization</span>
                <span className="summary-card__link" style={{ visibility: "hidden" }}>–</span>
                <span className="summary-card__value">{totalUtilizationPct}%</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="summary-card card">
              <h3 className="summary-card__title">Remaining Funds</h3>
              <p className="summary-card__meta">
                Remaining{" "}
                <strong style={{ color: "var(--accent-green, #2E7D32)" }}>
                  {formatCurrency(remaining)}
                </strong>
              </p>
              <div className="summary-card__capsule">
                <span className="summary-card__label">Condition</span>
                <span className="summary-card__link">On Track</span>
                {/* placeholder keeps right edge aligned across row */}
                <span className="summary-card__value summary-card__value--placeholder">00%</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="summary-card card">
              <h3 className="summary-card__title">Daily Allowance vs. Spent</h3>
              <p className="summary-card__meta">
                Daily Allowance {formatCurrency(dailyAllowance)} – Today{" "}
                <strong style={{ color: "var(--accent-blue, #1E88E5)" }}>
                  {formatCurrency(spentToday)}
                </strong>
              </p>
              <div className="summary-card__capsule">
                <span className="summary-card__label">Today’s utilization</span>
                <span className="summary-card__link" style={{ visibility: "hidden" }}>–</span>
                <span className="summary-card__value">{todaysUtilizationPct}%</span>
              </div>
            </div>
          </section>

          {/* Category chart card */}
          <div className="card" style={{ marginTop: 16, padding: 16 }}>
            <div className="card-header" style={{ padding: "0 0 8px 0" }}>
              <h3 className="card-title" style={{ fontSize: "1.1rem" }}>Category Breakdown</h3>
              <p className="card-subtext">Food, Transport, Shopping, Entertainment, Misc.</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <MiniBarChart
                data={categories}
                colors={colors}
                width={800}
                height={260}
                label="Spending by Category"
              />
            </div>
          </div>

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
