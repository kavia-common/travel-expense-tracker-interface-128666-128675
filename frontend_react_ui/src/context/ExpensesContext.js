import React from "react";

/**
 * PUBLIC_INTERFACE
 * ExpensesContext provides a simple global store for expenses and budget settings.
 * This enables instant cross-page updates (e.g., Dashboard updates when a new
 * expense is added from the Expense Logging page) without page reloads.
 *
 * API:
 * - <ExpensesProvider>{children}</ExpensesProvider>
 * - useExpenses() -> { expenses, addExpense, totalBudget, setTotalBudget, dailyAllowance, setDailyAllowance }
 *
 * Notes:
 * - Currently stores data in-memory only. To integrate with a backend later,
 *   replace addExpense to call your API and keep an optimistic update strategy.
 */
const ExpensesContext = React.createContext(null);

// Seed demo budget similar to previous static values for continuity
const initialBudget = {
  totalBudget: 1500,
  dailyAllowance: 120,
};

export function ExpensesProvider({ children }) {
  const [expenses, setExpenses] = React.useState([]);
  const [totalBudget, setTotalBudget] = React.useState(initialBudget.totalBudget);
  const [dailyAllowance, setDailyAllowance] = React.useState(initialBudget.dailyAllowance);

  // PUBLIC_INTERFACE
  const addExpense = React.useCallback((expense) => {
    // Optimistic: add immediately to state
    setExpenses((prev) => [
      {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        createdAt: new Date().toISOString(),
        ...expense,
        amount: Number(expense.amount) || 0,
      },
      ...prev,
    ]);
    // If there is a backend later: perform POST request here and handle errors (rollback if needed).
  }, []);

  const value = React.useMemo(
    () => ({
      expenses,
      addExpense,
      totalBudget,
      setTotalBudget,
      dailyAllowance,
      setDailyAllowance,
    }),
    [expenses, addExpense, totalBudget, dailyAllowance]
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

// PUBLIC_INTERFACE
export function useExpenses() {
  const ctx = React.useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses must be used within an ExpensesProvider");
  return ctx;
}
