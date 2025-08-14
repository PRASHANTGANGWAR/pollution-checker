import { Request, Response } from "express";
import { ResponseFormatter } from "../utils/responseFormatter";
import pollutionApiService from "../services/pollutionApiService";
import wikipediaService from "../services/wikipediaService";

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Returns basic health status of the service
 *     description: Simple health check endpoint for basic service status
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "OK"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       description: Service uptime in seconds
 *       503:
 *         description: Service is unhealthy
 */
const health = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = req.context?.requestId || 'unknown';
  
  try {
    // Simple health check - just check if service is running
    const healthData = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
    
    res.status(200).json(healthData);
  } catch (error) {
    const errorResponse = ResponseFormatter.error(
      "Health check failed",
      "HEALTH_CHECK_ERROR"
    );
    
    res.status(503).json(errorResponse);
  }
};

/**
 * @openapi
 * /health/detailed:
 *   get:
 *     tags:
 *       - Health
 *     summary: Returns comprehensive health status of the service
 *     description: Detailed health check including external API connectivity, system metrics, and performance data
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "OK"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       description: Service uptime in seconds
 *                     memory:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: number
 *                           description: Resident Set Size in bytes
 *                         heapTotal:
 *                           type: number
 *                           description: Total heap size in bytes
 *                         heapUsed:
 *                           type: number
 *                           description: Used heap size in bytes
 *                         external:
 *                           type: number
 *                           description: External memory usage in bytes
 *                     externalApis:
 *                       type: object
 *                       properties:
 *                         pollutionApi:
 *                           type: string
 *                           enum: [OK, DOWN]
 *                         wikipediaApi:
 *                           type: string
 *                           enum: [OK, DOWN]
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     environment:
 *                       type: string
 *                       example: "development"
 *       503:
 *         description: Service is unhealthy
 */
const detailedHealth = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = req.context?.requestId || 'unknown';
  
  try {
    // Check external API connectivity
    const pollutionApiHealthy = await pollutionApiService.testConnection();
    const wikipediaApiHealthy = await wikipediaService.testConnection();
    
    const isHealthy = pollutionApiHealthy && wikipediaApiHealthy;
    const statusCode = isHealthy ? 200 : 503;
    
    const healthData = {
      status: isHealthy ? "OK" : "DEGRADED",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      externalApis: {
        pollutionApi: pollutionApiHealthy ? "OK" : "DOWN",
        wikipediaApi: wikipediaApiHealthy ? "OK" : "DOWN"
      },
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        arch: process.arch
      }
    };
    
    res.status(statusCode).json(healthData);
  } catch (error) {
    const errorResponse = ResponseFormatter.error(
      "Detailed health check failed",
      "HEALTH_CHECK_ERROR"
    );
    
    res.status(503).json(errorResponse);
  }
};

/**
 * @openapi
 * /health/ping:
 *   get:
 *     tags:
 *       - Health
 *     summary: Simple ping endpoint
 *     description: Minimal health check that just returns pong
 *     responses:
 *       200:
 *         description: Service is responding
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "pong"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
const ping = async (req: Request, res: Response) => {
  const requestId = req.context?.requestId || 'unknown';
  
  const pingData = {
    message: "pong",
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(pingData);
};

export default {
  health,
  detailedHealth,
  ping,
};
