import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.text({ type: ["text/csv", "text/plain", "multipart/form-data"], limit: "50mb" }));

app.use("/api", router);

// Root operational health & endpoint guide
app.get("/", (req, res) => {
  res.status(200).json({
    name: "DriveOps-AI Manufacturing Intelligence Backend",
    version: "1.0.0",
    status: "operational",
    system_time: new Date().toISOString(),
    endpoints: {
      health: "/api/healthz",
      dashboard: "/api/dashboard",
      manufacturing_analyze: "/api/manufacturing/analyze",
      manufacturing_data: "/api/manufacturing/data",
      alerts: "/api/alerts",
      insights: "/api/insights",
      reports_shift: "/api/reports/shift",
    },
  });
});

export default app;

