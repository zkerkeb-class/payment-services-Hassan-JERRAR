import { Response } from "express";

export class CookieUtil {
    private static readonly cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        path: "/",
    };

    public static setAccessTokenCookie(res: Response, token: string): void {
        res.cookie("access_token", token, {
            ...this.cookieOptions,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
    }

    public static setRefreshTokenCookie(res: Response, token: string): void {
        res.cookie("refresh_token", token, {
            ...this.cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
        });
    }

    public static clearAuthCookies(res: Response): void {
        res.clearCookie("access_token", this.cookieOptions);
        res.clearCookie("refresh_token", this.cookieOptions);
    }
}
