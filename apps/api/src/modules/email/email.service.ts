import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.MAIL,
          pass: env.PASSWORD.replace(/\s+/g, ''),
        },
      });
    }
    return this.transporter;
  }

  /**
   * Envoie le code de vérification à 6 chiffres par email
   */
  static async sendVerificationCode(to: string, code: string, firstName = 'Étudiant'): Promise<boolean> {
    const appMail = env.MAIL;

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification YouColiva</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; margin: 0; padding: 24px; color: #111827;">
  <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #2563EB; padding: 28px 24px; text-align: center;">
      <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">YouColiva</h1>
      <p style="color: #DBEAFE; margin: 6px 0 0 0; font-size: 13px;">Plateforme de Colocation & Logement Étudiant YouCode</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0; color: #111827;">
        Bonjour ${firstName},
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin: 0 0 20px 0;">
        Merci d'avoir rejoint la communauté YouColiva ! Pour sécuriser votre compte et finaliser votre inscription, veuillez renseigner le code de vérification suivant :
      </p>

      <!-- Code Box -->
      <div style="background: #EFF6FF; border: 2px dashed #93C5FD; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1D4ED8;">
          ${code}
        </span>
      </div>

      <p style="font-size: 12px; color: #6B7280; text-align: center; margin: 0 0 24px 0;">
         Ce code est valable pendant <strong>15 minutes</strong>.
      </p>

      

      <p style="font-size: 13px; line-height: 1.5; color: #6B7280; margin: 24px 0 0 0;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 16px 24px; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
        © ${new Date().getFullYear()} YouColiva • Tous droits réservés. YouCode Maroc (Youssoufia, Safi, Nador).
      </p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      console.log(`[EMAIL] 📨 Envoi du code de vérification (${code}) vers ${to}...`);

      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: `"YouColiva" <${appMail}>`,
        to,
        subject: `[YouColiva] ${code} est votre code de vérification`,
        text: `Bonjour ${firstName},\n\nVotre code de vérification YouColiva est : ${code}\nCe code expire dans 15 minutes.\n\nSi vous ne trouvez pas cet email, pensez à vérifier vos spams.\n\nL'équipe YouColiva`,
        html: htmlContent,
      });

      console.log(`[EMAIL] ✅ Email de vérification envoyé avec succès à ${to}`);
      return true;
    } catch (error) {
      console.error(`[EMAIL] ❌ Erreur lors de l'envoi de l'email à ${to}:`, error);
      // We do not rethrow to avoid breaking registration if SMTP has transient issues; code is also logged
      return false;
    }
  }
}
