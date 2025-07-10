import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: [
            {
                emit: "event",
                level: "query",
            },
            {
                emit: "event",
                level: "error",
            },
            {
                emit: "event",
                level: "info",
            },
            {
                emit: "event",
                level: "warn",
            },
        ],
    });

// Gestion des logs Prisma
if (process.env.NODE_ENV === "development") {
    prisma.$on("query", (e) => {
        logger.debug(
            { query: e.query, params: e.params, duration: e.duration },
            "Prisma Query"
        );
    });
}

prisma.$on("error", (e) => {
    logger.error({ error: e }, "Prisma Error");
});

prisma.$on("info", (e) => {
    logger.info({ message: e.message }, "Prisma Info");
});

prisma.$on("warn", (e) => {
    logger.warn({ message: e.message }, "Prisma Warning");
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
