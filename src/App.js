import React, { useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Switch,
  Slider,
  Box,
} from '@mui/material';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const companies = {
  skycorp: {
    name: 'SKYCORP OÜ',
    address: 'Nurme vkt 17, 61702 Külitse, Eesti',
    regCode: '14211211',
    bankAccount: 'EE117700771002605677',
    bic: 'LHVBEE22',
  },
  skycorpTech: {
    name: 'SKYCORP Technologies OÜ',
    address: 'Teaduspargi 11, Tartu',
    regCode: '16782217',
    bankAccount: 'EE767700771009349402',
    bic: 'LHVBEE22',
  },
};

function App() {
  const [language, setLanguage] = useState('et');
  const [isExporting, setIsExporting] = useState(false);
  const [companyId, setCompanyId] = useState('skycorp');

  const labels = {
    et: {
      supplier: 'Tarnija',
      client: 'Klient',
      invoiceNumber: 'Dokumendi number',
      date: 'Dokumendi kuupäev',
      dueDate: 'Tähtaeg',
      account: 'Pangakonto',
      bic: 'BIC',
      addItem: '＋ Lisa rida',
      remove: 'Eemalda',
      subtotal: 'Summa KM-ta',
      vat: 'KM',
      total: 'Kogusumma',
      description: 'Kirjeldus',
      quantity: 'Kogus',
      unit: 'Ühik',
      unitPrice: 'Ühiku hind',
      tax: 'KM %',
      amount: 'Summa',
      download: 'Laadi PDF',
      toggleLang: 'English',
      invoiceTitleDefault: 'ARVE',
    },
    en: {
      supplier: 'Supplier',
      client: 'Client',
      invoiceNumber: 'Invoice Number',
      date: 'Invoice Date',
      dueDate: 'Due Date',
      account: 'Bank Account',
      bic: 'BIC',
      addItem: '＋ Add line item',
      remove: 'Remove',
      subtotal: 'Subtotal (excl. VAT)',
      vat: 'VAT',
      total: 'Total',
      description: 'Description',
      quantity: 'Quantity',
      unit: 'Unit',
      unitPrice: 'Unit Price',
      tax: 'VAT %',
      amount: 'Amount',
      download: 'Download PDF',
      toggleLang: 'Eesti',
      invoiceTitleDefault: 'Invoice',
    },
  };

  const [invoiceData, setInvoiceData] = useState({
    company: { ...companies[companyId] },
    client: {
      name: '',
      invoiceTitle: 'Teenusearve',
      address: '',
      regCode: '',
    },
    invoiceNumber: '2025043002',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    bankAccount: companies[companyId].bankAccount,
    bic: companies[companyId].bic,
    taxRate: 22,
    items: [],
    notes: '',
  });

  const [previewScale, setPreviewScale] = useState(1);
  const [compactView, setCompactView] = useState(false);

  const handleDataChange = (updatedData) => {
    setInvoiceData(updatedData);
  };

  const switchCompany = () => {
    const nextId = companyId === 'skycorp' ? 'skycorpTech' : 'skycorp';
    const nextCompany = companies[nextId];
    setCompanyId(nextId);
    setInvoiceData((prev) => ({
      ...prev,
      company: {
        name: nextCompany.name,
        address: nextCompany.address,
        regCode: nextCompany.regCode,
      },
      bankAccount: nextCompany.bankAccount,
      bic: nextCompany.bic,
    }));
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      const element = document.getElementById('pdf-preview');
      const canvas = await html2canvas(element, { scale: 1.2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`invoice_${invoiceData.invoiceNumber || 'export'}.pdf`);
      setIsExporting(false);
    }, 300);
  };

  return (
    <Container>
      <Grid container spacing={2} justifyContent="space-between" alignItems="center">
        <Grid item>
          <Typography variant="h5" gutterBottom fontWeight={500}>
            Invoice Generator
          </Typography>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={() => setLanguage(language === 'et' ? 'en' : 'et')}>
            {labels[language].toggleLang}
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={switchCompany}>
            {companyId === 'skycorp' ? 'Use SKYCORP Technologies OÜ' : 'Use SKYCORP OÜ'}
          </Button>
        </Grid>
      </Grid>
  
      {/* Scaled invoice generator UI */}
      <Box sx={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <InvoiceForm
              data={invoiceData}
              onDataChange={handleDataChange}
              labels={labels[language]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" fontWeight={500}>Live Preview</Typography>
            <Slider
              value={previewScale}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(e, value) => setPreviewScale(value)}
              valueLabelDisplay="auto"
            />
            <Typography variant="body2">Compact View</Typography>
            <Switch
              checked={compactView}
              onChange={(e) => setCompactView(e.target.checked)}
            />
            <InvoicePreview
              data={invoiceData}
              scale={previewScale}
              compact={compactView}
              labels={labels[language]}
              invoiceTitleDefault={labels[language].invoiceTitleDefault}
            />
            <Button variant="contained" onClick={handleExportPDF}>
              {labels[language].download}
            </Button>
          </Grid>
        </Grid>
      </Box>
  
      {isExporting && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <InvoicePreview
            data={invoiceData}
            scale={1}
            compact={compactView}
            labels={labels[language]}
            isExportMode={true}
            invoiceTitleDefault={labels[language].invoiceTitleDefault}
          />
        </div>
      )}
    </Container>
  );
  
}

export default App;
