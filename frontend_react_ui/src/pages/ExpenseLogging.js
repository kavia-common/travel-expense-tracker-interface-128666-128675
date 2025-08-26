import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import { useExpenses } from "../context/ExpensesContext";

/**
 * PUBLIC_INTERFACE
 * ExpenseLogging page
 * A dedicated page to quickly log a new expense with:
 * - Amount (currency)
 * - Category dropdown (sample categories)
 * - Notes (optional)
 * - Date (defaults to today, editable)
 * - Group Mode (assign expense to one/more persons)
 *
 * This page mirrors the visual style used elsewhere (hero + floating card).
 * On submit, it saves into the global expenses context to update the dashboard instantly.
 */
export default function ExpenseLogging() {
  const { addExpense } = useExpenses();

  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // Group Mode state: mock travelers list from "trip"
  const [groupMode, setGroupMode] = useState("all"); // all | specific
  const [people] = useState(["You", "Alex", "Sam", "Jamie"]);
  const [selectedPeople, setSelectedPeople] = useState(["You"]);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    document.title = "Expense Logging";
  }, []);

  const categories = useMemo(
    () => ["Food", "Transport", "Lodging", "Entertainment", "Shopping", "Misc"],
    []
  );

  // PUBLIC_INTERFACE
  const togglePerson = (name) => {
    setSelectedPeople((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  // PUBLIC_INTERFACE
  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    // Prepare payload for store (extensible for backend)
    const payload = {
      amount: amt,
      category,
      date,
      notes: notes.trim(),
      assignedTo: groupMode === "all" ? "ALL" : [...selectedPeople],
    };

    // Optimistic: immediately add to global state so dashboard updates without reload
    addExpense(payload);

    // Soft confirmation toast-ish feedback
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);

    // Reset minimal fields for quick add
    setAmount("");
    setNotes("");
    setCategory("Food");
    setGroupMode("all");
    setSelectedPeople(["You"]);
    setDate(() => {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });
  };

  const canSubmit =
    Number(amount) > 0 && date && category && (groupMode === "all" || selectedPeople.length > 0);

  return (
    <div className="App travel">
      {/* Hero with consistent style */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content container">
          <h1 className="headline">Log Expense</h1>
          <p className="subtext">
            Quickly record a new expense with category, date, and who it applies to.
          </p>
          <div className="accent-legend" aria-hidden="true">
            <span className="chip chip-yellow">Amount</span>
            <span className="chip chip-green">Category</span>
            <span className="chip chip-blue">Date</span>
            <span className="chip chip-pink">Group</span>
          </div>
        </div>
      </section>

      {/* Floating card with the expense form */}
      <div className="floating-card-wrapper">
        <form className="card floating-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2 className="card-title">Add an Expense</h2>
            <p className="card-subtext">Fill in the details and save it to your trip.</p>
            {justSaved && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(34,197,94,0.10)",
                  border: "1px solid rgba(34,197,94,0.45)",
                  color: "var(--text-strong, #0B0B0B)",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                Expense saved. Dashboard updated.
              </div>
            )}
          </div>

          <div className="inputs-grid">
            {/* Amount */}
            <div className="field">
              <label className="label">
                Amount
                <span className="dot dot-yellow" />
              </label>
              <div className="input-with-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  className="input"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-label="Amount"
                  required
                />
              </div>
              <small className="hint">Enter the expense amount.</small>
            </div>

            {/* Category */}
            <div className="field">
              <label className="label">
                Category
                <span className="dot dot-green" />
              </label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Category"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <small className="hint">Choose a category.</small>
            </div>

            {/* Date */}
            <div className="field">
              <label className="label">
                Date
                <span className="dot dot-blue" />
              </label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Expense date"
              />
              <small className="hint">Defaults to today; adjust if needed.</small>
            </div>

            {/* Notes */}
            <div className="field" style={{ gridColumn: "span 12" }}>
              <label className="label">
                Notes (optional)
                <span className="dot dot-pink" />
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Add details about this expense (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-label="Notes"
              />
              <small className="hint">Optional: add a brief description.</small>
            </div>

            {/* Group Mode */}
            <div className="field friends-field" style={{ gridColumn: "span 12" }}>
              <label className="label">
                Group Mode
                <span className="dot dot-green" />
              </label>

              <div
                role="group"
                aria-label="Group mode"
                style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
              >
                <button
                  type="button"
                  className="chip"
                  onClick={() => setGroupMode("all")}
                  aria-pressed={groupMode === "all"}
                  style={{
                    border: groupMode === "all" ? "2px solid var(--green)" : "1px solid var(--gray-200)",
                    background:
                      groupMode === "all"
                        ? "rgba(34,197,94,0.08)"
                        : "linear-gradient(180deg, #ffffff, #f9fafb)",
                  }}
                >
                  All travelers
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setGroupMode("specific")}
                  aria-pressed={groupMode === "specific"}
                  style={{
                    border:
                      groupMode === "specific"
                        ? "2px solid var(--blue)"
                        : "1px solid var(--gray-200)",
                    background:
                      groupMode === "specific"
                        ? "rgba(59,130,246,0.08)"
                        : "linear-gradient(180deg, #ffffff, #f9fafb)",
                  }}
                >
                  Specific person(s)
                </button>
              </div>

              {groupMode === "specific" && (
                <div className="friends-chips" role="list" aria-label="Select people">
                  {people.map((p) => {
                    const active = selectedPeople.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        role="listitem"
                        className="chip chip-friend"
                        onClick={() => togglePerson(p)}
                        aria-pressed={active}
                        title={active ? "Unselect" : "Select"}
                        style={{
                          borderColor: active ? "var(--blue)" : "var(--gray-200)",
                          background: active ? "rgba(59,130,246,0.08)" : undefined,
                        }}
                      >
                        <span className="chip-avatar" aria-hidden="true">
                          👤
                        </span>
                        <span className="chip-text">{p}</span>
                        <span
                          className="chip-remove"
                          aria-hidden="true"
                          style={{ cursor: "pointer" }}
                        >
                          {active ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <small className="hint">
                Choose who this expense applies to. Default is all travelers.
              </small>
            </div>
          </div>

          {/* Summary card */}
          <div className="summary card">
            <div className="summary-row">
              <span className="summary-label">Amount</span>
              <span className="summary-value accent">
                {Number(amount) > 0 ? formatCurrency(Number(amount)) : "$0"}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Category</span>
              <span className="summary-value">{category}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Date</span>
              <span className="summary-value">{date || "—"}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Assigned to</span>
              <span className="summary-value">
                {groupMode === "all"
                  ? "All travelers"
                  : selectedPeople.length
                  ? selectedPeople.join(", ")
                  : "(none)"}
              </span>
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              Add Expense
            </button>
            <a className="btn-secondary" href="/" title="Back to Trip Setup">
              ← Back to Trip Setup
            </a>
            <a className="btn-secondary" href="/dashboard" title="Go to Dashboard">
              Go to Dashboard →
            </a>
          </div>
        </form>
      </div>

      <footer className="footer container">
        <p className="footer-text">
          Keep your trip spending organized with quick, clear logging.
        </p>
      </footer>
    </div>
  );
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n || 0);
}
