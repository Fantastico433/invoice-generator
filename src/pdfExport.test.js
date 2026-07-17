import pdfMake from 'pdfmake/build/pdfmake';

jest.mock('pdfmake/build/pdfmake', () => ({
  __esModule: true,
  default: {
    addVirtualFileSystem: jest.fn(),
    createPdf: jest.fn(),
  },
}));
jest.mock('pdfmake/build/vfs_fonts', () => ({
  __esModule: true,
  default: {},
}));

import { buildPdfDefinition, exportDocumentPdf } from './pdfExport';

const labels = {
  quoteTitleDefault: 'HINNAPAKKUMINE',
  invoiceTitleDefault: 'ARVE',
  quoteNumber: 'Pakkumise nr',
  invoiceNumber: 'Arve nr',
  date: 'Kuupäev',
  validUntil: 'Kehtib kuni',
  dueDate: 'Tähtaeg',
  supplier: 'Müüja',
  client: 'Klient',
  regCode: 'Reg kood',
  description: 'Kirjeldus',
  quantity: 'Kogus',
  unit: 'Ühik',
  unitPrice: 'Ühiku hind',
  tax: 'KM',
  amount: 'Summa',
  contactPerson: 'Kontaktisik',
  referenceNumber: 'Viitenumber',
  deliveryTime: 'Tarneaeg',
  paymentTerms: 'Maksetingimused',
  deliveryTerms: 'Tarnetingimused',
  warranty: 'Garantii',
  terms: 'Lisatingimused',
  quoteDetails: 'Hinnapakkumise lisatingimused',
  notes: 'Märkused',
  subtotal: 'Summa KM-ta',
  vat: 'KM',
  total: 'Kokku',
  account: 'Arveldusarve',
};

const data = {
  company: {
    name: 'SKYCORP OÜ',
    address: 'Tartu, Eesti',
    regCode: '16782217',
    logoUrl: '/logo.png',
  },
  client: { name: 'Testklient OÜ', address: 'Tallinn', regCode: '12345678' },
  invoiceNumber: 'ARV-2026-1',
  quoteNumber: 'PAK-2026-1',
  date: '2026-07-17',
  dueDate: '',
  validUntil: '2026-08-17',
  bankAccount: 'EE001234',
  bic: 'LHVBEE22',
  taxRate: 22,
  items: [{ description: 'Valitav teenuse tekst', quantity: 2, unit: 'tk', unitPrice: 100 }],
  notes: '',
  contactPerson: '',
  referenceNumber: '',
  deliveryTime: '2 nädalat',
  paymentTerms: '',
  deliveryTerms: '',
  warranty: '',
  terms: '',
};

test('builds an A4 quote from real text nodes and omits empty optional fields', () => {
  const definition = buildPdfDefinition({
    data,
    labels,
    currency: 'EUR',
    rates: { EUR: 1 },
    isQuote: true,
  });
  const serialized = JSON.stringify(definition);
  const header = definition.content[1].columns[1];

  expect(definition.pageSize).toBe('A4');
  expect(header).toMatchObject({ width: 220, alignment: 'right', unbreakable: true });
  expect(header.stack[0]).toMatchObject({
    text: 'HINNAPAKKUMINE',
    alignment: 'right',
    noWrap: true,
  });
  expect(header.stack.slice(1).every((row) => row.noWrap)).toBe(true);
  expect(serialized).toContain('HINNAPAKKUMINE');
  expect(serialized).toContain('Valitav teenuse tekst');
  expect(serialized).toContain('Testklient OÜ');
  expect(serialized).toContain('2 nädalat');
  expect(serialized).not.toContain('Garantii:');
  expect(serialized).not.toContain('data:image');
});

test('downloads the text document with the quote file name', async () => {
  const download = jest.fn();
  pdfMake.createPdf.mockReturnValue({ download });
  global.fetch = jest.fn(() => Promise.reject(new Error('Logo unavailable')));

  await exportDocumentPdf({
    data,
    labels,
    currency: 'EUR',
    rates: { EUR: 1 },
    isQuote: true,
  });

  expect(pdfMake.createPdf).toHaveBeenCalledWith(
    expect.objectContaining({ pageSize: 'A4', content: expect.any(Array) })
  );
  expect(download).toHaveBeenCalledWith('quote_PAK-2026-1.pdf');
});
