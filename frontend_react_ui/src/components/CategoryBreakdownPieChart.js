import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/**
 * PUBLIC_INTERFACE
 * CategoryBreakdownPieChart
 * Renders a pie chart for category-wise expenses with a legend and currency formatting.
 *
 * Props:
 * - data: Array<{ label: string, value: number }>
 * - colors: string[] color palette corresponding to categories
 * - height?: number - chart container height (default 280)
 * - title?: string - aria label and tooltip title context
 */
export default function CategoryBreakdownPieChart({
  data = [],
  colors = ["#ffd600", "#22c55e", "#f43f5e", "#3b82f6", "#6b7280"],
  height = 280,
  title = "Category Breakdown",
}) {
  const total = Math.max(
    0,
    data.reduce((acc, d) => acc + (Number.isFinite(d.value) ? d.value : 0), 0)
  );

  const ariaSummary =
    `${title}. Total ${formatCurrency(total)}. ` +
    data
      .map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return `${d.label} ${formatCurrency(d.value)} (${pct}%)`;
      })
      .join(", ") + ".";

  return (
    <div
      role="img"
      aria-label={ariaSummary}
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 12,
      }}
    >
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              startAngle={90}
              endAngle={-270}
              innerRadius="50%"
              outerRadius="80%"
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.label + i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              isAnimationActive
              formatter={(value, name) => [formatCurrency(value), name]}
              labelFormatter={() => title}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend: two-column grid for label/value alignment */}
      <div
        className="cb-legend"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          rowGap: 8,
          columnGap: 12,
        }}
        aria-label="Legend"
      >
        {data.map((d, i) => (
          <React.Fragment key={d.label + "_legend"}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: colors[i % colors.length],
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
                {d.label}
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
              {formatCurrency(d.value)}
            </div>
          </React.Fragment>
        ))}
        {/* Total row */}
        <div
          style={{
            marginTop: 4,
            borderTop: "1px dashed var(--border-dashed, #BDBDBD)",
            gridColumn: "1 / -1",
          }}
          aria-hidden="true"
        />
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted, #6B6B6B)",
          }}
        >
          Total
        </div>
        <div
          style={{
            textAlign: "right",
            fontSize: 12,
            fontWeight: 800,
            color: "var(--text-strong, #0B0B0B)",
          }}
        >
          {formatCurrency(total)}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}
