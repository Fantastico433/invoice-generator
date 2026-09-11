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
  const seller = definition.content[1].columns[0].columns;
  const header = definition.content[1].columns[1];
  const definitionWithLogo = buildPdfDefinition({
    data,
    labels,
    currency: 'EUR',
    rates: { EUR: 1 },
    isQuote: true,
    logoDataUrl: 'data:image/png;base64,AA==',
  });
  const quoteLogo = definitionWithLogo.content[1].columns[0].columns[0];

  expect(definition.pageSize).toBe('A4');
  expect(quoteLogo).toMatchObject({ width: 40, margin: [0, 0, 9, 0] });
  expect(seller[0].stack[0]).toMatchObject({
    fontSize: 13,
    noWrap: true,
  });
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

test('drops headings and columns that would have nothing under them', () => {
  const definition = buildPdfDefinition({
    data: {
      ...data,
      client: { name: '', address: '', regCode: '', vatNumber: '' },
      items: [{ description: '', quantity: 1, unit: '', unitPrice: 1750 }],
    },
    labels: { ...labels, vatNumber: 'KMKR nr' },
    currency: 'EUR',
    rates: { EUR: 1 },
    isQuote: true,
  });

  // With no description the table is nested inside a right-aligning columns node.
  const findTable = (nodes) => nodes.reduce((found, node) => {
    if (found) return found;
    if (node.table && node.table.headerRows) return node;
    return node.columns ? findTable(node.columns) : null;
  }, null);

  const table = findTable(definition.content);
  const headers = table.table.body[0].map((cell) => cell.text);

  expect(headers).not.toContain(labels.description);
  expect(headers).not.toContain(labels.unit);
  expect(headers).toContain(labels.amount);
  expect(headers).not.toContain('');
  expect(table.table.widths).toHaveLength(headers.length);
  expect(table.table.widths).not.toContain('*');
  expect(table.table.body[1]).toHaveLength(headers.length);

  const parties = definition.content.find((node) => node.columns && node.columns[0].stack);
  const headings = parties.columns.map((column) => column.stack[0] && column.stack[0].text);
  expect(headings).toContain(labels.supplier);
  expect(headings).not.toContain(labels.client);
});
