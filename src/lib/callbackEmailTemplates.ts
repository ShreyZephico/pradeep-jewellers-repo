const GOLD = "#A67C37";
const DARK = "#2D2926";
const CREAM = "#F9F7F2";
const MUTED = "#5c534c";
const BORDER = "#E5E0D8";

export type CallbackLeadEmailData = {
  name: string;
  email: string;
  phone: string;
  preferredTime: string;
  message: string;
  brandName: string;
  brandTagline: string;
  brandDescription: string;
  contactPhone: string;
  contactEmail: string;
  siteUrl?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(
  preheader: string,
  headline: string,
  body: string,
  footerNote?: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background-color:#EBE6DE;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#EBE6DE;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(45,41,38,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,${GOLD} 0%,#8f6830 100%);padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:600;">Pradeep Jewellers</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#ffffff;line-height:1.3;">${escapeHtml(headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${body}</td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;border-top:1px solid ${BORDER};">
              <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
                ${footerNote ?? "Custom Gold · Diamond · Silver — Nadiad"}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${GOLD};">${escapeHtml(label)}</p>
        <p style="margin:0;font-size:15px;color:${DARK};line-height:1.5;">${escapeHtml(value)}</p>
      </td>
    </tr>`;
}

export function ownerLeadEmail(data: CallbackLeadEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New call-back — ${data.name}`;
  const messageDisplay =
    data.message && data.message !== "—" ? data.message : "No message provided";

  const body = `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${MUTED};">
      A visitor submitted the call-back form on your website. Details below:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${CREAM};border-radius:8px;padding:4px 20px;margin-bottom:24px;">
      ${detailRow("Name", data.name)}
      ${detailRow("Email", data.email)}
      ${detailRow("Phone", data.phone)}
      ${detailRow("Preferred time", data.preferredTime)}
      ${detailRow("Message / description", messageDisplay)}
    </table>
    <p style="margin:0;font-size:13px;color:${MUTED};">
      Reply directly to <a href="mailto:${escapeHtml(data.email)}" style="color:${GOLD};text-decoration:none;font-weight:600;">${escapeHtml(data.email)}</a>
      or call <strong style="color:${DARK};">${escapeHtml(data.phone)}</strong>.
    </p>`;

  const text = [
    `New call-back request — ${data.brandName}`,
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Preferred time: ${data.preferredTime}`,
    `Message: ${messageDisplay}`,
  ].join("\n");

  return {
    subject,
    html: layout(
      `New lead from ${data.name}`,
      "New call-back request",
      body,
      `${data.brandName} · ${data.contactPhone}`
    ),
    text,
  };
}

export function userConfirmationEmail(data: CallbackLeadEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Thank you — we received your call-back request | ${data.brandName}`;
  const messageDisplay =
    data.message && data.message !== "—" ? data.message : "Not provided";

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:${DARK};">Dear <strong>${escapeHtml(data.name)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${MUTED};">
      Thank you for reaching out to <strong style="color:${DARK};">${escapeHtml(data.brandName)}</strong>.
      We have received your call-back request and truly appreciate your interest in our gold, diamond, and bespoke jewellery.
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:${MUTED};">
      <em>${escapeHtml(data.brandTagline)}</em> — ${escapeHtml(data.brandDescription)}
    </p>
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${GOLD};">Your request summary</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${CREAM};border-radius:8px;padding:4px 20px;margin-bottom:24px;">
      ${detailRow("Preferred call time", data.preferredTime)}
      ${detailRow("Phone number", data.phone)}
      ${detailRow("Email", data.email)}
      ${detailRow("Your message", messageDisplay)}
    </table>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${MUTED};">
      Our jewellery experts will connect with you at your preferred time. Your request is already with our team — no login required.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding:20px;background:linear-gradient(180deg,${CREAM} 0%,#fff 100%);border-radius:8px;border:1px solid ${BORDER};">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${GOLD};font-weight:700;">Need us sooner?</p>
          <p style="margin:0;font-size:15px;color:${DARK};">
            Call <a href="tel:${escapeHtml(data.contactPhone.replace(/\s/g, ""))}" style="color:${GOLD};text-decoration:none;font-weight:600;">${escapeHtml(data.contactPhone)}</a>
            or email <a href="mailto:${escapeHtml(data.contactEmail)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(data.contactEmail)}</a>
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:15px;line-height:1.65;color:${MUTED};">
      With warm gratitude,<br/>
      <strong style="color:${DARK};font-family:Georgia,serif;">The ${escapeHtml(data.brandName)} Team</strong>
    </p>`;

  const text = [
    `Dear ${data.name},`,
    "",
    `Thank you for contacting ${data.brandName}.`,
    data.brandDescription,
    "",
    "Your request summary:",
    `Preferred time: ${data.preferredTime}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Message: ${messageDisplay}`,
    "",
    "Our team will connect with you at your preferred time.",
    "",
    `Call us: ${data.contactPhone}`,
    `Email: ${data.contactEmail}`,
    "",
    `With gratitude,`,
    `The ${data.brandName} Team`,
  ].join("\n");

  return {
    subject,
    html: layout(
      `We received your request, ${data.name}`,
      "Thank you",
      body,
      `${data.brandTagline} · ${data.contactPhone}`
    ),
    text,
  };
}
