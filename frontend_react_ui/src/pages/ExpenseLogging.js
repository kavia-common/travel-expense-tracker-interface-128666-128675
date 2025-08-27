import React from "react";
import "../App.css";

/**
 * ExpenseLogging page provides a quick-add form to log expenses.
 * Fields: Amount, Category (dropdown), Notes (optional), Date (defaults to today), Group Mode (assign to People).
 * Minimal, clean layout matching app style. Uses in-memory event dispatch for "real-time" integration.
 */

// Utility to format date as yyyy-mm-dd for input[type="date"]
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Simple categories palette (align with Dashboard colors)
const CATEGORY_OPTIONS = [
  { value: "Food", color: "#ffd600" },
  { value: "Transport", color: "#22c55e" },
  { value: "Shopping", color: "#f43f5e" },
  { value: "Entertainment", color: "#3b82f6" },
  { value: "Misc", color: "#6b7280" },
];

// PUBLIC_INTERFACE
export default function ExpenseLogging() {
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORY_OPTIONS[0].value);
  const [notes, setNotes] = React.useState("");
  const [date, setDate] = React.useState(todayISO());
  const [groupMode, setGroupMode] = React.useState(false);
  const [peopleInput, setPeopleInput] = React.useState("");
  const [people, setPeople] = React.useState([]);

  React.useEffect(() => {
    document.title = "Expense Logging";
  }, []);

  const normalized = (s) => s.trim().replace(/\s+/g, " ");
  const addPerson = () => {
    const v = normalized(peopleInput);
    if (!v) return;
    if (people.includes(v)) {
      setPeopleInput("");
      return;
    }
    setPeople((prev) => [...prev, v]);
    setPeopleInput("");
  };
  const removePerson = (p) => {
    setPeople((prev) => prev.filter((x) => x !== p));
  };
  const handlePeopleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addPerson();
    } else if (e.key === "Backspace" && peopleInput === "" && people.length) {
      removePerson(people[people.length - 1]);
    }
  };

  const resetForm = () => {
    setAmount("");
    setCategory(CATEGORY_OPTIONS[0].value);
    setNotes("");
    setDate(todayISO());
    setGroupMode(false);
    setPeople([]);
    setPeopleInput("");
  };

  // PUBLIC_INTERFACE
  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    const payload = {
      id: `${Date.now()}`,
      amount: amt,
      category,
      notes: normalized(notes),
      date,
      people: groupMode ? people : [],
      createdAt: new Date().toISOString(),
    };

    // Dispatch a custom event so other pages (e.g., Dashboard) can respond in real-time.
    // Consumers can listen to 'expense:added' to update summaries instantly.
    const evt = new CustomEvent("expense:added", { detail: payload });
    window.dispatchEvent(evt);

    // Provide minimal feedback and reset
    resetForm();
    // Optional: small toast-like feedback
    // eslint-disable-next-line no-alert
    alert("Expense added.");
  };

  const selectedCat =
    CATEGORY_OPTIONS.find((c) => c.value === category) || CATEGORY_OPTIONS[0];

  return (
    <div className="App travel">
      <section className="hero" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.92), #fff)" }}>
        <div className="hero-overlay" style={{ display: "none" }} />
        <div className="hero-content container">
          <h1 className="headline">Expense Logging</h1>
          <p className="subtext">
            Quickly log expenses with amount, category, date, notes, and assign to people in group mode.
          </p>
          <div className="accent-legend" aria-hidden="true">
            <span className="chip chip-yellow">Amount</span>
            <span className="chip chip-green">Group</span>
            <span className="chip chip-pink">Notes</span>
            <span className="chip chip-blue">Date</span>
          </div>
        </div>
      </section>

      <div className="floating-card-wrapper">
        <form className="card floating-card card--loose" onSubmit={handleSubmit} style={{ paddingTop: 18, paddingBottom: 18 }}>
          <div className="card-header" style={{ paddingBottom: 2 }}>
            <h2 className="card-title">Quick Add Expense</h2>
            <p className="card-subtext">All fields are editable. Date defaults to today.</p>
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
                  placeholder="e.g., 32.50"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-label="Expense amount"
                  required
                />
              </div>
              <small className="hint">Enter the total amount for this expense.</small>
            </div>

            {/* Category */}
            <div className="field">
              <label className="label">
                Category
                <span className="dot dot-pink" />
              </label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Expense category"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value}
                  </option>
                ))}
              </select>
              <small className="hint">Categorize this expense for insights.</small>
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
              <small className="hint">Defaults to today. Adjust if needed.</small>
            </div>

            {/* Notes */}
            <div className="field">
              <label className="label">
                Notes (optional)
                <span className="dot dot-green" />
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Lunch near museum"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-label="Notes"
              />
              <small className="hint">Add a short description to remember later.</small>
            </div>

            {/* Group Mode toggle */}
            <div className="field">
              <label className="label">
                Group Mode
                <span className="dot dot-green" />
              </label>
              <div className="dotted-box" style={{ gap: 12 }}>
                <span className="summary-label">Assign to people</span>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={groupMode}
                    onChange={(e) => setGroupMode(e.target.checked)}
                    aria-label="Enable group mode"
                  />
                  <span className="pill">{groupMode ? "Enabled" : "Disabled"}</span>
                </label>
              </div>
              <small className="hint">Toggle to split this expense among people.</small>
            </div>

            {/* People input appears only if group mode */}
            {groupMode && (
              <div className="field friends-field">
                <label className="label">
                  People
                  <span className="dot dot-blue" />
                </label>
                <div className="friends-input-wrap">
                  <input
                    type="text"
                    className="input"
                    placeholder="Type a name or email, press Enter"
                    value={peopleInput}
                    onChange={(e) => setPeopleInput(e.target.value)}
                    onKeyDown={handlePeopleKeyDown}
                    aria-label="Add person to expense"
                  />
                  <button
                    type="button"
                    className="btn-ghost friends-add-btn"
                    onClick={addPerson}
                    aria-label="Add person"
                    title="Add person"
                  >
                    +
                  </button>
                </div>

                {people.length > 0 && (
                  <div className="friends-chips" aria-live="polite">
                    {people.map((p) => (
                      <span key={p} className="chip chip-friend" role="listitem">
                        <span className="chip-avatar" aria-hidden="true">👤</span>
                        <span className="chip-text">{p}</span>
                        <button
                          type="button"
                          className="chip-remove"
                          aria-label={`Remove ${p}`}
                          onClick={() => removePerson(p)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <small className="hint">These people will be associated with this expense.</small>
              </div>
            )}
          </div>

          {/* Summary and submit */}
          <div className="summary card" style={{ marginTop: 14 }}>
            <div className="summary-row">
              <span className="summary-label">Amount</span>
              <span className="summary-value" style={{ color: "var(--black)" }}>
                {amount ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(amount)) : "$0.00"}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Category</span>
              <span className="summary-value" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: selectedCat.color, boxShadow: "0 0 0 2px rgba(0,0,0,0.04)" }} />
                {category}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Date</span>
              <span className="summary-value">{date}</span>
            </div>
            {groupMode && (
              <div className="summary-row">
                <span className="summary-label">People</span>
                <span className="summary-value">{people.length ? people.join(", ") : "None"}</span>
              </div>
            )}
          </div>

          <div className="actions">
            <button type="submit" className="btn-primary">Add Expense</button>
            <a className="btn-secondary" href="/dashboard" title="Go to Dashboard">
              View Dashboard →
            </a>
          </div>
        </form>
      </div>

      <section className="container info-cards">
        <div className="info-card card">
          <h3 className="info-title">Real-time Updates</h3>
          <p className="info-text">Newly added expenses dispatch an event that other pages can use to update instantly.</p>
        </div>
        <div className="info-card card">
          <h3 className="info-title">Clean and Fast</h3>
          <p className="info-text">Minimal controls with clear defaults to keep logging frictionless.</p>
        </div>
        <div className="info-card card">
          <h3 className="info-title">Assign to People</h3>
          <p className="info-text">Use group mode to tag who participated in the expense.</p>
        </div>
      </section>

      <footer className="footer container">
        <p className="footer-text">Keep your trip spending organized with quick, simple logging.</p>
      </footer>
    </div>
  );
}
