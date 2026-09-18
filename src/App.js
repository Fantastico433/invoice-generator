import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
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
import { ThemeProvider, alpha, createTheme } from '@mui/material/styles';
import {
  Brightness4,
  Brightness7,
  Close as CloseIcon,
  CloudUpload,
  RestartAlt,
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
  taxRate: 24,
  showPaymentQr: false,
  paymentLink: '',
  poNumber: '',
  contractNumber: '',
  quotationNumber: '',
  reverseCharge: false,
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
    reverseCharge: 'Pöördmaksustamine',
    reverseChargeNote: 'KM 0% – pöördmaksustamine. Nõukogu direktiivi 2006/112/EÜ artiklid 44 ja 196.',
    poNumber: 'PO nr',
    contractNumber: 'Leping',
    quotationNumber: 'Pakkumise nr',
    paymentQrTitle: 'Maksa QR-koodiga',
    paymentQrHint: 'Skaneeri pangarakendusega',
    paymentLink: 'Makselink (nt LHV makseküsimine)',
    paymentLinkHint: 'Skaneeri telefoniga või ava link',
    signIn: 'Logi sisse',
    signOut: 'Logi välja',
    save: 'Salvesta pilve',
    saved: 'Salvestatud',
    myDocuments: 'Minu dokumendid',
    noDocuments: 'Salvestatud dokumente veel ei ole',
    newDocument: 'Uus dokument',
    deleteDocument: 'Kustuta',
    signInHint: 'Logi sisse, et dokumente pilve salvestada',
    clearFields: 'Tühjenda väljad',
    cleared: 'Väljad tühjendatud',
    undo: 'Võta tagasi',
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
    reverseCharge: 'Reverse charge',
    reverseChargeNote: 'VAT 0% - reverse charge. Articles 44 and 196 of Council Directive 2006/112/EC.',
    poNumber: 'PO',
    contractNumber: 'Contract',
    quotationNumber: 'Quotation',
    paymentQrTitle: 'Pay by QR code',
    paymentQrHint: 'Scan with your banking app',
    paymentLink: 'Payment link (e.g. LHV money request)',
    paymentLinkHint: 'Scan with your phone or open the link',
    signIn: 'Sign in',
    signOut: 'Sign out',
    save: 'Save to cloud',
    saved: 'Saved',
    myDocuments: 'My documents',
    noDocuments: 'No saved documents yet',
    newDocument: 'New document',
    deleteDocument: 'Delete',
    signInHint: 'Sign in to save documents to the cloud',
    clearFields: 'Clear fields',
    cleared: 'Fields cleared',
    undo: 'Undo',
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
  const [undoState, setUndoState] = useState(null);

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
        shape: { borderRadius: 10 },
        components: {
          MuiTextField: { defaultProps: { size: 'small' } },
          MuiFormControl: { defaultProps: { size: 'small' } },
          // Field text a point below the default so the form reads denser.
          MuiInputBase: { styleOverrides: { input: { fontSize: 15 } } },
          MuiInputLabel: { styleOverrides: { root: { fontSize: 15 } } },
          MuiFormControlLabel: { styleOverrides: { label: { fontSize: 15 } } },
        },
      }),
    [darkMode, isQuote]
  );

  useEffect(() => watchUser(setUser), []);

  // Glass surfaces sit on a soft gradient; transparency is dropped entirely
  // for people who have asked their OS to reduce it.
  const accentGlow = (alpha) => (isQuote ? `rgba(124, 58, 237, ${alpha})` : `rgba(25, 118, 210, ${alpha})`);
  const secondaryGlow = (alpha) => (isQuote ? `rgba(236, 72, 153, ${alpha})` : `rgba(192, 38, 211, ${alpha})`);
  const glass = {
    borderRadius: 3,
    border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.7)',
    bgcolor: darkMode ? 'rgba(17, 24, 39, 0.55)' : 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(18px) saturate(160%)',
    WebkitBackdropFilter: 'blur(18px) saturate(160%)',
    boxShadow: darkMode
      ? '0 12px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
      : '0 12px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    '@media (prefers-reduced-transparency: reduce)': {
      bgcolor: darkMode ? '#111827' : '#ffffff',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
  };
  // One control family for the bar: same height, radius, edge and weight,
  // whether the control is a button, a select or an icon.
  // Every bar control is a tint of the document accent, so the row reads as
  // one family and shifts blue -> purple with the document type.
  const accentHex = isQuote ? '#7c3aed' : '#1976d2';
  const accentInk = darkMode ? (isQuote ? '#c4b5fd' : '#93c5fd') : (isQuote ? '#5b21b6' : '#0d47a1');
  const edge = alpha(accentHex, darkMode ? 0.35 : 0.28);
  const pill = {
    height: 34,
    minHeight: 34,
    borderRadius: 999,
    px: 1.75,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1,
    color: accentInk,
    border: `1px solid ${edge}`,
    bgcolor: alpha(accentHex, darkMode ? 0.16 : 0.08),
    boxShadow: 'none',
    '&:hover': { bgcolor: alpha(accentHex, darkMode ? 0.26 : 0.16), borderColor: alpha(accentHex, 0.5), boxShadow: 'none' },
    '& .MuiSvgIcon-root': { color: accentInk },
  };
  const pillIcon = { ...pill, width: 34, px: 0, justifyContent: 'center' };
  const pillPrimary = {
    ...pill,
    color: '#fff',
    bgcolor: accentHex,
    borderColor: 'transparent',
    '&:hover': { bgcolor: alpha(accentHex, 0.85), borderColor: 'transparent', boxShadow: 'none' },
    '& .MuiSvgIcon-root': { color: '#fff' },
    '&.Mui-disabled': { color: alpha('#fff', 0.7), bgcolor: alpha(accentHex, 0.45) },
  };
  // The mode toggle is one step stronger than its neighbours: it changes the
  // whole document, and the tint says so without a second colour.
  const pillQuote = {
    ...pill,
    bgcolor: alpha(accentHex, darkMode ? 0.26 : 0.14),
    borderColor: alpha(accentHex, 0.45),
    '&:hover': { bgcolor: alpha(accentHex, darkMode ? 0.34 : 0.22), borderColor: alpha(accentHex, 0.6), boxShadow: 'none' },
  };

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

  const handleClearFields = () => {
    // Keep the company block and the document kind: those are settings, not content.
    const fresh = createInitialData();
    setUndoState({ data: invoiceData, documentId });
    setInvoiceData({
      ...fresh,
      documentType: invoiceData.documentType,
      company: invoiceData.company,
      bankAccount: invoiceData.bankAccount,
      bic: invoiceData.bic,
    });
    setDocumentId(null);
    setStatusMsg(labels.cleared);
  };

  const handleUndoClear = () => {
    if (!undoState) return;
    setInvoiceData(undoState.data);
    setDocumentId(undoState.documentId);
    setUndoState(null);
    setStatusMsg('');
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
          backgroundImage: darkMode
            ? `radial-gradient(900px 600px at 8% -10%, ${accentGlow(0.28)}, transparent 60%),
               radial-gradient(700px 500px at 100% 0%, ${secondaryGlow(0.22)}, transparent 60%),
               linear-gradient(180deg, #0b1220 0%, #0f172a 100%)`
            : `radial-gradient(900px 600px at 8% -10%, ${accentGlow(0.18)}, transparent 60%),
               radial-gradient(700px 500px at 100% 0%, ${secondaryGlow(0.16)}, transparent 60%),
               linear-gradient(180deg, #f6f8fc 0%, #eef2f8 100%)`,
          backgroundAttachment: 'fixed',
          transition: 'background-image 400ms ease',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
          {/* ---- top bar: identity, settings, actions — one row, wraps when narrow ---- */}
          <Box sx={{ ...glass, px: { xs: 2, md: 2.5 }, py: 1.25, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Box sx={{ mr: 'auto', minWidth: 0, pr: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {labels.appTitle}
              </Typography>
              <Typography
                data-testid="document-mode-status"
                variant="caption"
                fontWeight={600}
                sx={{ color: isQuote ? '#a78bfa' : '#60a5fa', letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                {isQuote ? labels.modeQuote : labels.modeInvoice}
              </Typography>
            </Box>

            <Button onClick={switchCompany} sx={pill}>
              {companyId === 'skycorp' ? 'SKYCORP Tech' : 'SKYCORP'}
            </Button>
            <Tooltip title={labels.currency}>
              <Select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                aria-label={labels.currency}
                sx={{
                  ...pill,
                  px: 0,
                  '& .MuiSelect-select': { py: 0, pl: 1.75, pr: '32px !important', display: 'flex', alignItems: 'center', height: '34px !important', minHeight: '0 !important' },
                  '& .MuiOutlinedInput-notchedOutline': { border: 0 },
                }}
              >
                {Object.keys(currencyRates).map((currentCurrency) => (
                  <MenuItem key={currentCurrency} value={currentCurrency}>
                    {currentCurrency}
                  </MenuItem>
                ))}
              </Select>
            </Tooltip>
            <Button onClick={() => setLanguage(language === 'et' ? 'en' : 'et')} sx={pill}>
              {labels.toggleLang}
            </Button>
            <Tooltip title={darkMode ? 'Hele' : 'Tume'}>
              <IconButton onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme" sx={pillIcon}>
                {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Box sx={{ width: '1px', alignSelf: 'stretch', my: 0.5, bgcolor: edge, mx: 0.5, display: { xs: 'none', md: 'block' } }} />

            <Button
              data-testid="document-mode-toggle"
              startIcon={<RequestQuote fontSize="small" />}
              onClick={toggleDocumentType}
              sx={pillQuote}
            >
              {isQuote ? labels.quoteModeButton : labels.invoiceModeButton}
            </Button>

            <Button onClick={handleExportPDF} disabled={isExporting} sx={pillPrimary}>
              {labels.download}
            </Button>

            {user ? (
              <>
                <Button startIcon={<CloudUpload fontSize="small" />} onClick={handleSave} sx={pill}>
                  {labels.save}
                </Button>
                <Button startIcon={<FolderOpen fontSize="small" />} onClick={handleOpenDocuments} sx={pill}>
                  {labels.myDocuments}
                </Button>
                <Tooltip title={`${user.email} — ${labels.signOut}`}>
                  <IconButton onClick={signOutUser} aria-label={labels.signOut} sx={pillIcon}>
                    <Logout fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title={labels.signInHint}>
                <Button startIcon={<Login fontSize="small" />} onClick={signIn} sx={pill}>
                  {labels.signIn}
                </Button>
              </Tooltip>
            )}

            <Tooltip title={labels.clearFields}>
              <IconButton onClick={handleClearFields} aria-label={labels.clearFields} sx={pillIcon}>
                <RestartAlt fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* ---- work area: form on glass, document as paper ---- */}
          <Grid container spacing={2} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ ...glass, p: { xs: 1.5, md: 2 } }}>
                <InvoiceForm data={invoiceData} onDataChange={handleDataChange} labels={labels} isQuote={isQuote} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ ...glass, p: { xs: 1.5, md: 2 }, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, pr: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{labels.livePreview}</Typography>
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
              </Box>
            </Grid>
          </Grid>

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
            autoHideDuration={undoState ? 8000 : 2000}
            onClose={() => setStatusMsg('')}
            message={statusMsg}
            action={undoState ? (
              <Button color="secondary" size="small" onClick={handleUndoClear}>
                {labels.undo}
              </Button>
            ) : null}
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
