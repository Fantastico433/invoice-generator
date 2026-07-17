import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }));
jest.mock('html2canvas', () => jest.fn());

import App from './App';

beforeEach(() => {
  localStorage.clear();
});

test('switches between invoice and quote modes', () => {
  render(<App />);

  expect(screen.getByText('ARVE')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /koosta hinnapakkumine/i }));

  expect(screen.getByTestId('document-mode-toggle')).toHaveTextContent('Hinnapakkumise režiim');
  expect(screen.getByText('HINNAPAKKUMINE')).toBeInTheDocument();
  expect(screen.getByLabelText('Pakkumise nr')).toBeInTheDocument();
  expect(screen.getByLabelText('Kehtib kuni')).toBeInTheDocument();
});

test('does not render empty optional quote fields in the final document', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /koosta hinnapakkumine/i }));

  const preview = document.getElementById('pdf-preview');
  expect(within(preview).queryByText('Hinnapakkumise lisatingimused')).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Tarneaeg'), { target: { value: '2 nädalat' } });

  expect(within(preview).getByText('Hinnapakkumise lisatingimused')).toBeInTheDocument();
  expect(within(preview).getByText(/2 nädalat/)).toBeInTheDocument();
  expect(within(preview).queryByText(/Garantii:/)).not.toBeInTheDocument();
});

test('keeps invoice data when quote mode is toggled off again', () => {
  render(<App />);
  const invoiceNumber = screen.getByLabelText('Arve nr');
  fireEvent.change(invoiceNumber, { target: { value: 'ARV-2026-0042' } });

  fireEvent.click(screen.getByRole('button', { name: /koosta hinnapakkumine/i }));
  fireEvent.click(screen.getByRole('button', { name: /hinnapakkumise režiim/i }));

  expect(screen.getByLabelText('Arve nr')).toHaveValue('ARV-2026-0042');
});
