// Vercel Serverless Function — /api/orders
// Accepts POST: new order placement
// Stores order to Vercel KV (if available) and sends email invoice
// Falls back gracefully if KV / email not configured

const crypto = require('crypto');

// ── PDF Invoice Generation (inline, no external deps) ─────
function generateInvoiceHTML(order) {
  const itemsRows = order.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;font-family:sans-serif;font-size:13px;color:#f0f0f0;">${item.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;text-align:center;font-family:sans-serif;font-size:13px;color:#999;">${item.size}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;text-align:center;font-family:sans-serif;font-size:13px;color:#999;">${item.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;text-align:right;font-family:sans-serif;font-size:13px;color:#F5A800;font-weight:bold;">R ${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('');

  const subtotal = order.subtotal || order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = order.delivery !== undefined ? order.delivery : 99;
  const total    = order.total    || (subtotal + delivery);
  const addr     = order.address  || {};

  const paymentLabel = {
    eft:  'EFT / Bank Transfer',
    card: 'Credit / Debit Card',
    cash: 'Cash on Delivery',
  }[order.payment] || order.payment || 'EFT';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Invoice ${order.orderNum} - ABC FC Store</title>
</head>
<body style="background:#0d0d0d;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#141414;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
    <!-- Header -->
    <tr>
      <td style="background:#0d0d0d;padding:28px 28px 20px;border-bottom:3px solid #F5A800;text-align:center;">
        <p style="font-size:30px;font-weight:900;letter-spacing:0.06em;color:#F5A800;margin:0 0 4px;text-transform:uppercase;">ABC FC</p>
        <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#999;margin:0;text-transform:uppercase;">Official Store · Lion of the North</p>
      </td>
    </tr>
    <!-- Invoice Title -->
    <tr>
      <td style="padding:24px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="font-size:22px;font-weight:900;letter-spacing:0.04em;color:#f0f0f0;margin:0;text-transform:uppercase;">Order Invoice</p>
              <p style="font-size:13px;color:#999;margin:4px 0 0;">${new Date(order.createdAt || Date.now()).toLocaleDateString('en-ZA', { day:'2-digit', month:'long', year:'numeric' })}</p>
            </td>
            <td style="text-align:right;">
              <p style="font-size:13px;font-weight:700;letter-spacing:0.06em;color:#F5A800;margin:0;text-transform:uppercase;">Order Number</p>
              <p style="font-size:18px;font-weight:900;color:#f0f0f0;margin:4px 0 0;">${order.orderNum}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Customer / Address -->
    <tr>
      <td style="padding:20px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:50%;vertical-align:top;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#F5A800;margin:0 0 8px;text-transform:uppercase;">Billed To</p>
              <p style="font-size:14px;color:#f0f0f0;margin:0 0 4px;font-weight:700;">${order.name}</p>
              <p style="font-size:13px;color:#999;margin:0 0 2px;">${order.email}</p>
              <p style="font-size:13px;color:#999;margin:0;">${order.phone || ''}</p>
            </td>
            <td style="width:50%;vertical-align:top;padding-left:16px;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#F5A800;margin:0 0 8px;text-transform:uppercase;">Ship To</p>
              <p style="font-size:13px;color:#999;margin:0;line-height:1.7;">
                ${addr.line1 || ''}${addr.line2 ? '<br/>' + addr.line2 : ''}<br/>
                ${addr.city || ''}, ${addr.postal || ''}<br/>
                ${addr.province || ''}, South Africa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Items Table -->
    <tr>
      <td style="padding:20px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#1a1a1a;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#F5A800;text-transform:uppercase;">Product</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#F5A800;text-transform:uppercase;">Size</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#F5A800;text-transform:uppercase;">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#F5A800;text-transform:uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </td>
    </tr>
    <!-- Totals -->
    <tr>
      <td style="padding:16px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Subtotal</td>
            <td style="padding:6px 0;font-size:13px;color:#999;text-align:right;">R ${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Delivery</td>
            <td style="padding:6px 0;font-size:13px;color:#999;text-align:right;">${delivery === 0 ? 'FREE' : 'R ' + delivery.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="border-top:1px solid #2a2a2a;padding-top:10px;"></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:16px;font-weight:900;color:#f0f0f0;text-transform:uppercase;letter-spacing:0.04em;">Total</td>
            <td style="padding:6px 0;font-size:20px;font-weight:900;color:#F5A800;text-align:right;">R ${total.toFixed(2)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Payment Method -->
    <tr>
      <td style="padding:16px 28px 0;">
        <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:14px 16px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;color:#F5A800;margin:0 0 6px;text-transform:uppercase;">Payment Method</p>
          <p style="font-size:14px;color:#f0f0f0;margin:0;">${paymentLabel}</p>
          ${order.payment === 'eft' ? `
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid #2a2a2a;">
            <p style="font-size:12px;color:#999;margin:0 0 4px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Banking Details</p>
            <p style="font-size:13px;color:#ccc;margin:0;line-height:1.8;">
              Account Name: ABC FC Foundation<br/>
              Bank: To be confirmed by return email<br/>
              Reference: <strong style="color:#F5A800;">${order.orderNum}</strong>
            </p>
          </div>` : ''}
        </div>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:24px 28px;text-align:center;border-top:1px solid #2a2a2a;margin-top:20px;">
        <p style="font-size:12px;color:#555;margin:0 0 6px;">Thank you for supporting ABC FC — Lion of the North!</p>
        <p style="font-size:11px;color:#444;margin:0;">Questions? Contact us at tshibalo.lucas@gmail.com or +27 71 109 2360</p>
        <p style="font-size:11px;color:#444;margin:6px 0 0;">ABC FC Foundation · Thohoyandou, Limpopo, South Africa</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const order = req.body;

      if (!order || !order.orderNum || !order.email) {
        return res.status(400).json({ error: 'Invalid order data' });
      }

      // 1. Save to Vercel KV if available
      let kvSaved = false;
      try {
        const { kv } = require('@vercel/kv');
        await kv.set(`order:${order.orderNum}`, JSON.stringify(order), { ex: 60 * 60 * 24 * 90 }); // 90 days
        kvSaved = true;
      } catch (e) {
        console.warn('[orders] KV not available:', e.message);
      }

      // 2. Generate invoice HTML
      const invoiceHTML = generateInvoiceHTML(order);

      // 3. Send invoice email (Resend / Nodemailer)
      let emailSent = false;
      const RESEND_KEY = process.env.RESEND_API_KEY;
      if (RESEND_KEY) {
        try {
          const https = require('https');
          const emailPayload = JSON.stringify({
            from: 'ABC FC Store <store@abcfc.store>',
            to: [order.email],
            bcc: ['tshibalo.lucas@gmail.com'],
            subject: `Your ABC FC Order Invoice — ${order.orderNum}`,
            html: invoiceHTML,
          });
          await new Promise((resolve, reject) => {
            const req2 = https.request({
              hostname: 'api.resend.com',
              path: '/emails',
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(emailPayload),
              },
            }, (res2) => {
              let data = '';
              res2.on('data', c => data += c);
              res2.on('end', () => {
                if (res2.statusCode >= 200 && res2.statusCode < 300) resolve(data);
                else reject(new Error(`Resend ${res2.statusCode}: ${data}`));
              });
            });
            req2.on('error', reject);
            req2.write(emailPayload);
            req2.end();
          });
          emailSent = true;
        } catch (e) {
          console.error('[orders] Email error:', e.message);
        }
      }

      return res.status(200).json({
        success: true,
        orderNum: order.orderNum,
        kvSaved,
        emailSent,
        message: emailSent
          ? 'Order saved and invoice emailed.'
          : 'Order saved. Invoice email requires RESEND_API_KEY configuration.',
      });

    } catch (err) {
      console.error('[orders] Handler error:', err.message);
      return res.status(500).json({ error: 'Failed to process order', detail: err.message });
    }
  }

  // GET — retrieve order by number
  if (req.method === 'GET') {
    const orderNum = req.query.orderNum;
    if (!orderNum) return res.status(400).json({ error: 'orderNum query param required' });
    try {
      const { kv } = require('@vercel/kv');
      const raw = await kv.get(`order:${orderNum}`);
      if (!raw) return res.status(404).json({ error: 'Order not found' });
      return res.status(200).json(JSON.parse(raw));
    } catch (e) {
      return res.status(503).json({ error: 'KV not available', detail: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
