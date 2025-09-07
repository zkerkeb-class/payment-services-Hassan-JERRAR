import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/customError";
import logger from "../utils/logger";
import { ApiResponse } from "../utils/apiResponse";

export const errorMiddleware = (
    error: Error | CustomError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = "Erreur interne du serveur";

    // Log de l'erreur
    logger.error(
        {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            request: {
                method: req.method,
                url: req.url,
                body: req.body,
                params: req.params,
                query: req.query,
            },
        },
        "Erreur non gérée"
    );

    // Si c'est une erreur personnalisée
    if (error instanceof CustomError) {
        statusCode = error.statusCode;
        message = error.message;
    }

    // Erreurs de validation Joi
    else if (error.name === "ValidationError") {
        statusCode = 400;
        message = "Données de requête invalides";
    }

    // Erreurs Prisma
    else if (error.name === "PrismaClientKnownRequestError") {
        statusCode = 400;
        message = "Erreur de base de données";
    }

    // Erreurs Stripe
    else if (error.name === "StripeError") {
        statusCode = 400;
        message = "Erreur de paiement Stripe";
    }

    // En production, ne pas exposer les détails des erreurs
    if (process.env.NODE_ENV === "production" && statusCode === 500) {
        message = "Une erreur inattendue s'est produite";
    }

    return ApiResponse.error(res, statusCode, message);
};
