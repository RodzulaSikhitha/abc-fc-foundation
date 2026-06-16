// api/contact.js — ABC FC Contact Form Handler
// Uses Resend (https://resend.com) via RESEND_API_KEY environment variable
// Set this in: Vercel Dashboard → Project → Settings → Environment Variables

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const { name, phone, email, interest, message, hp_field } = body;

  // Honeypot: real users never fill this hidden field. Pretend success for bots.
  if (hp_field) {
    return res.status(200).json({ success: true });
  }

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  // Reject oversized / malformed input
  const within = (v, max) => typeof v === 'string' && v.length <= max;
  if (!within(name, 200) || !within(email, 200) || !within(message, 5000) ||
      (phone && !within(phone, 40)) || (interest && !within(interest, 100))) {
    return res.status(400).json({ error: 'Invalid input.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  // Escape user input before embedding in the email HTML to prevent
  // HTML/link injection in the recipient's mail client.
  const esc = (v) =>
    String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safeName     = esc(name);
  const safeEmail    = esc(email);
  const safePhone    = phone ? esc(phone) : 'Not provided';
  const safeMessage  = esc(message).replace(/\n/g, '<br/>');
  const interestLabel = interest ? esc(interest) : 'General Enquiry';

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:#F5A800;padding:24px 32px;">
        <h1 style="margin:0;font-size:22px;color:#0d0d0d;font-weight:900;letter-spacing:1px;">NEW ENQUIRY — ABC FC WEBSITE</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#0d0d0d;opacity:.75;">Submitted via abcfc.co.za</p>
      </div>
      <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:140px;">Full Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#ffffff;font-size:15px;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#ffffff;font-size:15px;"><a href="mailto:${safeEmail}" style="color:#F5A800;">${safeEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#ffffff;font-size:15px;">${safePhone}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Interested In</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#ffffff;font-size:15px;">${interestLabel}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Message</td>
            <td style="padding:10px 0;color:#ffffff;font-size:15px;line-height:1.6;">${safeMessage}</td>
          </tr>
        </table>
      </div>
      <div style="background:#111111;padding:16px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);">ABC FC — Lion of the North · abcfc.co.za</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ['tshibalo.lucas@gmail.com', 'sikhitha.r@gmail.com'],
        reply_to: email,
        subject: `New Enquiry: ${interestLabel} — ${safeName}`,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact API error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
