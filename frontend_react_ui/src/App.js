import React from "react";
import "./App.css";
import TripSetup from "./TripSetup";
import Dashboard from "./pages/Dashboard";
import ExpenseLogging from "./pages/ExpenseLogging";
import GroupTravel from "./pages/GroupTravel";
import NavBar from "./components/NavBar";
import { ExpensesProvider } from "./context/ExpensesContext";

/**
 * Root with minimal client-side routing by path prefix.
 * Avoids external dependencies while enabling navigation between pages.
 *
 * Provides a global ExpensesProvider so the Expense Logging page can add a new
 * expense and the Dashboard reflects the change instantly (optimistic UI).
 */

// PUBLIC_INTERFACE
export default function App() {
  const [path, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Intercept nav clicks for internal routes
  React.useEffect(() => {
    const handler = (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      const url = new URL(a.href);
      const sameOrigin = url.origin === window.location.origin;
      if (sameOrigin && !a.hasAttribute("data-external")) {
        e.preventDefault();
        if (url.pathname !== window.location.pathname) {
          window.history.pushState({}, "", url.pathname);
          setPath(url.pathname);
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  let Page = TripSetup;
  if (path.startsWith("/expenses")) Page = ExpenseLogging;
  else if (path.startsWith("/dashboard")) Page = Dashboard;
  else if (path.startsWith("/group")) Page = GroupTravel;

  return (
    <ExpensesProvider>
      <div className="App travel">
        <NavBar />
        <Page />
      </div>
    </ExpensesProvider>
  );
}
