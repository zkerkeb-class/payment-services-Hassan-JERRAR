import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { supabase } from "../lib/supabase";
import logger from "../utils/logger";
import { IUserResponse } from "../interfaces/User.interface";
import { CookieUtil } from "../utils/cookie";
import { ApiResponse } from "../utils/apiResponse";

export interface AuthRequest extends Request {
    user?: IUserResponse;
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Vérifier d'abord le cookie d'accès
        const token = req.cookies.access_token;

        if (!token) {
            const refreshToken = req.cookies.refresh_token;
            // Si pas de token mais un refresh token, tenter de rafraîchir la session
            if (refreshToken) {
                return await tryRefreshToken(refreshToken, req, res, next);
            }

            // Aucun token disponible
            return ApiResponse.error(res, 401, "Non autorisé: Token manquant");
        }

        // Vérifier le token avec Supabase
        const {
            data: { user: supabaseUser },
            error: authError,
        } = await supabase.auth.getUser(token);

        // Si le token est valide
        if (!authError && supabaseUser) {
            // Récupérer l'utilisateur dans notre base de données
            const user = await prisma.user.findUnique({
                where: { id: supabaseUser.id },
                include: {
                    Company: {
                        select: {
                            company_id: true,
                            name: true,
                        },
                    },
                },
            });

            if (!user) {
                logger.warn(
                    { supabaseEmail: supabaseUser.email },
                    "Utilisateur authentifié avec Supabase mais non trouvé dans la base de données locale"
                );
                CookieUtil.clearAuthCookies(res);
                return ApiResponse.error(
                    res,
                    401,
                    "Non autorisé: Utilisateur non trouvé"
                );
            }

            // Authentification réussie
            req.user = user;
            next();
            return;
        }

        // Token invalide, tenter de rafraîchir avec le refresh token
        const refreshToken = req.cookies.refresh_token;
        if (refreshToken) {
            return await tryRefreshToken(refreshToken, req, res, next);
        }

        // Aucun refresh token disponible
        logger.warn(
            { error: authError },
            "Token invalide et pas de refresh token"
        );
        CookieUtil.clearAuthCookies(res);
        return ApiResponse.error(res, 401, "Non autorisé: Session invalide");
    } catch (error) {
        logger.error({ error }, "Erreur lors de la vérification du token");
        CookieUtil.clearAuthCookies(res);
        return ApiResponse.error(res, 500, "Erreur lors de l'authentification");
    }
};

// Fonction pour tenter de rafraîchir le token
async function tryRefreshToken(
    refreshToken: string,
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        // Rafraîchir le token avec Supabase
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error || !data.session) {
            logger.warn({ error }, "Échec du rafraîchissement du token");
            CookieUtil.clearAuthCookies(res);
            return ApiResponse.error(
                res,
                401,
                "Session expirée, veuillez vous reconnecter"
            );
        }

        // Mettre à jour les cookies
        if (data.session.access_token) {
            CookieUtil.setAccessTokenCookie(res, data.session.access_token);
        }

        if (data.session.refresh_token) {
            CookieUtil.setRefreshTokenCookie(res, data.session.refresh_token);
        }

        // Récupérer l'utilisateur avec le nouveau token
        const {
            data: { user: refreshedUser },
            error: refreshError,
        } = await supabase.auth.getUser(data.session.access_token);

        if (refreshError || !refreshedUser) {
            logger.warn({ error: refreshError }, "Token rafraîchi invalide");
            CookieUtil.clearAuthCookies(res);
            return ApiResponse.error(
                res,
                401,
                "Non autorisé: Token invalide après rafraîchissement"
            );
        }

        // Récupérer l'utilisateur dans notre base de données
        const user = await prisma.user.findUnique({
            where: { id: refreshedUser.id },
            include: {
                Company: {
                    select: {
                        company_id: true,
                        name: true,
                    },
                },
            },
        });

        if (!user) {
            logger.warn(
                { supabaseEmail: refreshedUser.email },
                "Utilisateur non trouvé dans la base de données locale après rafraîchissement"
            );
            CookieUtil.clearAuthCookies(res);
            return ApiResponse.error(
                res,
                401,
                "Non autorisé: Utilisateur non trouvé"
            );
        }

        // Authentification réussie après rafraîchissement
        req.user = user;
        next();
        return;
    } catch (refreshError) {
        logger.error(
            { error: refreshError },
            "Erreur lors du rafraîchissement du token"
        );
        CookieUtil.clearAuthCookies(res);
        return ApiResponse.error(
            res,
            401,
            "Non autorisé: Erreur de rafraîchissement de session"
        );
    }
}
