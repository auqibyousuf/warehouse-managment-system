import { DEFAULT_CURRENCY_SYMBOL, formatMoney } from './money';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SaleInvoice, FactorySettings, Purchase } from '../types';

/**
 * BatchIQ - Professional Invoice & Bill PDF Generator
 * Built with Expo Print and Expo Sharing for pixel-perfect documents.
 */

export const generateInvoicePDF = async (
  invoice: SaleInvoice,
  settings?: FactorySettings | null,
): Promise<string> => {
  const companyName = settings?.factoryName?.trim() || 'Your Business';
  const tagline = settings?.tagline?.trim() || '';
  const address = settings?.address?.trim() || '';
  const phone = settings?.phone?.trim() || '';
  const email = settings?.email?.trim() || '';
  const gstin = settings?.gstin?.trim() || '';
  const bankName = settings?.bankName?.trim() || '';
  const accountNumber = settings?.accountNumber?.trim() || '';
  const ifscCode = settings?.ifscCode?.trim() || '';
  const terms = settings?.termsAndConditions?.trim() || '';
  const symbol = settings?.currencySymbol?.trim() || DEFAULT_CURRENCY_SYMBOL;
  const money = (value: number) => formatMoney(value, symbol);
  // Only print what the business actually entered; never invent contact or bank details.
  const contactLine = [phone && `Phone: ${phone}`, email && `Email: ${email}`]
    .filter(Boolean)
    .join(' | ');
  const hasBank = Boolean(bankName || accountNumber || ifscCode);

  const isPaid = invoice.paymentStatus === 'paid';
  const isPartial = invoice.paymentStatus === 'partial';
  const statusColor = isPaid ? '#15803d' : isPartial ? '#b45309' : '#b91c1c';
  const statusBg = isPaid ? '#dcfce7' : isPartial ? '#fef3c7' : '#fee2e2';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 36px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header-table { width: 100%; margin-bottom: 24px; border-bottom: 2px solid #0f766e; padding-bottom: 16px; }
          .company-title { font-size: 24px; font-weight: 800; color: #0f766e; letter-spacing: -0.5px; }
          .company-tagline { font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 6px; }
          .company-meta { font-size: 11px; color: #475569; }
          .invoice-badge-box { text-align: right; }
          .invoice-title { font-size: 26px; font-weight: 800; color: #0f172a; }
          .invoice-num { font-size: 14px; font-weight: 700; color: #0f766e; }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background-color: ${statusBg};
            color: ${statusColor};
            margin-top: 6px;
          }
          .bill-meta-table { width: 100%; margin-bottom: 24px; }
          .bill-to-box { width: 55%; vertical-align: top; }
          .dates-box { width: 45%; vertical-align: top; text-align: right; }
          .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.8px; margin-bottom: 4px; }
          .customer-name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .customer-details { font-size: 12px; color: #475569; line-height: 1.4; }
          
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .items-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }

          .summary-table { width: 100%; margin-bottom: 28px; }
          .terms-col { width: 55%; vertical-align: top; padding-right: 20px; }
          .totals-col { width: 45%; vertical-align: top; }
          .calc-table { width: 100%; border-collapse: collapse; }
          .calc-table td { padding: 6px 0; font-size: 13px; }
          .grand-total-row td {
            font-size: 16px;
            font-weight: 800;
            color: #0f766e;
            border-top: 2px solid #0f766e;
            border-bottom: 2px solid #0f766e;
            padding: 8px 0;
          }
          .balance-row td {
            font-weight: 800;
            color: #b91c1c;
            padding-top: 8px;
          }

          .bank-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 11px;
            color: #334155;
          }
          .footer-table { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 36px; }
          .signatory-box { text-align: right; font-size: 12px; font-weight: 600; color: #475569; }
          .signatory-line { width: 180px; border-bottom: 1px solid #94a3b8; margin: 40px 0 6px auto; }
        </style>
      </head>
      <body>
        <!-- Header -->
        <table class="header-table">
          <tr>
            <td>
              <div class="company-title">${companyName}</div>
              ${tagline ? `<div class="company-tagline">${tagline}</div>` : ''}
              ${address ? `<div class="company-meta">${address}</div>` : ''}
              ${contactLine ? `<div class="company-meta">${contactLine}</div>` : ''}
              ${gstin ? `<div class="company-meta"><b>GSTIN:</b> ${gstin}</div>` : ''}
            </td>
            <td class="invoice-badge-box">
              <div class="invoice-title">TAX INVOICE</div>
              <div class="invoice-num">${invoice.invoiceNumber}</div>
              <div class="status-badge">${invoice.paymentStatus}</div>
            </td>
          </tr>
        </table>

        <!-- Bill To & Dates -->
        <table class="bill-meta-table">
          <tr>
            <td class="bill-to-box">
              <div class="section-label">Billed To (Customer):</div>
              <div class="customer-name">${invoice.customerName}</div>
              <div class="customer-details">${invoice.customerAddress || 'Customer Address on Record'}</div>
              <div class="customer-details">Phone: ${invoice.customerPhone || 'N/A'}</div>
              ${invoice.customerGstin ? `<div class="customer-details"><b>GSTIN:</b> ${invoice.customerGstin}</div>` : ''}
            </td>
            <td class="dates-box">
              <div class="section-label">Invoice Details:</div>
              <div><b>Invoice Date:</b> ${invoice.date}</div>
              <div><b>Payment Terms:</b> ${invoice.isCredit ? 'Credit (Net 15)' : 'Immediate Cash/UPI'}</div>
              <div><b>Dispatch Status:</b> Dispatched & Delivered</div>
            </td>
          </tr>
        </table>

        <!-- Line Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 8%;">#</th>
              <th style="width: 46%;">Item & Description</th>
              <th class="text-center" style="width: 14%;">Unit</th>
              <th class="text-right" style="width: 14%;">Quantity</th>
              <th class="text-right" style="width: 18%;">Rate (${symbol})</th>
              <th class="text-right" style="width: 20%;">Amount (${symbol})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td>
                <b>${invoice.productName}</b>
                <div style="font-size: 11px; color: #64748b;">Factory standard batch production unit</div>
              </td>
              <td class="text-center">${invoice.outputUnit || 'units'}</td>
              <td class="text-right">${(invoice.quantity || invoice.bagQuantity || 1).toLocaleString('en-IN')}</td>
              <td class="text-right">${money(invoice.unitPrice)}</td>
              <td class="text-right"><b>${money(invoice.subtotal)}</b></td>
            </tr>
          </tbody>
        </table>

        <!-- Calculation & Terms -->
        <table class="summary-table">
          <tr>
            <td class="terms-col">
              ${
                hasBank
                  ? `<div class="bank-box">
                <b>BANK ACCOUNT DETAILS FOR REMITTANCE:</b><br />
                ${bankName ? `Bank Name: ${bankName}<br />` : ''}
                ${accountNumber ? `A/C No: ${accountNumber}<br />` : ''}
                ${ifscCode ? `IFSC Code: ${ifscCode}` : ''}
              </div>`
                  : ''
              }
              ${
                terms
                  ? `<div class="section-label">TERMS & CONDITIONS:</div>
              <div style="font-size: 11px; color: #64748b; white-space: pre-line;">${terms}</div>`
                  : ''
              }
            </td>
            <td class="totals-col">
              <table class="calc-table">
                <tr>
                  <td>Subtotal:</td>
                  <td class="text-right">${money(invoice.subtotal)}</td>
                </tr>
                ${
                  invoice.discount > 0
                    ? `<tr>
                        <td style="color: #059669;">Special Discount:</td>
                        <td class="text-right" style="color: #059669;">- ${money(invoice.discount)}</td>
                      </tr>`
                    : ''
                }
                <tr class="grand-total-row">
                  <td><b>Total Invoice Value:</b></td>
                  <td class="text-right"><b>${money(invoice.totalAmount)}</b></td>
                </tr>
                <tr>
                  <td>Amount Paid:</td>
                  <td class="text-right" style="color: #15803d; font-weight: 600;">${money(invoice.amountPaid)}</td>
                </tr>
                <tr class="balance-row">
                  <td><b>Balance Due:</b></td>
                  <td class="text-right"><b>${money(invoice.balanceDue)}</b></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Footer Signatory -->
        <table class="footer-table">
          <tr>
            <td style="font-size: 11px; color: #94a3b8;">
              Computer generated invoice processed by BatchIQ. No physical signature required.
            </td>
            <td class="signatory-box">
              For ${companyName}
              <div class="signatory-line"></div>
              Authorized Signatory
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Tax Invoice ${invoice.invoiceNumber}`,
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
};

export const generatePurchaseBillPDF = async (
  purchase: Purchase,
  settings?: FactorySettings | null,
): Promise<string> => {
  const symbol = settings?.currencySymbol?.trim() || DEFAULT_CURRENCY_SYMBOL;
  const money = (value: number) => formatMoney(value, symbol);
  const companyName = settings?.factoryName?.trim() || 'Your Business';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Purchase Voucher ${purchase.purchaseNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 32px; color: #1e293b; font-size: 13px; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #0f766e; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; text-align: left; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${companyName}</div>
          <div>INWARD PURCHASE VOUCHER / BILL</div>
          <div style="margin-top: 6px;"><b>Voucher #:</b> ${purchase.purchaseNumber} | <b>Date:</b> ${purchase.date}</div>
        </div>
        <p><b>Supplier:</b> ${purchase.supplierName} (${purchase.supplierPhone || '-'})</p>
        <table>
          <thead>
            <tr>
              <th>Material / Item</th>
              <th>Quantity</th>
              <th class="text-right">Unit Rate (${symbol})</th>
              <th class="text-right">Total Amount (${symbol})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${purchase.itemName}</td>
              <td>${purchase.quantity} ${purchase.unit}</td>
              <td class="text-right">${money(purchase.unitPrice)}</td>
              <td class="text-right">${money(purchase.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 24px; text-align: right;">
          <p><b>Paid:</b> ${money(purchase.amountPaid)}</p>
          <p style="color: #b91c1c;"><b>Balance Due:</b> ${money(purchase.balanceDue)}</p>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Purchase Voucher ${purchase.purchaseNumber}`,
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
};
