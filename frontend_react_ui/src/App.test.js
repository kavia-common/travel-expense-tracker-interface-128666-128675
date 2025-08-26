import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Trip Setup headline', () => {
  render(<App />);
  const headline = screen.getByText(/Trip Setup/i);
  expect(headline).toBeInTheDocument();
});
