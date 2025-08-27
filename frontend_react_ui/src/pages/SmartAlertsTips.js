import React from "react";
import "../App.css";
import { ExpensesContext, DEFAULT_CATEGORIES } from "../context/ExpensesContext";

/**
 * SmartAlertsTips page
 * - Live Overspending Alerts derived from ExpensesContext (spentToday vs dailyAllowance, spentTotal vs totalBudget, category spikes)
 * - AI-powered Tips (rule-based local heuristics)
 * - "Plan My Day" budget entry UI: user enters budget; we propose a simple day plan across categories
 */

// Local helpers
function currency(n) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}

// PUBLIC_INTERFACE
export default function SmartAlertsTips() {
  const {
    totalBudget,
    dailyAllowance,
    spentTotal,
    spentToday,
    categoriesTotals,
    expenses,
  } = React.useContext(ExpensesContext);

  React.useEffect(() => {
    document.title = "Smart Alerts & Tips";
  }, []);

  // Overspending alerts
  const alerts = React.useMemo(() => {
    const list = [];

    // Today usage alert
    const todayPct = dailyAllowance > 0 ? Math.round((spentToday / dailyAllowance) * 100) : 0;
    if (todayPct >= 120) {
      list.push({
        level: "critical",
        title: "Over daily allowance",
        detail: `You are ${todayPct}% of your daily allowance. Consider pausing non-essential spend.`,
      });
    } else if (todayPct >= 100) {
      list.push({
        level: "warning",
        title: "Reached daily allowance",
        detail: "You’ve hit your daily target. Any additional spend will exceed today’s plan.",
      });
    } else if (todayPct >= 80) {
      list.push({
        level: "info",
        title: "Close to daily limit",
        detail: `You're at ${todayPct}% of today’s budget. Keep an eye on remaining spend.`,
      });
    }

    // Total usage alert
    const totalPct = totalBudget > 0 ? Math.round((spentTotal / totalBudget) * 100) : 0;
    if (totalPct >= 110) {
      list.push({
        level: "critical",
        title: "Over total budget",
        detail: "Total spending has exceeded your trip budget.",
      });
    } else if (totalPct >= 100) {
      list.push({
        level: "warning",
        title: "At total budget",
        detail: "You’ve reached your overall budget. Consider reducing upcoming costs.",
      });
    } else if (totalPct >= 80) {
      list.push({
        level: "info",
        title: "Approaching total budget",
        detail: `You’ve used ${totalPct}% of your trip budget.`,
      });
    }

    // Category spike: detect last 5 expenses concentration in one category
    const recent = expenses.slice(0, 5);
    if (recent.length >= 3) {
      const counts = new Map();
      for (const e of recent) {
        const c = e.category || "Misc";
        counts.set(c, (counts.get(c) || 0) + 1);
      }
      const spike = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      if (spike && spike[1] >= Math.ceil(recent.length * 0.6)) {
        list.push({
          level: "tip",
          title: "Category spike detected",
          detail: `Recent spending clustered in “${spike[0]}”. Consider rebalancing today.`,
        });
      }
    }

    if (list.length === 0) {
      list.push({
        level: "ok",
        title: "All clear",
        detail: "No overspending alerts at the moment.",
      });
    }

    return list;
  }, [dailyAllowance, spentToday, totalBudget, spentTotal, expenses]);

  // AI-like money saving tips (rule-based)
  const tips = React.useMemo(() => {
    const out = [];
    const colorsByLabel = Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.label, c.color]));
    const totalSpent = categoriesTotals.reduce((a, b) => a + b.value, 0) || 1;
    const byShare = categoriesTotals
      .map(c => ({ ...c, share: c.value / totalSpent }))
      .sort((a, b) => b.share - a.share);

    // Top category tip
    if (byShare[0]) {
      const top = byShare[0];
      out.push({
        title: `High spend in ${top.label}`,
        text: `About ${(top.share * 100).toFixed(0)}% of your spend is ${top.label.toLowerCase()}. Plan low-cost alternatives to reduce ${top.label.toLowerCase()} tomorrow.`,
        color: colorsByLabel[top.label] || "#6b7280",
      });
    }

    // Food specific
    const food = categoriesTotals.find(c => c.label === "Food");
    if (food && food.value > dailyAllowance) {
      out.push({
        title: "Food spending exceeds daily allowance",
        text: "Try a grocery pickup or fixed-price lunch menu to lower costs.",
        color: colorsByLabel["Food"] || "#ffd600",
      });
    }

    // Transport optimization
    const transport = categoriesTotals.find(c => c.label === "Transport");
    if (transport && transport.value > 0) {
      out.push({
        title: "Transport optimization",
        text: "Bundle errands or use a day pass/public transit to cut per-trip fares.",
        color: colorsByLabel["Transport"] || "#22c55e",
      });
    }

    // Entertainment balance
    const ent = categoriesTotals.find(c => c.label === "Entertainment");
    if (ent && ent.value > 0) {
      out.push({
        title: "Free entertainment options",
        text: "Check free museum days, parks, or community events to balance paid activities.",
        color: colorsByLabel["Entertainment"] || "#3b82f6",
      });
    }

    // If no specific signal, add general tip
    if (out.length === 0) {
      out.push({
        title: "Small changes, big impact",
        text: "Track categories daily, set micro-goals, and batch costly activities to stay on plan.",
        color: "#6b7280",
      });
    }

    return out.slice(0, 4);
  }, [categoriesTotals, dailyAllowance]);

  // Plan My Day
  const [dayBudget, setDayBudget] = React.useState(80);
  const [plan, setPlan] = React.useState(null);

  // PUBLIC_INTERFACE
  const generatePlan = React.useCallback(() => {
    // Simple proportional allocator across categories with sensible minimums
    const baseline = [
      { label: "Food", min: 20, weight: 3 },
      { label: "Transport", min: 8, weight: 1.5 },
      { label: "Entertainment", min: 0, weight: 1.3 },
      { label: "Shopping", min: 0, weight: 0.8 },
      { label: "Misc", min: 0, weight: 0.6 },
    ];

    // Adjust weights inversely to recent share to encourage rebalancing
    const mapShare = new Map(categoriesTotals.map(c => [c.label, c.value]));
    const totalSpent = categoriesTotals.reduce((a, b) => a + b.value, 0) || 1;

    const adjusted = baseline.map(b => {
      const spent = mapShare.get(b.label) || 0;
      const share = spent / totalSpent;
      // If share is high, reduce weight slightly; if low, increase slightly
      const factor = 1 + (0.2 - Math.min(0.2, share)); // 0.8..1.2 approx
      return { ...b, weight: Math.max(0.4, b.weight * factor) };
    });

    const totalWeight = adjusted.reduce((a, b) => a + b.weight, 0) || 1;
    const afterMins = Math.max(0, dayBudget - adjusted.reduce((a, b) => a + b.min, 0));

    const allocations = adjusted.map(b => {
      const extra = (b.weight / totalWeight) * afterMins;
      return { label: b.label, amount: Math.max(0, Math.round((b.min + extra) * 1) ) };
    });

    // Create a very simple "itinerary" wording
    const activities = [
      { label: "Food", text: "Breakfast + casual lunch" },
      { label: "Transport", text: "Transit day pass or 2–3 rides" },
      { label: "Entertainment", text: "Low-cost attraction or free museum hour" },
      { label: "Shopping", text: "Souvenirs window-shop or small gift" },
      { label: "Misc", text: "Contingency for small surprises" },
    ];

    const items = allocations
      .filter(a => a.amount > 0)
      .map(a => ({
        ...a,
        idea: (activities.find(x => x.label === a.label) || {}).text || "Flexible activity",
      }));

    setPlan({
      budget: dayBudget,
      items,
      total: items.reduce((a, b) => a + b.amount, 0),
    });
  }, [dayBudget, categoriesTotals]);

  const colors = React.useMemo(() => Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.label, c.color])), []);

  const utilizationToday = Math.round((spentToday / (dailyAllowance || 1)) * 100);

  return (
    <div className="App travel">
      <section className="hero" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.92), #fff)" }}>
        <div className="hero-overlay" style={{ display: "none" }} />
        <div className="hero-content container">
          <h1 className="headline">Smart Alerts & Tips</h1>
          <p className="subtext">
            Live spending alerts, simple AI-like tips, and a quick "Plan My Day" budget helper.
          </p>
          <div className="accent-legend" aria-hidden="true">
            <span className="chip chip-yellow">Budget</span>
            <span className="chip chip-green">Tips</span>
            <span className="chip chip-pink">Activities</span>
            <span className="chip chip-blue">Today</span>
          </div>
        </div>
      </section>

      <div className="floating-card-wrapper">
        <div className="card floating-card card--loose" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <div className="card-header" style={{ paddingBottom: 2 }}>
            <h2 className="card-title">Overspending Alerts</h2>
            <p className="card-subtext">
              Based on your current spending and budgets. Today’s utilization: <strong>{utilizationToday}%</strong>
            </p>
            <small className="hint" aria-live="polite">
              Placeholder: live alerts will evolve with richer rules and visual states.
            </small>
          </div>

          <div className="section section--flush-top" style={{ display: "grid", gap: 10 }}>
            {alerts.map((a, i) => (
              <div
                key={i}
                className="dotted-box"
                aria-live="polite"
                style={{
                  borderColor:
                    a.level === "critical"
                      ? "rgba(244,63,94,0.8)"
                      : a.level === "warning"
                      ? "rgba(255,214,0,0.9)"
                      : a.level === "info"
                      ? "rgba(59,130,246,0.6)"
                      : "rgba(10,10,10,0.6)",
                  gap: 8,
                  alignItems: "flex-start",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="dot"
                    style={{
                      background:
                        a.level === "critical"
                          ? "var(--pink)"
                          : a.level === "warning"
                          ? "var(--yellow)"
                          : a.level === "info"
                          ? "var(--blue)"
                          : "var(--green)",
                    }}
                    aria-hidden="true"
                  />
                  <strong>{a.title}</strong>
                </div>
                <div className="info-text" style={{ margin: 0 }}>{a.detail}</div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="dotted-box" role="status">
                <span className="summary-label">No alerts</span>
                <span className="pill">All clear</span>
              </div>
            )}
          </div>

          <div className="rule" />

          <div className="card-header" style={{ paddingBottom: 2 }}>
            <h2 className="card-title">AI-powered Tips</h2>
            <p className="card-subtext">Simple suggestions to help you save more, powered by local rules.</p>
            <small className="hint">
              Placeholder: category-based AI tips will be enhanced with backend-driven insights.
            </small>
          </div>

          <section className="section" aria-labelledby="tips-h">
            <h3 id="tips-h" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
              Tips
            </h3>
            <div className="info-cards" style={{ marginTop: 12, padding: 0, gap: 12 }}>
              {tips.map((t, i) => (
                <article key={i} className="info-card card" style={{ gridColumn: "span 12" }}>
                  <h4 className="info-title" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span aria-hidden="true" className="category-dot" style={{ background: t.color }} />
                    {t.title}
                  </h4>
                  <p className="info-text" style={{ marginTop: 4 }}>{t.text}</p>
                </article>
              ))}
              {tips.length === 0 && (
                <article className="info-card card" style={{ gridColumn: "span 12" }}>
                  <h4 className="info-title">Tips placeholder</h4>
                  <p className="info-text">Tips will appear here once data is available.</p>
                </article>
              )}
            </div>
          </section>

          <div className="rule" />

          <div className="card-header" style={{ paddingBottom: 2 }}>
            <h2 className="card-title">Plan My Day</h2>
            <p className="card-subtext">Enter a day budget and get a simple, balanced plan.</p>
            <small className="hint">
              Placeholder: enter a value and click Generate Plan to view a suggested allocation.
            </small>
          </div>

          <section className="section" aria-labelledby="pmd-h">
            <h3 id="pmd-h" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
              Plan My Day
            </h3>
            <div className="inputs-grid" style={{ marginTop: 6 }}>
              <div className="field">
                <label className="label">
                  Day budget
                  <span className="dot dot-yellow" />
                </label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    className="input"
                    value={dayBudget}
                    onChange={(e) => setDayBudget(Number(e.target.value))}
                    aria-label="Day budget"
                  />
                </div>
                <small className="hint">We’ll propose a simple allocation across categories.</small>
              </div>
            </div>

            <div className="actions">
              <button type="button" className="btn-primary" onClick={generatePlan}>Generate Plan</button>
              <a className="btn-secondary" href="/expenses" title="Log an expense">Log Expense →</a>
            </div>

            {!plan && (
              <div className="summary card" aria-live="polite" style={{ marginTop: 14 }}>
                <div className="summary-row">
                  <span className="summary-label">Plan Preview</span>
                  <span className="summary-value">No plan generated yet</span>
                </div>
                <p className="info-text" style={{ marginTop: 6 }}>
                  Enter a budget above and click “Generate Plan” to see a suggested split for the day.
                </p>
              </div>
            )}

            {plan && (
              <div className="summary card" style={{ marginTop: 14 }}>
                <div className="summary-row">
                  <span className="summary-label">Planned budget</span>
                  <span className="summary-value">{currency(plan.budget)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Allocated total</span>
                  <span className="summary-value accent" style={{ color: "var(--blue)" }}>
                    {currency(plan.total)}
                  </span>
                </div>
                <div className="rule" />
                <div className="category-list" style={{ marginTop: 6 }}>
                  {plan.items.map((it) => (
                    <div key={it.label} className="category-list-row">
                      <div className="category-list-left">
                        <span
                          aria-hidden="true"
                          className="category-dot"
                          style={{ background: colors[it.label] || "#6b7280" }}
                        />
                        <span className="category-name">{it.label}</span>
                      </div>
                      <div className="category-amount">{currency(it.amount)}</div>
                    </div>
                  ))}
                </div>
                <div className="footer-row" style={{ marginTop: 10 }}>
                  <span className="pill">Idea</span>
                  <span className="summary-value" style={{ fontWeight: 600 }}>
                    {plan.items.map(i => i.idea).filter(Boolean)[0] || "Keep it flexible and fun"}
                  </span>
                </div>
              </div>
            )}
          </section>

          <div className="actions" style={{ marginTop: 22 }}>
            <a className="btn-secondary" href="/dashboard" title="Back to Dashboard">← Back to Dashboard</a>
            <a className="btn-secondary" href="/" title="Back to Trip Setup">Trip Setup</a>
          </div>
        </div>
      </div>

      <footer className="footer container">
        <p className="footer-text">Stay on track with smart guidance and a light daily plan.</p>
      </footer>
    </div>
  );
}
