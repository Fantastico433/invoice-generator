import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Button,
} from '@mui/material';

function InvoiceForm({ data, onDataChange, labels }) {
  const handleChange = (section, field, value) => {
    onDataChange({
      ...data,
      [section]: {
        ...data[section],
        [field]: value,
      },
    });
  };

  const handleFieldChange = (field, value) => {
    onDataChange({
      ...data,
      [field]: value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = data.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onDataChange({ ...data, items: updatedItems });
  };

  const addItem = () => {
    const defaultItem = {
      description: data.items.length === 0 ? 'Teenus' : '',
      quantity: 1,
      unit: 'tk/h',
      unitPrice: 0,
    };
  
    onDataChange({
      ...data,
      items: [...data.items, defaultItem],
    });
  };

  const removeItem = (index) => {
    const updatedItems = data.items.filter((_, i) => i !== index);
    onDataChange({ ...data, items: updatedItems });
  };

  return (
    <Grid container spacing={1.5}>
      {/* Supplier */}
      <Grid item xs={6}>
        <Typography variant="body1" fontWeight={600}>{labels.supplier}</Typography>
        <TextField
          size="small"
          label="Company Name"
          fullWidth
          value={data.company.name}
          onChange={(e) => handleChange('company', 'name', e.target.value)}
        />
        <TextField
          size="small"
          label="Address"
          fullWidth
          value={data.company.address}
          onChange={(e) => handleChange('company', 'address', e.target.value)}
        />
        <TextField
          size="small"
          label="Registration Code"
          fullWidth
          value={data.company.regCode}
          onChange={(e) => handleChange('company', 'regCode', e.target.value)}
        />
      </Grid>

      {/* Client */}
      <Grid item xs={6}>
        <Typography variant="body1" fontWeight={600}>{labels.client}</Typography>
        <TextField
          size="small"
          label="Client Name"
          fullWidth
          value={data.client.name}
          onChange={(e) => handleChange('client', 'name', e.target.value)}
        />
        <TextField
          size="small"
          label="Address"
          fullWidth
          value={data.client.address}
          onChange={(e) => handleChange('client', 'address', e.target.value)}
        />
        <TextField
          size="small"
          label="Registration Code"
          fullWidth
          value={data.client.regCode}
          onChange={(e) => handleChange('client', 'regCode', e.target.value)}
        />
      </Grid>

      {/* Invoice Metadata */}
      <Grid item xs={4}>
        <TextField
          size="small"
          label={labels.invoiceNumber}
          fullWidth
          value={data.invoiceNumber}
          onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          size="small"
          label={labels.date}
          type="date"
          fullWidth
          value={data.date}
          onChange={(e) => handleFieldChange('date', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          size="small"
          label={labels.dueDate}
          type="date"
          fullWidth
          value={data.dueDate}
          onChange={(e) => handleFieldChange('dueDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      

      {/* Bank Info */}
      <Grid item xs={6}>
        <TextField
          size="small"
          label={labels.account}
          fullWidth
          value={data.bankAccount}
          onChange={(e) => handleFieldChange('bankAccount', e.target.value)}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          size="small"
          label={labels.bic}
          fullWidth
          value={data.bic}
          onChange={(e) => handleFieldChange('bic', e.target.value)}
        />
      </Grid>

      {/* Line Items */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" fontWeight={500} gutterBottom>
          {labels.addItem}
        </Typography>
        {data.items.map((item, index) => (
          <Grid container spacing={1} key={index} alignItems="center">
            <Grid item xs={4}>
              <TextField
                size="small"
                label={labels.description}
                fullWidth
                value={item.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                size="small"
                label={labels.quantity}
                type="number"
                fullWidth
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                size="small"
                label={labels.unit}
                fullWidth
                value={item.unit}
                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                size="small"
                label={labels.unitPrice}
                type="number"
                fullWidth
                value={item.unitPrice}
                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
              />
            </Grid>
            <Grid item xs={2}>
              <Button size="small" color="error" onClick={() => removeItem(index)}>
                {labels.remove}
              </Button>
            </Grid>
          </Grid>
        ))}
        <Button size="small" onClick={addItem}>
          {labels.addItem}
        </Button>
      </Grid>

     
    </Grid>
  );
}

export default InvoiceForm;
