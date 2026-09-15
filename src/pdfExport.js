import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.addVirtualFileSystem(pdfFonts);

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== '';

const loadImageAsDataUrl = async (url) => {
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// Mixes two hex colours; used to step a gradient out of flat rectangles,
// since pdfMake's canvas has no gradient fill of its own.
const mixHex = (from, to, t) => {
  const channel = (offset) => {
    const a = parseInt(from.slice(offset, offset + 2), 16);
    const b = parseInt(to.slice(offset, offset + 2), 16);
    return Math.round(a + (b - a) * t).toString(16).padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
};

const PAGE = { width: 595.28, height: 841.89 };
const FRAME = { x: 30, y: 30, w: PAGE.width - 60, h: PAGE.height - 90, r: 8 };

export const buildPdfDefinition = ({
  data,
  labels,
  currency,
  rates,
  isQuote,
  logoDataUrl = null,
  paymentQrDataUrl = null,
  paymentLink = '',
}) => {
  const accent = isQuote ? '#7c3aed' : '#1976d2';
  const accentEnd = isQuote ? '#ec4899' : '#c026d3';
  const accentLight = isQuote ? '#f5f0ff' : '#eef6fd';
  const ink = '#1f2937';
  const muted = '#64748b';
  const line = '#e2e8f0';
  const rate = rates[currency] || 1;
  const taxRate = Number(data.taxRate) || 0;
  const subtotal = data.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const vat = (subtotal * taxRate) / 100;
  const total = subtotal + vat;
  const money = (value) => `${(value * rate).toFixed(2)} ${currency}`;
  const documentNumber = isQuote ? data.quoteNumber : data.invoiceNumber;
  const deadlineValue = isQuote ? data.validUntil : data.dueDate;
  const deadlineLabel = isQuote ? labels.validUntil : labels.dueDate;
  const title = isQuote ? labels.quoteTitleDefault : labels.invoiceTitleDefault;

  // ---- header: identity on the left, title and number box on the right ----

  const sellerIdentity = [];
  if (logoDataUrl) {
    sellerIdentity.push({ image: logoDataUrl, width: 44, margin: [0, 2, 10, 0] });
  }
  sellerIdentity.push({
    width: '*',
    stack: [
      { text: data.company.name || '', bold: true, fontSize: 16, color: ink, noWrap: true },
      ...(hasValue(data.company.address)
        ? [{ text: data.company.address, color: muted, fontSize: 9.5, margin: [0, 2, 0, 0] }]
        : []),
    ],
  });

  const numberBoxRows = [];
  if (hasValue(documentNumber)) {
    numberBoxRows.push({ text: `#${documentNumber}`, bold: true, fontSize: 12, color: ink, noWrap: true });
  }
  if (hasValue(data.date)) {
    numberBoxRows.push({ text: `${labels.date}: ${data.date}`, color: muted, noWrap: true, margin: [0, 3, 0, 0] });
  }
  if (hasValue(deadlineValue)) {
    numberBoxRows.push({ text: `${deadlineLabel}: ${deadlineValue}`, color: muted, noWrap: true, margin: [0, 3, 0, 0] });
  }

  const headerRight = {
    width: 200,
    alignment: 'right',
    unbreakable: true,
    stack: [
      { text: title, fontSize: 26, bold: true, color: accent, alignment: 'right', noWrap: true },
      ...(numberBoxRows.length
        ? [{
            table: { widths: ['*'], body: [[{ stack: numberBoxRows, alignment: 'right' }]] },
            layout: {
              fillColor: () => accentLight,
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingTop: () => 8,
              paddingBottom: () => 8,
              paddingLeft: () => 12,
              paddingRight: () => 12,
            },
            margin: [0, 4, 0, 0],
          }]
        : []),
    ],
  };

  // ---- party boxes ----

  const partyBox = (heading, party, options) => {
    const hasDetails =
      hasValue(party.name) || hasValue(party.address) || hasValue(party.regCode) || hasValue(party.vatNumber);
    if (!hasDetails) return { width: '*', text: '' };

    const rows = [
      {
        text: String(heading).toUpperCase(),
        bold: true,
        fontSize: 7.5,
        color: options.headingColor,
        characterSpacing: 0.6,
        margin: [0, 0, 0, 5],
      },
    ];
    if (hasValue(party.name)) rows.push({ text: party.name, bold: true, fontSize: 11, color: ink, margin: [0, 0, 0, 3] });
    if (hasValue(party.address)) rows.push({ text: party.address, color: muted, margin: [0, 0, 0, 2] });
    if (hasValue(party.regCode)) rows.push({ text: `${labels.regCode}: ${party.regCode}`, color: muted, margin: [0, 0, 0, 2] });
    if (hasValue(party.vatNumber)) rows.push({ text: `${labels.vatNumber}: ${party.vatNumber}`, color: muted, margin: [0, 0, 0, 2] });

    return {
      width: '*',
      table: { widths: ['*'], body: [[{ stack: rows }]] },
      layout: {
        fillColor: () => options.fill,
        hLineWidth: () => 0,
        vLineWidth: (index) => (index === 0 ? 3 : 0),
        vLineColor: () => options.edge,
        paddingTop: () => 12,
        paddingBottom: () => 10,
        paddingLeft: () => 14,
        paddingRight: () => 12,
      },
    };
  };

  // ---- reference line: PO | contract | quotation ----

  const references = [
    [labels.poNumber, data.poNumber],
    [labels.contractNumber, data.contractNumber],
    [labels.quotationNumber, data.quotationNumber],
  ].filter(([, value]) => hasValue(value));

  // ---- items table ----

  // A column whose every cell is empty says nothing, so its heading goes too.
  const anyItemHas = (field) => data.items.some((item) => hasValue(item[field]));
  const showDescription = anyItemHas('description');
  const showUnit = anyItemHas('unit');

  const itemRows = data.items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return [
      ...(showDescription ? [{ text: item.description || '', bold: true, color: ink }] : []),
      { text: String(quantity), alignment: 'center' },
      ...(showUnit ? [{ text: item.unit || '', alignment: 'center' }] : []),
      { text: money(unitPrice), alignment: 'right' },
      { text: `${taxRate.toFixed(1)}%`, alignment: 'center' },
      { text: money(quantity * unitPrice), alignment: 'right', bold: true, color: ink },
    ];
  });

  const headerCells = [
    ...(showDescription ? [{ text: labels.description, alignment: 'left' }] : []),
    { text: labels.quantity, alignment: 'center' },
    ...(showUnit ? [{ text: labels.unit, alignment: 'center' }] : []),
    { text: labels.unitPrice, alignment: 'right' },
    { text: labels.tax, alignment: 'center' },
    { text: labels.amount, alignment: 'right' },
  ].map((cell) => ({ ...cell, bold: true, color: '#ffffff', fontSize: 8.5 }));

  const itemsTable = {
    table: {
      headerRows: 1,
      // Widths are content widths: pdfMake adds the cell padding on top.
      widths: [...(showDescription ? ['*'] : []), 34, ...(showUnit ? [36] : []), 54, 30, 60],
      body: [headerCells, ...itemRows],
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? accent : null),
      hLineWidth: (index, node) => (index === 0 || index === node.table.body.length ? 1 : 0.5),
      hLineColor: (index, node) => (index === 0 || index === node.table.body.length ? line : '#eef2f6'),
      vLineWidth: (index, node) => (index === 0 || index === node.table.widths.length ? 1 : 0),
      vLineColor: () => line,
      paddingTop: (rowIndex) => (rowIndex === 0 ? 9 : 11),
      paddingBottom: (rowIndex) => (rowIndex === 0 ? 9 : 11),
      paddingLeft: () => 8,
      paddingRight: () => 8,
    },
    margin: [0, 0, 0, 24],
  };

  // Without a description column the table no longer fills the page, so it is
  // pushed to the right edge rather than left dangling.
  const itemsBlock = showDescription
    ? itemsTable
    : { columns: [{ width: '*', text: '' }, { ...itemsTable, width: 'auto' }], margin: [0, 0, 0, 24] };

  // ---- quote terms ----

  const quoteFields = [
    [labels.contactPerson, data.contactPerson],
    [labels.referenceNumber, data.referenceNumber],
    [labels.deliveryTime, data.deliveryTime],
    [labels.paymentTerms, data.paymentTerms],
    [labels.deliveryTerms, data.deliveryTerms],
    [labels.warranty, data.warranty],
    [labels.terms, data.terms],
  ].filter(([, value]) => hasValue(value));

  // ---- totals ----

  const totalsBox = {
    width: 240,
    table: {
      widths: ['*', 100],
      body: [
        [{ text: labels.subtotal, color: muted }, { text: money(subtotal), alignment: 'right', color: muted }],
        [{ text: `${labels.vat} (${taxRate}%)`, color: muted }, { text: money(vat), alignment: 'right', color: muted }],
        [
          { text: labels.total, bold: true, fontSize: 11, color: '#ffffff' },
          { text: money(total), bold: true, fontSize: 13, color: '#ffffff', alignment: 'right' },
        ],
      ],
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 2 ? accent : null),
      hLineWidth: (index) => (index === 0 || index === 3 ? 1 : 0),
      hLineColor: () => line,
      vLineWidth: (index) => (index === 0 || index === 2 ? 1 : 0),
      vLineColor: () => line,
      paddingTop: (rowIndex) => (rowIndex === 2 ? 12 : 8),
      paddingBottom: (rowIndex) => (rowIndex === 2 ? 12 : 8),
      paddingLeft: () => 16,
      paddingRight: () => 16,
    },
  };

  const qrBlock = paymentQrDataUrl
    ? {
        width: 'auto',
        stack: [
          { text: labels.paymentQrTitle, bold: true, margin: [0, 0, 0, 5] },
          { image: paymentQrDataUrl, width: 96 },
          {
            text: paymentLink ? labels.paymentLinkHint : labels.paymentQrHint,
            color: muted,
            fontSize: 8,
            margin: [0, 4, 0, 0],
          },
          ...(paymentLink
            ? [{ text: paymentLink, link: paymentLink, color: accent, fontSize: 8, margin: [0, 2, 0, 0] }]
            : []),
        ],
      }
    : { width: '*', text: '' };

  // ---- assemble ----

  const content = [
    {
      columns: [{ width: '*', columns: sellerIdentity, columnGap: 0 }, headerRight],
      columnGap: 20,
      margin: [0, 6, 0, 30],
    },
    {
      columns: [
        partyBox(labels.supplier, data.company, { fill: '#f3f4f6', edge: '#cbd5e1', headingColor: muted }),
        partyBox(labels.client, data.client, { fill: accentLight, edge: accent, headingColor: accent }),
      ],
      columnGap: 14,
      margin: [0, 0, 0, references.length ? 12 : 26],
    },
  ];

  if (references.length) {
    content.push({
      text: references.map(([label, value]) => `${label}: ${value}`).join('    |    '),
      color: muted,
      fontSize: 8.5,
      margin: [0, 0, 0, 22],
    });
  }

  content.push(itemsBlock);

  if (isQuote && quoteFields.length) {
    content.push({
      table: {
        widths: ['*'],
        body: [[{
          stack: [
            {
              text: String(labels.quoteDetails).toUpperCase(),
              bold: true,
              fontSize: 7.5,
              color: accent,
              characterSpacing: 0.6,
              margin: [0, 0, 0, 6],
            },
            ...quoteFields.map(([label, value]) => ({
              text: [{ text: `${label}: `, bold: true }, String(value)],
              margin: [0, 2, 0, 0],
            })),
          ],
        }]],
      },
      layout: {
        fillColor: () => accentLight,
        hLineWidth: () => 0,
        vLineWidth: (index) => (index === 0 ? 3 : 0),
        vLineColor: () => accent,
        paddingTop: () => 12,
        paddingBottom: () => 10,
        paddingLeft: () => 14,
        paddingRight: () => 12,
      },
      margin: [0, 0, 0, 22],
    });
  }

  if (hasValue(data.notes)) {
    content.push({
      stack: [
        {
          text: String(labels.notes).toUpperCase(),
          bold: true,
          fontSize: 7.5,
          color: muted,
          characterSpacing: 0.6,
          margin: [0, 0, 0, 5],
        },
        { text: String(data.notes) },
      ],
      margin: [0, 0, 0, 22],
    });
  }

  content.push({
    columns: [qrBlock, { width: '*', text: '' }, totalsBox],
    margin: [0, 0, 0, 20],
  });

  if (data.reverseCharge) {
    content.push({ text: labels.reverseChargeNote, color: muted, fontSize: 8, margin: [0, 4, 0, 0] });
  }

  // The frame's top edge carries a blue-to-purple sweep, stepped out of
  // narrow rectangles because the canvas cannot fill a gradient.
  const barSteps = 40;
  const barWidth = FRAME.w - 2 * FRAME.r;
  const topBar = Array.from({ length: barSteps }, (_, index) => ({
    type: 'rect',
    x: FRAME.x + FRAME.r + (barWidth * index) / barSteps,
    y: FRAME.y - 2,
    w: barWidth / barSteps + 0.6,
    h: 4,
    color: mixHex(accent, accentEnd, index / (barSteps - 1)),
  }));

  return {
    pageSize: 'A4',
    pageMargins: [50, 56, 50, 72],
    background: () => ({
      canvas: [
        { type: 'rect', x: FRAME.x, y: FRAME.y, w: FRAME.w, h: FRAME.h, r: FRAME.r, lineColor: line, lineWidth: 1 },
        ...topBar,
      ],
    }),
    defaultStyle: { font: 'Roboto', fontSize: 9, color: ink, lineHeight: 1.3 },
    content,
    footer: () => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: PAGE.width - 100, y2: 0, lineColor: line, lineWidth: 1 }] },
        {
          columns: [
            { text: data.company.name || '', color: muted, fontSize: 8.5 },
            {
              text: !isQuote && hasValue(data.bankAccount)
                ? `${labels.account}: ${data.bankAccount}${hasValue(data.bic) ? ` · BIC: ${data.bic}` : ''}`
                : '',
              color: muted,
              fontSize: 8.5,
              alignment: 'right',
            },
          ],
          margin: [0, 12, 0, 0],
        },
      ],
      margin: [50, 8, 50, 0],
    }),
    info: {
      title: `${title} ${documentNumber || ''}`.trim(),
      author: data.company.name || '',
      subject: title,
    },
  };
};

export const exportDocumentPdf = async ({ data, labels, currency, rates, isQuote, paymentQrDataUrl = null }) => {
  const paymentLink = hasValue(data.paymentLink) ? String(data.paymentLink).trim() : '';
  const logoDataUrl = await loadImageAsDataUrl(data.company.logoUrl);
  const definition = buildPdfDefinition({
    data,
    labels,
    currency,
    rates,
    isQuote,
    logoDataUrl,
    paymentQrDataUrl,
    paymentLink,
  });
  const documentNumber = isQuote ? data.quoteNumber : data.invoiceNumber;
  const fileName = `${isQuote ? 'quote' : 'invoice'}_${documentNumber || 'draft'}.pdf`;

  pdfMake.createPdf(definition).download(fileName);
};
