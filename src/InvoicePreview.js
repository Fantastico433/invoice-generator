import React from 'react';
import {
  Avatar,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

// EPC069-12 ("SEPA Credit Transfer") payload, the format European banking apps
// read from a QR code. Euro only, and the amount must stay within 0.01-999999999.99.
const buildSepaQrPayload = ({ name, iban, bic, amount, reference }) => {
  const cleanIban = String(iban || '').replace(/\s/g, '');
  if (!cleanIban || !hasValue(name)) return null;
  if (!(amount > 0) || amount > 999999999.99) return null;

  return [
    'BCD',
    '002',
    '1',
    'SCT',
    String(bic || '').replace(/\s/g, ''),
    String(name).slice(0, 70),
    cleanIban,
    'EUR' + amount.toFixed(2),
    '',
    '',
    String(reference || '').slice(0, 140),
    '',
  ].join(String.fromCharCode(10));
};

function InvoicePreview({
  data,
  scale = 1,
  compact = false,
  labels,
  isExportMode = false,
  currency = 'EUR',
  rates = { EUR: 1 },
  isQuote = false,
  previewId = 'pdf-preview',
}) {
  const theme = useTheme();
  const accent = isQuote ? '#7c3aed' : '#1976d2';
  const accentLight = isQuote ? '#f5f0ff' : '#eef6fd';
  const taxRate = Number(data.taxRate) || 0;
  const rate = rates[currency] || 1;
  const subtotal = data.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const vat = (subtotal * taxRate) / 100;
  const total = subtotal + vat;
  const formatMoney = (value) => `${(value * rate).toFixed(2)} ${currency}`;

  const documentNumber = isQuote ? data.quoteNumber : data.invoiceNumber;
  // Only invoices in euro can carry a scannable payment code: the EPC format is
  // euro-only, so a converted total would tell the bank the wrong number.
  // A payment link wins over the EPC payload: Estonian banking apps read a URL
  // and ignore EPC, while EPC still serves euro-area apps that support it.
  const paymentLink = hasValue(data.paymentLink) ? String(data.paymentLink).trim() : '';
  const paymentQrPayload = !isQuote && data.showPaymentQr
    ? paymentLink
      || (currency === 'EUR'
        ? buildSepaQrPayload({
            name: data.company.name,
            iban: data.bankAccount,
            bic: data.bic,
            amount: total,
            reference: documentNumber ? `${labels.invoiceNumber} ${documentNumber}` : '',
          })
        : null)
    : null;
  const paymentQrHint = paymentLink ? labels.paymentLinkHint : labels.paymentQrHint;
  // A column whose every cell is empty says nothing, so its heading should not
  // appear either. The money columns always carry a number and always stay.
  const anyItemHas = (field) => data.items.some((item) => hasValue(item[field]));
  const showDescription = anyItemHas('description');
  const showUnit = anyItemHas('unit');
  const hasPartyDetails = (party) =>
    hasValue(party.name) || hasValue(party.address) || hasValue(party.regCode) || hasValue(party.vatNumber);

  const documentTitle = isQuote ? labels.quoteTitleDefault : labels.invoiceTitleDefault;
  const deadlineValue = isQuote ? data.validUntil : data.dueDate;
  const deadlineLabel = isQuote ? labels.validUntil : labels.dueDate;
  const quoteFields = [
    [labels.contactPerson, data.contactPerson],
    [labels.referenceNumber, data.referenceNumber],
    [labels.deliveryTime, data.deliveryTime],
    [labels.paymentTerms, data.paymentTerms],
    [labels.deliveryTerms, data.deliveryTerms],
    [labels.warranty, data.warranty],
    [labels.terms, data.terms],
  ].filter(([, value]) => hasValue(value));

  const containerStyles = isExportMode
    ? {
        boxSizing: 'border-box',
        width: 794,
        minHeight: 1123,
        margin: '0 auto',
        padding: '40px',
        backgroundColor: '#fff',
        color: '#1f2937',
        fontSize: 11,
        lineHeight: 1.6,
      }
    : {
        boxSizing: 'border-box',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: 794,
        margin: '0 auto',
        padding: compact ? theme.spacing(4) : theme.spacing(6),
        backgroundColor: '#fff',
        color: '#1f2937',
        fontSize: 11,
        lineHeight: 1.6,
      };

  const references = [
    [labels.poNumber, data.poNumber],
    [labels.contractNumber, data.contractNumber],
    [labels.quotationNumber, data.quotationNumber],
  ].filter(([, value]) => hasValue(value));

  const muted = '#64748b';
  const line = '#e2e8f0';
  const eyebrow = { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' };

  const partyBox = (heading, party, options) => {
    if (!hasPartyDetails(party)) return null;
    return (
      <Box sx={{ flex: 1, bgcolor: options.fill, borderLeft: `4px solid ${options.edge}`, borderRadius: 1, px: 2.5, py: 2 }}>
        <Typography sx={{ ...eyebrow, color: options.headingColor, mb: 0.75 }}>{heading}</Typography>
        {hasValue(party.name) && <Typography variant="subtitle1" fontWeight={700} color="#1f2937" sx={{ lineHeight: 1.3, mb: 0.5 }}>{party.name}</Typography>}
        {hasValue(party.address) && <Typography variant="body2" sx={{ color: muted }}>{party.address}</Typography>}
        {hasValue(party.regCode) && <Typography variant="body2" sx={{ color: muted }}>{labels.regCode}: {party.regCode}</Typography>}
        {hasValue(party.vatNumber) && <Typography variant="body2" sx={{ color: muted }}>{labels.vatNumber}: {party.vatNumber}</Typography>}
      </Box>
    );
  };

  return (
    <div id={previewId} style={containerStyles} data-document-type={isQuote ? 'quote' : 'invoice'}>
      <Box
        sx={{
          border: `1px solid ${line}`,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#fff',
          color: '#1f2937',
        }}
      >
        <Box
          sx={{
            height: 6,
            background: isQuote
              ? 'linear-gradient(to right, #7c3aed, #ec4899)'
              : 'linear-gradient(to right, #1976d2, #c026d3)',
          }}
        />

        <Box sx={{ p: 5 }}>
          <Grid
            data-testid="document-header"
            container
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 5, flexWrap: 'nowrap', columnGap: 2 }}
          >
            <Grid sx={{ flex: '1 1 auto', minWidth: 0, pr: 2 }}>
              <Box display="flex" alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar
                  data-testid="company-header-logo"
                  src={data.company.logoUrl || `${process.env.PUBLIC_URL}/logo.png`}
                  alt="Company Logo"
                  crossOrigin="anonymous"
                  sx={{
                    mr: isQuote ? 1.25 : 2,
                    width: isQuote ? 44 : 56,
                    height: isQuote ? 44 : 56,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    data-testid="company-header-name"
                    variant="h5"
                    fontWeight={700}
                    color="#1f2937"
                    sx={{
                      fontSize: isQuote ? '1.1rem' : '1.5rem',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {data.company.name}
                  </Typography>
                  {hasValue(data.company.address) && (
                    <Typography variant="body2" sx={{ color: muted, mt: 0.25 }}>{data.company.address}</Typography>
                  )}
                </Box>
              </Box>
            </Grid>
            <Grid
              data-testid="document-header-right"
              sx={{ ml: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, textAlign: 'right' }}
            >
              <Typography
                data-testid="document-title"
                variant="h4"
                fontWeight={700}
                style={{ fontSize: isQuote ? '1.7rem' : '2.2rem' }}
                sx={{ color: accent, whiteSpace: 'nowrap', lineHeight: 1.1 }}
              >
                {documentTitle}
              </Typography>
              {(hasValue(documentNumber) || hasValue(data.date) || hasValue(deadlineValue)) && (
                <Box data-testid="document-metadata" sx={{ mt: 1, bgcolor: accentLight, borderRadius: 1, px: 2, py: 1.25, textAlign: 'right', minWidth: 180 }}>
                  {hasValue(documentNumber) && (
                    <Typography variant="subtitle1" fontWeight={700} color="#1f2937" sx={{ whiteSpace: 'nowrap', lineHeight: 1.3 }}>#{documentNumber}</Typography>
                  )}
                  {hasValue(data.date) && (
                    <Typography variant="body2" sx={{ color: muted, whiteSpace: 'nowrap' }}>{labels.date}: {data.date}</Typography>
                  )}
                  {hasValue(deadlineValue) && (
                    <Typography variant="body2" sx={{ color: muted, whiteSpace: 'nowrap' }}>{deadlineLabel}: {deadlineValue}</Typography>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mb: references.length ? 2 : 4 }}>
            {partyBox(labels.supplier, data.company, { fill: '#f3f4f6', edge: '#cbd5e1', headingColor: muted })}
            {partyBox(labels.client, data.client, { fill: accentLight, edge: accent, headingColor: accent })}
          </Box>

          {references.length > 0 && (
            <Typography variant="body2" sx={{ color: muted, mb: 4 }}>
              {references.map(([label, value]) => `${label}: ${value}`).join('    |    ')}
            </Typography>
          )}

          <TableContainer sx={{ mb: 4, border: `1px solid ${line}`, borderRadius: 1.5, overflow: 'hidden' }}>
            <Table
              size="small"
              sx={{
                '& th': { bgcolor: accent, color: '#fff', fontWeight: 700, fontSize: 12, borderBottom: 0 },
                '& td': { color: '#1f2937', borderBottom: '1px solid #eef2f6' },
                '& tbody tr:last-child td': { borderBottom: 0 },
              }}
            >
              <TableHead>
                <TableRow>
                  {showDescription && <TableCell>{labels.description}</TableCell>}
                  <TableCell align="center">{labels.quantity}</TableCell>
                  {showUnit && <TableCell align="center">{labels.unit}</TableCell>}
                  <TableCell align="right">{labels.unitPrice}</TableCell>
                  <TableCell align="center">{labels.tax}</TableCell>
                  <TableCell align="right">{labels.amount}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((item, index) => (
                  <TableRow key={index}>
                    {showDescription && <TableCell sx={{ py: 2, fontWeight: 700 }}>{item.description}</TableCell>}
                    <TableCell align="center" sx={{ py: 2 }}>{item.quantity}</TableCell>
                    {showUnit && <TableCell align="center" sx={{ py: 2 }}>{item.unit}</TableCell>}
                    <TableCell align="right" sx={{ py: 2 }}>{formatMoney(Number(item.unitPrice) || 0)}</TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>{taxRate.toFixed(1)}%</TableCell>
                    <TableCell align="right" sx={{ py: 2, fontWeight: 700 }}>{formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {isQuote && quoteFields.length > 0 && (
            <Box sx={{ mb: 4, px: 2.5, py: 2, borderRadius: 1, bgcolor: accentLight, borderLeft: `4px solid ${accent}` }}>
              <Typography sx={{ ...eyebrow, color: accent, mb: 1 }}>{labels.quoteDetails}</Typography>
              {quoteFields.map(([label, value]) => (
                <Typography variant="body2" color="#1f2937" key={label} sx={{ whiteSpace: 'pre-wrap' }}>
                  <strong>{label}:</strong> {value}
                </Typography>
              ))}
            </Box>
          )}

          {hasValue(data.notes) && (
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ ...eyebrow, color: muted, mb: 0.5 }}>{labels.notes}</Typography>
              <Typography variant="body2" color="#1f2937" sx={{ whiteSpace: 'pre-wrap' }}>{data.notes}</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: paymentQrPayload ? 'space-between' : 'flex-end', alignItems: 'flex-start', gap: 3, mb: 3 }}>
            {paymentQrPayload && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" fontWeight={700} color="#1f2937" gutterBottom>
                  {labels.paymentQrTitle}
                </Typography>
                <QRCodeCanvas value={paymentQrPayload} size={116} level="M" bgColor="#ffffff" fgColor="#1f2937" />
                <Typography variant="caption" display="block" sx={{ color: muted, mt: 0.5 }}>
                  {paymentQrHint}
                </Typography>
              </Box>
            )}
            <Box sx={{ width: 340, border: `1px solid ${line}`, borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 1.25 }}>
                <Typography variant="body2" sx={{ color: muted }}>{labels.subtotal}</Typography>
                <Typography variant="body2" sx={{ color: muted }}>{formatMoney(subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 1.25 }}>
                <Typography variant="body2" sx={{ color: muted }}>{labels.vat} ({taxRate}%)</Typography>
                <Typography variant="body2" sx={{ color: muted }}>{formatMoney(vat)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, bgcolor: accent, color: '#fff' }}>
                <Typography variant="subtitle1" fontWeight={700}>{labels.total}</Typography>
                <Typography variant="h6" fontWeight={700}>{formatMoney(total)}</Typography>
              </Box>
            </Box>
          </Box>

          {data.reverseCharge && (
            <Typography variant="caption" display="block" sx={{ color: muted, mb: 3 }}>
              {labels.reverseChargeNote}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ borderTop: `1px solid ${line}`, mt: 3, pt: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="caption" sx={{ color: muted }}>{data.company.name}</Typography>
        {!isQuote && hasValue(data.bankAccount) && (
          <Typography variant="caption" sx={{ color: muted }}>
            {labels.account}: {data.bankAccount}{hasValue(data.bic) ? ` · BIC: ${data.bic}` : ''}
          </Typography>
        )}
      </Box>
    </div>
  );
}

export default InvoicePreview;
