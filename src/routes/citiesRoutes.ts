import { Router } from "express";

import citiesController from "../controllers/citiesController";

const router = Router();

router.get("/", citiesController.getCities);

export default router;
