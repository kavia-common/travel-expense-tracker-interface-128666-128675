import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import appIcon from './assets/app-icon.png';

/**
 * TripSetup page: original App content extracted for routing.
 * The UI and behavior are preserved.
 */

// Accent chips component for guidance
function AccentLegend() {
  return (
    <div className="accent-legend" aria-hidden="true">
      <span className="chip chip-yellow">Budget</span>
      <span className="chip chip-green">Savings</span>
      <span className="chip chip-pink">Activities</span>
      <span className="chip chip-blue">Dates</span>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function TripSetup() {
  const [tripName, setTripName] = useState('');
  const [totalBudget, setTotalBudget] = useState(1500);
  const [dailyBudget, setDailyBudget] = useState(120);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [friendInput, setFriendInput] = useState('');
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    document.title = `Trip Tracker${tripName ? ` - ${tripName}` : ''}`;
  }, [tripName]);

  const tripSummary = useMemo(() => {
    const days =
      startDate && endDate
        ? Math.max(
            0,
            Math.ceil(
              (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0;
    const estTotal = days > 0 ? dailyBudget * days : totalBudget;
    return { days, estTotal };
  }, [startDate, endDate, dailyBudget, totalBudget]);

  const incrementDaily = () => setDailyBudget((v) => Math.min(10000, v + 10));
  const decrementDaily = () => setDailyBudget((v) => Math.max(0, v - 10));

  const formatCurrency = (n) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n || 0);

  const normalized = (s) => s.trim().replace(/\s+/g, ' ');
  const isValidFriend = (s) => normalized(s).length > 0;

  // PUBLIC_INTERFACE
  const addFriend = () => {
    const value = normalized(friendInput);
    if (!isValidFriend(value)) return;
    if (friends.includes(value)) {
      setFriendInput('');
      return;
    }
    setFriends((prev) => [...prev, value]);
    setFriendInput('');
  };

  // PUBLIC_INTERFACE
  const removeFriend = (name) => {
    setFriends((prev) => prev.filter((f) => f !== name));
  };

  // PUBLIC_INTERFACE
  const handleFriendKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addFriend();
    } else if (e.key === 'Backspace' && friendInput === '' && friends.length) {
      removeFriend(friends[friends.length - 1]);
    }
  };

  // PUBLIC_INTERFACE
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      `Trip saved:
- Name: ${tripName || '(untitled)'}
- Dates: ${startDate || 'N/A'} to ${endDate || 'N/A'} (${tripSummary.days} days)
- Daily Budget: ${formatCurrency(dailyBudget)}
- Total Budget: ${formatCurrency(totalBudget)}
- Est. Total: ${formatCurrency(tripSummary.estTotal)}
- Friends: ${friends.length ? friends.join(', ') : 'None'}`
    );
  };

  return (
    <div className="App travel">
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content container">
          <h1
            className="headline"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <img
              src={appIcon}
              alt=""
              aria-hidden="true"
              style={{
                width: 40,
                height: 40,
                objectFit: "contain",
                borderRadius: 10,
              }}
            />
            <span>Trip Tracker</span>
          </h1>
          <p className="subtext">
            Plan your travel budget with clarity. Set your trip details, daily
            spending goals, and dates. Clean, simple, and flexible.
          </p>
          <AccentLegend />
        </div>
      </section>

      <div className="floating-card-wrapper">
        <form className="card floating-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2 className="card-title">Your Trip</h2>
            {/* Removed instructional subtext per request */}
          </div>

          <div className="inputs-grid">
            <div className="field">
              <label className="label">
                Trip name
                <span className="dot dot-pink" />
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Summer in Spain"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                aria-label="Trip name"
              />
              {/* Removed hint per request */}
            </div>

            <div className="field">
              <label className="label">
                Total budget
                <span className="dot dot-yellow" />
              </label>
              <div className="input-with-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  className="input"
                  min={0}
                  step={50}
                  placeholder="1500"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  aria-label="Total budget"
                />
              </div>
              {/* Removed hint per request */}
            </div>

            <div className="field">
              <label className="label">
                Daily budget
                <span className="dot dot-green" />
              </label>
              <div className="clicker">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={decrementDaily}
                  aria-label="Decrease daily budget"
                >
                  −
                </button>
                <div className="clicker-display" aria-live="polite">
                  {formatCurrency(dailyBudget)}
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={incrementDaily}
                  aria-label="Increase daily budget"
                >
                  +
                </button>
              </div>
              {/* Removed hint per request */}
            </div>

            <div className="field">
              <label className="label">
                Start date
                <span className="dot dot-blue" />
              </label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
              />
              {/* Removed hint per request */}
            </div>

            <div className="field">
              <label className="label">
                End date
                <span className="dot dot-blue" />
              </label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
              />
              {/* Removed hint per request */}
            </div>

            <div className="field friends-field">
              <label className="label">
                Add friends
                <span className="dot dot-green" />
              </label>
              <div className="friends-input-wrap">
                <input
                  type="text"
                  className="input"
                  placeholder="Type a name or email, then press Enter"
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  onKeyDown={handleFriendKeyDown}
                  aria-label="Add friend by name or email"
                />
                <button
                  type="button"
                  className="btn-ghost friends-add-btn"
                  onClick={addFriend}
                  aria-label="Add friend"
                  title="Add friend"
                >
                  +
                </button>
              </div>

              {friends.length > 0 && (
                <div className="friends-chips" aria-live="polite">
                  {friends.map((f) => (
                    <span key={f} className="chip chip-friend" role="listitem">
                      <span className="chip-avatar" aria-hidden="true">
                        👥
                      </span>
                      <span className="chip-text">{f}</span>
                      <button
                        type="button"
                        className="chip-remove"
                        aria-label={`Remove ${f}`}
                        onClick={() => removeFriend(f)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Removed hint per request */}
            </div>
          </div>

          <div className="summary card">
            <div className="summary-row">
              <span className="summary-label">Duration</span>
              <span className="summary-value">
                {tripSummary.days} {tripSummary.days === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Daily budget</span>
              <span className="summary-value">{formatCurrency(dailyBudget)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Planned total</span>
              <span className="summary-value accent">{formatCurrency(tripSummary.estTotal)}</span>
            </div>
            {friends.length > 0 && (
              <div className="summary-row">
                <span className="summary-label">Group size</span>
                <span className="summary-value">{friends.length + 1} travelers</span>
              </div>
            )}
          </div>

          <div className="actions">
            <button type="submit" className="btn-primary">
              Save Trip
            </button>
            <a className="btn-secondary" href="/expenses" title="Log an Expense">
              Quick Log Expense →
            </a>
            <a className="btn-secondary" href="/dashboard" title="Go to Dashboard">
              View Dashboard →
            </a>
          </div>
        </form>
      </div>

      <section className="container info-cards">
        <div className="info-card card">
          <h3 className="info-title">Track Expenses</h3>
          <p className="info-text">
            Add expenses as you go and compare against your daily budget.
          </p>
        </div>
        <div className="info-card card">
          <h3 className="info-title">Visual Insights</h3>
          <p className="info-text">
            See how your spending evolves across categories and days.
          </p>
        </div>
        <div className="info-card card">
          <h3 className="info-title">Smart Tips</h3>
          <p className="info-text">
            Get reminders and suggestions to stay within your plan.
          </p>
        </div>
      </section>

      <footer className="footer container">
        <p className="footer-text">
          Designed for clarity and ease. Plan, track, and enjoy your trip.
        </p>
      </footer>
    </div>
  );
}
