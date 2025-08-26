import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/**
 * PUBLIC_INTERFACE
 * RemainingFundsPieChart
 * A compact donut chart that visualizes Remaining vs Spent (and optional Over Budget).
 * Props:
 * - budget: number (total budget)
 * - spent: number (total spent)
 * - colors: optional object to override segment colors { remaining, spent, over }
 * - height: optional number to control chart box height (default 180)
 *
 * Accessibility:
 * - Renders an aria-label summarizing numerical data
 * - Tooltip disabled for screen readers; textual summary provided
 */
export default function RemainingFundsPieChart({
  budget = 0,
  spent = 0,
  colors = {
    remaining: "var(--green, #22C55E)",
    spent: "var(--blue, #60A5FA)",
    over: "var(--pink, #F43F5E)",
  },
  height = 180,
}) {
  const remaining = Math.max(0, budget - spent);
  const overBudget = Math.max(0, spent - budget);
  // For a balanced ring, normalize base to max(budget, spent) so overage is visible.
  const base = Math.max(budget, spent, 1);

  // Compose segments per design notes
  let segments = [];
  if (overBudget > 0) {
    segments = [
      { name: "Spent", value: Math.min(spent, budget), color: colors.spent },
      { name: "Over Budget", value: overBudget, color: colors.over },
      { name: "Remaining", value: 0, color: colors.remaining },
    ];
  } else {
    segments = [
      { name: "Spent", value: spent, color: colors.spent },
      { name: "Remaining", value: remaining, color: colors.remaining },
    ];
  }

  const centerRemainingLabel = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(remaining || 0);

  const ariaSummary = `Remaining Funds Donut Chart. Budget ${formatCurrency(
    budget
  )}, Spent ${formatCurrency(spent)}, Remaining ${formatCurrency(
    remaining
  )}. Remaining is ${Math.round((remaining / base) * 100)}% of reference total.`;

  return (
    <div
      role="img"
      aria-label={ariaSummary}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        className="rf-chart-wrap"
        style={{
          width: "100%",
          minHeight: height,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="name"
                startAngle={90}
                endAngle={-270}
                innerRadius="60%"
                outerRadius="80%"
                stroke="none"
              >
                {segments.map((seg, i) => (
                  <Cell key={seg.name + i} fill={seg.color} />
                ))}
              </Pie>
              <Tooltip
                isAnimationActive
                formatter={(value, name) => [formatCurrency(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center label overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            textAlign: "center",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Center text over the donut using a simple overlay box */}
      <div
        aria-hidden="true"
        style={{
          position: "relative",
          marginTop: `-${height}px`,
          height: 0,
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            transform: "translateY(-2px)",
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-strong, #0B0B0B)",
            }}
          >
            {centerRemainingLabel}
          </div>
          <div
            style={{
              marginTop: 2,
              fontWeight: 500,
              fontSize: 12,
              color: "var(--text-muted, #6B6B6B)",
            }}
          >
            Remaining
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        className="rf-legend"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          rowGap: 8,
          columnGap: 12,
          marginTop: height - 140 > 0 ? height - 140 : 8,
        }}
      >
        <LegendItem
          label="Remaining"
          value={remaining}
          color={colors.remaining}
        />
        <LegendItem label="Spent" value={Math.min(spent, budget)} color={colors.spent} />
        {overBudget > 0 && (
          <LegendItem label="Over Budget" value={overBudget} color={colors.over} />
        )}
      </div>
    </div>
  );
}

/**
 * Small legend row component
 */
function LegendItem({ label, value, color }) {
  return (
    <>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span
          aria-hidden="true"
          style={{
            width: 12,
            height: 12,
            borderRadius: 4,
            background: color,
            boxShadow: "inset 0 0 0 1px var(--swatch-border, rgba(0,0,0,0.1))",
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-strong, #0B0B0B)",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          textAlign: "right",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-strong, #0B0B0B)",
        }}
      >
        {formatCurrency(value)}
      </div>
    </>
  );
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}
