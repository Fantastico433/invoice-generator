import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Snackbar,
  Typography,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Brightness4,
  Brightness7,
  Close as CloseIcon,
  RequestQuote,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';

const logoUrl = `${process.env.PUBLIC_URL}/logo.png`;

const companies = {
  skycorp: {
    name: 'SKYCORP OÜ',
    address: 'Nurme vkt 17, 61702 Külitse, Eesti',
    regCode: '14211211',
    bankAccount: 'EE117700771002605677',
    bic: 'LHVBEE22',
    logoUrl,
  },
  skycorpTech: {
    name: 'SKYCORP Technologies OÜ',
    address: 'Teaduspargi 11, Tartu, Eesti',
    regCode: '16782217',
    bankAccount: 'EE767700771009349402',
    bic: 'LHVBEE22',
    logoUrl,
  },
};

const currencyRates = { EUR: 1, USD: 1.1 };

const createInitialData = () => ({
  documentType: 'invoice',
  company: companies.skycorp,
  client: { name: '', address: '', regCode: '' },
  invoiceNumber: '2025043002',
  quoteNumber: `PAK-${new Date().getFullYear()}-0001`,
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  validUntil: '',
  bankAccount: companies.skycorp.bankAccount,
  bic: companies.skycorp.bic,
  taxRate: 22,
  items: [{ description: '', quantity: 1, unit: 'pcs', unitPrice: 0 }],
  notes: '',
  contactPerson: '',
  referenceNumber: '',
  deliveryTime: '',
  paymentTerms: '',
  deliveryTerms: '',
  warranty: '',
  terms: '',
});

const loadSavedData = () => {
  const defaults = createInitialData();

  try {
    const saved = JSON.parse(localStorage.getItem('invoiceData'));
    if (!saved || typeof saved !== 'object') return defaults;

    return {
      ...defaults,
      ...saved,
      documentType: saved.documentType === 'quote' ? 'quote' : 'invoice',
      company: { ...defaults.company, ...(saved.company || {}), logoUrl },
      client: { ...defaults.client, ...(saved.client || {}) },
      items: Array.isArray(saved.items) && saved.items.length ? saved.items : defaults.items,
    };
  } catch {
    return defaults;
  }
};

