import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.disable("x-powered-by");
app.set("etag", "strong");
app.use(compression({
  filter: (req, res) => {
    const type = res.getHeader("Content-Type");
    if (typeof type === "string" && type.includes("text/event-stream")) return false;
    return compression.filter(req, res);
  },
}));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env["NODE_ENV"] === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(__dirname, "../../nawa/dist/public"),
    path.resolve(__dirname, "../../../artifacts/nawa/dist/public"),
    path.resolve(process.cwd(), "artifacts/nawa/dist/public"),
  ];
  const staticDir = candidates.find((p) => fs.existsSync(p));

  if (staticDir) {
    logger.info({ staticDir }, "Serving frontend static files");
    app.use(express.static(staticDir, { maxAge: "1h", index: false }));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  } else {
    logger.warn({ candidates }, "Frontend dist not found; static serving disabled");
  }
}

export default app;
