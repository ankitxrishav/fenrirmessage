import { createServer as createViteServer, createLogger } from "vite";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { Express } from "express";
import type { Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
    const vite = await createViteServer({
        ...viteConfig,
        configFile: false,
        server: { middlewareMode: true, hmr: { server } },
        appType: "custom",
        customLogger: {
            ...viteLogger,
            error: (msg, options) => {
                viteLogger.error(msg, options);
                process.exit(1);
            },
        },
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
        try {
            const clientTemplate = path.resolve(
                process.cwd(),
                "client",
                "index.html"
            );

            let template = await fs.promises.readFile(clientTemplate, "utf-8");
            template = template.replace(
                `src="/src/main.tsx"`,
                `src="/src/main.tsx?v=${nanoid()}"`
            );

            const page = await vite.transformIndexHtml(req.originalUrl, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(page);
        } catch (e) {
            next(e);
        }
    });
}
export { };