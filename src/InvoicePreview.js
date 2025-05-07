import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Divider,
  Grid,
} from '@mui/material';

function InvoicePreview({ data, scale, compact, labels, isExportMode = false, invoiceTitleDefault }) {
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = (subtotal * data.taxRate) / 100;
  const total = subtotal + vat;

  const containerStyle = isExportMode
    ? {
        width: '794px',
        minHeight: '1123px',
        margin: '0 auto',
        padding: '48px 40px 40px 40px',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        fontSize: '9px',
        lineHeight: 1.4,
      }
    : {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: '794px',
        margin: '0 auto',
        padding: compact ? '16px' : '24px 32px',
        backgroundColor: '#fff',
        fontSize: '9px',
        lineHeight: 1.4,
      };

  return (
    <div id="pdf-preview" style={containerStyle}>
     <Paper elevation={0}>
  {/* Move title down */}
  <Box mt={4} mb={2}>
    <Grid container justifyContent="space-between">
      <Grid item>
      <Typography variant="h6" fontWeight={700}>{invoiceTitleDefault}</Typography>
      </Grid>
      <Grid item>
        <Typography>Dokumendi number: {data.invoiceNumber}</Typography>
        <Typography>Dokumendi kuupäev: {data.date}</Typography>
        <Typography>Tähtaeg: {data.dueDate}</Typography>
      </Grid>
    </Grid>
  </Box>

  {/* Move supplier down more */}
  {/* Supplier and Client on same level */}
<Grid container spacing={2} mb={2}>
  {/* Supplier aligned left */}
  <Grid item xs={6}>
    <Box>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: '48px', height: 'auto', objectFit: 'contain', marginBottom: '8px' }}
      />
      <Typography variant="subtitle1" fontWeight={600}>{labels.supplier}</Typography>
      <Typography>{data.company.name}</Typography>
      <Typography>{data.company.address}</Typography>
      <Typography>Registrikood: {data.company.regCode}</Typography>
    </Box>
  </Grid>

  {/* Client aligned right with spacing */}
  {/* Client aligned right with spacing */}
<Grid item xs={8} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
  <Box textAlign="right" mt={7} sx={{ transform: 'translateX(225px)' }}>
  <Typography variant="subtitle1" textAlign="left" fontWeight={600}>{labels.client}</Typography>
  <Typography display="block" textAlign="left">{data.client.name}</Typography>
  <Typography display="block" textAlign="left">{data.client.address}</Typography>
  <Typography display="block" textAlign="left">Registrikood: {data.client.regCode}</Typography>
  </Box>
</Grid>
</Grid>


        {/* Table Header */}
        <Box mt={8} mb={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            {labels.description} {labels.quantity} {labels.unit} {labels.unitPrice} {labels.tax} {labels.amount} (EUR)
          </Typography>
        </Box>

        {/* Item Table */}
        <Table size="small">
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
              <TableRow key={index} sx={{ '& td': { py: 1.5 } }}>
                <TableCell>{item.description}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{item.unit}</TableCell>
                <TableCell align="right">{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                <TableCell align="right">{data.taxRate.toFixed(1)}%</TableCell>
                <TableCell align="right">{(item.quantity * item.unitPrice).toFixed(2)} EUR</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals Box */}
        <Box mt={8} p={2} bgcolor="#f5f5f5" borderRadius="4px" textAlign="right">
          <Typography><strong>{labels.subtotal}:</strong> {subtotal.toFixed(2)} EUR</Typography>
          <Typography><strong>{labels.vat}:</strong> {vat.toFixed(2)} EUR</Typography>
          <Typography variant="subtitle1" fontWeight={700}>
            {labels.total}: {total.toFixed(2)} EUR
          </Typography>
        </Box>


        {/* Footer */}
        <Box mt={10} pt={2} borderTop="1px solid #ccc" textAlign="center" fontSize="10px">
          <Typography>{data.company.name} | {labels.account}: {data.bankAccount}</Typography>
        </Box>
      </Paper>
    </div>
  );
}

export default InvoicePreview;
