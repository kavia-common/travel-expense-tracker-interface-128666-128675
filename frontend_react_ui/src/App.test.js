import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Trip Tracker headline', () => {
  // ensure we are on root route for test
  window.history.pushState({}, '', '/');
  render(<App />);
  const headline = screen.getByText(/Trip Tracker/i);
  expect(headline).toBeInTheDocument();
});
