import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = 'Lama Linked.In <noreply@lamalinked.in>';
const REPLY_TO = 'heycestlelama@gmail.com';

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to,
    subject: 'Bienvenue sur Lama Linked.In !',
    html: `
      <div style="font-family: 'Montserrat', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0A66C2; font-size: 24px; margin: 0;">Lama Linked.In</h1>
        </div>
        <h2 style="color: #0B1220;">Bienvenue ${name} !</h2>
        <p style="color: #374151; line-height: 1.6;">
          Merci de rejoindre Lama Linked.In. Votre assistant LinkedIn est prêt à vous aider à développer
          votre réseau professionnel.
        </p>
        <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #0B1220; margin-top: 0;">Pour commencer :</h3>
          <ol style="color: #374151; line-height: 1.8;">
            <li>Installez l'extension Chrome</li>
            <li>Ouvrez votre feed Linked.In</li>
            <li>Choisissez votre mode (Assisté ou Agent)</li>
            <li>Lancez votre première session !</li>
          </ol>
        </div>
        <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 32px;">
          Lama Linked.In — Votre assistant Linked.In intelligent<br>
          <a href="https://lamalinked.in" style="color: #0A66C2;">lamalinked.in</a>
        </p>
      </div>
    `,
  });
}

export async function sendPaymentSuccessEmail(to: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to,
    subject: 'Paiement confirmé — Lama Linked.In Premium',
    html: `
      <div style="font-family: 'Montserrat', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0A66C2; font-size: 24px; margin: 0;">Lama Linked.In</h1>
        </div>
        <h2 style="color: #0B1220;">Paiement confirmé !</h2>
        <p style="color: #374151; line-height: 1.6;">
          Merci ${name} ! Votre abonnement Premium est maintenant actif.
        </p>
        <div style="background: linear-gradient(135deg, #F4B183, #C97C5D); border-radius: 12px; padding: 20px; margin: 24px 0; color: white;">
          <h3 style="margin-top: 0;">Vos avantages Premium :</h3>
          <ul style="line-height: 1.8;">
            <li>Templates illimités</li>
            <li>Statistiques avancées</li>
            <li>Export de données CSV/PDF</li>
            <li>Mode Agent complet</li>
            <li>Support prioritaire</li>
            <li>Sans publicité</li>
          </ul>
        </div>
        <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 32px;">
          Lama Linked.In — Votre assistant Linked.In intelligent<br>
          <a href="https://lamalinked.in" style="color: #0A66C2;">lamalinked.in</a>
        </p>
      </div>
    `,
  });
}

