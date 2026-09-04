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

export const buildPdfDefinition = ({
  data,
  labels,
  currency,
  rates,
  isQuote,
  logoDataUrl = null,
  paymentQrDataUrl = null,
}) => {
  const accent = isQuote ? '#7c3aed' : '#1976d2';
  const accentLight = isQuote ? '#f5f0ff' : '#eef6fd';
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
  const numberLabel = isQuote ? labels.quoteNumber : labels.invoiceNumber;
  const title = isQuote ? labels.quoteTitleDefault : labels.invoiceTitleDefault;

  const sellerIdentity = [];
  if (logoDataUrl) {
    sellerIdentity.push({
      image: logoDataUrl,
      width: isQuote ? 40 : 48,
      margin: [0, 0, isQuote ? 9 : 12, 0],
    });
  }
  sellerIdentity.push({
    width: '*',
    stack: [
      {
        text: data.company.name || '',
        style: 'companyName',
        fontSize: isQuote ? 13 : 15,
        noWrap: isQuote,
      },
      ...(hasValue(data.company.address)
        ? [{ text: data.company.address, style: 'muted', margin: [0, 3, 0, 0] }]
        : []),
    ],
  });

  const metadata = [];
  if (hasValue(documentNumber)) {
    metadata.push({ text: [{ text: `${numberLabel}: `, bold: true }, String(documentNumber)] });
  }
  if (hasValue(data.date)) {
    metadata.push({ text: [{ text: `${labels.date}: `, bold: true }, String(data.date)] });
  }
  if (hasValue(deadlineValue)) {
    metadata.push({ text: [{ text: `${deadlineLabel}: `, bold: true }, String(deadlineValue)] });
  }

  const partyStack = (heading, party, isCompany = false) => {
    const hasDetails =
      hasValue(party.name) || hasValue(party.address) || hasValue(party.regCode) || hasValue(party.vatNumber);
    // Without a single filled field the heading would stand on its own, so drop it too.
    if (!hasDetails) return [];

    const rows = [{ text: heading, style: 'sectionHeading', margin: [0, 0, 0, 5] }];
    if (hasValue(party.name)) rows.push({ text: party.name });
    if (hasValue(party.address)) rows.push({ text: party.address });
    if (hasValue(party.regCode)) {
      rows.push({ text: `${labels.regCode}: ${party.regCode}` });
    }
    if (hasValue(party.vatNumber)) {
      rows.push({ text: `${labels.vatNumber}: ${party.vatNumber}` });
    }
    if (isCompany && hasValue(data.bic)) rows.push({ text: `BIC: ${data.bic}` });
    return rows;
  };

  // A column whose every cell is empty says nothing, so its heading goes too.
  const anyItemHas = (field) => data.items.some((item) => hasValue(item[field]));
  const showDescription = anyItemHas('description');
  const showUnit = anyItemHas('unit');

  const itemRows = data.items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return [
      ...(showDescription ? [{ text: item.description || '', alignment: 'left' }] : [{ text: '' }]),
      { text: String(quantity), alignment: 'right' },
      ...(showUnit ? [{ text: item.unit || '', alignment: 'right' }] : []),
      { text: money(unitPrice), alignment: 'right', noWrap: true },
      { text: `${taxRate.toFixed(1)}%`, alignment: 'right', noWrap: true },
      { text: money(quantity * unitPrice), alignment: 'right', noWrap: true },
    ];
  });

  const quoteFields = [
    [labels.contactPerson, data.contactPerson],
    [labels.referenceNumber, data.referenceNumber],
    [labels.deliveryTime, data.deliveryTime],
    [labels.paymentTerms, data.paymentTerms],
    [labels.deliveryTerms, data.deliveryTerms],
    [labels.warranty, data.warranty],
    [labels.terms, data.terms],
  ].filter(([, value]) => hasValue(value));

  const content = [
    {
      canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 5, color: accent, r: 2 }],
      margin: [0, 0, 0, 22],
    },
    {
      columns: [
        { width: '*', columns: sellerIdentity },
        {
          width: 220,
          alignment: 'right',
          unbreakable: true,
          stack: [
            {
              text: title,
              fontSize: isQuote ? 20 : 25,
              bold: true,
              color: accent,
              alignment: 'right',
              noWrap: true,
              margin: [0, 0, 0, 10],
            },
            ...metadata.map((row) => ({
              ...row,
              alignment: 'right',
              noWrap: true,
              margin: [0, 2, 0, 0],
            })),
          ],
        },
      ],
      columnGap: 20,
      margin: [0, 0, 0, 22],
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineColor: '#d7dee8' }],
      margin: [0, 0, 0, 20],
    },
    {
      columns: [
        {
          width: '*',
          stack: partyStack(labels.supplier, data.company, true),
        },
        {
          width: '*',
          stack: partyStack(labels.client, data.client),
          alignment: 'right',
        },
      ],
      columnGap: 35,
      margin: [0, 0, 0, 22],
    },
    {
      table: {
        headerRows: 1,
        widths: ['*', 40, ...(showUnit ? [40] : []), 70, 40, 78],
        body: [
          [
            // The leading column keeps its flexible width even when the
            // description is dropped, so the money columns stay on the right.
            showDescription ? labels.description : '',
            labels.quantity,
            ...(showUnit ? [labels.unit] : []),
            labels.unitPrice,
            labels.tax,
            labels.amount,
          ].map((text, index) => ({
            text,
            bold: true,
            color: '#334155',
            alignment: index === 0 ? 'left' : 'right',
          })),
          ...itemRows,
        ],
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? '#f1f5f9' : rowIndex % 2 ? '#ffffff' : '#f8fafc'),
        hLineColor: () => '#d7dee8',
        vLineColor: () => '#e5eaf0',
        paddingTop: () => 7,
        paddingBottom: () => 7,
        paddingLeft: () => 6,
        paddingRight: () => 6,
      },
      margin: [0, 0, 0, 20],
    },
  ];

  if (isQuote && quoteFields.length) {
    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                { text: labels.quoteDetails, bold: true, color: accent, margin: [0, 0, 0, 6] },
                ...quoteFields.map(([label, value]) => ({
                  text: [{ text: `${label}: `, bold: true }, String(value)],
                  margin: [0, 2, 0, 0],
                })),
              ],
            },
          ],
        ],
      },
      layout: {
        fillColor: () => accentLight,
        hLineColor: () => '#d8c9f5',
        vLineColor: () => '#d8c9f5',
        paddingTop: () => 10,
        paddingBottom: () => 10,
        paddingLeft: () => 12,
        paddingRight: () => 12,
      },
      margin: [0, 0, 0, 18],
    });
  }

  if (hasValue(data.notes)) {
    content.push({
      stack: [
        { text: labels.notes, style: 'sectionHeading', margin: [0, 0, 0, 5] },
        { text: String(data.notes) },
      ],
      margin: [0, 0, 0, 18],
    });
  }

  content.push({
    columns: [
      paymentQrDataUrl
        ? {
            width: 'auto',
            stack: [
              { text: labels.paymentQrTitle, bold: true, margin: [0, 0, 0, 5] },
              { image: paymentQrDataUrl, width: 96 },
              { text: labels.paymentQrHint, style: 'muted', margin: [0, 4, 0, 0] },
            ],
          }
        : { width: '*', text: '' },
      { width: '*', text: '' },
      {
        width: 230,
        table: {
          widths: ['*', 90],
          body: [
            [labels.subtotal, { text: money(subtotal), alignment: 'right' }],
            [labels.vat, { text: money(vat), alignment: 'right' }],
            [
              { text: labels.total, bold: true, fontSize: 11 },
              { text: money(total), bold: true, fontSize: 11, color: accent, alignment: 'right' },
            ],
          ],
        },
        layout: {
          fillColor: () => accentLight,
          hLineColor: (index) => (index === 2 ? '#b8c1ce' : accentLight),
          vLineColor: () => accentLight,
          paddingTop: () => 7,
          paddingBottom: () => 7,
          paddingLeft: () => 10,
          paddingRight: () => 10,
        },
      },
    ],
    margin: [0, 0, 0, 18],
  });

  return {
    pageSize: 'A4',
    pageMargins: [40, 38, 40, 48],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#1f2937', lineHeight: 1.25 },
    content,
    footer: () => ({
      text:
        data.company.name +
        (!isQuote && hasValue(data.bankAccount)
          ? ` | ${labels.account}: ${data.bankAccount}`
          : ''),
      alignment: 'center',
      color: '#64748b',
      fontSize: 8,
      margin: [40, 14, 40, 0],
    }),
    styles: {
      companyName: { fontSize: 15, bold: true, color: '#1f2937' },
      muted: { color: '#64748b', fontSize: 8.5 },
      sectionHeading: { fontSize: 10, bold: true, color: '#334155' },
    },
    info: {
      title: `${title} ${documentNumber || ''}`.trim(),
      author: data.company.name || '',
      subject: title,
    },
  };
};

export const exportDocumentPdf = async ({ data, labels, currency, rates, isQuote, paymentQrDataUrl = null }) => {
  const logoDataUrl = await loadImageAsDataUrl(data.company.logoUrl);
  const definition = buildPdfDefinition({
    data,
    labels,
    currency,
    rates,
    isQuote,
    logoDataUrl,
    paymentQrDataUrl,
  });
  const documentNumber = isQuote ? data.quoteNumber : data.invoiceNumber;
  const fileName = `${isQuote ? 'quote' : 'invoice'}_${documentNumber || 'draft'}.pdf`;

  pdfMake.createPdf(definition).download(fileName);
};
