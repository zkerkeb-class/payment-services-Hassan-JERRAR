import * as SibApiV3Sdk from "@getbrevo/brevo";
import { IncomingMessage } from "http";
import logger from "../utils/logger";

class EmailService {
    private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

    constructor() {
        logger.info("Initialisation du service email");
        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            logger.error(
                "BREVO_API_KEY manquante dans les variables d'environnement"
            );
            throw new Error(
                "BREVO_API_KEY is not defined in environment variables"
            );
        }

        this.apiInstance.setApiKey(
            SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
            apiKey
        );
        logger.info("Service email initialisé avec succès");
    }

    async sendEmail(
        to: string[],
        subject: string,
        htmlContent: string,
        sender: { name: string; email: string } = {
            name: "ZenBilling Payments",
            email: "payments@zenbilling.com",
        }
    ): Promise<{
        response: IncomingMessage;
        body: SibApiV3Sdk.CreateSmtpEmail;
    }> {
        logger.info({ to, subject }, "Envoi d'email de paiement");
        try {
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = htmlContent;
            sendSmtpEmail.sender = sender;
            sendSmtpEmail.to = to.map((email) => ({ email }));

            const result = await this.apiInstance.sendTransacEmail(
                sendSmtpEmail
            );
            logger.info(
                { to, subject },
                "Email de paiement envoyé avec succès"
            );
            return result;
        } catch (error) {
            logger.error(
                { error, to, subject },
                "Erreur lors de l'envoi de l'email de paiement"
            );
            throw new Error("Failed to send payment email");
        }
    }

    async sendPaymentNotification(
        to: string,
        paymentAmount: number,
        invoiceNumber: string,
        companyName: string
    ): Promise<void> {
        const htmlContent = `
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: #28a745; margin-bottom: 20px;">✅ Paiement confirmé</h1>
                    
                    <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #333; margin-top: 0;">Détails du paiement</h2>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>Facture n°:</strong> ${invoiceNumber}</p>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>Montant:</strong> ${(
                            paymentAmount / 100
                        ).toFixed(2)} €</p>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>Société:</strong> ${companyName}</p>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString(
                            "fr-FR"
                        )}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        Votre paiement a été traité avec succès. Vous recevrez un reçu par email séparément.
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Merci de votre confiance.<br/>
                        L'équipe ZenBilling
                    </p>
                </div>
            </body>
        </html>
        `;

        await this.sendEmail(
            [to],
            `Confirmation de paiement - Facture ${invoiceNumber}`,
            htmlContent
        );
    }

    async sendPaymentFailureNotification(
        to: string,
        invoiceNumber: string,
        companyName: string,
        errorMessage?: string
    ): Promise<void> {
        const htmlContent = `
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: #dc3545; margin-bottom: 20px;">❌ Échec du paiement</h1>
                    
                    <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #333; margin-top: 0;">Détails de la tentative</h2>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>Facture n°:</strong> ${invoiceNumber}</p>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>Société:</strong> ${companyName}</p>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString(
                            "fr-FR"
                        )}</p>
                        ${
                            errorMessage
                                ? `<p style="font-size: 14px; color: #dc3545; margin: 15px 0;"><strong>Erreur:</strong> ${errorMessage}</p>`
                                : ""
                        }
                    </div>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="color: #856404; margin: 0; font-size: 14px;">
                            <strong>Que faire maintenant ?</strong><br/>
                            Veuillez vérifier vos informations de paiement et réessayer, ou contactez votre banque si le problème persiste.
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Si vous avez des questions, n'hésitez pas à nous contacter.<br/>
                        L'équipe ZenBilling
                    </p>
                </div>
            </body>
        </html>
        `;

        await this.sendEmail(
            [to],
            `Échec du paiement - Facture ${invoiceNumber}`,
            htmlContent
        );
    }
}

export default new EmailService();
