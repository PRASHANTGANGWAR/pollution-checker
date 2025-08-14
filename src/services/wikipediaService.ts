import axios, { AxiosInstance } from "axios";

import logger from "../utils/logger";
import { config } from "../config/config";

class WikipediaService {
  private baseURL: string;
  private apiClient: AxiosInstance;

  constructor() {
    this.baseURL = config.wikipediaApi.baseUrl;
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 8000,
    });
  }

  /**
   * Fetch a short description for a city from Wikipedia
   * Uses multiple search strategies to find the best match
   */
  async getCityDescription(
    cityName: string,
    countryName: string
  ): Promise<string | null> {
    try {
      logger.debug("Fetching Wikipedia description", { cityName, countryName });
      
      // Try multiple search strategies in order of specificity
      const searchStrategies = [
        `${cityName}, ${countryName}`,  // Most specific
        cityName,                       // City name only
        `${cityName} (${countryName})`  // Alternative format
      ];
      
      for (const searchTerm of searchStrategies) {
        const description = await this.searchCity(searchTerm);
        if (description) {
          logger.debug("Found Wikipedia description", { 
            cityName, 
            searchTerm,
            descriptionLength: description.length 
          });
          return description;
        }
      }
      
      logger.debug("No Wikipedia description found", { cityName, countryName });
      return null;
    } catch (error: any) {
      logger.warn("Failed to fetch Wikipedia description", {
        cityName,
        countryName,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Search for a city in Wikipedia
   */
  private async searchCity(searchTerm: string): Promise<string | null> {
    try {
      const cleanTerm = this.cleanSearchTerm(searchTerm);
      const response = await this.apiClient.get(`/${encodeURIComponent(cleanTerm)}`);
      
      if (response.data && response.data.extract) {
        let description: string = response.data.extract;

        // Decode HTML entities
        description = this.decodeHtmlEntities(description);

        // Truncate to reasonable length
        description = this.truncateDescription(description);

        return description;
      }

      return null;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        logger.debug("Wikipedia page not found", { searchTerm });
        return null;
      }
      logger.warn("Wikipedia API error", {
        searchTerm,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Decode HTML entities in text
   */
  private decodeHtmlEntities(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
      '&lt;': '<',
      '&gt;': '>',
      '&nbsp;': ' ',
      '&apos;': "'"
    };
    
    return text.replace(/&[^;]+;/g, (entity) => {
      return htmlEntities[entity] || entity;
    });
  }

  /**
   * Truncate description to reasonable length
   */
  private truncateDescription(description: string): string {
    const maxLength = 200;
    
    // Try to get the first complete sentence
    const firstSentence = description.split(".")[0];
    if (firstSentence && firstSentence.length < maxLength) {
      return firstSentence + ".";
    }
    
    // Otherwise truncate at word boundary
    const truncated = description.substring(0, maxLength).trim();
    return truncated.endsWith(".") ? truncated : truncated + "...";
  }

  /**
   * Clean search term for Wikipedia API
   */
  private cleanSearchTerm(term: string): string {
    return term
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s,.-]/g, "")
      .replace(/^\s+|\s+$/g, "");
  }

  /**
   * Test the Wikipedia API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.apiClient.get("/London");
      logger.info("Wikipedia API connection test successful");
      return true;
    } catch (error: any) {
      logger.error("Wikipedia API connection test failed", {
        error: error.message,
      });
      return false;
    }
  }
}

export default new WikipediaService();
