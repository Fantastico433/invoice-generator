import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }));
jest.mock('html2canvas', () => jest.fn());

import App from './App';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const mockPdf = {
  internal: {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297,
    },
  },
  addImage: jest.fn(),
  addPage: jest.fn(),
  save: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.requestAnimationFrame = (callback) => callback();
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillStyle: '',
    fillRect: jest.fn(),
    drawImage: jest.fn(),
  }));
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test');
  html2canvas.mockResolvedValue({ width: 1985, height: 2807 });
  jsPDF.mockReturnValue(mockPdf);
});

test('switches between invoice and quote modes', () => {
  render(<App />);

  expect(screen.getByText('ARVE')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /koosta hinnapakkumine/i }));

  expect(screen.getByTestId('document-mode-toggle')).toHaveTextContent('Hinnapakkumise režiim');
  expect(screen.getByText('HINNAPAKKUMINE')).toBeInTheDocument();
  expect(screen.getByTestId('document-title')).toHaveStyle('font-size: 1.7rem');
  expect(screen.getByTestId('document-metadata')).toHaveStyle('text-align: right');
  expect(within(screen.getByTestId('document-metadata')).getByText(/Pakkumise nr:/)).toBeInTheDocument();
  expect(within(screen.getByTestId('document-metadata')).getByText(/Kuupäev:/)).toBeInTheDocument();
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

test('lets the user resize the live document preview', () => {
  render(<App />);

  const scaleSlider = screen.getByRole('slider', { name: 'Eelvaate suurus' });
  expect(scaleSlider).toHaveValue('90');
  expect(document.getElementById('pdf-preview')).toHaveStyle('transform: scale(0.9)');

  fireEvent.change(scaleSlider, { target: { value: '70' } });

  expect(document.getElementById('pdf-preview')).toHaveStyle('transform: scale(0.7)');
});

test('exports a full-size shadow-free A4 document independently of live preview scale', async () => {
  render(<App />);
  fireEvent.change(screen.getByRole('slider', { name: 'Eelvaate suurus' }), {
    target: { value: '50' },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Laadi alla' }));

  await waitFor(() => expect(html2canvas).toHaveBeenCalled());
  const [exportElement, exportOptions] = html2canvas.mock.calls[0];

  expect(exportElement).toHaveAttribute('id', 'pdf-export-preview');
  expect(exportElement).toHaveStyle({
    width: '794px',
    minHeight: '1123px',
    boxSizing: 'border-box',
  });
  expect(exportElement.style.transform).toBe('');
  expect(exportOptions).toMatchObject({
    scale: 2.5,
    useCORS: true,
    backgroundColor: '#ffffff',
  });
  expect(jsPDF).toHaveBeenCalledWith(
    expect.objectContaining({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  );
  expect(mockPdf.addImage).toHaveBeenCalledWith(
    expect.any(String),
    'PNG',
    0,
    0,
    210,
    297,
    undefined,
    'FAST'
  );
  expect(mockPdf.save).toHaveBeenCalledWith('invoice_2025043002.pdf');
  await waitFor(() => expect(document.getElementById('pdf-export-preview')).not.toBeInTheDocument());
});
