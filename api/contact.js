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

  const submittedAt = new Date().toLocaleString('en-ZA', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg',
  });
  const replyMailtoLink = `mailto:${email}`;
  const replyTelLink = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';

  const callButton = replyTelLink
    ? `<td width="50%" align="center" style="padding-left:6px;">
         <a href="${replyTelLink}" style="display:block; background-color:#111111; color:#F5A800; font-size:13px; font-weight:bold; text-decoration:none; padding:13px 0; border-radius:6px; font-family:Arial, Helvetica, sans-serif;">📞 Call ${safeName}</a>
       </td>`
    : '';

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Website Enquiry — ABC FC</title>
</head>
<body style="margin:0; padding:0; background-color:#EFEAE0; font-family:Arial, Helvetica, sans-serif;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    New enquiry from ${safeName} via abcfc.co.za — ${interestLabel}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EFEAE0;">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:10px; overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#111111; padding:24px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="56" valign="middle">
                    <img src="https://abcfc.co.za/images/abc-fc-logo.jpeg" width="48" height="48" alt="ABC FC crest" style="display:block; border-radius:50%; border:2px solid #F5A800;">
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <span style="color:#F5A800; font-size:13px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; font-family:Arial, Helvetica, sans-serif;">ABC FC Foundation</span><br>
                    <span style="color:#9A9A9A; font-size:11px; font-family:Arial, Helvetica, sans-serif;">Website Enquiry Notification</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="background-color:#F5A800; padding:4px 0;"></td></tr>

          <!-- ALERT BANNER -->
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0 0 6px 0; color:#F5A800; font-size:13px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; font-family:Arial, Helvetica, sans-serif;">📩 New Website Enquiry</p>
              <h1 style="margin:0 0 6px 0; color:#111111; font-size:22px; font-family:Arial, Helvetica, sans-serif;">${safeName} reached out via abcfc.co.za</h1>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                <tr>
                  <td style="background-color:#111111; color:#F5A800; font-size:11px; font-weight:bold; padding:5px 12px; border-radius:14px; font-family:Arial, Helvetica, sans-serif;">${interestLabel}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTACT DETAILS CARD -->
          <tr>
            <td style="padding:20px 28px 0 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF8E7; border-radius:8px;">
                <tr>
                  <td style="padding:16px 18px; border-bottom:1px solid #F0E2BF;">
                    <span style="display:block; color:#9A8159; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; font-family:Arial, Helvetica, sans-serif;">Full Name</span>
                    <span style="display:block; color:#111111; font-size:14px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${safeName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px; border-bottom:1px solid #F0E2BF;">
                    <span style="display:block; color:#9A8159; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; font-family:Arial, Helvetica, sans-serif;">Phone Number</span>
                    <span style="display:block; color:#111111; font-size:14px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">📞 ${safePhone}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;">
                    <span style="display:block; color:#9A8159; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; font-family:Arial, Helvetica, sans-serif;">Email Address</span>
                    <span style="display:block; color:#111111; font-size:14px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">✉️ ${safeEmail}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MESSAGE -->
          <tr>
            <td style="padding:24px 28px 0 28px;">
              <h2 style="margin:0 0 10px 0; color:#111111; font-size:15px; font-family:Arial, Helvetica, sans-serif; text-transform:uppercase; letter-spacing:0.5px;">Message</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAFA; border-left:4px solid #F5A800; border-radius:4px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0; color:#333333; font-size:13px; line-height:1.7; font-family:Arial, Helvetica, sans-serif;">${safeMessage}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0 0; color:#999999; font-size:11px; font-family:Arial, Helvetica, sans-serif;">Submitted ${submittedAt}</p>
            </td>
          </tr>

          <!-- ACTION BUTTONS -->
          <tr>
            <td style="padding:24px 28px 0 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="${callButton ? '50%' : '100%'}" align="center" style="padding-right:${callButton ? '6px' : '0'};">
                    <a href="${replyMailtoLink}" style="display:block; background-color:#F5A800; color:#111111; font-size:13px; font-weight:bold; text-decoration:none; padding:13px 0; border-radius:6px; font-family:Arial, Helvetica, sans-serif;">✉️ Reply by Email</a>
                  </td>
                  ${callButton}
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 28px 24px 28px;" align="center">
              <p style="margin:0 0 4px 0; color:#999999; font-size:11px; font-family:Arial, Helvetica, sans-serif;">This message was submitted via the contact form on <a href="https://abcfc.co.za" style="color:#9A8159; text-decoration:none;">abcfc.co.za</a></p>
              <p style="margin:0; color:#BBBBBB; font-size:10px; font-family:Arial, Helvetica, sans-serif;">ABC FC Foundation · Thohoyandou, Limpopo · #LionOfTheNorth</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
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