export async function sendEbookEmail(to: string, firstName: string): Promise<void> {
  const logoUrl = 'https://raw.githubusercontent.com/IDONTSHOWSYFER/LamaLinkedIn/main/apps/extension/src/assets/icons/logo.png';

  // Resolve ebook PDF path relative to project root
  const ebookPath = path.resolve(process.cwd(), 'public/ebook/playbook_linkedin.pdf');

  const attachments: nodemailer.SendMailOptions['attachments'] = [];
  if (fs.existsSync(ebookPath)) {
    attachments.push({
      filename: 'Playbook_LinkedIn_LamaLinkedIn.pdf',
      path: ebookPath,
      contentType: 'application/pdf',
    });
  }

  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to,
    subject: 'Votre ebook LinkedIn est prêt ! 📥',
    attachments,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1800AD 0%,#4A20E8 50%,#7C3AED 100%);padding:48px 40px 40px;text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
    <tr><td style="background:rgba(255,255,255,0.15);border-radius:16px;padding:12px;width:64px;height:64px;text-align:center;">
      <img src="${logoUrl}" alt="Lama Linked.In" width="48" height="48" style="display:block;margin:0 auto;">
    </td></tr>
  </table>
  <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px;letter-spacing:-0.5px;">Votre ebook est prêt !</h1>
  <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0;line-height:1.5;">Le guide complet pour dominer LinkedIn</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
  <p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 8px;">
    Bonjour <strong>${firstName}</strong>,
  </p>
  <p style="color:#555770;font-size:15px;line-height:1.7;margin:0 0 32px;">
    Merci pour votre intérêt ! Votre exemplaire du guide <em>"Les stratégies LinkedIn qui font la différence"</em> est en pièce jointe de cet email.
  </p>

  <!-- Info box -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
    <tr><td style="background:#f0edff;border-radius:12px;padding:20px;text-align:center;">
      <p style="color:#1800AD;font-size:14px;font-weight:600;margin:0 0 4px;">📎 Playbook_LinkedIn_LamaLinkedIn.pdf</p>
      <p style="color:#555770;font-size:13px;margin:0;">Retrouvez le PDF en pièce jointe ci-dessous</p>
    </td></tr>
  </table>

  <!-- Divider -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="border-top:1px solid #eeeef2;padding-top:32px;">
      <p style="color:#1a1a2e;font-size:15px;font-weight:600;margin:0 0 16px;">Ce que vous allez découvrir :</p>
    </td></tr>
  </table>

  <!-- Features -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:12px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:36px;vertical-align:top;"><div style="width:28px;height:28px;background:#EEE8FF;border-radius:8px;text-align:center;line-height:28px;font-size:14px;">🎯</div></td>
        <td style="padding-left:12px;vertical-align:middle;">
          <p style="color:#1a1a2e;font-size:14px;font-weight:500;margin:0;">Profil LinkedIn optimisé</p>
          <p style="color:#888;font-size:13px;margin:2px 0 0;">Les éléments clés qui attirent les recruteurs</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:12px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:36px;vertical-align:top;"><div style="width:28px;height:28px;background:#E0F7FF;border-radius:8px;text-align:center;line-height:28px;font-size:14px;">✍️</div></td>
        <td style="padding-left:12px;vertical-align:middle;">
          <p style="color:#1a1a2e;font-size:14px;font-weight:500;margin:0;">Contenu qui engage</p>
          <p style="color:#888;font-size:13px;margin:2px 0 0;">Comment créer des posts à fort impact</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:12px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:36px;vertical-align:top;"><div style="width:28px;height:28px;background:#E8FFE8;border-radius:8px;text-align:center;line-height:28px;font-size:14px;">🤖</div></td>
        <td style="padding-left:12px;vertical-align:middle;">
          <p style="color:#1a1a2e;font-size:14px;font-weight:500;margin:0;">Automatisation intelligente</p>
          <p style="color:#888;font-size:13px;margin:2px 0 0;">Gagnez du temps sans risquer votre compte</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:12px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:36px;vertical-align:top;"><div style="width:28px;height:28px;background:#FFF3E0;border-radius:8px;text-align:center;line-height:28px;font-size:14px;">🚀</div></td>
        <td style="padding-left:12px;vertical-align:middle;">
          <p style="color:#1a1a2e;font-size:14px;font-weight:500;margin:0;">Réseau qui convertit</p>
          <p style="color:#888;font-size:13px;margin:2px 0 0;">Développer des connexions de qualité</p>
        </td>
      </tr></table>
    </td></tr>
  </table>

  <!-- Upsell -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
    <tr><td style="background:linear-gradient(135deg,#f8f6ff,#f0edff);border-radius:12px;padding:24px;text-align:center;">
      <p style="color:#1800AD;font-size:14px;font-weight:600;margin:0 0 4px;">Envie d'aller plus loin ?</p>
      <p style="color:#555770;font-size:13px;margin:0 0 16px;">Découvrez Lama Linked.In Premium pour automatiser votre croissance.</p>
      <a href="https://www.lamalinked.in/#pricing" target="_blank" style="display:inline-block;padding:10px 28px;background:#ffffff;color:#1800AD;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;border:1px solid #d4c8ff;">
        Voir les offres →
      </a>
    </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="background:#fafafc;padding:28px 40px;border-top:1px solid #eeeef2;text-align:center;">
  <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px;">Lama Linked.In — Votre assistant LinkedIn intelligent</p>
  <p style="margin:8px 0 0;"><a href="https://www.lamalinked.in" style="color:#1800AD;font-size:12px;text-decoration:none;font-weight:500;">lamalinked.in</a></p>
  <p style="color:#c4c4cc;font-size:11px;margin:16px 0 0;">Vous recevez cet email car vous avez demandé notre ebook gratuit.</p>
</td></tr>

</table>
</td></tr></table>
</body></html>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://lamalinked.in'}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to,
    subject: 'Réinitialisation de mot de passe — Lama Linked.In',
    html: `
      <div style="font-family: 'Montserrat', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0A66C2; font-size: 24px; margin: 0;">Lama Linked.In</h1>
        </div>
        <h2 style="color: #0B1220;">Réinitialiser votre mot de passe</h2>
        <p style="color: #374151; line-height: 1.6;">
          Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe. Ce lien expire dans 1 heure.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #0A66C2; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Réinitialiser le mot de passe
          </a>
        </div>
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      </div>
    `,
  });
}
