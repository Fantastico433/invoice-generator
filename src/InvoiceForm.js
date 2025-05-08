import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Divider,
  Typography,
  Card,
  Grid,
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';

export default function InvoiceForm({ data, onDataChange, labels }) {
  const handleFieldChange = (field) => (e) => {
    onDataChange({ ...data, [field]: e.target.value });
  };

  const handleNumberChange = (field) => (e) => {
    const val = parseFloat(e.target.value);
    onDataChange({ ...data, [field]: isNaN(val) ? 0 : val });
  };

  const handleItemChange = (idx, field) => (e) => {
    const items = [...data.items];
    const value =
      field === 'quantity' || field === 'unitPrice'
        ? parseFloat(e.target.value) || 0
        : e.target.value;
    items[idx][field] = value;
    onDataChange({ ...data, items });
  };

  const addItem = () => {
    onDataChange({
      ...data,
      items: [...data.items, { description: '', quantity: 1, unit: 'pcs', unitPrice: 0 }],
    });
  };

  const removeItem = (idx) => {
    const items = data.items.filter((_, i) => i !== idx);
    onDataChange({ ...data, items });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ transform: 'scale(0.8)', transformOrigin: 'top left', pt: 6 }}>
        <Card elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          {/* Invoice Metadata and Client Info */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                {labels.invoiceTitle} Details
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={labels.invoiceNumber}
                    value={data.invoiceNumber}
                    onChange={handleFieldChange('invoiceNumber')}
                    fullWidth
                    
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label={labels.date}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={data.date}
                    onChange={handleFieldChange('date')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label={labels.dueDate}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={data.dueDate}
                    onChange={handleFieldChange('dueDate')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={labels.taxRate}
                    type="number"
                    value={data.taxRate}
                    onChange={handleNumberChange('taxRate')}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                {labels.client}
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <TextField
                    label={labels.client}
                    value={data.client.name}
                    onChange={(e) =>
                      onDataChange({
                        ...data,
                        client: { ...data.client, name: e.target.value },
                      })
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={labels.address}
                    value={data.client.address}
                    onChange={(e) =>
                      onDataChange({
                        ...data,
                        client: { ...data.client, address: e.target.value },
                      })
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={labels.regCode}
                    value={data.client.regCode}
                    onChange={(e) =>
                      onDataChange({
                        ...data,
                        client: { ...data.client, regCode: e.target.value },
                      })
                    }
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Product Items */}
          <Typography variant="subtitle1" gutterBottom>
            {labels.description}
          </Typography>
          {data.items.map((item, idx) => (
            <Grid container spacing={1} key={idx} alignItems="center" sx={{ mb: 1 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label={labels.description}
                  value={item.description}
                  onChange={handleItemChange(idx, 'description')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label={labels.quantity}
                  type="number"
                  value={item.quantity}
                  onChange={handleItemChange(idx, 'quantity')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label={labels.unit}
                  value={item.unit}
                  onChange={handleItemChange(idx, 'unit')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label={labels.unitPrice}
                  type="number"
                  value={item.unitPrice}
                  onChange={handleItemChange(idx, 'unitPrice')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <IconButton onClick={() => removeItem(idx)} disabled={data.items.length === 1}>
                  <RemoveCircle />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Button startIcon={<AddCircle />} onClick={addItem} size="small" sx={{ mt: 1 }}>
            {labels.addItem}
          </Button>

          <Divider sx={{ my: 2 }} />

          <TextField
            label={labels.notes}
            value={data.notes}
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
