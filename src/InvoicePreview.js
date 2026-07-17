import React from 'react';
import {
  Avatar,
  Box,
  Card,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Business, Person, ReceiptLong } from '@mui/icons-material';

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

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
  const documentTitle = isQuote ? labels.quoteTitleDefault : labels.invoiceTitleDefault;
  const numberLabel = isQuote ? labels.quoteNumber : labels.invoiceNumber;
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

  return (
    <div id={previewId} style={containerStyles} data-document-type={isQuote ? 'quote' : 'invoice'}>
      <Box
        sx={{
          height: 6,
          background: isQuote
            ? 'linear-gradient(to right, #6d28d9, #c084fc)'
            : 'linear-gradient(to right, #1565c0, #42a5f5)',
          mb: 4,
          borderRadius: 2,
        }}
      />

      <Card
        elevation={isExportMode ? 0 : 3}
        sx={{
          borderRadius: isExportMode ? 0 : 3,
          boxShadow: isExportMode ? 'none' : undefined,
          p: 4,
          bgcolor: '#fff',
          color: '#1f2937',
        }}
      >
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
          <Grid>
            <Box display="flex" alignItems="center">
              <Avatar
                src={data.company.logoUrl || `${process.env.PUBLIC_URL}/logo.png`}
                alt="Company Logo"
                crossOrigin="anonymous"
                sx={{ mr: 2, width: 64, height: 64 }}
              />
              <Box>
                <Typography variant="h5" fontWeight={700} color="#1f2937">{data.company.name}</Typography>
                {hasValue(data.company.address) && (
                  <Typography variant="subtitle2" color="#64748b">{data.company.address}</Typography>
                )}
              </Box>
            </Box>
          </Grid>
          <Grid sx={{ textAlign: isQuote ? 'right' : 'left' }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent={isQuote ? 'flex-end' : 'flex-start'}
              gap={1}
            >
              <ReceiptLong sx={{ color: isQuote ? '#7c3aed' : '#1976d2' }} />
              <Typography
                data-testid="document-title"
                variant="h4"
                fontWeight={700}
                style={{ fontSize: isQuote ? '1.7rem' : undefined }}
                sx={{ color: isQuote ? '#7c3aed' : '#1976d2' }}
              >
                {documentTitle}
              </Typography>
            </Box>
            <Box
              data-testid="document-metadata"
              mt={2}
              sx={{ textAlign: isQuote ? 'right' : 'left' }}
            >
              {hasValue(documentNumber) && (
                <Typography variant="body2" color="#1f2937"><strong>{numberLabel}:</strong> {documentNumber}</Typography>
              )}
              {hasValue(data.date) && (
                <Typography variant="body2" color="#1f2937"><strong>{labels.date}:</strong> {data.date}</Typography>
              )}
              {hasValue(deadlineValue) && (
                <Typography variant="body2" color="#1f2937"><strong>{deadlineLabel}:</strong> {deadlineValue}</Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 5 }} />

        <Grid container justifyContent="space-between" spacing={4} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Business fontSize="small" color="action" />
              <Typography variant="subtitle1" fontWeight={600} color="#1f2937">{labels.supplier}</Typography>
            </Box>
            {hasValue(data.company.name) && <Typography variant="body2" color="#1f2937">{data.company.name}</Typography>}
            {hasValue(data.company.address) && <Typography variant="body2" color="#1f2937">{data.company.address}</Typography>}
            {hasValue(data.company.regCode) && <Typography variant="body2" color="#1f2937">{labels.regCode}: {data.company.regCode}</Typography>}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: 'right', pr: { xs: 1, md: 4 } }}>
            <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} mb={1}>
              <Person fontSize="small" color="action" />
              <Typography variant="subtitle1" fontWeight={600} color="#1f2937">{labels.client}</Typography>
            </Box>
            {hasValue(data.client.name) && <Typography variant="body2" color="#1f2937">{data.client.name}</Typography>}
            {hasValue(data.client.address) && <Typography variant="body2" color="#1f2937">{data.client.address}</Typography>}
            {hasValue(data.client.regCode) && <Typography variant="body2" color="#1f2937">{labels.regCode}: {data.client.regCode}</Typography>}
          </Grid>
        </Grid>

        <TableContainer sx={{ mb: 5 }}>
          <Table size="small" sx={{ '& th': { bgcolor: '#f1f5f9', color: '#1f2937' }, '& td': { color: '#1f2937' } }}>
            <TableHead>
              <TableRow>
                <TableCell>{labels.description}</TableCell>
                <TableCell align="right">{labels.quantity}</TableCell>
                <TableCell align="right">{labels.unit}</TableCell>
                <TableCell align="right">{labels.unitPrice}</TableCell>
                <TableCell align="right">{labels.tax}</TableCell>
                <TableCell align="right">{labels.amount}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((item, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ py: 2 }}>{item.description}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{item.unit}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{formatMoney(Number(item.unitPrice) || 0)}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{taxRate.toFixed(1)}%</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {isQuote && quoteFields.length > 0 && (
          <Box sx={{ mb: 4, p: 3, borderRadius: 2, bgcolor: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.16)' }}>
            <Typography variant="subtitle2" fontWeight={700} color="#6d28d9" gutterBottom>
              {labels.quoteDetails}
            </Typography>
            {quoteFields.map(([label, value]) => (
              <Typography variant="body2" color="#1f2937" key={label} sx={{ whiteSpace: 'pre-wrap' }}>
                <strong>{label}:</strong> {value}
              </Typography>
            ))}
          </Box>
        )}

        {hasValue(data.notes) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" color="#1f2937" gutterBottom>{labels.notes}</Typography>
            <Typography variant="body2" color="#1f2937" sx={{ whiteSpace: 'pre-wrap' }}>{data.notes}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 5 }}>
          <Box
            sx={{
              width: 360,
              p: 3,
              bgcolor: alpha(isQuote ? '#c084fc' : '#90caf9', 0.12),
              borderRadius: 2,
              boxShadow: isExportMode ? 'none' : 1,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="#64748b">{labels.subtotal}</Typography>
              <Typography variant="body2" color="#1f2937">{formatMoney(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="#64748b">{labels.vat}</Typography>
              <Typography variant="body2" color="#1f2937">{formatMoney(vat)}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#1f2937">{labels.total}</Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: isQuote ? '#7c3aed' : '#1976d2' }}>{formatMoney(total)}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="#64748b">
            {data.company.name}
            {!isQuote && hasValue(data.bankAccount) ? ` | ${labels.account}: ${data.bankAccount}` : ''}
          </Typography>
        </Box>
      </Card>
    </div>
  );
}

export default InvoicePreview;
