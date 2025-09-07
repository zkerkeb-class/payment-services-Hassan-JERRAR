import { Request, Response } from "express";
import Stripe from "stripe";
import stripe from "../lib/stripe";
import prisma from "../lib/prisma";
import emailService from "../services/email.service";
import logger from "../utils/logger";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
    throw new Error(
        "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be defined in environment"
    );
}

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
        return res
            .status(400)
            .json({ success: false, message: "Signature Stripe manquante" });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        logger.error(`Erreur de signature webhook: ${err.message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de signature webhook: ${err.message}`,
        });
    }

    // Traiter les événements
    try {
        switch (event.type) {
            case "account.updated": {
                const account = event.data.object as Stripe.Account;
                await handleAccountUpdated(account);
                break;
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentIntentSucceeded(paymentIntent);
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentIntentFailed(paymentIntent);
                break;
            }

            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionCompleted(session);
                break;
            }

            default:
                logger.info(`Événement non géré: ${event.type}`);
        }

        return res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error(`Erreur lors du traitement du webhook: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Erreur lors du traitement du webhook",
        });
    }
};

/**
 * Gère la mise à jour d'un compte Stripe Connect
 */
async function handleAccountUpdated(account: Stripe.Account) {
    try {
        logger.info({ accountId: account.id }, "Traitement account.updated");

        // Trouver l'utilisateur correspondant
        const user = await prisma.user.findFirst({
            where: { stripe_account_id: account.id },
        });

        if (!user) {
            logger.warn(
                { accountId: account.id },
                "Aucun utilisateur trouvé pour ce compte Stripe"
            );
            return;
        }

        // Vérifier si le compte est maintenant onboardé
        const isOnboarded =
            account.charges_enabled &&
            account.payouts_enabled &&
            account.details_submitted;

        if (isOnboarded && !user.stripe_onboarded) {
            // Mettre à jour le statut d'onboarding
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    stripe_onboarded: true,
                    onboarding_step: "FINISH",
                    onboarding_completed: true,
                },
            });

            logger.info(
                { userId: user.id, accountId: account.id },
                "Utilisateur Stripe onboardé avec succès"
            );
        }
    } catch (error: any) {
        logger.error(
            `Erreur lors du traitement de account.updated: ${error.message}`
        );
        throw error;
    }
}

/**
 * Gère un paiement réussi
 */
async function handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
) {
    try {
        logger.info(
            { paymentIntentId: paymentIntent.id },
            "Traitement payment_intent.succeeded"
        );

        if (paymentIntent.metadata?.invoiceId) {
            const invoiceId = paymentIntent.metadata.invoiceId;

            await prisma.$transaction(async (tx) => {
                // Mettre à jour le statut de la facture
                const updatedInvoice = await tx.invoice.update({
                    where: { invoice_id: invoiceId },
                    data: { status: "paid" },
                    include: {
                        customer: true,
                        user: {
                            include: { Company: true },
                        },
                    },
                });

                // Créer un enregistrement de paiement
                await tx.payment.create({
                    data: {
                        invoice_id: invoiceId,
                        payment_date: new Date(),
                        amount: paymentIntent.amount / 100, // Convertir les centimes en euros
                        payment_method: "stripe",
                        reference: paymentIntent.id,
                        description: "Paiement Stripe",
                    },
                });

                // Envoyer une notification de confirmation par email
                if (updatedInvoice.customer.email) {
                    const companyName =
                        updatedInvoice.user.Company?.name ||
                        `${updatedInvoice.user.first_name} ${updatedInvoice.user.last_name}`;

                    await emailService.sendPaymentNotification(
                        updatedInvoice.customer.email,
                        paymentIntent.amount,
                        updatedInvoice.invoice_number,
                        companyName
                    );
                }

                logger.info(`Facture ${invoiceId} marquée comme payée`);
            });
        }
    } catch (error: any) {
        logger.error(
            `Erreur lors du traitement du paiement réussi: ${error.message}`
        );
        throw error;
    }
}

/**
 * Gère un échec de paiement
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
        logger.info(
            { paymentIntentId: paymentIntent.id },
            "Traitement payment_intent.payment_failed"
        );

        if (paymentIntent.metadata?.invoiceId) {
            const invoiceId = paymentIntent.metadata.invoiceId;

            // Récupérer les détails de la facture
            const invoice = await prisma.invoice.findUnique({
                where: { invoice_id: invoiceId },
                include: {
                    customer: true,
                    user: {
                        include: { Company: true },
                    },
                },
            });

            if (invoice && invoice.customer.email) {
                const companyName =
                    invoice.user.Company?.name ||
                    `${invoice.user.first_name} ${invoice.user.last_name}`;

                // Envoyer une notification d'échec par email
                await emailService.sendPaymentFailureNotification(
                    invoice.customer.email,
                    invoice.invoice_number,
                    companyName,
                    paymentIntent.last_payment_error?.message
                );

                logger.info(
                    `Notification d'échec envoyée pour la facture ${invoiceId}`
                );
            }
        }
    } catch (error: any) {
        logger.error(
            `Erreur lors du traitement de l'échec de paiement: ${error.message}`
        );
        throw error;
    }
}

/**
 * Gère la complétion d'une session de checkout
 */
async function handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
) {
    try {
        logger.info(
            { sessionId: session.id },
            "Traitement checkout.session.completed"
        );

        if (session.metadata?.invoiceId && session.payment_intent) {
            // Récupérer les détails du payment intent
            const paymentIntent = await stripe.paymentIntents.retrieve(
                session.payment_intent as string
            );

            // Traiter comme un paiement réussi
            await handlePaymentIntentSucceeded(paymentIntent);
        }
    } catch (error: any) {
        logger.error(
            `Erreur lors du traitement de la session checkout: ${error.message}`
        );
        throw error;
    }
}
