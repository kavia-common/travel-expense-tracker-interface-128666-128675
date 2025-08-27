import React from "react";
import "../App.css";
import { ExpensesContext, DEFAULT_CATEGORIES } from "../context/ExpensesContext";

/**
 * SmartAlertsTips page
 * - Live Overspending Alerts derived from ExpensesContext (spentToday vs average daily spend and dailyAllowance, totalBudget, category spikes)
 * - AI-powered Tips (rule-based local heuristics)
 * - "Plan My Day" budget entry UI: user enters budget; we propose a day plan across categories using local logic and savings heuristics
 */

// Local helpers
function currency(n) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}

// Helper: group expenses by yyyy-mm-dd and compute stats
function computeDailyStats(expenses) {
  const map = new Map();
  for (const e of expenses) {
    const d = e.date;
    if (!d) continue;
    map.set(d, (map.get(d) || 0) + Number(e.amount || 0));
  }
  const days = [...map.keys()];
  const totals = [...map.values()];
  const sum = totals.reduce((a, b) => a + b, 0);
  const avg = days.length > 0 ? sum / days.length : 0;
  return { daysCount: days.length, average: avg, byDay: map, total: sum };
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

  // Compute historical average daily spend from context
  const { average: averageDailySpend } = React.useMemo(() => computeDailyStats(expenses), [expenses]);

  // Threshold: show prominent warning if today's spending exceeds average by 25% (configurable)
  const OVERRUN_THRESHOLD = 0.25;

  // Overspending alerts
  const alerts = React.useMemo(() => {
    const list = [];

    // A) New: Compare today's spend to historical average daily spend
    const exceedsAvg = averageDailySpend > 0 ? (spentToday - averageDailySpend) / averageDailySpend : 0;
    if (averageDailySpend > 0 && exceedsAvg >= OVERRUN_THRESHOLD) {
      const overPct = Math.round(exceedsAvg * 100);
      list.push({
        level: "critical",
        title: "Overspending trend detected",
        detail: `You’ve spent ${overPct}% more than your average daily spend today (${currency(spentToday)} vs avg ${currency(averageDailySpend)}).`,
        kind: "avgDailyOverrun",
      });
    }

    // B) Today usage alert against daily allowance
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

    // C) Total usage alert
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

    // D) Category spike: detect last 5 expenses concentration in one category
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
  }, [averageDailySpend, dailyAllowance, spentToday, totalBudget, spentTotal, expenses]);

  // AI-like money saving tips (rule-based) — dynamic and category-aware
  const tips = React.useMemo(() => {
    const tipsOut = [];
    const colorsByLabel = Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.label, c.color]));

    // Totals and shares
    const totalSpentAllTime = categoriesTotals.reduce((a, b) => a + (b.value || 0), 0);
    const safeDen = totalSpentAllTime > 0 ? totalSpentAllTime : 1;
    const ranked = categoriesTotals
      .map(c => ({ ...c, share: (c.value || 0) / safeDen }))
      .sort((a, b) => b.share - a.share);

    // Helper: get recent spend per category (last N expenses) to detect fresh spikes
    const recentN = 10;
    const recent = expenses.slice(0, recentN);
    const recentTotals = recent.reduce((acc, e) => {
      const k = e.category || "Misc";
      acc[k] = (acc[k] || 0) + Number(e.amount || 0);
      return acc;
    }, {});
    const recentTop = Object.entries(recentTotals).sort((a, b) => b[1] - a[1])[0];

    // 1) Tip: Top category overall with actionable suggestion per category
    if (ranked[0]) {
      const top = ranked[0];
      const label = top.label;
      const pct = Math.round(top.share * 100);

      const suggestionByCategory = {
        Food: "Plan one meal as DIY or pick a fixed-price lunch. Carry a water bottle and snacks to avoid impulse buys.",
        Transport: "Consider a day pass or bundle trips; walk short distances to cut per-ride costs.",
        Shopping: "Set a souvenir cap and compare prices; batch shopping to a single window to avoid multiple small splurges.",
        Entertainment: "Look up free museum hours, parks, or community events to balance paid activities.",
        Misc: "Review small recurring add-ons; keep a small buffer and avoid ATM fees by planning cash needs.",
      };
      tipsOut.push({
        title: `Top spend: ${label} (${pct}% of total)`,
        text: suggestionByCategory[label] || "Plan lower-cost alternatives and batch discretionary spend to reduce this category.",
        color: colorsByLabel[label] || "#6b7280",
      });
    }

    // 2) Tip: Recent spike focus (if a category surged in the last few entries)
    if (recentTop && recent.length >= 3) {
      const [label, amt] = recentTop;
      if (amt > 0) {
        tipsOut.push({
          title: `Recent spike in ${label}`,
          text: `Your last ${Math.min(recent.length, recentN)} expenses lean toward ${label.toLowerCase()}. Plan a no-${label.toLowerCase()} half-day to rebalance.`,
          color: colorsByLabel[label] || "#6b7280",
        });
      }
    }

    // 3) Tip: If today's spending is high vs. allowance, give targeted advice against the top active category today
    if (dailyAllowance > 0 && spentToday > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayTotals = expenses
        .filter(e => e.date === todayStr)
        .reduce((acc, e) => {
          const k = e.category || "Misc";
          acc[k] = (acc[k] || 0) + Number(e.amount || 0);
          return acc;
        }, {});
      const topToday = Object.entries(todayTotals).sort((a, b) => b[1] - a[1])[0];
      const todayPct = Math.round((spentToday / dailyAllowance) * 100);
      if (topToday && todayPct >= 80) {
        const [label] = topToday;
        const microAdvice = {
          Food: "Pick one affordable meal and one splurge; skip desserts/drinks to stay within plan.",
          Transport: "Combine routes and avoid peak-time premiums; consider walking short legs.",
          Shopping: "Delay purchases 24h; add to a list and buy only if it still matters tomorrow.",
          Entertainment: "Swap one paid activity with a free local experience.",
          Misc: "Hold non-urgent buys until tomorrow to keep today under control.",
        };
        tipsOut.push({
          title: `Close to today's limit`,
          text: `${todayPct}% of daily budget used. ${microAdvice[label] || "Trim one discretionary item to keep today on track."}`,
          color: "#246BFD",
        });
      }
    }

    // 4) Tip: If Food alone exceeds daily allowance (frequent traveler pain point)
    const food = categoriesTotals.find(c => c.label === "Food");
    if (food && dailyAllowance > 0 && food.value > dailyAllowance) {
      tipsOut.push({
        title: "Food overshoot vs daily allowance",
        text: "Try a grocery pickup for breakfast items and target fixed-price lunch menus; set a per-meal cap.",
        color: colorsByLabel["Food"] || "#ffd600",
      });
    }

    // 5) Tip: If total budget utilization is high, suggest global throttle
    const totalPct = totalBudget > 0 ? Math.round((spentTotal / totalBudget) * 100) : 0;
    if (totalPct >= 80 && spentTotal < totalBudget) {
      tipsOut.push({
        title: "Near your total budget",
        text: "Pick a ‘low-spend’ day: free activities + walking + set-and-forget meal plan.",
        color: "#111827",
      });
    }

    // Fallback: Always show at least one general tip
    if (tipsOut.length === 0) {
      tipsOut.push({
        title: "Small changes, big impact",
        text: "Set tiny daily targets per category and batch paid activities every other day to reduce drift.",
        color: "#6b7280",
      });
    }

    // De-duplicate similar titles while keeping first occurrence
    const seen = new Set();
    const deduped = tipsOut.filter(t => {
      if (seen.has(t.title)) return false;
      seen.add(t.title);
      return true;
    });

    return deduped.slice(0, 5);
  }, [categoriesTotals, expenses, dailyAllowance, spentToday, spentTotal, totalBudget]);

  // Plan My Day
  const [dayBudget, setDayBudget] = React.useState(80);
  const [plan, setPlan] = React.useState(null);
  const [savingsNotes, setSavingsNotes] = React.useState([]);

  // Internal helper: generate savings heuristics based on budget level and allocations
  function computeSavings(items, budget) {
    const notes = [];
    const byLabel = Object.fromEntries(items.map(i => [i.label, i.amount || 0]));

    // General tiered guidance based on budget size
    if (budget < 40) {
      notes.push("Leverage free attractions and walk between sights to save on transport.");
    } else if (budget < 80) {
      notes.push("Target a fixed-price lunch and 1–2 short transit rides; pick one low-cost highlight.");
    } else {
      notes.push("Bundle paid activities with one free experience to keep value high under budget.");
    }

    // Category-specific nudges
    if ((byLabel.Food || 0) >= budget * 0.35) {
      notes.push("Swap one restaurant meal for grab-and-go or grocery breakfast to trim food costs.");
    }
    if ((byLabel.Transport || 0) >= 12) {
      notes.push("Consider a transit day pass if you expect 3+ rides, or plan a walking loop.");
    }
    if ((byLabel.Entertainment || 0) > 0 && (byLabel.Entertainment || 0) >= (byLabel.Food || 0)) {
      notes.push("Look for free museum hours/parks to balance paid entertainment.");
    }
    if ((byLabel.Shopping || 0) > 0) {
      notes.push("Set a souvenir cap and batch shopping into one window to avoid multiple small splurges.");
    }
    return notes.slice(0, 4);
  }

  // PUBLIC_INTERFACE
  const generatePlan = React.useCallback(() => {
    // Baseline categories with minimums and weights
    const baseline = [
      { label: "Food", min: 18, weight: 3.0 },
      { label: "Transport", min: 6, weight: 1.4 },
      { label: "Entertainment", min: 0, weight: 1.2 },
      { label: "Shopping", min: 0, weight: 0.7 },
      { label: "Misc", min: 0, weight: 0.5 },
    ];

    // Adjust weights inversely to recent share to encourage rebalancing (value maximization)
    const mapShare = new Map(categoriesTotals.map(c => [c.label, c.value]));
    const totalSpent = categoriesTotals.reduce((a, b) => a + b.value, 0) || 1;

    const adjusted = baseline.map(b => {
      const spent = mapShare.get(b.label) || 0;
      const share = spent / totalSpent;
      // If share is high, reduce current day's weight; if low, increase to diversify experiences
      const factor = 1 + (0.25 - Math.min(0.25, share)); // gently 0.75..1.25 scaling
      return { ...b, weight: Math.max(0.35, b.weight * factor) };
    });

    // Ensure feasibility under very low budgets: cap mins to fit
    const sumMins = adjusted.reduce((a, b) => a + b.min, 0);
    let effectiveBudget = Math.max(0, dayBudget || 0);

    let minsScaled = adjusted.map(b => ({ ...b }));
    if (sumMins > effectiveBudget) {
      // Scale down minimums proportionally so they fit under budget
      const scale = effectiveBudget / sumMins;
      minsScaled = adjusted.map(b => ({ ...b, min: Math.floor(b.min * scale) }));
    }

    const totalWeight = minsScaled.reduce((a, b) => a + b.weight, 0) || 1;
    const afterMins = Math.max(0, effectiveBudget - minsScaled.reduce((a, b) => a + b.min, 0));

    // Initial allocations
    let allocations = minsScaled.map(b => {
      const extra = (b.weight / totalWeight) * afterMins;
      return { label: b.label, amount: Math.max(0, Math.round(b.min + extra)) };
    });

    // Savings heuristics to keep under budget and maximize perceived value:
    // - Guarantee at least a minimal entertainment offering if possible by borrowing from Shopping/Misc.
    const totalAlloc = allocations.reduce((a, b) => a + b.amount, 0);
    if (effectiveBudget > 0 && totalAlloc <= effectiveBudget) {
      const ent = allocations.find(a => a.label === "Entertainment");
      if (ent && ent.amount < Math.min(12, Math.floor(effectiveBudget * 0.2))) {
        const needed = Math.min(
          Math.min(12, Math.floor(effectiveBudget * 0.2)) - ent.amount,
          effectiveBudget - totalAlloc
        );
        if (needed > 0) {
          // Pull from Shopping then Misc
          for (const donorLabel of ["Shopping", "Misc"]) {
            const donor = allocations.find(a => a.label === donorLabel);
            if (!donor || needed <= 0) continue;
            const give = Math.min(donor.amount, needed);
            donor.amount -= give;
            ent.amount += give;
          }
        }
      }
    }

    // If we somehow exceeded budget due to rounding, trim lowest-value buckets first (Misc, Shopping)
    let currentTotal = allocations.reduce((a, b) => a + b.amount, 0);
    if (currentTotal > effectiveBudget) {
      const order = ["Misc", "Shopping", "Transport", "Food", "Entertainment"];
      let over = currentTotal - effectiveBudget;
      for (const label of order) {
        const a = allocations.find(x => x.label === label);
        if (!a) continue;
        const cut = Math.min(a.amount, over);
        a.amount -= cut;
        over -= cut;
        if (over <= 0) break;
      }
    }

    // Build activity ideas and savings notes
    const activities = [
      { label: "Food", text: "Breakfast + simple lunch (consider fixed-price menu)" },
      { label: "Transport", text: "Transit day pass or 2–3 rides; walk short legs" },
      { label: "Entertainment", text: "One value highlight + free museum hour/park" },
      { label: "Shopping", text: "Souvenir window-shop with a small cap" },
      { label: "Misc", text: "Buffer for coffee/water or surprises" },
    ];

    const items = allocations
      .filter(a => a.amount > 0)
      .map(a => ({
        ...a,
        idea: (activities.find(x => x.label === a.label) || {}).text || "Flexible activity",
      }));

    // Compute savings guidance
    const notes = computeSavings(items, effectiveBudget);

    setPlan({
      budget: effectiveBudget,
      items,
      total: items.reduce((a, b) => a + b.amount, 0),
    });
    setSavingsNotes(notes);
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
            {/* Prominent warning for average daily overrun */}
            {averageDailySpend > 0 && spentToday > averageDailySpend * (1 + OVERRUN_THRESHOLD) && (
              <div
                className="dotted-box"
                role="alert"
                aria-live="assertive"
                style={{
                  marginTop: 10,
                  borderColor: "rgba(244,63,94,0.9)",
                  background: "linear-gradient(180deg, #fff5f7, #ffffff)",
                  alignItems: "flex-start",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dot" style={{ background: "var(--pink)" }} aria-hidden="true" />
                  <strong>Today exceeds average daily spend</strong>
                </div>
                <p className="info-text" style={{ margin: 0 }}>
                  You’ve spent {Math.round(((spentToday - averageDailySpend) / averageDailySpend) * 100)}% more than average today ({currency(spentToday)} vs avg {currency(averageDailySpend)}).
                </p>
              </div>
            )}
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
            <p className="card-subtext">Contextual, category-aware tips that update as you log expenses.</p>
            <small className="hint">
              These tips are generated from local rules analyzing your recent and cumulative spending.
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
                  <h4 className="info-title">Tips will appear here</h4>
                  <p className="info-text">Log a few expenses to receive personalized suggestions.</p>
                </article>
              )}
            </div>
          </section>

          <div className="rule" />

          <div className="card-header" style={{ paddingBottom: 2 }}>
            <h2 className="card-title">Plan My Day</h2>
            <p className="card-subtext">Enter a day budget and get a budget-optimized plan with savings tips.</p>
            <small className="hint">
              No external data required. We use local heuristics to balance categories and keep under budget.
            </small>
          </div>

          <section className="section" aria-labelledby="pmd-h">
            <h3 id="pmd-h" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
              Plan My Day
            </h3>

            {/* Budget input form */}
            <form
              className="inputs-grid"
              style={{ marginTop: 6 }}
              onSubmit={(e) => {
                e.preventDefault();
                generatePlan();
              }}
            >
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
                    required
                  />
                </div>
                <small className="hint">We’ll propose an allocation across food, transport, entertainment, shopping, and misc.</small>
              </div>

              <div className="actions" style={{ gridColumn: "1 / -1" }}>
                <button type="submit" className="btn-primary">Generate Plan</button>
                <a className="btn-secondary" href="/expenses" title="Log an expense">Log Expense →</a>
              </div>
            </form>

            {!plan && (
              <div className="summary card" aria-live="polite" style={{ marginTop: 14 }}>
                <div className="summary-row">
                  <span className="summary-label">Plan Preview</span>
                  <span className="summary-value">No plan generated yet</span>
                </div>
                <p className="info-text" style={{ marginTop: 6 }}>
                  Enter a budget above and click “Generate Plan” to see a suggested split and savings tips.
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
                          style={{ background: (Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.label, c.color]))[it.label]) || "#6b7280" }}
                        />
                        <span className="category-name">{it.label}</span>
                      </div>
                      <div className="category-amount">{currency(it.amount)}</div>
                    </div>
                  ))}
                </div>

                {/* Savings tips under the plan */}
                {savingsNotes.length > 0 && (
                  <>
                    <div className="rule" />
                    <div className="category-list" style={{ marginTop: 6 }}>
                      {savingsNotes.map((note, idx) => (
                        <div key={idx} className="category-list-row">
                          <div className="category-list-left">
                            <span aria-hidden="true" className="category-dot" style={{ background: "var(--green)" }} />
                            <span className="category-name">Savings Tip</span>
                          </div>
                          <div className="category-amount" style={{ fontWeight: 600, color: "var(--gray-700)" }}>
                            {note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

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
