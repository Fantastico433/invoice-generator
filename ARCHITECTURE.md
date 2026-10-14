# Architecture

Invoice / quote generator. Create React App (react-scripts 5) + React 19 + MUI 7.
No server of its own: documents are edited in the browser and PDFs are built
client-side. Firebase provides hosting, sign-in and storage.

## Source layout

| File | Responsibility |
| --- | --- |
| `src/index.js` | CRA entry point; mounts `<App />`. |
| `src/App.js` | Application shell and single source of truth: all state, i18n labels, company presets, currency rates, theming, localStorage autosave, cloud actions. |
| `src/InvoiceForm.js` | Controlled form (left column). Holds no state; calls `onDataChange` with the whole updated document. |
| `src/InvoicePreview.js` | On-screen render of the document, including the payment QR. |
| `src/pdfExport.js` | Builds the PDF as a pdfMake document definition. |
| `src/firebase.js` | Firebase app, auth and Firestore handles. |
| `src/cloudStore.js` | Sign-in plus save / list / delete of stored documents. |

No router, no state library: data flows `App` → props → child → `onDataChange`
→ `App`.

## Document model

One `invoiceData` object covers both kinds. `documentType`
(`'invoice' | 'quote'`) switches labels, colours and which fields apply —
`invoiceNumber`/`dueDate` for invoices, `quoteNumber`/`validUntil` plus the
quote-only block for quotes. Form and preview branch on an `isQuote` prop
rather than duplicating components.

Line items are `{ description, quantity, unit, unitPrice }`. Totals are derived
on render (subtotal → VAT from `taxRate` → total) and never stored.

## Cross-cutting state in `App.js`

- **i18n** — `labels` keyed by `et` / `en`; children receive strings as props
  and contain no literal copy.
- **Currency** — `currencyRates` is a hardcoded table; amounts are stored in
  euro and converted at format time.
- **Companies** — `companies` holds the two SKYCORP presets, including their
  VAT numbers; switching swaps company and bank details into `invoiceData`.
- **Preview scale** — `previewScale` (percent, default 60, slider 50–100) is
  applied as a CSS transform. Display only; it never affects the PDF.

## Flight hour calculator tab

A second workspace for the SentH2ium hydrogen drone service, opened by the
Kalkulaator button in the top bar and closed by the same button. It keeps the
documents tab's split: inputs on the left, a client-ready page on the right.

- `src/pricing.js` — the whole model as one pure function, `calculatePricing`.
  Nothing is typed twice: every figure is derived from the inputs. Margin is a
  share of the selling price, so `price = cost / (1 - margin)`.
- `src/PricingForm.js` — the inputs, plus the internal readout (fixed costs,
  per-hour costs, and a per-mission margin table). This half is never shown to
  a client.
- `src/PriceList.js` — the client page. It also exports the row builders, so
  the PDF cannot drift from the preview.
- `src/priceListPdf.js` — the same page as a pdfMake definition, styled like
  the invoice.

The model answers two questions at once: what a mission costs at the volume
used for pricing (`targetHours`), and what it actually earns at the volume
expected (`actualHours`). The second is usually worse, and the cash margin —
the same sum without depreciation — says whether real money is left over.
`pricing.test.js` pins the agreed figures so a changed formula cannot pass
quietly.

Each mission also carries a `breakdown`: the list price split into the four
cost drivers, overhead, margin and the rounding given away, in euros that add
back up to the list price exactly. It answers what a client is actually paying
for — on a full day the drone's fixed cost (27.6%) outweighs the crew flying
it (16.8%).

Three fields shape the client page without touching the calculation: `hidden`
drops rows, `customRows` adds rows the user typed, and `order` sets the
sequence per group. A custom row's price is free text, so "kokkuleppel" is a
valid value.

Inputs persist to `localStorage` under `pricingInputs`, separately from the
document.

## Persistence and authentication

Two independent layers:

- **localStorage** — always on. Holds the document being edited, so the app is
  fully usable with no account.
- **Firestore** — opt-in, behind Google sign-in. Saving writes the whole
  document plus denormalised fields (number, client, date, total) that the
  document list renders without reading every document.

Every stored document carries an `ownerId`. `firestore.rules` checks it on
read, update and delete, refuses an update that changes it, and denies
everything outside the `documents` collection. Ownership is per Google
account; sharing across colleagues would mean adding an organisation id beside
`ownerId` rather than reworking what exists.

The Firebase config in `src/firebase.js` is not secret — every client is served
it. The rules, not the config, protect the data.

## PDF export

`pdfExport.js` builds a pdfMake definition, so the PDF is real vector text:
sharp at any zoom, selectable, searchable, and small (a one-item quote is
about 22 KB). An earlier html2canvas approach rasterised the preview and was
replaced for exactly those reasons.

The payment QR reaches the PDF as a PNG lifted from the preview's canvas, so
the exported document always matches what is on screen.

## Payment QR

Optional per document (`showPaymentQr`), and only offered on invoices in euro:
the EPC069-12 payload is euro-only, so a converted total would give the bank
the wrong amount. It encodes recipient, IBAN, BIC, total and the invoice
number, and needs no payment provider or contract.

## Layout notes

- The preview is a fixed 794px (A4 at 96dpi) sheet scaled by CSS transform, so
  document geometry stays stable regardless of zoom.
- The app chrome is glass on a soft gradient: a top bar, a quiet settings
  strip, and two translucent panels (`backdrop-filter`). The document inside
  the preview panel stays opaque white, since it is a print artefact and the
  PDF cannot render blur. Transparency is dropped under
  `prefers-reduced-transparency`.
- Form density comes from the theme (`MuiTextField` defaults to `size="small"`),
  not from a CSS transform; the earlier `scale(0.8)` wrapper is gone.
- In the details block the first row is document number (8/12) plus the
  narrower VAT rate (4/12); date and deadline sit below at 6/12 each so the
  date pickers have room.

## Deployment

Live at https://invoice-generator-7978a.web.app (Firebase project
`invoice-generator-7978a`).

```
MSYS_NO_PATHCONV=1 PUBLIC_URL=/ npx react-scripts build
firebase deploy --only hosting
```

`PUBLIC_URL=/` is required because `package.json` sets `homepage` to
`/invoice-generator` for the second, older target: GitHub Pages, published by
`npm run deploy`. Deploying one target does not update the other.
(`MSYS_NO_PATHCONV=1` is only needed under Git Bash on Windows, which would
otherwise rewrite the bare `/` into a Windows path.)

Rules and indexes deploy separately:
`firebase deploy --only firestore:rules,firestore:indexes`.

## Working copy

Keep the checkout outside OneDrive. A synced folder previously removed the
entire working tree, `.git` included, when the folder was taken out of sync.
