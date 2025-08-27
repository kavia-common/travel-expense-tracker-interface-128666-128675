import React from "react";

/**
 * Shared in-memory store for expenses and budget values.
 * Provides real-time updates across pages using React Context.
 */

// Helper: format to yyyy-mm-dd
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Default categories palette (aligned with UI colors)
export const DEFAULT_CATEGORIES = [
  { label: "Food", color: "#ffd600" },
  { label: "Transport", color: "#22c55e" },
  { label: "Shopping", color: "#f43f5e" },
  { label: "Entertainment", color: "#3b82f6" },
  { label: "Misc", color: "#6b7280" },
];

// PUBLIC_INTERFACE
export const ExpensesContext = React.createContext({
  expenses: [],
  addExpense: (_e) => {},
  totalBudget: 1500,
  setTotalBudget: (_n) => {},
  dailyAllowance: 120,
  setDailyAllowance: (_n) => {},
  // Derived
  spentTotal: 0,
  spentToday: 0,
  categoriesTotals: [], // [{label, value}]
});

/**
 * PUBLIC_INTERFACE
 * Provides the ExpensesContext to children and computes derived state.
 */
export function ExpensesProvider({ children }) {
  const [expenses, setExpenses] = React.useState([]);
  // Simple in-memory budgets; these can be wired to TripSetup later if needed.
  const [totalBudget, setTotalBudget] = React.useState(1500);
  const [dailyAllowance, setDailyAllowance] = React.useState(120);

  // PUBLIC_INTERFACE
  const addExpense = React.useCallback((expense) => {
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const spentTotal = React.useMemo(
    () => expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0),
    [expenses]
  );

  const todayStr = todayISO();
  const spentToday = React.useMemo(
    () =>
      expenses
        .filter((e) => e.date === todayStr)
        .reduce((acc, e) => acc + Number(e.amount || 0), 0),
    [expenses, todayStr]
  );

  const categoriesTotals = React.useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const key = e.category || "Misc";
      map.set(key, (map.get(key) || 0) + Number(e.amount || 0));
    }
    // Ensure all known categories exist (for stable pie/list order)
    const ordered = DEFAULT_CATEGORIES.map((c) => ({
      label: c.label,
      value: map.get(c.label) || 0,
    }));
    return ordered;
  }, [expenses]);

  const value = React.useMemo(
    () => ({
      expenses,
      addExpense,
      totalBudget,
      setTotalBudget,
      dailyAllowance,
      setDailyAllowance,
      spentTotal,
      spentToday,
      categoriesTotals,
    }),
    [
      expenses,
      addExpense,
      totalBudget,
      dailyAllowance,
      spentTotal,
      spentToday,
      categoriesTotals,
    ]
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}
