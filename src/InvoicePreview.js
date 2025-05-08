import React from 'react';
import {
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Box,
  Divider,
  Grid,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { Business, Person, ReceiptLong } from '@mui/icons-material';

function InvoicePreview({ data, scale = 1, compact = false, labels, isExportMode = false, invoiceTitleDefault }) {
  const theme = useTheme();

  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = (subtotal * data.taxRate) / 100;
  const total = subtotal + vat;

  const containerStyles = isExportMode
    ? {
        width: 794,
        minHeight: 1123,
        margin: '0 auto',
        padding: '64px',
        backgroundColor: '#fff',
        fontSize: 11,
        lineHeight: 1.6,
      }
    : {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: 794,
        margin: '0 auto',
        padding: compact ? theme.spacing(4) : theme.spacing(6),
        backgroundColor: '#fff',
        fontSize: 11,
        lineHeight: 1.6,
      };

  return (
    <div id="pdf-preview" style={containerStyles}>
      {/* Gradient Accent Bar */}
      <Box sx={{
        height: 6,
        background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        mb: 4,
        borderRadius: 2
      }} />

      <Card elevation={3} sx={{ borderRadius: 3, p: 4 }}>
        {/* Header */}
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Grid item>
  <Box display="flex" alignItems="center">
    <Avatar src="/logo.png" alt="Company Logo" crossOrigin="anonymous" sx={{ mr: 2, width: 64, height: 64 }} />
    <Box>
      <Typography variant="h5" fontWeight={700} color="text.primary">
        {data.company.name}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary">
        {data.company.address}
      </Typography>
    </Box>
  </Box>
</Grid>
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <ReceiptLong color="primary" />
              <Typography variant="h4" fontWeight={700} color="primary">
                {invoiceTitleDefault || 'INVOICE'}
              </Typography>
            </Box>
            <Box mt={2}>
              <Typography variant="body2"><strong>{labels.invoiceNumber}:</strong> {data.invoiceNumber}</Typography>
              <Typography variant="body2"><strong>{labels.date}:</strong> {data.date}</Typography>
              <Typography variant="body2"><strong>{labels.dueDate}:</strong> {data.dueDate}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 5 }} />

        {/* Supplier & Client Info */}
        <Grid container justifyContent="space-between" spacing={4} sx={{ mb: 5 }}>
  {/* Supplier on the left */}
  <Grid item xs={12} md={5}>
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      <Business fontSize="small" color="action" />
      <Typography variant="subtitle1" fontWeight={600}>{labels.supplier}</Typography>
    </Box>
    <Typography variant="body2">{data.company.name}</Typography>
    <Typography variant="body2">{data.company.address}</Typography>
    <Typography variant="body2">{labels.regCode}: {data.company.regCode}</Typography>
  </Grid>

  {/* Spacer */}
  <Grid item xs={false} md={2} sx={{ display: { xs: 'none', md: 'block' } }} />

  {/* Client */}
  <Grid item xs={12} md={5} sx={{ textAlign: 'right', pr: { xs: 1, md: 4 } }}>
    <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} mb={1}>
      <Person fontSize="small" color="action" />
      <Typography variant="subtitle1" fontWeight={600}>{labels.client}</Typography>
    </Box>
    <Typography variant="body2">{data.client.name}</Typography>
    <Typography variant="body2">{data.client.address}</Typography>
    <Typography variant="body2">{labels.regCode}: {data.client.regCode}</Typography>
  </Grid>
</Grid>


        {/* Items Table */}
        <TableContainer sx={{ mb: 5 }}>
          <Table size="small" stickyHeader sx={{ '& th': { bgcolor: theme.palette.grey[100] } }}>
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
              {data.items.map((item, i) => (
                <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: theme.palette.action.hover } }}>
                  <TableCell sx={{ py: 2 }}>{item.description}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{item.unit}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{parseFloat(item.unitPrice).toFixed(2)} EUR</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{data.taxRate.toFixed(1)}%</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>{(item.quantity * item.unitPrice).toFixed(2)} EUR</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {data.notes && (
  <Box sx={{ mb: 4 }}>
    <Typography variant="subtitle2" gutterBottom>
      {labels.notes}
    </Typography>
    <Typography variant="body2" color="text.primary">
      {data.notes}
    </Typography>
  </Box>
)}

      {/* Totals Summary */}
<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 5 }}>
  <Box
    sx={{
      width: 360,
      p: 3,
      bgcolor: alpha(theme.palette.primary.light, 0.05),
      borderRadius: 2,
      boxShadow: 1,
    }}
    
  >
    {/* Subtotal */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {labels.subtotal}
      </Typography>
      <Typography variant="body2" color="text.primary">
        {subtotal.toFixed(2)} EUR
      </Typography>
    </Box>

    {/* VAT */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {labels.vat}
      </Typography>
      <Typography variant="body2" color="text.primary">
        {vat.toFixed(2)} EUR
      </Typography>
    </Box>

    <Divider sx={{ my: 2 }} />
    

    {/* Total */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="subtitle1" fontWeight={700}>
        {labels.total}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700} color="primary">
        {total.toFixed(2)} EUR
      </Typography>
    </Box>
  </Box>
</Box>


        {/* Footer */}
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {data.company.name} | {labels.account}: {data.bankAccount}
          </Typography>
        </Box>
      </Card>
    </div>
  );
}

export default InvoicePreview;
