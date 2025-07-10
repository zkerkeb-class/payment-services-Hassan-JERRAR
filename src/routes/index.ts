import { Router } from "express";
import paymentRoutes from "./payment.routes";

const router = Router();

// Routes de paiement
router.use("/payments", paymentRoutes);

// Route de santé pour vérifier que le microservice fonctionne
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Payment microservice is running",
        timestamp: new Date().toISOString(),
        service: "payment-microservice",
        version: "1.0.0",
    });
});

// Route racine
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ZenBilling Payment Microservice API",
        documentation: "/api/health",
        version: "1.0.0",
    });
});

export default router;
