import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import { useExpenses } from "../context/ExpensesContext";

/**
 * PUBLIC_INTERFACE
 * GroupTravel page (Simplified)
 * Provides a minimal experience for group trips:
 * 1) Invite or share a trip code/link
 * 2) Show current group members
 * 3) Quick add a shared expense (equal split)
 * 4) Minimal balance summary:
 *    "You've paid X, others paid Y, your current balance: Z"
 *
 * Notes:
 * - In-memory only (no backend). Group expenses are tagged in notes as [G:<gid>].
 * - Balance is simplified: we compare your payments vs others' payments and your fair share.
 */
export default function GroupTravel() {
  const { expenses, addExpense } = useExpenses();

  // Minimal local state
  const [groupId] = useState(() =>
    (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())).slice(0, 6)
  );
  const [inviteCode] = useState(() =>
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );
  const [members, setMembers] = useState(["You"]);
  const [memberInput, setMemberInput] = useState("");

  // Quick shared expense (equal split, payer selectable)
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("You");
  const [description, setDescription] = useState("");

  useEffect(() => {
    document.title = "Group Travel - Simple";
  }, []);

  useEffect(() => {
    // keep payer valid
    if (!members.includes(payer)) setPayer(members[0] || "You");
  }, [members, payer]);

  // PUBLIC_INTERFACE
  const addMember = () => {
    const name = memberInput.trim();
    if (!name) return;
    if (members.includes(name)) {
      setMemberInput("");
      return;
    }
    setMembers((prev) => [...prev, name]);
    setMemberInput("");
  };

  // PUBLIC_INTERFACE
  const removeMember = (name) => {
    if (name === "You") return; // keep "You" for the minimal balance computation
    setMembers((prev) => prev.filter((m) => m !== name));
  };

  // Minimal invite link
  const inviteLink = useMemo(() => {
    const url = new URL(window.location.href);
    url.pathname = "/group";
    url.searchParams.set("invite", inviteCode);
    url.searchParams.set("gid", groupId);
    return url.toString();
  }, [inviteCode, groupId]);

  // Filter group expenses (tagged in notes)
  const groupExpenses = useMemo(() => {
    return expenses.filter(
      (e) => typeof e.notes === "string" && e.notes.includes(`[G:${groupId}]`)
    );
  }, [expenses, groupId]);

  // Minimal balance summary:
  // - yourPaid: sum of amounts where payer === "You"
  // - othersPaid: sum of amounts where payer !== "You"
  // - Assuming equal split among current members, estimate your fair share:
  //   yourShare = sum(amount / membersCount for each group expense)
  // - currentBalance Z = yourPaid - yourShare
  //   Positive Z means others "owe you" overall; negative means you "owe others".
  const membersCount = Math.max(1, members.length);
  const yourPaid = useMemo(
    () =>
      groupExpenses
        .filter((e) => (e.payer || "You") === "You")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [groupExpenses]
  );
  const othersPaid = useMemo(
    () =>
      groupExpenses
        .filter((e) => (e.payer || "You") !== "You")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [groupExpenses]
  );
  const yourShare = useMemo(() => {
    let share = 0;
    for (const e of groupExpenses) {
      const total = Number(e.amount) || 0;
      share += total / membersCount;
    }
    return share;
  }, [groupExpenses, membersCount]);
  const currentBalance = Math.round((yourPaid - yourShare) * 100) / 100;

  // PUBLIC_INTERFACE
  const handleAddSharedExpense = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    addExpense({
      amount: amt,
      category: "Group",
      date: `${yyyy}-${mm}-${dd}`,
      notes: `${description || "Shared expense"} [G:${groupId}]`,
      payer,
      involved: [...members], // for future reference
      split: { mode: "equal" },
    });

    setAmount("");
    setDescription("");
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n || 0);

  return (
    <div className="App travel">
      {/* Hero */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content container">
          <h1 className="headline">Group Travel</h1>
          <p className="subtext">
            Keep it simple: invite friends, add shared expenses, and see your current balance.
          </p>
          <div className="accent-legend" aria-hidden="true">
            <span className="chip chip-blue">Invite</span>
            <span className="chip chip-green">Members</span>
            <span className="chip chip-yellow">Expense</span>
            <span className="chip chip-pink">Balance</span>
          </div>
        </div>
      </section>

      {/* Floating card */}
      <div className="floating-card-wrapper">
        <div className="card floating-card">
          {/* 1) Invite or Share Code */}
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div className="card-header" style={{ padding: "0 0 8px 0" }}>
              <h2 className="card-title" style={{ fontSize: "1.1rem" }}>Invite</h2>
              <p className="card-subtext">Share this code or link to invite others.</p>
            </div>
            <div className="summary">
              <div className="summary-row">
                <span className="summary-label">Trip code</span>
                <span className="summary-value accent">{inviteCode}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Share link</span>
                <span
                  className="summary-value"
                  style={{ fontSize: 12, fontWeight: 600, color: "var(--text-strong, #0B0B0B)" }}
                >
                  {inviteLink}
                </span>
              </div>
            </div>
            <div className="actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  navigator.clipboard
                    .writeText(`${inviteCode} — ${inviteLink}`)
                    .then(() => alert("Invite copied"), () => alert("Copy failed"))
                }
              >
                Copy invite
              </button>
            </div>
          </div>

          {/* 2) Current Members */}
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div className="card-header" style={{ padding: "0 0 8px 0" }}>
              <h2 className="card-title" style={{ fontSize: "1.1rem" }}>Members</h2>
              <p className="card-subtext">Add a name or email. Remove if needed.</p>
            </div>

            <div className="inputs-grid" style={{ marginTop: 8 }}>
              <div className="field">
                <label className="label">
                  Invite member
                  <span className="dot dot-green" />
                </label>
                <div className="friends-input-wrap">
                  <input
                    type="text"
                    className="input"
                    placeholder="Type name or email, press Enter"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMember();
                      }
                    }}
                    aria-label="Invite member"
                  />
                  <button
                    type="button"
                    className="btn-ghost friends-add-btn"
                    onClick={addMember}
                    aria-label="Add member"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {members.length > 0 && (
              <div className="friends-chips" role="list" aria-label="Current members" style={{ marginTop: 10 }}>
                {members.map((m) => (
                  <span key={m} className="chip chip-friend" role="listitem">
                    <span className="chip-avatar" aria-hidden="true">👥</span>
                    <span className="chip-text">{m}</span>
                    {m !== "You" && (
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => removeMember(m)}
                        aria-label={`Remove ${m}`}
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            <small className="hint">{members.length} member(s) in this group.</small>
          </div>

          {/* 3) Add Shared Expense (equal split) */}
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div className="card-header" style={{ padding: "0 0 8px 0" }}>
              <h2 className="card-title" style={{ fontSize: "1.1rem" }}>Add Shared Expense</h2>
              <p className="card-subtext">Simple equal split among current members.</p>
            </div>

            <form onSubmit={handleAddSharedExpense} className="inputs-grid">
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
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">
                  Payer
                  <span className="dot dot-pink" />
                </label>
                <select
                  className="input"
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                  aria-label="Payer"
                >
                  {members.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ gridColumn: "span 12" }}>
                <label className="label">
                  Description (optional)
                  <span className="dot dot-pink" />
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Dinner at La Rambla"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-label="Description"
                />
              </div>
            </form>

            <div className="actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddSharedExpense}
                disabled={!(Number(amount) > 0 && members.length > 0)}
              >
                Add Expense
              </button>
              <a className="btn-secondary" href="/expenses" title="Open Expense Logger">
                Open Expense Logger →
              </a>
            </div>
          </div>

          {/* 4) Minimal Balance Summary */}
          <div className="card" style={{ padding: 16 }}>
            <div className="card-header" style={{ padding: "0 0 8px 0" }}>
              <h2 className="card-title" style={{ fontSize: "1.1rem" }}>Your Balance</h2>
              <p className="card-subtext">A quick snapshot versus the group.</p>
            </div>

            <div className="summary" aria-live="polite">
              <div className="summary-row">
                <span className="summary-label">You've paid</span>
                <span className="summary-value">{formatCurrency(yourPaid)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Others paid</span>
                <span className="summary-value">{formatCurrency(othersPaid)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Your fair share</span>
                <span className="summary-value">{formatCurrency(yourShare)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Current balance</span>
                <span
                  className="summary-value accent"
                  style={{
                    color:
                      currentBalance > 0
                        ? "var(--green)"
                        : currentBalance < 0
                        ? "var(--pink)"
                        : "var(--text-strong, #0B0B0B)",
                  }}
                >
                  {formatCurrency(currentBalance)}
                </span>
              </div>
              <small className="hint">
                Positive means you're ahead (others owe you overall). Negative means you owe others.
              </small>
            </div>
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <a className="btn-secondary" href="/" title="Back to Trip Setup">
              ← Back to Trip Setup
            </a>
            <a className="btn-secondary" href="/dashboard" title="View Dashboard">
              View Dashboard →
            </a>
          </div>
        </div>
      </div>

      <footer className="footer container">
        <p className="footer-text">Simple group tracking: invite, add, and check your balance.</p>
      </footer>
    </div>
  );
}
