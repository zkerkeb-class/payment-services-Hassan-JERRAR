import { Router } from "express";
import * as stripeController from "../controllers/stripe.controller";
import { handleWebhook } from "../controllers/webhook.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import express from "express";

const router = Router();

/**
 * @route POST /api/payments/stripe/connect
 * @desc Créer un compte Stripe Connect pour un utilisateur
 * @access Private
 */
router.post(
    "/stripe/connect",
    authMiddleware,
    stripeController.createConnectAccount
);

/**
 * @route POST /api/payments/stripe/account-link
 * @desc Créer un lien d'onboarding pour Stripe Connect
 * @access Private
 */
router.post(
    "/stripe/account-link",
    authMiddleware,
    stripeController.createAccountLink
);

/**
 * @route GET /api/payments/stripe/account-status
 * @desc Récupérer le statut du compte Stripe Connect
 * @access Private
 */
router.get(
    "/stripe/account-status",
    authMiddleware,
    stripeController.getAccountStatus
);

/**
 * @route POST /api/payments/stripe/skip-setup
 * @desc Ignorer la configuration Stripe et passer à l'étape suivante
 * @access Private
 */
router.post(
    "/stripe/skip-setup",
    authMiddleware,
    stripeController.skipStripeSetup
);

/**
 * @route POST /api/payments/stripe/create-payment
 * @desc Créer un paiement pour une facture
 * @access Private
 */
router.post(
    "/stripe/create-payment",
    authMiddleware,
    stripeController.createPayment
);

/**
 * @route POST /api/payments/stripe/create-payment-with-email
 * @desc Créer un paiement pour une facture et envoyer un e-mail avec le lien de paiement
 * @access Private
 */
router.post(
    "/stripe/create-payment-with-email",
    authMiddleware,
    stripeController.createPaymentWithEmailLink
);

/**
 * @route GET /api/payments/stripe/dashboard-link
 * @desc Obtenir un lien d'accès au dashboard Stripe Express
 * @access Private
 */
router.get(
    "/stripe/dashboard-link",
    authMiddleware,
    stripeController.getDashboardLink
);

/**
 * @route POST /api/payments/stripe/webhook
 * @desc Endpoint pour les webhooks Stripe
 * @access Public (validé par Stripe)
 */
router.post(
    "/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleWebhook
);

export default router;
