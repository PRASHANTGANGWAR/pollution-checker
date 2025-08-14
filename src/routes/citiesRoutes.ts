import { Router } from "express";

import citiesController from "../controllers/citiesController";
import { citiesRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Apply rate limiting to cities endpoint - 10 requests per minute
router.get("/", citiesRateLimiter, citiesController.getCities);

export default router;
