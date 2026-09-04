import React from 'react';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';

export default function InvoiceForm({ data, onDataChange, labels, isQuote }) {
  const handleFieldChange = (field) => (event) => {
    onDataChange({ ...data, [field]: event.target.value });
  };

  const handleNumberChange = (field) => (event) => {
    const value = parseFloat(event.target.value);
    onDataChange({ ...data, [field]: Number.isNaN(value) ? 0 : value });
  };

  const handleCompanyChange = (field) => (event) => {
    onDataChange({ ...data, company: { ...data.company, [field]: event.target.value } });
  };

  const handleClientChange = (field) => (event) => {
    onDataChange({ ...data, client: { ...data.client, [field]: event.target.value } });
  };

  const handleItemChange = (index, field) => (event) => {
    const items = data.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const value = field === 'quantity' || field === 'unitPrice'
        ? parseFloat(event.target.value) || 0
        : event.target.value;
      return { ...item, [field]: value };
    });
    onDataChange({ ...data, items });
  };

  const addItem = () => {
    onDataChange({
      ...data,
      items: [...data.items, { description: '', quantity: 1, unit: 'pcs', unitPrice: 0 }],
    });
  };

  const removeItem = (index) => {
    onDataChange({ ...data, items: data.items.filter((_, itemIndex) => itemIndex !== index) });
  };

  const documentTitle = isQuote ? labels.quoteTitle : labels.invoiceTitle;
  const numberField = isQuote ? 'quoteNumber' : 'invoiceNumber';
  const numberLabel = isQuote ? labels.quoteNumber : labels.invoiceNumber;
  const deadlineField = isQuote ? 'validUntil' : 'dueDate';
  const deadlineLabel = isQuote ? labels.validUntil : labels.dueDate;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ transform: 'scale(0.8)', transformOrigin: 'top left', pt: 6, width: '125%' }}>
        <Card elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                {documentTitle} {labels.details}
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    label={numberLabel}
                    value={data[numberField] || ''}
                    onChange={handleFieldChange(numberField)}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label={labels.taxRate}
                    type="number"
                    value={data.taxRate}
                    onChange={handleNumberChange('taxRate')}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={labels.date}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={data.date || ''}
                    onChange={handleFieldChange('date')}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={deadlineLabel}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={data[deadlineField] || ''}
                    onChange={handleFieldChange(deadlineField)}
                    fullWidth
                  />
                </Grid>
                {!isQuote && (
                  <Grid size={12}>
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={Boolean(data.showPaymentQr)}
                          onChange={(event) => onDataChange({ ...data, showPaymentQr: event.target.checked })}
                        />
                      )}
                      label={labels.paymentQr}
                    />
                  </Grid>
                )}
                <Grid size={12}>
                  <TextField
                    label={`${labels.supplier} — ${labels.vatNumber}`}
                    value={data.company.vatNumber || ''}
                    onChange={handleCompanyChange('vatNumber')}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" gutterBottom>{labels.client}</Typography>
              <Grid container spacing={1}>
                <Grid size={12}>
                  <TextField label={labels.client} value={data.client.name || ''} onChange={handleClientChange('name')} fullWidth />
                </Grid>
                <Grid size={12}>
                  <TextField label={labels.address} value={data.client.address || ''} onChange={handleClientChange('address')} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={labels.regCode} value={data.client.regCode || ''} onChange={handleClientChange('regCode')} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={labels.vatNumber} value={data.client.vatNumber || ''} onChange={handleClientChange('vatNumber')} fullWidth />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>{labels.description}</Typography>
          {data.items.map((item, index) => (
            <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label={labels.description} value={item.description} onChange={handleItemChange(index, 'description')} fullWidth />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField label={labels.quantity} type="number" value={item.quantity} onChange={handleItemChange(index, 'quantity')} fullWidth />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField label={labels.unit} value={item.unit} onChange={handleItemChange(index, 'unit')} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField label={labels.unitPrice} type="number" value={item.unitPrice} onChange={handleItemChange(index, 'unitPrice')} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton onClick={() => removeItem(index)} disabled={data.items.length === 1} aria-label="Remove item">
                  <RemoveCircle />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Button startIcon={<AddCircle />} onClick={addItem} size="small" sx={{ mt: 1 }}>
            {labels.addItem}
          </Button>

          {isQuote && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" color="primary" fontWeight={700} gutterBottom>
                {labels.quoteDetails}
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={labels.contactPerson} value={data.contactPerson || ''} onChange={handleFieldChange('contactPerson')} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={labels.referenceNumber} value={data.referenceNumber || ''} onChange={handleFieldChange('referenceNumber')} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={labels.deliveryTime} value={data.deliveryTime || ''} onChange={handleFieldChange('deliveryTime')} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={labels.paymentTerms} value={data.paymentTerms || ''} onChange={handleFieldChange('paymentTerms')} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={labels.deliveryTerms} value={data.deliveryTerms || ''} onChange={handleFieldChange('deliveryTerms')} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={labels.warranty} value={data.warranty || ''} onChange={handleFieldChange('warranty')} fullWidth />
                </Grid>
                <Grid size={12}>
                  <TextField label={labels.terms} value={data.terms || ''} onChange={handleFieldChange('terms')} multiline rows={2} fullWidth />
                </Grid>
              </Grid>
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <TextField
            label={labels.notes}
            value={data.notes || ''}
            onChange={handleFieldChange('notes')}
            multiline
            rows={2}
            fullWidth
          />
        </Card>
      </Box>
    </Box>
  );
}
