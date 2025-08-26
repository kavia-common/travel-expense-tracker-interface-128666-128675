import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import { useExpenses } from "../context/ExpensesContext";

/**
 * PUBLIC_INTERFACE
 * GroupTravel page
 * Introduces Group Travel mode and provides:
 * - Invite flow: generate and share an invite code/link
 * - Join flow: join using an invite code
 * - Members list: show who has joined
 * - Shared expense tracking: add expenses with a payer and split method
 * - Live balance sheet: net balances and who owes whom (simplified settlement)
 *
 * Notes:
 * - This is an in-memory demo. It doesn't persist beyond page reload.
 * - It reuses the app's design language (hero + floating card, chips, summary cards).
 */

// Helpers
function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n || 0);
}

// Compute net balances and suggested settlements.
// balances: record { [member]: number } where positive means member should receive money.
function computeSettlements(balances) {
  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([name, amt]) => {
    const v = Math.round(amt * 100) / 100;
    if (v > 0.009) creditors.push({ name, amount: v });
    else if (v < -0.009) debtors.push({ name, amount: -v }); // store as positive debt
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const give = creditors[i];
    const take = debtors[j];
    const pay = Math.min(give.amount, take.amount);

    transfers.push({
      from: take.name,
      to: give.name,
      amount: Math.round(pay * 100) / 100,
    });

    give.amount -= pay;
    take.amount -= pay;
    if (give.amount <= 0.009) i++;
    if (take.amount <= 0.009) j++;
  }

  return transfers;
}

