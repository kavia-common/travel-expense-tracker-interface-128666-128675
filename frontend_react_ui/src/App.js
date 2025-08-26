import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Minimal travel expense tracker UI
 * - Large hero with "Trip Setup"
 * - Subtle background photo
 * - Floating rounded filter/search card with trip filters
 * - Bold black headings, gray subtext, accent highlights
 */

// Accent chips component for a bit of color and guidance
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
export default function App() {
  /** UI state for trip setup form */
  const [tripName, setTripName] = useState('');
  const [totalBudget, setTotalBudget] = useState(1500);
  const [dailyBudget, setDailyBudget] = useState(120);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Accessibility: announce changes (simple demo via title)
  useEffect(() => {
    document.title = `Trip Setup${tripName ? ` - ${tripName}` : ''}`;
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

  // PUBLIC_INTERFACE
  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder action: For future integration with backend
    // For now, show a non-blocking feedback
    alert(
      `Trip saved:
- Name: ${tripName || '(untitled)'}
- Dates: ${startDate || 'N/A'} to ${endDate || 'N/A'} (${tripSummary.days} days)
- Daily Budget: ${formatCurrency(dailyBudget)}
- Total Budget: ${formatCurrency(totalBudget)}
- Est. Total: ${formatCurrency(tripSummary.estTotal)}`
    );
  };

  return (
    <div className="App travel">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content container">
          <h1 className="headline">Trip Setup</h1>
          <p className="subtext">
            Plan your travel budget with clarity. Set your trip details, daily
            spending goals, and dates. Clean, simple, and flexible.
          </p>
          <AccentLegend />
        </div>

        {/* Floating Card */}
        <div className="floating-card-wrapper">
          <form className="card floating-card" onSubmit={handleSubmit}>
            <div className="card-header">
              <h2 className="card-title">Your Trip</h2>
              <p className="card-subtext">
                Configure the essentials. You can adjust everything later.
              </p>
            </div>

            <div className="inputs-grid">
              {/* Trip Name */}
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
                <small className="hint">A short title to recognize your trip.</small>
              </div>

              {/* Total Budget */}
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
                <small className="hint">
                  The maximum you want to spend for the entire trip.
                </small>
              </div>

              {/* Daily Budget Clicker */}
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
                <small className="hint">
                  Your ideal spending limit per day.
                </small>
              </div>

              {/* Start Date */}
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
                <small className="hint">When your trip begins.</small>
              </div>

              {/* End Date */}
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
                <small className="hint">When your trip finishes.</small>
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
            </div>

            <div className="actions">
              <button type="submit" className="btn-primary">
                Save Trip
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setTripName('');
                  setTotalBudget(1500);
                  setDailyBudget(120);
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Content section placeholder for future expansion */}
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
