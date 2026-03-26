import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = 'Lama Linked.In <noreply@lamalinked.in>';

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
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
  const downloadUrl = `${process.env.FRONTEND_URL || 'https://lamalinked.in'}/ebook/download`;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Votre ebook Linked.In est prêt !',
    html: `
      <div style="font-family: 'Montserrat', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0A66C2; font-size: 24px; margin: 0;">Lama Linked.In</h1>
        </div>
        <h2 style="color: #0B1220;">Bonjour ${firstName} !</h2>
        <p style="color: #374151; line-height: 1.6;">
          Merci pour votre intérêt ! Votre ebook sur les meilleures stratégies LinkedIn est prêt à être téléchargé.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${downloadUrl}" style="background: linear-gradient(135deg, #0A66C2, #004182); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
            Télécharger l'ebook
          </a>
        </div>
        <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #0B1220; margin-top: 0;">Ce que vous allez découvrir :</h3>
          <ul style="color: #374151; line-height: 1.8;">
            <li>Les secrets d'un profil LinkedIn optimisé</li>
            <li>Comment créer du contenu qui engage</li>
            <li>Stratégies d'automatisation intelligente</li>
            <li>Développer votre réseau efficacement</li>
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

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://lamalinked.in'}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: FROM,
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
