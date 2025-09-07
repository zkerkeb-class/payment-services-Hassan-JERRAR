import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const loggerMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const start = Date.now();

    // Log de la requête entrante
    logger.info(
        {
            request: {
                method: req.method,
                url: req.url,
                userAgent: req.get("User-Agent"),
                ip: req.ip,
                body: req.method !== "GET" ? req.body : undefined,
            },
        },
        "Requête entrante"
    );

    // Intercepter la fin de la réponse
    res.on("finish", () => {
        const duration = Date.now() - start;

        logger.info(
            {
                request: {
                    method: req.method,
                    url: req.url,
                },
                response: {
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                },
            },
            "Requête terminée"
        );
    });

    next();
};
