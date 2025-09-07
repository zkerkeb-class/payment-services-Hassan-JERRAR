import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import logger from "./utils/logger";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import routes from "./routes";

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration de sécurité
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    })
);

// Configuration CORS
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(",") || [
            "http://localhost:3000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par windowMs
    message: {
        success: false,
        message: "Trop de requêtes de cette IP, veuillez réessayer plus tard",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api", limiter);

// Middleware de parsing
app.use(cookieParser());

// Middleware de logging
app.use(loggerMiddleware);

// Configuration spéciale pour les webhooks Stripe (avant le parsing JSON)
app.use(
    "/api/payments/stripe/webhook",
    express.raw({ type: "application/json" })
);

// Parsing JSON pour les autres routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes principales
app.use("/api", routes);

// Route de test de santé
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ZenBilling Payment Microservice",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
    });
});

// Middleware de gestion d'erreur global (doit être en dernier)
app.use(errorMiddleware);

// Gestion des routes non trouvées
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} non trouvée`,
    });
});

// Gestion des erreurs non capturées
process.on("uncaughtException", (error) => {
    logger.error({ error }, "Exception non capturée");
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error({ reason, promise }, "Promesse rejetée non gérée");
    process.exit(1);
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
    logger.info(
        {
            port: PORT,
            environment: process.env.NODE_ENV || "development",
        },
        `🚀 Payment Microservice démarré sur le port ${PORT}`
    );
});

// Gestion de l'arrêt propre
process.on("SIGTERM", () => {
    logger.info("Signal SIGTERM reçu, arrêt du serveur...");
    server.close(() => {
        logger.info("Serveur fermé avec succès");
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    logger.info("Signal SIGINT reçu, arrêt du serveur...");
    server.close(() => {
        logger.info("Serveur fermé avec succès");
        process.exit(0);
    });
});

export default app;
