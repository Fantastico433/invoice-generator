import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Select,
  Slider,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Brightness4,
  Brightness7,
  Close as CloseIcon,
  CloudUpload,
  DeleteOutline,
  FolderOpen,
  Login,
  Logout,
  RequestQuote,
} from '@mui/icons-material';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import {
  deleteDocument,
  listDocuments,
  saveDocument,
  signIn,
  signOutUser,
  watchUser,
} from './cloudStore';

const logoUrl = `${process.env.PUBLIC_URL}/logo.png`;

const companies = {
  skycorp: {
    name: 'SKYCORP OÜ',
    address: 'Nurme vkt 17, 61702 Külitse, Eesti',
    regCode: '14211211',
    vatNumber: '',
    bankAccount: 'EE117700771002605677',
    bic: 'LHVBEE22',
    logoUrl,
  },
  skycorpTech: {
    name: 'SKYCORP Technologies OÜ',
    address: 'Teaduspargi 11, Tartu, Eesti',
    regCode: '16782217',
    vatNumber: 'EE102638736',
    bankAccount: 'EE767700771009349402',
    bic: 'LHVBEE22',
    logoUrl,
  },
};

const currencyRates = { EUR: 1, USD: 1.1 };

const createInitialData = () => ({
  documentType: 'invoice',
  company: companies.skycorp,
  client: { name: '', address: '', regCode: '', vatNumber: '' },
  invoiceNumber: '2025043002',
  quoteNumber: `PAK-${new Date().getFullYear()}-0001`,
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  validUntil: '',
  bankAccount: companies.skycorp.bankAccount,
  bic: companies.skycorp.bic,
  taxRate: 22,
  showPaymentQr: false,
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

    const savedCompany = { ...defaults.company, ...(saved.company || {}), logoUrl };
    if (!savedCompany.vatNumber) {
      const preset = Object.values(companies).find((entry) => entry.regCode === savedCompany.regCode);
      if (preset) savedCompany.vatNumber = preset.vatNumber;
    }

    return {
      ...defaults,
      ...saved,
      documentType: saved.documentType === 'quote' ? 'quote' : 'invoice',
      company: savedCompany,
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
    quoteModeButton: 'Koosta arve',
    modeInvoice: 'Koostad arvet',
    modeQuote: 'Koostad hinnapakkumist',
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
    vatNumber: 'KMKR nr',
    paymentQr: 'Lisa makse-QR',
    paymentQrTitle: 'Maksa QR-koodiga',
    paymentQrHint: 'Skaneeri pangarakendusega',
    signIn: 'Logi sisse',
    signOut: 'Logi välja',
    save: 'Salvesta pilve',
    saved: 'Salvestatud',
    myDocuments: 'Minu dokumendid',
    noDocuments: 'Salvestatud dokumente veel ei ole',
    newDocument: 'Uus dokument',
    deleteDocument: 'Kustuta',
    signInHint: 'Logi sisse, et dokumente pilve salvestada',
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
    quoteModeButton: 'Create an invoice',
    modeInvoice: 'Editing an invoice',
    modeQuote: 'Editing a quote',
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
    vatNumber: 'VAT number',
    paymentQr: 'Add payment QR',
    paymentQrTitle: 'Pay by QR code',
    paymentQrHint: 'Scan with your banking app',
    signIn: 'Sign in',
    signOut: 'Sign out',
    save: 'Save to cloud',
    saved: 'Saved',
    myDocuments: 'My documents',
    noDocuments: 'No saved documents yet',
    newDocument: 'New document',
    deleteDocument: 'Delete',
    signInHint: 'Sign in to save documents to the cloud',
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
  const [previewScale, setPreviewScale] = useState(60);
  const [isExporting, setIsExporting] = useState(false);
  const [autosaveMsg, setAutosaveMsg] = useState(false);
  const [invoiceData, setInvoiceData] = useState(loadSavedData);
  const [user, setUser] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

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

  useEffect(() => watchUser(setUser), []);

  const handleDataChange = (updated) => setInvoiceData(updated);

  const refreshDocuments = useCallback(async (account) => {
    if (!account) return;
    setSavedDocuments(await listDocuments(account));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const savedId = await saveDocument(user, invoiceData, documentId);
    setDocumentId(savedId);
    setStatusMsg(labels.saved);
    refreshDocuments(user);
  };

  const handleOpenDocuments = async () => {
    setDocumentsOpen(true);
    refreshDocuments(user);
  };

  const handleOpenDocument = (entry) => {
    setInvoiceData(entry.data);
    setDocumentId(entry.id);
    setDocumentsOpen(false);
  };

  const handleDeleteDocument = async (entry) => {
    await deleteDocument(entry.id);
    if (entry.id === documentId) setDocumentId(null);
    refreshDocuments(user);
  };


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

    try {
      // The on-screen preview already renders the payment QR; reusing that
      // canvas keeps the PDF in step with what the user is looking at.
      const qrCanvas = document.querySelector('#pdf-preview canvas');
      const { exportDocumentPdf } = await import('./pdfExport');

      await exportDocumentPdf({
        data: invoiceData,
        labels,
        currency,
        rates: currencyRates,
        isQuote,
        paymentQrDataUrl: qrCanvas ? qrCanvas.toDataURL('image/png') : null,
      });
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
                <Typography
                  data-testid="document-mode-status"
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: isQuote ? '#7c3aed' : '#1976d2' }}
                >
                  {isQuote ? labels.modeQuote : labels.modeInvoice}
                </Typography>
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

              {user ? (
                <>
                  <Grid>
                    <Button startIcon={<CloudUpload />} onClick={handleSave} size="small">
                      {labels.save}
                    </Button>
                  </Grid>
                  <Grid>
                    <Button startIcon={<FolderOpen />} onClick={handleOpenDocuments} size="small">
                      {labels.myDocuments}
                    </Button>
                  </Grid>
                  <Grid>
                    <Tooltip title={`${user.email} — ${labels.signOut}`}>
                      <IconButton onClick={signOutUser} size="small" aria-label={labels.signOut}>
                        <Logout fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </>
              ) : (
                <Grid>
                  <Tooltip title={labels.signInHint}>
                    <Button startIcon={<Login />} onClick={signIn} size="small">
                      {labels.signIn}
                    </Button>
                  </Tooltip>
                </Grid>
              )}
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

          <Dialog open={documentsOpen} onClose={() => setDocumentsOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>{labels.myDocuments}</DialogTitle>
            <DialogContent dividers>
              {savedDocuments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  {labels.noDocuments}
                </Typography>
              ) : (
                <List>
                  {savedDocuments.map((entry) => (
                    <ListItemButton
                      key={entry.id}
                      onClick={() => handleOpenDocument(entry)}
                      selected={entry.id === documentId}
                    >
                      <ListItemText
                        primary={`${entry.number || labels.newDocument} — ${entry.clientName || ''}`}
                        secondary={`${entry.date || ''} · ${(entry.total || 0).toFixed(2)} EUR · ${
                          entry.documentType === 'quote' ? labels.quoteTitleDefault : labels.invoiceTitleDefault
                        }`}
                      />
                      <IconButton
                        edge="end"
                        aria-label={labels.deleteDocument}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteDocument(entry);
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  ))}
                </List>
              )}
            </DialogContent>
          </Dialog>

          <Snackbar
            open={Boolean(statusMsg)}
            autoHideDuration={2000}
            onClose={() => setStatusMsg('')}
            message={statusMsg}
          />

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
