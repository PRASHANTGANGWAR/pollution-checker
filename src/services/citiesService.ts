import cache from "../utils/cache";
import logger from "../utils/logger";
import { config } from "../config/config";
import wikipediaService from "./wikipediaService";
import pollutionApiService from "./pollutionApiService";
import * as cityValidator from "../utils/cityValidator";

import PollutionEntry from "../interfaces/pollutionEntryInterface";
import NormalizedCity from "../interfaces/normalizedCityInterface";

class CitiesService {
  async getPollutedCities(
    country: string | undefined,
    page: number = 1,
    limit: number = 10
  ): Promise<NormalizedCity[]> {
    try {
      logger.info("Starting polluted cities data fetch", { country, page, limit });
      
      // Fetch raw pollution data from external API
      const pollutionData: any = await pollutionApiService.getPollutionData(
        country,
        page,
        limit
      );
      
      // Filter and validate city entries
      const validCities = this.filterValidCities(pollutionData, country);
      
      // Enrich with Wikipedia descriptions
      const enrichedCities = await this.enrichCitiesWithDescriptions(validCities);
      
      logger.info("Successfully processed polluted cities", {
        country,
        totalProcessed: validCities.length,
        enrichedCount: enrichedCities.length
      });
      
      return enrichedCities;
    } catch (error) {
      logger.error("Error in getPollutedCities", {
        error: error instanceof Error ? error.message : String(error),
        country,
        page,
        limit
      });
      throw new Error("Failed to fetch polluted cities data");
    }
  }

  filterValidCities(
    pollutionData: any,
    country: string | undefined
  ): NormalizedCity[] {
    logger.debug("Filtering valid cities", {
      dataType: Array.isArray(pollutionData) ? "array" : "object",
      hasResults: !!pollutionData.results,
      country,
      totalEntries: pollutionData.results?.length || pollutionData.length || 0,
    });

    const results: PollutionEntry[] = pollutionData.results || pollutionData;

    // Apply city validation directly on the original data
    const filteredCities: NormalizedCity[] = results
      .filter((entry: PollutionEntry) => cityValidator.isValidCity(entry, country))
      .map((entry: PollutionEntry) => this.normalizeCityData(entry, country));

    logger.info("City filtering completed", {
      country,
      totalEntries: results.length,
      validCities: filteredCities.length,
      filteredOut: results.length - filteredCities.length
    });

    return filteredCities;
  }

  normalizeCityData(
    entry: PollutionEntry,
    country: string | undefined
  ): NormalizedCity {
    // Country code to full name mapping
    const countryMapping: Record<string, string> = {
      PL: "Poland",
      DE: "Germany", 
      ES: "Spain",
      FR: "France",
    };

    // Extract and clean city name
    const cityName = (entry.name || entry.city || "").toString().trim();
    
    // Extract and validate pollution level
    const pollutionLevel = entry.pollution || entry.pollution_level || 0;
    const normalizedPollution = parseFloat(pollutionLevel as any) || 0;
    
    // Determine country name
    const countryName = country 
      ? countryMapping[country] || country 
      : "Unknown";

    return {
      name: cityName,
      country: countryName,
      pollution: normalizedPollution,
    };
  }

  async enrichCitiesWithDescriptions(
    cities: NormalizedCity[]
  ): Promise<NormalizedCity[]> {
    const enrichedCities: NormalizedCity[] = [];

    for (const city of cities) {
      try {
        const cacheKey = `wikipedia_${city.name}_${city.country}`;
        let description: string | undefined | null = cache.get(cacheKey) as
          | string
          | undefined;
        if (!description) {
          description = await wikipediaService.getCityDescription(
            city.name,
            city.country
          );

          cache.set(cacheKey, description, Number(config.cache.ttl) || 3600);
        }
        enrichedCities.push({
          ...city,
          description: description || "No description available",
        });
      } catch (error: unknown) {
        logger.warn(`Failed to enrich city ${city.name}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
        enrichedCities.push({
          ...city,
          description: "Description unavailable",
        });
      }
    }

    logger.info("Cities enrichment completed", {
      totalCities: cities.length,
      enrichedCities: enrichedCities.length,
      failedCities: cities.length - enrichedCities.length,
    });

    return enrichedCities;
  }
}

export default new CitiesService();
