# Business checkout, live proof (22 Oct 2026)

Request: Shayna (support@ravenallinstitute.com), 22 Oct 2026: a business checkout where buyers enter company details, including their VAT number. Built in 1b0b7d4, deployed with run 39746053416 (web medusa, box on d17fe3a which contains it).

Box: review VPS 169.239.180.49. Buyer: johan@aiautomations.co.za (test persona). Voucher: QA-SELFTEST-100 (R0 orders, /api/checkout/free). Product: Rapid Repatterning Session, 90 min online.

| Check | Order | Result | Evidence |
|---|---|---|---|
| Toggle off by default, fields appear when ticked | - | PASS | browser/business-checkout-fields.jpg |
| SA VAT format checked when filled (123456 refused) | - | PASS | browser/business-checkout-vat-error.jpg |
| Payment step repeats company and VAT | #425 | PASS | browser/business-checkout-425-payment.jpg |
| Order placed (voucher, R0) | #425 | PASS | browser/business-checkout-425-confirmed.jpg |
| Order mail: "Billed To QA Business Test (Pty) Ltd, VAT No: 4123456789" | #425 | PASS | inbox, 08:28:21Z, invoice-425.pdf attached |
| Invoice SR-00425 Bill To: company, VAT No, Reg No, company address, then "Attention: Johan QA Test" | #425 | PASS | invoice-425.pdf read in the inbox |
| Vtiger Event 18x659 description ends "Company: QA Business Test (Pty) Ltd, VAT 4123456789, Reg 2020/123456/07" | #425 | PASS | read back from suzanne.aimate.co.za |
| Personal checkout unchanged: no company in the summary, mail, invoice (SR-00426 Bill To = Johan QA Test) or Vtiger Event 18x660 | #426 | PASS | browser/business-checkout-426-personal-payment.jpg, inbox 08:29:23Z |

Cleanup: #425 (order_01M5HBK59DSZS9NGZ0XJ4T5EQP) and #426 (order_01M5HBN3DTS7N1N63VVTCPNDJP) cancelled 22 Oct via the admin API by exact id after reading back number and email; both read back canceled.

Not covered: a paid PayFast or PayPal order with the toggle on. The details travel on the cart (billing address company and metadata), which completeCart copies to the order the same way on all three paths, and the payment routes only read the cart.