const translations = {
  et: {
    toggleLang: 'ENG',
    appTitle: 'Dokumendivabrik',
    livePreview: 'Eelvaade',
    previewScale: 'Eelvaate suurus',
    invoiceModeButton: 'Koosta hinnapakkumine',
    quoteModeButton: 'Hinnapakkumise režiim',
    invoiceTitle: 'Arve',
    invoiceTitleDefault: 'ARVE',
    quoteTitle: 'Hinnapakkumine',
    quoteTitleDefault: 'HINNAPAKKUMINE',
    invoiceNumber: 'Arve nr',
    quoteNumber: 'Pakkumise nr',
    details: 'andmed',
    date: 'Kuupäev',
    dueDate: 'Tähtaeg',
    validUntil: 'Kehtib kuni',
    client: 'Klient',
    address: 'Aadress',
    taxRate: 'KM määr (%)',
    tax: 'KM',
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
    quoteDetails: 'Hinnapakkumise lisatingimused',
    contactPerson: 'Kontaktisik',
    referenceNumber: 'Kliendi päringu / viite nr',
    deliveryTime: 'Tarneaeg',
    paymentTerms: 'Maksetingimused',
    deliveryTerms: 'Tarnetingimused',
    warranty: 'Garantii',
    terms: 'Lisatingimused',
    autosaved: 'Automaatselt salvestatud',
    currency: 'Valuuta',
  },
  en: {
    toggleLang: 'EST',
    appTitle: 'Document Factory',
    livePreview: 'Live preview',
    previewScale: 'Preview size',
    invoiceModeButton: 'Create a quote',
    quoteModeButton: 'Quote mode',
    invoiceTitle: 'Invoice',
    invoiceTitleDefault: 'INVOICE',
    quoteTitle: 'Quote',
    quoteTitleDefault: 'QUOTE',
    invoiceNumber: 'Invoice #',
    quoteNumber: 'Quote #',
    details: 'details',
    date: 'Date',
    dueDate: 'Due date',
    validUntil: 'Valid until',
    client: 'Client',
    address: 'Address',
    taxRate: 'Tax rate (%)',
    tax: 'Tax',
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
    quoteDetails: 'Quote terms',
    contactPerson: 'Contact person',
    referenceNumber: 'Customer request / reference #',
    deliveryTime: 'Delivery time',
    paymentTerms: 'Payment terms',
    deliveryTerms: 'Delivery terms',
    warranty: 'Warranty',
    terms: 'Additional terms',
    autosaved: 'Autosaved',
    currency: 'Currency',
  },
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('et');
  const [companyId, setCompanyId] = useState('skycorp');
  const [currency, setCurrency] = useState('EUR');
  const [previewScale, setPreviewScale] = useState(90);
  const [isExporting, setIsExporting] = useState(false);
  const [autosaveMsg, setAutosaveMsg] = useState(false);
  const [invoiceData, setInvoiceData] = useState(loadSavedData);

  const isQuote = invoiceData.documentType === 'quote';
  const labels = translations[language];

  useEffect(() => {
    localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    setAutosaveMsg(true);
  }, [invoiceData]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: { main: isQuote ? '#7c3aed' : '#1976d2' },
          secondary: { main: isQuote ? '#c084fc' : '#42a5f5' },
          background: {
            default: darkMode ? (isQuote ? '#171221' : '#121212') : (isQuote ? '#f5f0ff' : '#f3f7fb'),
            paper: darkMode ? (isQuote ? '#21182e' : '#1e1e1e') : '#ffffff',
          },
        },
      }),
    [darkMode, isQuote]
  );

  const handleDataChange = (updated) => setInvoiceData(updated);

  const toggleDocumentType = () => {
    setInvoiceData((previous) => ({
      ...previous,
      documentType: previous.documentType === 'quote' ? 'invoice' : 'quote',
    }));
  };

  const switchCompany = () => {
    const next = companyId === 'skycorp' ? 'skycorpTech' : 'skycorp';
    setCompanyId(next);
    setInvoiceData((previous) => ({
      ...previous,
      company: companies[next],
      bankAccount: companies[next].bankAccount,
      bic: companies[next].bic,
    }));
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    try {
      const element = document.getElementById('pdf-export-preview');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageHeightPx = Math.floor((canvas.width * pageHeight) / pageWidth);
      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - sourceY);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightPx;
        const context = pageCanvas.getContext('2d');

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        context.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        if (pageIndex > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(
          pageCanvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          pageWidth,
          pageHeight,
          undefined,
          'FAST'
        );

        sourceY += sliceHeight;
        pageIndex += 1;
      }

      const documentNumber = isQuote ? invoiceData.quoteNumber : invoiceData.invoiceNumber;
      pdf.save(`${isQuote ? 'quote' : 'invoice'}_${documentNumber || 'draft'}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          backgroundImage: isQuote
            ? 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.18), transparent 42%)'
            : 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.12), transparent 42%)',
          transition: 'background-color 300ms ease, background-image 300ms ease',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Card
            elevation={isQuote ? 7 : 3}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 3,
              border: isQuote ? '1px solid rgba(124, 58, 237, 0.32)' : '1px solid transparent',
              transition: 'border-color 300ms ease, box-shadow 300ms ease',
            }}
          >
            <Grid container spacing={1.5} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Grid>
                <Typography variant="h5">{labels.appTitle}</Typography>
              </Grid>

              <Grid>
                <Button
                  data-testid="document-mode-toggle"
                  variant={isQuote ? 'contained' : 'outlined'}
                  startIcon={<RequestQuote />}
                  onClick={toggleDocumentType}
                  sx={{
                    px: 2,
                    fontWeight: 700,
                    color: isQuote ? '#fff' : '#6d28d9',
                    borderColor: '#7c3aed',
                    bgcolor: isQuote ? '#7c3aed' : 'rgba(124, 58, 237, 0.06)',
                    boxShadow: isQuote ? '0 6px 18px rgba(124, 58, 237, 0.3)' : 'none',
                    '&:hover': { bgcolor: isQuote ? '#6d28d9' : 'rgba(124, 58, 237, 0.12)' },
                  }}
                >
                  {isQuote ? labels.quoteModeButton : labels.invoiceModeButton}
                </Button>
              </Grid>

              <Grid>
                <IconButton onClick={() => setDarkMode(!darkMode)} size="small" aria-label="Toggle theme">
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Grid>

              <Grid>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>{labels.currency}</InputLabel>
                  <Select value={currency} label={labels.currency} onChange={(event) => setCurrency(event.target.value)}>
                    {Object.keys(currencyRates).map((currentCurrency) => (
                      <MenuItem key={currentCurrency} value={currentCurrency}>
                        {currentCurrency}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid>
                <Button onClick={() => setLanguage(language === 'et' ? 'en' : 'et')} size="small">
                  {labels.toggleLang}
                </Button>
              </Grid>

              <Grid>
                <Button variant="outlined" onClick={switchCompany} size="small">
                  {companyId === 'skycorp' ? 'SKYCORP Tech' : 'SKYCORP'}
                </Button>
              </Grid>

              <Grid>
                <Button variant="contained" onClick={handleExportPDF} size="small" disabled={isExporting}>
                  {labels.download}
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 1 }} />

            <Grid container spacing={0}>
              <Grid size={{ xs: 12, md: 6 }} sx={{ p: 0 }}>
                <InvoiceForm data={invoiceData} onDataChange={handleDataChange} labels={labels} isQuote={isQuote} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ p: 0, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, pr: 1 }}>
                  <Typography variant="h6" sx={{ whiteSpace: 'nowrap' }}>{labels.livePreview}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    {labels.previewScale}
                  </Typography>
                  <Slider
                    aria-label={labels.previewScale}
                    value={previewScale}
                    onChange={(_, value) => setPreviewScale(value)}
                    min={50}
                    max={100}
                    step={5}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                    sx={{ minWidth: 120, maxWidth: 220 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 38 }}>
                    {previewScale}%
                  </Typography>
                </Box>
                <InvoicePreview
                  data={invoiceData}
                  labels={labels}
                  currency={currency}
                  rates={currencyRates}
                  isQuote={isQuote}
                  scale={previewScale / 100}
                />
              </Grid>
            </Grid>
          </Card>

          {isExporting && (
            <Box
              aria-hidden="true"
              sx={{
                position: 'fixed',
                left: '-10000px',
                top: 0,
                width: 794,
                pointerEvents: 'none',
              }}
            >
              <InvoicePreview
                previewId="pdf-export-preview"
                data={invoiceData}
                labels={labels}
                currency={currency}
                rates={currencyRates}
                isQuote={isQuote}
                isExportMode
              />
            </Box>
          )}

          <Snackbar
            open={autosaveMsg}
            autoHideDuration={2000}
            onClose={() => setAutosaveMsg(false)}
            message={labels.autosaved}
            action={
              <IconButton size="small" onClick={() => setAutosaveMsg(false)} aria-label="Close">
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
