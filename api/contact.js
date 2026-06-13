// api/contact.js — ABC FC Contact Form Handler
// Uses Resend (https://resend.com) via RESEND_API_KEY environment variable
// Set this in: Vercel Dashboard → Project → Settings → Environment Variables

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, interest, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const interestLabel = interest || 'General Enquiry';

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
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#ffffff;font-size:15px;">${name}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#ffffff;font-size:15px;"><a href="mailto:${email}" style="color:#F5A800;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#ffffff;font-size:15px;">${phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Interested In</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#ffffff;font-size:15px;">${interestLabel}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#F5A800;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Message</td>
            <td style="padding:10px 0;color:#ffffff;font-size:15px;line-height:1.6;">${message.replace(/\n/g, '<br/>')}</td>
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
        from: 'ABC FC Website <onboarding@resend.dev>',
        to: ['sikhitha.r@gmail.com'],
        reply_to: email,
        subject: `New Enquiry: ${interestLabel} — ${name}`,
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
