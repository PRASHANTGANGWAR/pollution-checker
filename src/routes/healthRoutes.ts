import { Router } from "express";

import healthController from "../controllers/healthController";

const router = Router();

// Minimal ping endpoint
router.get("/ping", healthController.ping);

// Basic health check endpoint
router.get("/", healthController.health);

// Detailed health check endpoint
router.get("/detailed", healthController.detailedHealth);

export default router;