export default function GroupTravel() {
  const { expenses, addExpense } = useExpenses();

  // "Group" local state for demo
  const [groupId, setGroupId] = useState(() =>
    (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())).slice(0, 8)
  );
  const [hostName, setHostName] = useState("You");
  const [members, setMembers] = useState(["You"]); // joined members
  const [inviteCode] = useState(() =>
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );
  const [joinCode, setJoinCode] = useState("");
  const [newMember, setNewMember] = useState("");

  // Expense form (scoped to this group)
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("You");
  const [description, setDescription] = useState("");
  const [splitMode, setSplitMode] = useState("equal"); // equal | custom
  const [customShares, setCustomShares] = useState({}); // name -> share (number)

  useEffect(() => {
    document.title = "Group Travel Mode";
  }, []);

  useEffect(() => {
    // Keep payer valid
    if (!members.includes(payer)) setPayer(members[0] || "You");
  }, [members, payer]);

  // Invite link (demo)
  const groupLink = useMemo(() => {
    const url = new URL(window.location.href);
    url.pathname = "/group";
    url.searchParams.set("invite", inviteCode);
    url.searchParams.set("gid", groupId);
    return url.toString();
  }, [inviteCode, groupId]);

  // Add a member by name/email
  // PUBLIC_INTERFACE
  const addMember = () => {
    const name = newMember.trim();
    if (!name) return;
    if (members.includes(name)) {
      setNewMember("");
      return;
    }
    setMembers((prev) => [...prev, name]);
    setNewMember("");
  };

  // PUBLIC_INTERFACE
  const removeMember = (name) => {
    if (name === "You") return; // keep at least "You" for demo
    setMembers((prev) => prev.filter((m) => m !== name));
    // Clean up custom shares
    setCustomShares((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // PUBLIC_INTERFACE
  const handleCustomShareChange = (name, value) => {
    const n = Number(value);
    setCustomShares((prev) => ({ ...prev, [name]: Number.isFinite(n) ? n : 0 }));
  };

  // PUBLIC_INTERFACE
  const handleJoinByCode = (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    // Demo: accept if matches current inviteCode
    if (code === inviteCode) {
      alert("Joined group successfully (demo).");
      // In real world, we'd fetch members and group from backend
    } else {
      alert("Invalid invite code (demo).");
    }
  };

  // Shared expenses limited to those with "groupId" marker in notes for demo (no backend).
  const groupExpenses = useMemo(() => {
    // We tag group expenses in add with a hidden key in notes " [G:<gid>]"
    return expenses.filter((e) => typeof e.notes === "string" && e.notes.includes(`[G:${groupId}]`));
  }, [expenses, groupId]);

  // Compute balances for group from groupExpenses
  const balances = useMemo(() => {
    // Initialize
    const b = {};
    members.forEach((m) => (b[m] = 0));

    for (const e of groupExpenses) {
      const total = Number(e.amount) || 0;
      const payerName = e.payer || "You";
      const split = e.split || { mode: "equal" };
      const involved = e.involved && Array.isArray(e.involved) ? e.involved : members;

      if (!involved.length || total <= 0) continue;

      if (split.mode === "custom" && split.shares) {
        const shares = split.shares; // { name: number }
        const sum = involved.reduce((acc, name) => acc + (Number(shares[name]) || 0), 0) || 1;
        involved.forEach((name) => {
          const portion = (Number(shares[name]) || 0) / sum;
          const owed = total * portion;
          if (name !== payerName) {
            b[name] -= owed;
          }
        });
        // Payer receives from others
        const othersTotal = involved
          .filter((n) => n !== payerName)
          .reduce((acc, name) => {
            const portion = (Number(shares[name]) || 0) / sum;
            return acc + total * portion;
          }, 0);
        b[payerName] += othersTotal;
      } else {
        // equal split among involved
        const perPerson = total / involved.length;
        involved.forEach((name) => {
          if (name !== payerName) {
            b[name] -= perPerson;
          }
        });
        b[payerName] += perPerson * (involved.length - 1);
      }
    }

    // Round to cents
    Object.keys(b).forEach((k) => (b[k] = Math.round(b[k] * 100) / 100));
    return b;
  }, [groupExpenses, members]);

  const settlements = useMemo(() => computeSettlements(balances), [balances]);

  // PUBLIC_INTERFACE
  const handleAddSharedExpense = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Enter a valid amount greater than 0.");
      return;
    }

    const involved = [...members]; // demo: all members involved in group expense
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const payload = {
      amount: amt,
      category: "Group",
      date: `${yyyy}-${mm}-${dd}`,
      notes: `${description || "Shared expense"} [G:${groupId}]`,
      payer,
      involved,
      split:
        splitMode === "custom"
          ? { mode: "custom", shares: customShares }
          : { mode: "equal" },
    };

    addExpense(payload);
    setAmount("");
    setDescription("");
    setSplitMode("equal");
    setCustomShares({});
  };

  const totalGroupSpend = useMemo(
    () => groupExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [groupExpenses]
  );

  const canAdd = Number(amount) > 0 && members.length > 0;

  return (
    <div className="App travel">
      {/* Hero */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content container">
          <h1 className="headline">Group Travel Mode</h1>
          <p className="subtext">
            Invite your travel companions, log shared expenses, and see who owes whom—automatically.
          </p>
          <div className="accent-legend" aria-hidden="true">
            <span className="chip chip-blue">Invite</span>
            <span className="chip chip-green">Join</span>
            <span className="chip chip-yellow">Shared Expenses</span>
            <span className="chip chip-pink">Balances</span>
          </div>
        </div>
      </section>

      {/* Floating card */}
      <div className="floating-card-wrapper">
        <div className="card floating-card">
          <div className="card-header">
            <h2 className="card-title">Get Started with Your Group</h2>
            <p className="card-subtext">Follow the steps below: Invite → Join → Add Shared Expenses → Review Balances.</p>
          </div>

          {/* Step 1: Invite */}
          <section className="card" style={{ padding: 16, marginBottom: 12 }}>
            <h3 className="card-title" style={{ fontSize: "1.05rem" }}>Step 1: Invite</h3>
            <p className="card-subtext">Share this code or link so others can join.</p>
            <div className="summary" style={{ marginTop: 12 }}>
              <div className="summary-row">
                <span className="summary-label">Invite Code</span>
                <span className="summary-value accent">{inviteCode}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Share Link</span>
                <span className="summary-value" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-strong, #0B0B0B)" }}>
                  {groupLink}
                </span>
              </div>
            </div>
            <div className="actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(groupLink).then(
                    () => alert("Link copied to clipboard"),
                    () => alert("Could not copy, please copy manually")
                  );
                }}
              >
                Copy Link
              </button>
            </div>
          </section>

          {/* Step 2: Join */}
          <section className="card" style={{ padding: 16, marginBottom: 12 }}>
            <h3 className="card-title" style={{ fontSize: "1.05rem" }}>Step 2: Join</h3>
            <p className="card-subtext">Already have a code? Join with the invite code.</p>

            <form onSubmit={handleJoinByCode} className="inputs-grid" style={{ marginTop: 10 }}>
              <div className="field">
                <label className="label">Enter Invite Code <span className="dot dot-blue" /></label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., 7K39WT"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  aria-label="Invite code"
                />
              </div>
              <div className="actions" style={{ marginTop: 0 }}>
                <button type="submit" className="btn-primary">Join Group</button>
              </div>
            </form>
          </section>

          {/* Step 3: Members */}
          <section className="card" style={{ padding: 16, marginBottom: 12 }}>
            <h3 className="card-title" style={{ fontSize: "1.05rem" }}>Step 3: Members</h3>
            <p className="card-subtext">Add members by name or email. Remove if added by mistake.</p>

            <div className="inputs-grid" style={{ marginTop: 10 }}>
              <div className="field">
                <label className="label">
                  Add Member
                  <span className="dot dot-green" />
                </label>
                <div className="friends-input-wrap">
                  <input
                    type="text"
                    className="input"
                    placeholder="Type a name or email, then Enter"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMember();
                      }
                    }}
                    aria-label="Add member by name or email"
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
              <div className="friends-chips" role="list" style={{ marginTop: 12 }}>
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
          </section>

          {/* Step 4: Add Shared Expenses */}
          <section className="card" style={{ padding: 16, marginBottom: 12 }}>
            <h3 className="card-title" style={{ fontSize: "1.05rem" }}>Step 4: Add Shared Expenses</h3>
            <p className="card-subtext">Log a shared expense with a payer and split method; balances update automatically.</p>

            <form onSubmit={handleAddSharedExpense} className="inputs-grid" style={{ marginTop: 10 }}>
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
                    aria-label="Shared expense amount"
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">
                  Payer
                  <span className="dot dot-pink" />
                </label>
                <select className="input" value={payer} onChange={(e) => setPayer(e.target.value)} aria-label="Payer">
                  {members.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">
                  Split Mode
                  <span className="dot dot-blue" />
                </label>
                <div role="group" aria-label="Split mode" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setSplitMode("equal")}
                    aria-pressed={splitMode === "equal"}
                    style={{
                      border: splitMode === "equal" ? "2px solid var(--green)" : "1px solid var(--gray-200)",
                      background: splitMode === "equal" ? "rgba(34,197,94,0.08)" : "linear-gradient(180deg, #ffffff, #f9fafb)",
                    }}
                  >
                    Split equally
                  </button>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setSplitMode("custom")}
                    aria-pressed={splitMode === "custom"}
                    style={{
                      border: splitMode === "custom" ? "2px solid var(--blue)" : "1px solid var(--gray-200)",
                      background: splitMode === "custom" ? "rgba(59,130,246,0.08)" : "linear-gradient(180deg, #ffffff, #f9fafb)",
                    }}
                  >
                    Custom shares
                  </button>
                </div>
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

              {splitMode === "custom" && (
                <div className="field" style={{ gridColumn: "span 12" }}>
                  <label className="label">Custom Shares <span className="dot dot-blue" /></label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                    {members.map((m) => (
                      <div key={m} className="input-with-prefix">
                        <span className="prefix">#</span>
                        <input
                          type="number"
                          className="input"
                          min={0}
                          step="0.1"
                          placeholder="1"
                          value={customShares[m] ?? ""}
                          onChange={(e) => handleCustomShareChange(m, e.target.value)}
                          aria-label={`Share for ${m}`}
                        />
                        <small className="hint">Weight for {m}</small>
                      </div>
                    ))}
                  </div>
                  <small className="hint">Each person pays their weight/totalWeights portion of the amount.</small>
                </div>
              )}
            </form>

            <div className="actions">
              <button type="button" className="btn-primary" onClick={handleAddSharedExpense} disabled={!canAdd}>
                Add Shared Expense
              </button>
              <a className="btn-secondary" href="/expenses" title="Open Expense Logger">
                Open Expense Logger →
              </a>
            </div>

            <div className="summary" style={{ marginTop: 12 }}>
              <div className="summary-row">
                <span className="summary-label">Total Group Spend</span>
                <span className="summary-value accent">{formatCurrency(totalGroupSpend)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Recent items</span>
                <span className="summary-value">{groupExpenses.slice(0, 3).length}</span>
              </div>
            </div>
          </section>

          {/* Step 5: Live Balances */}
          <section className="card" style={{ padding: 16 }}>
            <h3 className="card-title" style={{ fontSize: "1.05rem" }}>Step 5: Live Balance Sheet</h3>
            <p className="card-subtext">Positive means to receive, negative means owes. Suggested settlements below.</p>

            {/* Balances grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
                marginTop: 12,
              }}
            >
              {members.map((m) => {
                const v = balances[m] || 0;
                const color =
                  v > 0 ? "var(--green)" : v < 0 ? "var(--pink)" : "var(--gray-700)";
                return (
                  <div key={m} className="summary-card">
                    <div className="summary-card__title" style={{ marginBottom: 4 }}>{m}</div>
                    <div className="summary-card__capsule">
                      <span className="summary-card__label">Net</span>
                      <span className="summary-card__link" style={{ color }}>
                        {formatCurrency(v)}
                      </span>
                      <span className="summary-card__value summary-card__value--placeholder">–</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested settlements */}
            <div className="card" style={{ marginTop: 16, padding: 12 }}>
              <div className="card-header" style={{ padding: "0 0 6px 0" }}>
                <h4 className="card-title" style={{ fontSize: 14, margin: 0 }}>Suggested Settlements</h4>
                <p className="card-subtext" style={{ marginTop: 4 }}>Minimal payments to settle all balances.</p>
              </div>

              {settlements.length === 0 ? (
                <p className="hint" style={{ margin: 0 }}>All settled. No one owes anything.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                  {settlements.map((s, idx) => (
                    <li key={idx} className="summary-card" style={{ padding: "10px 12px", minHeight: "auto" }}>
                      <div className="summary-card__capsule">
                        <span className="summary-card__label">{s.from} pays</span>
                        <span className="summary-card__link" style={{ color: "var(--accent-blue, #1E88E5)" }}>
                          {formatCurrency(s.amount)}
                        </span>
                        <span className="summary-card__value">to {s.to}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <div className="actions" style={{ marginTop: 16 }}>
            <a className="btn-secondary" href="/" title="Back to Trip Setup">
              ← Back to Trip Setup
            </a>
            <a className="btn-secondary" href="/expenses" title="Log Expense">
              Log Expense →
            </a>
            <a className="btn-secondary" href="/dashboard" title="View Dashboard">
              View Dashboard →
            </a>
          </div>
        </div>
      </div>

      <footer className="footer container">
        <p className="footer-text">Invite, join, share costs, and settle up effortlessly.</p>
      </footer>
    </div>
  );
}
