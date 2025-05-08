import React, { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  IconButton,
  Card,
  Divider,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Brightness4, Brightness7, Close as CloseIcon } from '@mui/icons-material';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const companies = {
  skycorp: {
    name: 'SKYCORP OÜ',
    address: 'Nurme vkt 17, 61702 Külitse, Eesti',
    regCode: '14211211',
    bankAccount: 'EE117700771002605677',
    bic: 'LHVBEE22',
    logoUrl: '/logo.png',
  },
  skycorpTech: {
    name: 'SKYCORP Technologies OÜ',
    address: 'Teaduspargi 11, Tartu, Eesti',
    regCode: '16782217',
    bankAccount: 'EE767700771009349402',
    bic: 'LHVBEE22',
    logoUrl: '/logo.png',
  },
};

const currencyRates = { EUR: 1, USD: 1.1 };

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('et');
  const [companyId, setCompanyId] = useState('skycorp');
  const [currency, setCurrency] = useState('EUR');
  const [autosaveMsg, setAutosaveMsg] = useState(false);

  const [invoiceData, setInvoiceData] = useState(() => {
    const saved = localStorage.getItem('invoiceData');
    return saved
      ? JSON.parse(saved)
      : {
          company: companies[companyId],
          client: { name: '', address: '', regCode: '' },
          invoiceNumber: '2025043002',
          date: new Date().toISOString().split('T')[0],
          dueDate: '',
          bankAccount: companies[companyId].bankAccount,
          bic: companies[companyId].bic,
          taxRate: 22,
          items: [{ description: '', quantity: 1, unit: 'pcs', unitPrice: 0 }],
          notes: '',
        };
  });

  useEffect(() => {
    localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    setAutosaveMsg(true);
  }, [invoiceData]);

  const theme = useMemo(
    () => createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } }),
    [darkMode]
  );

  const labels = {
    et: {
      toggleLang: 'ENG',
      invoiceTitle: 'Arve',
      invoiceTitleDefault: 'ARVE',
      invoiceNumber: 'Arve nr',
      date: 'Kuupäev',
      dueDate: 'Tähtaeg',
      client: 'Klient',
      address: 'Aadress',
      taxRate: 'KM määr (%)',
      addItem: 'Lisa rida',
      description: 'Kirjeldus',
      quantity: 'Kogus',
      unit: 'Ühik',
      unitPrice: 'Ühiku hind',
      notes: 'Märkused',
      download: 'Laadi alla',
      supplier: 'Müüja',
      regCode: 'Reg kood',
      amount: 'Summa',
      subtotal: 'Summa KM-ta',
      vat: 'KM',
      total: 'Kokku',
      account: 'Arveldusarve',
    },
    en: {
      toggleLang: 'EST',
      invoiceTitle: 'Invoice',
      invoiceTitleDefault: 'INVOICE',
      invoiceNumber: 'Invoice #',
      date: 'Date',
      dueDate: 'Due date',
      client: 'Client',
      address: 'Address',
      taxRate: 'Tax rate (%)',
      addItem: 'Add item',
      description: 'Description',
      quantity: 'Quantity',
      unit: 'Unit',
      unitPrice: 'Unit price',
      notes: 'Notes',
      download: 'Download',
      supplier: 'Supplier',
      regCode: 'Reg code',
      amount: 'Amount',
      subtotal: 'Subtotal',
      vat: 'VAT',
      total: 'Total',
      account: 'Account',
    },
  };

  const handleDataChange = (updated) => setInvoiceData(updated);

  const switchCompany = () => {
    const next = companyId === 'skycorp' ? 'skycorpTech' : 'skycorp';
    setCompanyId(next);
    setInvoiceData((prev) => ({
      ...prev,
      company: companies[next],
      bankAccount: companies[next].bankAccount,
      bic: companies[next].bic,
    }));
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('pdf-preview');
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save(`invoice_${invoiceData.invoiceNumber}.pdf`);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {/* Header */}
          <Grid
            container
            spacing={1}
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Grid item>
              <Typography variant="h5">Invoice Generator</Typography>
            </Grid>

            <Grid item>
              <IconButton
                onClick={() => setDarkMode(!darkMode)}
                size="small"
                sx={{ p: 0.5 }}
              >
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Grid>

            <Grid item>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  label="Currency"
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {Object.keys(currencyRates).map((cur) => (
                    <MenuItem key={cur} value={cur}>
                      {cur}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item>
              <Button
                onClick={() => setLanguage(language === 'et' ? 'en' : 'et')}
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {labels[language].toggleLang}
              </Button>
            </Grid>

            <Grid item>
              <Button
                variant="outlined"
                onClick={switchCompany}
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {companyId === 'skycorp' ? 'SKYCORP Tech' : 'SKYCORP'}
              </Button>
            </Grid>

            <Grid item>
              <Button
                variant="contained"
                onClick={handleExportPDF}
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {labels[language].download}
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 1 }} />

          {/* Main Content */}
          <Grid container spacing={0}>
            <Grid item xs={12} md={6} sx={{ p: 0 }}>
              <InvoiceForm
                data={invoiceData}
                onDataChange={handleDataChange}
                labels={labels[language]}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ p: 0 }}>
              <Typography variant="h6" sx={{ mb: 0 }}>
                Live Preview
              </Typography>
              <InvoicePreview
                data={invoiceData}
                labels={labels[language]}
                currency={currency}
                rates={currencyRates}
                invoiceTitleDefault={labels[language].invoiceTitleDefault}
              />
            </Grid>
          </Grid>
        </Card>

        {/* Snackbar */}
        <Snackbar
          open={autosaveMsg}
          autoHideDuration={2000}
          onClose={() => setAutosaveMsg(false)}
          message="Autosaved"
          action={
            <IconButton size="small" onClick={() => setAutosaveMsg(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
      </Container>
    </ThemeProvider>
  );
}

export default App;
