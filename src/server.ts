import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import express, { Request, Response } from "express";

import logger from "./utils/logger";
import { config } from "./config/config";
import swaggerSpecs from "./config/swagger";
import citiesRouter from "./routes/citiesRoutes";
import healthRouter from "./routes/healthRoutes";
import errorHandler from "./middleware/errorHandler";
import { requestTracker, validateRequest } from "./middleware/requestTracker";

const app = express();
const PORT = config.server.port || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Custom middleware
app.use(requestTracker);
app.use(validateRequest);

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Pollution Backend Service API",
    customfavIcon: "/favicon.ico",
  })
);

// Root route handler
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Pollution Backend Service API",
    version: "1.0.0",
    endpoints: {
      cities: "/cities",
      health: "/health",
      healthDetailed: "/health/detailed",
      healthPing: "/health/ping",
      docs: "/api-docs"
    },
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/health", healthRouter);
app.use("/cities", citiesRouter);

// Error handling middleware (must come after routes)
app.use(errorHandler);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found",
    availableEndpoints: [
      "GET /",
      "GET /cities",
      "GET /health",
      "GET /health/detailed", 
      "GET /health/ping",
      "GET /api-docs"
    ],
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  logger.info("Server started successfully", { port: PORT });
});

export default app;
