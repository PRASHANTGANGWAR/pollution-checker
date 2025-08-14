import { Request, Response } from "express";
import citiesService from "../services/citiesService";
import { CustomApiError, ErrorCodes } from "../utils/errorUtils";
import { ResponseFormatter, generateRequestId } from "../utils/responseFormatter";

/**
 * @openapi
 * /cities:
 *   get:
 *     summary: Get the list of most polluted cities by country
 *     description: >
 *       Fetches pollution data from external API, filters valid cities, enriches them with Wikipedia descriptions,
 *       and returns sorted results by pollution level with pagination.
 *     tags:
 *       - Cities
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           enum: [PL, DE, ES, FR]
 *         description: The country code to filter cities by. If not provided, all countries will be fetched.
 *         required: false
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination.
 *         required: false
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of results per page (max 100).
 *         required: false
 *     responses:
 *       200:
 *         description: Successfully retrieved polluted cities data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [page, limit, total, cities]
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 cities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [city, country, pollution, description]
 *                     properties:
 *                       city:
 *                         type: string
 *                         example: Kraków
 *                       country:
 *                         type: string
 *                         example: Poland
 *                       pollution:
 *                         type: number
 *                         example: 57.1
 *                       description:
 *                         type: string
 *                         example: No description available
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid country code
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

const getCities = async (req: Request, res: Response) => {
  const startTime = req.context?.startTime || Date.now();
  const requestId = req.context?.requestId || generateRequestId();
  
  try {
    // Extract and validate query parameters
    const { country, page: pageParam, limit: limitParam } = req.query;
    
    // Parse pagination with sensible defaults
    const page = Math.max(1, parseInt(pageParam as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam as string) || 10));
    
    // Validate country code if provided
    const validCountries = ["PL", "DE", "ES", "FR"];
    if (country && !validCountries.includes(country as string)) {
      throw new CustomApiError(
        `Invalid country code: ${country}`,
        400,
        ErrorCodes.VALIDATION_ERROR,
        { validCountries, provided: country }
      );
    }

    // Fetch and process city data
    // If no country is specified, we need to fetch data for all supported countries
    let cities: any[] = [];
    
    if (country) {
      // Fetch data for specific country
      cities = await citiesService.getPollutedCities(country as string, page, limit);
    } else {
      // Fetch data for all supported countries
      const supportedCountries = ["PL", "DE", "ES", "FR"];
      const allCities = [];
      
      for (const countryCode of supportedCountries) {
        try {
          const countryCities = await citiesService.getPollutedCities(countryCode, page, limit);
          allCities.push(...countryCities);
        } catch (error) {
          console.warn(`Failed to fetch data for country ${countryCode}:`, error);
        }
      }
      
      cities = allCities;
    }

    // Format and return response
    const response = ResponseFormatter.success(cities, page, limit, cities.length);
    
    return res.status(200).json(response);
  } catch (err: any) {
    console.error('Cities endpoint error:', err);
    
    // Use custom error handling
    if (err instanceof CustomApiError) {
      const errorResponse = ResponseFormatter.error(
        err.message,
        err.code
      );
      
      return res.status(err.statusCode).json(errorResponse);
    }
    
    const errorResponse = ResponseFormatter.error(
      "Internal server error",
      ErrorCodes.INTERNAL_ERROR
    );
    
    return res.status(500).json(errorResponse);
  }
};

export default {
  getCities,
};
