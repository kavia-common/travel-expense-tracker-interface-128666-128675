import React, { useEffect, useMemo } from "react";
import "../App.css";
import CategoryBreakdownPieChart from "../components/CategoryBreakdownPieChart";
import { useExpenses } from "../context/ExpensesContext";

/**
 * Dashboard page shows overview of budget vs. spending with minimal card UI.
 * - Total budget vs. spent
 * - Remaining funds
 * - Daily allowance vs. spent
 * - Category breakdown with a pie chart (Recharts)
 * - Smart Alerts & Tips (mock AI suggestions)
 *
 * Now connected to the global Expenses store for live updates.
 */

// PUBLIC_INTERFACE
export default function Dashboard() {
  const { expenses, totalBudget, dailyAllowance } = useExpenses();

  // Compute totals from expenses
  const spentTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  // Today’s date string (yyyy-mm-dd)
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Today’s spending
  const spentToday = useMemo(
    () =>
      expenses
        .filter((e) => e.date === todayStr)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses, todayStr]
  );

  // Average daily spending based on available history
  const avgDaily = useMemo(() => {
    if (expenses.length === 0) return 0;
    const byDay = new Map();
    for (const e of expenses) {
      const key = e.date || "unknown";
      const amt = Number(e.amount) || 0;
      byDay.set(key, (byDay.get(key) || 0) + amt);
    }
    const days = byDay.size || 1;
    const total = Array.from(byDay.values()).reduce((a, b) => a + b, 0);
    return total / days;
  }, [expenses]);

  // Category totals
  const categories = useMemo(() => {
    if (!expenses.length) {
      // Keep a friendly initial sample when empty
      return [
        { label: "Food", value: 240 },
        { label: "Transport", value: 120 },
        { label: "Shopping", value: 140 },
        { label: "Entertainment", value: 90 },
        { label: "Misc", value: 30 },
      ];
    }
    const map = new Map();
    for (const e of expenses) {
      const key = e.category || "Misc";
      const v = Number(e.amount) || 0;
      map.set(key, (map.get(key) || 0) + v);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [expenses]);

  const remaining = Math.max(0, totalBudget - spentTotal);
  const colors = ["#ffd600", "#22c55e", "#f43f5e", "#3b82f6", "#6b7280"];

  useEffect(() => {
    document.title = "Dashboard - Trip Overview";
  }, []);

  const formatCurrency = (n) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n || 0);

  // Derived percentages (guard divide-by-zero)
  const totalUtilizationPct =
    totalBudget > 0 ? Math.round((spentTotal / totalBudget) * 100) : 0;
  const todaysUtilizationPct =
    dailyAllowance > 0 ? Math.round((spentToday / dailyAllowance) * 100) : 0;

  // ALERTS: Overspending trend detection (mock heuristic)
  // If today's spending is > avgDaily by 20% or more, show an alert.
  // If no history, base against dailyAllowance if provided.
  const overspendAlert = useMemo(() => {
    let basis = avgDaily;
    if (basis === 0 && dailyAllowance > 0) basis = dailyAllowance;
    if (basis === 0) return null;

    const delta = spentToday - basis;
    const pct = basis > 0 ? Math.round((delta / basis) * 100) : 0;
    if (pct >= 20) {
      return `You’ve spent ${pct}% more than average today.`;
    }
    // Also warn if utilization today exceeds 90%
    if (dailyAllowance > 0 && todaysUtilizationPct >= 90) {
      return `Heads up: You’ve used ${todaysUtilizationPct}% of today’s allowance.`;
    }
    return null;
  }, [avgDaily, spentToday, dailyAllowance, todaysUtilizationPct]);

  // TIPS: Mock AI-style money-saving tips based on category and patterns
  const tips = useMemo(() => {
    const tipsOut = [];

    // Find top 2 categories by spend to tailor suggestions
    const topCats = [...categories]
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .map((c) => c.label);

    const hasFood = topCats.includes("Food");
    const hasTransport = topCats.includes("Transport");
    const hasShopping = topCats.includes("Shopping");
    const hasEntertainment = topCats.includes("Entertainment");

    // General tip if utilization high
    if (totalBudget > 0 && totalUtilizationPct > 75) {
      tipsOut.push(
        `Your trip spending is at ${totalUtilizationPct}% of budget. Consider a no-spend morning or a low-cost activity to rebalance.`
      );
    }

    if (hasFood) {
      tipsOut.push(
        "Food tip: Try one sit-down meal per day and choose local markets or take-away for the rest. It can cut daily food costs by 20–30%."
      );
    }
    if (hasTransport) {
      tipsOut.push(
        "Transport tip: Look into day passes or multi-ride tickets—often cheaper than single fares if you take 3+ rides."
      );
    }
    if (hasShopping) {
      tipsOut.push(
        "Shopping tip: Set a small souvenir cap per day and batch purchases at the end—this curbs impulse buys."
      );
    }
    if (hasEntertainment) {
      tipsOut.push(
        "Entertainment tip: Many museums have free hours or discount days. Check schedules to save without missing highlights."
      );
    }

    // If today overspending, give a tactical tip
    if (overspendAlert) {
      tipsOut.push(
        "Today-only tip: Swap one paid activity for a scenic walk or free landmark. Small changes help stay on track."
      );
    }

    // A default gentle tip if nothing triggered
    if (tipsOut.length === 0) {
      tipsOut.push(
        "General tip: Plan tomorrow’s main meal and book ahead if possible—planning reduces last-minute pricier choices."
      );
    }

    // De-duplicate and cap count for brevity
    const unique = Array.from(new Set(tipsOut));
    return unique.slice(0, 4);
  }, [categories, totalBudget, totalUtilizationPct, overspendAlert]);

  return (
    <div className="App travel">
      {/* Soft hero without photo, consistent spacing */}
      <section
        className="hero"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.9), #fff)" }}
      >
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
          <section className="dashboard-summary-row" aria-label="Overview summary cards">
            {/* Card 1: Total Budget vs Spent (left, row 1) */}
            <div className="summary-card card card--half" aria-live="polite" role="region" aria-labelledby="tbvs-title">
              <h3 id="tbvs-title" className="summary-card__title">Total Budget vs. Spent</h3>
              <p className="summary-card__meta">
                Budget {formatCurrency(totalBudget)}, Spent{" "}
                <strong style={{ color: "var(--accent-red, #D32F2F)" }}>
                  {formatCurrency(spentTotal)}
                </strong>
              </p>
              <div className="summary-card__capsule" aria-label={`Utilization ${totalUtilizationPct}%`}>
                <span className="summary-card__label">Utilization</span>
                <span className="summary-card__link" style={{ visibility: "hidden" }}>–</span>
                <span className="summary-card__value">{totalUtilizationPct}%</span>
              </div>
            </div>

            {/* Card 2: Daily Allowance vs Spent (right, row 1 after swap) */}
            <div className="summary-card card card--half" role="region" aria-labelledby="davs-title">
              <h3 id="davs-title" className="summary-card__title">Daily Allowance vs. Spent</h3>
              <p className="summary-card__meta">
                Daily Allowance {formatCurrency(dailyAllowance)} – Today{" "}
                <strong style={{ color: "var(--accent-blue, #1E88E5)" }}>
                  {formatCurrency(spentToday)}
                </strong>
              </p>
              <div className="summary-card__capsule" aria-label={`Today's utilization ${todaysUtilizationPct}%`}>
                <span className="summary-card__label">Today’s utilization</span>
                <span className="summary-card__link" style={{ visibility: "hidden" }}>–</span>
                <span className="summary-card__value">{todaysUtilizationPct}%</span>
              </div>
            </div>

            {/* Card 3: Remaining Funds (centered below row 1) */}
            <div className="summary-card card card--centerWide" role="region" aria-labelledby="remaining-title">
              <h3 id="remaining-title" className="summary-card__title">Remaining Funds</h3>
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
          </section>

          {/* Category pie chart card */}
          <div className="card" style={{ marginTop: 16, padding: 16 }}>
            <div className="card-header" style={{ padding: "0 0 8px 0" }}>
              <h3 className="card-title" style={{ fontSize: "1.1rem" }}>Category Breakdown</h3>
              <p className="card-subtext">Food, Transport, Shopping, Entertainment, Misc.</p>
            </div>
            <CategoryBreakdownPieChart
              data={categories}
              colors={colors}
              height={280}
              title="Spending by Category"
            />
          </div>

          {/* Smart Alerts & Tips section */}
          <div className="card" style={{ marginTop: 16, padding: 16 }}>
            <div className="card-header" style={{ padding: "0 0 8px 0" }}>
              <h3 className="card-title" style={{ fontSize: "1.1rem" }}>Smart Alerts & Tips</h3>
              <p className="card-subtext">Stay on track with spending alerts and tailored suggestions.</p>
            </div>

            {/* Alert capsule */}
            <div
              className="summary-card__capsule"
              role="status"
              aria-live="polite"
              style={{
                borderColor: overspendAlert ? "var(--pink, #F43F5E)" : "var(--border-dashed, #BDBDBD)",
                background: overspendAlert ? "rgba(244,63,94,0.06)" : "#fff",
                marginBottom: 12,
              }}
            >
              <span className="summary-card__label">Alert</span>
              <span
                className="summary-card__link"
                style={{
                  color: overspendAlert ? "var(--accent-red, #D32F2F)" : "var(--text-muted, #6B6B6B)",
                  fontWeight: overspendAlert ? 800 : 600,
                }}
              >
                {overspendAlert ? overspendAlert : "No alerts. You’re on track today."}
              </span>
              <span className="summary-card__value summary-card__value--placeholder">–</span>
            </div>

            {/* Tips list */}
            <ul
              aria-label="Money-saving tips"
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gap: 8,
              }}
            >
              {tips.map((t, idx) => (
                <li
                  key={`tip_${idx}`}
                  className="summary-card"
                  style={{
                    padding: "10px 12px",
                    minHeight: "auto",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    alignItems: "start",
                    gap: 10,
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 16 }}>💡</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-strong, #0B0B0B)" }}>
                      {t}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted, #6B6B6B)" }}>
                      Tip generated based on recent spend patterns.
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="actions" style={{ marginTop: 18 }}>
            <a className="btn-secondary" href="/" title="Back to Trip Tracker">
              ← Back to Trip Tracker
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
