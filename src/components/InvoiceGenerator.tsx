import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type InvoiceItem = {
  description: string;
  quantity: number;
  price: number;
};

type Currency = "USD" | "EUR";

export default function InvoiceGenerator() {
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [vatRate, setVatRate] = useState(25);
  const [currency, setCurrency] = useState<Currency>("USD");

  const invoiceRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0 },
  ]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }

  useEffect(() => {
    const saved = localStorage.getItem("invoice-generator-data");

    if (saved) {
      const data = JSON.parse(saved);

      setCompanyName(data.companyName || "");
      setCompanyEmail(data.companyEmail || "");
      setClientName(data.clientName || "");
      setInvoiceNumber(data.invoiceNumber || "INV-001");
      setInvoiceDate(data.invoiceDate || "");
      setDueDate(data.dueDate || "");
      setVatRate(data.vatRate || 25);
      setCurrency(data.currency || "USD");
      setItems(data.items || [{ description: "", quantity: 1, price: 0 }]);
    }
  }, []);

  useEffect(() => {
    const data = {
      companyName,
      companyEmail,
      clientName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      vatRate,
      currency,
      items,
    };

    localStorage.setItem("invoice-generator-data", JSON.stringify(data));
  }, [
    companyName,
    companyEmail,
    clientName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    vatRate,
    currency,
    items,
  ]);

  function updateItem(index: number, field: keyof InvoiceItem, value: string) {
    const updatedItems = [...items];

    if (field === "description") {
      updatedItems[index].description = value;
    } else {
      updatedItems[index][field] = value === "" ? 0 : Number(value);
    }

    setItems(updatedItems);
  }

  function addItem() {
    setItems([...items, { description: "", quantity: 1, price: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function clearInvoice() {
    localStorage.removeItem("invoice-generator-data");

    setCompanyName("");
    setCompanyEmail("");
    setClientName("");
    setInvoiceNumber("INV-001");
    setInvoiceDate("");
    setDueDate("");
    setVatRate(25);
    setCurrency("USD");
    setItems([{ description: "", quantity: 1, price: 0 }]);
  }

  function handleInvoiceDateChange(value: string) {
    setInvoiceDate(value);

    if (dueDate && value && dueDate < value) {
      setDueDate("");
    }
  }

  async function downloadPdf() {
    if (!invoiceRef.current) return;

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imageWidth = pageWidth - 20;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;

    const x = 10;
    const y = 10;

    if (imageHeight > pageHeight - 20) {
      const scaledHeight = pageHeight - 20;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;

      pdf.addImage(
        imageData,
        "PNG",
        (pageWidth - scaledWidth) / 2,
        y,
        scaledWidth,
        scaledHeight
      );
    } else {
      pdf.addImage(imageData, "PNG", x, y, imageWidth, imageHeight);
    }

    pdf.save(`${invoiceNumber || "invoice"}.pdf`);
  }

  return (
    <section className="invoice-page">
      <div className="invoice-header">
        <h1>Free Invoice Generator</h1>
        <p>
          Create a simple invoice online, calculate VAT automatically and save
          your progress in your browser.
        </p>
      </div>

      <div className="invoice-grid">
        <div className="card">
          <h2>Invoice Details</h2>

          <div className="form-grid">
            <input
              placeholder="Your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <input
              placeholder="Company email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />

            <input
              placeholder="Client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />

            <input
              placeholder="Invoice number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />

            <label>
              Invoice date
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => handleInvoiceDateChange(e.target.value)}
              />
            </label>

            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                min={invoiceDate || undefined}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>

            <label>
              VAT / Tax rate %
              <input
                type="number"
                min="0"
                value={vatRate}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setVatRate(Number(e.target.value))}
              />
            </label>

            <label>
              Currency
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </label>
          </div>
        </div>

        <div className="card">
          <h2>Invoice Preview</h2>

          <div className="preview-box" ref={invoiceRef}>
            <div className="preview-top">
              <div className="preview-brand">
                <h3>INVOICE</h3>
                <p className="invoice-number">{invoiceNumber}</p>
              </div>

              <div className="preview-meta">
                <div className="meta-row">
                  <span>Date</span>
                  <strong>{invoiceDate || "Invoice date"}</strong>
                </div>

                <div className="meta-row">
                  <span>Due</span>
                  <strong>{dueDate || "Due date"}</strong>
                </div>
              </div>
            </div>

            <div className="preview-addresses">
              <div className="info-box">
                <strong>From</strong>
                <p>{companyName || "Your company"}</p>
                <p>{companyEmail || "company@email.com"}</p>
              </div>

              <div className="info-box">
                <strong>Bill To</strong>
                <p>{clientName || "Client name"}</p>
              </div>
            </div>

            <div className="invoice-row invoice-row-head">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit price</span>
              <span>Total</span>
            </div>

            {items.map((item, index) => (
              <div key={index} className="invoice-row">
                <span>{item.description || "Item description"}</span>
                <span>{item.quantity}</span>
                <span>{formatMoney(item.price)}</span>
                <span>{formatMoney(item.quantity * item.price)}</span>
              </div>
            ))}

            <div className="totals-box">
              <p>
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </p>

              <p>
                <span>VAT</span>
                <strong>{formatMoney(vatAmount)}</strong>
              </p>

              <h3>
                <span>Total</span>
                <strong>{formatMoney(total)}</strong>
              </h3>
            </div>
          </div>

          <div className="preview-actions">
            <button
              type="button"
              className="download-btn"
              onClick={downloadPdf}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="card items-card">
        <h2>Invoice Items</h2>

        <div className="item-helper-text">
          <strong>Tip:</strong> Enter the item or service, quantity, and the
          amount in the <strong>Unit price</strong> field.
        </div>

        <div className="item-label-row">
          <span>Description</span>
          <span>Quantity</span>
          <span>Unit price</span>
          <span></span>
        </div>

        {items.map((item, index) => (
          <div key={index} className="item-input-row">
            <input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
            />

            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={item.quantity === 0 ? "" : item.quantity}
              onFocus={(e) => e.target.select()}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit price"
              value={item.price === 0 ? "" : item.price}
              onFocus={(e) => e.target.select()}
              onChange={(e) => updateItem(index, "price", e.target.value)}
            />

            <button
              type="button"
              className="danger-btn"
              onClick={() => removeItem(index)}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="button-row">
          <button type="button" onClick={addItem}>
            Add item
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={clearInvoice}
          >
            Clear invoice
          </button>
        </div>
      </div>

      <div className="seo-section">
        <h2>Free Online Invoice Generator</h2>

        <p>
          This free invoice generator helps freelancers, small businesses and
          service providers create simple invoices directly in the browser. You
          can add your company details, client information, invoice number,
          dates, line items, quantity, unit price, VAT and currency.
        </p>

        <h3>Create invoices in USD or EUR</h3>

        <p>
          The tool supports USD and EUR, making it useful for international
          invoices, freelance work, digital services, consulting, online
          projects and small business billing.
        </p>

        <h3>No account required</h3>

        <p>
          You do not need to create an account to use this invoice maker. Your
          invoice data is saved locally in your browser, so you can continue
          editing your invoice without sending your information to a server.
        </p>

        <h3>Who can use this invoice generator?</h3>

        <p>
          This online invoice tool is useful for freelancers, consultants,
          designers, developers, creators, contractors and small business owners
          who need a fast and simple way to create invoices.
        </p>
      </div>
    </section>
  );
}