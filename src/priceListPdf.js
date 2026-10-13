import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { buildExtraRows, buildIncludedRows, buildPriceRows } from './PriceList';

pdfMake.addVirtualFileSystem(pdfFonts);

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

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

export const buildPriceListDefinition = ({ input, result, labels, company, logoDataUrl = null }) => {
  const accent = '#1976d2';
  const accentEnd = '#c026d3';
  const accentLight = '#eef6fd';
  const ink = '#1f2937';
  const muted = '#64748b';
  const line = '#e2e8f0';
  const money = (value) =>
    typeof value === 'number' ? `${Math.round(value).toLocaleString('et-EE')} €` : String(value || '');

  const identity = [];
  if (logoDataUrl) identity.push({ image: logoDataUrl, width: 44, margin: [0, 2, 10, 0] });
  identity.push({
    width: '*',
    stack: [
      { text: company.name || '', bold: true, fontSize: 16, color: ink, noWrap: true },
      ...(hasValue(company.address)
        ? [{ text: company.address, color: muted, fontSize: 9.5, margin: [0, 2, 0, 0] }]
        : []),
    ],
  });

  const includedRows = buildIncludedRows(input, labels);
  const extraRows = buildExtraRows(input, labels);
  const priceRows = buildPriceRows(result, input, labels).map((row) => [
    { text: row.service, bold: true, color: ink },
    { text: money(row.list), alignment: 'right' },
    { text: money(row.pilot), alignment: 'right', bold: true, color: accent },
  ]);

  const header = [labels.service, labels.listPriceColumn, labels.pilotPriceColumn].map((text, index) => ({
    text,
    bold: true,
    color: '#ffffff',
    fontSize: 8.5,
    alignment: index === 0 ? 'left' : 'right',
  }));

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
    content: [
      {
        columns: [
          { width: '*', columns: identity, columnGap: 0 },
          {
            width: 210,
            alignment: 'right',
            stack: [
              { text: labels.priceListTitle, fontSize: 22, bold: true, color: accent, alignment: 'right' },
              { text: labels.priceListSubtitle, color: muted, alignment: 'right', margin: [0, 4, 0, 0] },
            ],
          },
        ],
        columnGap: 20,
        margin: [0, 6, 0, 28],
      },
      ...(priceRows.length ? [{
        table: { headerRows: 1, widths: ['*', 90, 90], body: [header, ...priceRows] },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? accent : null),
          hLineWidth: (index, node) => (index === 0 || index === node.table.body.length ? 1 : 0.5),
          hLineColor: (index, node) => (index === 0 || index === node.table.body.length ? line : '#eef2f6'),
          vLineWidth: (index, node) => (index === 0 || index === node.table.widths.length ? 1 : 0),
          vLineColor: () => line,
          paddingTop: (rowIndex) => (rowIndex === 0 ? 9 : 10),
          paddingBottom: (rowIndex) => (rowIndex === 0 ? 9 : 10),
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 10],
      }] : []),
      ...(priceRows.length ? [{
        text: `${labels.pilotNotePrefix}${Math.round(input.pilotDiscount * 100)}${labels.pilotNoteSuffix}`,
        color: muted,
        fontSize: 8,
        margin: [0, 0, 0, 22],
      }] : []),
      // A block with nothing under it would print as a lone heading, so it goes
      // with its rows.
      ...(includedRows.length || extraRows.length ? [{
        columns: [
          includedRows.length ? {
            width: '*',
            table: {
              widths: ['*'],
              body: [[{
                stack: [
                  { text: String(labels.included).toUpperCase(), bold: true, fontSize: 7.5, color: accent, characterSpacing: 0.6, margin: [0, 0, 0, 6] },
                  ...includedRows.map((item) => ({ text: `• ${item.text}`, margin: [0, 1.5, 0, 0] })),
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
          } : { width: '*', text: '' },
          extraRows.length ? {
            width: '*',
            stack: [
              { text: String(labels.extraServices).toUpperCase(), bold: true, fontSize: 7.5, color: muted, characterSpacing: 0.6, margin: [0, 0, 0, 6] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: extraRows.map((extra) => [
                    { text: extra.label },
                    { text: extra.value, alignment: 'right', bold: true, noWrap: true },
                  ]),
                },
                layout: {
                  hLineWidth: (index, node) => (index === 0 || index === node.table.body.length ? 0 : 0.5),
                  hLineColor: () => line,
                  vLineWidth: () => 0,
                  paddingTop: () => 5,
                  paddingBottom: () => 5,
                  paddingLeft: () => 0,
                  paddingRight: () => 0,
                },
              },
            ],
          } : { width: '*', text: '' },
        ],
        columnGap: 18,
        margin: [0, 0, 0, 22],
      }] : []),
      { text: labels.priceListFooter, color: muted, fontSize: 8 },
    ],
    footer: () => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: PAGE.width - 100, y2: 0, lineColor: line, lineWidth: 1 }] },
        { text: company.name || '', color: muted, fontSize: 8.5, margin: [0, 12, 0, 0] },
      ],
      margin: [50, 8, 50, 0],
    }),
    info: { title: labels.priceListTitle, author: company.name || '', subject: labels.priceListTitle },
  };
};

export const exportPriceListPdf = async ({ input, result, labels, company }) => {
  const logoDataUrl = await loadImageAsDataUrl(company.logoUrl);
  const definition = buildPriceListDefinition({ input, result, labels, company, logoDataUrl });
  pdfMake.createPdf(definition).download('hinnakiri.pdf');
};
