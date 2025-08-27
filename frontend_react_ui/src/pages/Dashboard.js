import React, { useEffect, useMemo } from "react";
import "../App.css";

/**
 * Dashboard page shows overview of budget vs. spending with minimal card UI,
 * arranged per design notes:
 * - Row 1: Total Budget vs. Spent + Daily Allowance vs. Spent (two-column row)
 * - Row 2: Remaining Funds (single card centered)
 * - Category Breakdown: single Pie Chart with hover values and a list of categories with amounts below
 */



// Minimal Pie Chart using canvas; centered via parent wrapper.
function MiniPieChart({ data, colors, size = 300 }) {
  /**
   * Canvas donut chart with hover. On hover over a segment, draw the amount
   * on top of that arc using the segment color for the text background.
   */
  const canvasRef = React.useRef(null);
  const [hoverIndex, setHoverIndex] = React.useState(null);

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  // Precompute segment angles for hit testing
  const segments = React.useMemo(() => {
    let start = -Math.PI / 2;
    return data.map((d) => {
      const angle = (d.value / total) * Math.PI * 2;
      const seg = { start, end: start + angle, value: d.value };
      start += angle;
      return seg;
    });
  }, [data, total]);

  // Draw chart (and hover overlay)
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
    const innerR = r * 0.55;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw slices
    segments.forEach((seg, i) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, seg.start, seg.end);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
    });

    // Donut hole
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Hover label if any
    if (hoverIndex !== null && segments[hoverIndex]) {
      const seg = segments[hoverIndex];
      const mid = (seg.start + seg.end) / 2;
      const ringR = (r + innerR) / 2;

      const tx = cx + Math.cos(mid) * ringR;
      const ty = cy + Math.sin(mid) * ringR;

      const amount = `$${Math.round(data[hoverIndex].value).toLocaleString()}`;
      const color = colors[hoverIndex % colors.length];

      // Draw rounded pill background directly on arc center
      ctx.font = "bold 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell";
      const textW = ctx.measureText(amount).width;
      const padX = 8;
      const padY = 4;
      const pillW = textW + padX * 2;
      const pillH = 20;
      const rx = tx - pillW / 2;
      const ry = ty - pillH / 2;
      const radius = 10;

      // Semi-transparent colored background to ensure readability
      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.arcTo(rx + pillW, ry, rx + pillW, ry + pillH, radius);
      ctx.arcTo(rx + pillW, ry + pillH, rx, ry + pillH, radius);
      ctx.arcTo(rx, ry + pillH, rx, ry, radius);
      ctx.arcTo(rx, ry, rx + pillW, ry, radius);
      ctx.closePath();
      ctx.fillStyle = color + "CC"; // add alpha
      ctx.fill();

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(amount, tx, ty);
    }
  }, [data, colors, size, segments, hoverIndex]);

  // Hit testing on mouse move
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cx = canvas.clientWidth / 2;
      const cy = canvas.clientHeight / 2;
      const r = (canvas.clientWidth / 2) * 0.9;
      const innerR = r * 0.55;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < innerR || dist > r) {
        if (hoverIndex !== null) setHoverIndex(null);
        return;
      }

      let angle = Math.atan2(dy, dx); // -PI..PI
      // convert to our start reference (-PI/2)
      angle -= -Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;

      // Convert back to absolute angle space used in segments (starting at -PI/2)
      const absoluteAngle = angle - Math.PI / 2;

      // Since segments are stored in -PI/2 space already, normalize angle accordingly
      let found = null;
      segments.forEach((seg, i) => {
        // normalize: ensure angle in [seg.start, seg.end) considering wrap
        const a = seg.start;
        const b = seg.end;
        // Because our constructed angle above is equivalent to (raw atan2) already aligned with seg.start,
        // we can compare using the raw atan2 result:
        let theta = Math.atan2(dy, dx); // -PI..PI
        if (theta < -Math.PI / 2) theta += Math.PI * 2; // wrap so start at -PI/2
        if (theta >= seg.start && theta < seg.end) {
          found = i;
        }
      });

      if (found !== null) {
        if (hoverIndex !== found) setHoverIndex(found);
      } else if (hoverIndex !== null) {
        setHoverIndex(null);
      }
    };

    const handleLeave = () => setHoverIndex(null);

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
    };
  }, [segments, hoverIndex]);

  return (
    <canvas
      aria-label={`Category shares donut. Total ${total}. Hover segments to see amount.`}
      role="img"
      ref={canvasRef}
      style={{ cursor: "pointer" }}
    />
  );
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
      <section className="hero" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.92), #fff)" }}>
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
        <div className="card floating-card card--loose" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <div className="card-header" style={{ paddingBottom: 2 }}>
            <h2 className="card-title">Overview</h2>
            <p className="card-subtext">Quick snapshot of your trip finances.</p>
          </div>

          {/* Overview cards grid per layout_mapping_and_implementation.md */}
          <section className="overview section section--flush-top" aria-labelledby="overview-h">
            <header className="header">
              <h2 id="overview-h" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
                Overview
              </h2>
            </header>

            <div className="cards">
              {/* Total Budget vs Spent (left of row 1) */}
              <article className="card card--compact" aria-live="polite">
                <h3 className="info-title">Total Budget vs. Spent</h3>
                <p className="info-text">
                  Budget: <strong>{formatCurrency(totalBudget)}</strong> — Spent:{" "}
                  <strong style={{ color: "var(--pink)" }}>{formatCurrency(spentTotal)}</strong>
                </p>

                {/* Dotted progress box */}
                <div className="dotted-box dotted-box--row" aria-label={`Utilization ${utilizationTotal} percent`}>
                  <div className="progress-bg">
                    <div className="progress-fill" style={{ width: `${utilizationTotal}%` }} />
                  </div>
                </div>

                <div className="footer-row">
                  <span className="summary-label">Utilization</span>
                  <span className="pill">{utilizationTotal}%</span>
                </div>
              </article>

              {/* Daily Allowance vs Spent (right of row 1) */}
              <article className="card card--compact">
                <h3 className="info-title">Daily Allowance vs. Spent</h3>
                <p className="info-text">
                  Daily Allowance: <strong>{formatCurrency(dailyAllowance)}</strong> — Today:{" "}
                  <strong style={{ color: "var(--blue)" }}>{formatCurrency(spentToday)}</strong>
                </p>

                <div className="dotted-box" aria-label={`Today's utilization ${utilizationToday} percent`}>
                  <div className="progress-bg">
                    <div className="progress-fill" style={{ width: `${utilizationToday}%` }} />
                  </div>
                </div>

                <div className="footer-row">
                  <span className="summary-label">Today’s Utilization</span>
                  <span className="pill">{utilizationToday}%</span>
                </div>
              </article>

              {/* Remaining Funds (row 2 centered, full width container with max-width) */}
              <article
                className="card card--compact"
                style={{
                  gridColumn: "1 / -1",
                  maxWidth: 560,
                  margin: "0 auto",
                  width: "100%",
                }}
              >
                <h3 className="info-title">Remaining Funds</h3>
                <p className="info-text">
                  Remaining: <strong style={{ color: "var(--green)" }}>{formatCurrency(remaining)}</strong>
                </p>

                <div className="dotted-box" style={{ justifyContent: "space-between" }}>
                  <span className="pill">Cushion</span>
                  <span className="summary-value accent" style={{ color: "var(--blue)", fontWeight: 800 }}>
                    {remaining > 0 ? "On Track" : "Exceeded"}
                  </span>
                </div>
              </article>
            </div>
          </section>

          {/* Category Breakdown: Only a donut pie + list of categories/amounts */}
          <section className="category-breakdown section" aria-labelledby="cat-h" style={{ marginTop: 28 }}>
            <div className="card-header">
              <h3 id="cat-h" className="card-title" style={{ fontSize: "1.1rem" }}>
                Category Breakdown
              </h3>
              <p className="card-subtext">Food, Transport, Shopping, Entertainment, Misc.</p>
            </div>

            {/* Centered Pie Chart */}
            <div className="pie-wrapper">
              <MiniPieChart data={categories} colors={colors} size={300} />
            </div>

            {/* List of categories with amounts */}
            <div className="category-list">
              {categories.map((c, i) => (
                <div key={c.label} className="category-list-row">
                  <div className="category-list-left">
                    <span
                      aria-hidden="true"
                      className="category-dot"
                      style={{ background: colors[i % colors.length] }}
                    />
                    <span className="category-name">{c.label}</span>
                  </div>
                  <div className="category-amount">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(c.value)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="actions" style={{ marginTop: 22 }}>
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
