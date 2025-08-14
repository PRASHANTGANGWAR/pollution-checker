/**
 * Data transformation utilities for processing and normalizing data
 */

export interface DataMetrics {
  totalProcessed: number;
  validEntries: number;
  invalidEntries: number;
  processingTime: number;
  cacheHits: number;
  cacheMisses: number;
}

export class DataTransformer {
  /**
   * Transform raw pollution data into normalized format
   */
  static transformPollutionData(rawData: any[], country?: string): {
    cities: any[];
    metrics: DataMetrics;
  } {
    const startTime = Date.now();
    const metrics: DataMetrics = {
      totalProcessed: rawData.length,
      validEntries: 0,
      invalidEntries: 0,
      processingTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    const transformedCities = rawData
      .filter(entry => {
        const isValid = this.isValidEntry(entry);
        if (isValid) {
          metrics.validEntries++;
        } else {
          metrics.invalidEntries++;
        }
        return isValid;
      })
      .map(entry => this.normalizeEntry(entry, country));

    metrics.processingTime = Date.now() - startTime;

    return {
      cities: transformedCities,
      metrics
    };
  }

  /**
   * Check if an entry is valid for processing
   */
  private static isValidEntry(entry: any): boolean {
    if (!entry || typeof entry !== 'object') return false;
    
    // Must have a name/city field
    if (!entry.name && !entry.city) return false;
    
    // Must have pollution data
    if (entry.pollution === undefined && entry.pollution_level === undefined) return false;
    
    return true;
  }

  /**
   * Normalize a single entry
   */
  private static normalizeEntry(entry: any, country?: string): any {
    const cityName = this.cleanString(entry.name || entry.city);
    const pollutionLevel = this.parseNumber(entry.pollution || entry.pollution_level);
    const aqi = this.parseNumber(entry.aqi);
    
    return {
      city: cityName,
      country: this.getCountryName(country),
      pollution: pollutionLevel,
      aqi: aqi || null,
      coordinates: entry.coordinates || null,
      lastUpdated: entry.last_updated || entry.timestamp || new Date().toISOString()
    };
  }

  /**
   * Clean and normalize string values
   */
  private static cleanString(value: any): string {
    if (!value) return '';
    
    return value
      .toString()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-'.,()]/g, ''); // Remove invalid characters
  }

  /**
   * Parse and validate numeric values
   */
  private static parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Get full country name from code
   */
  private static getCountryName(countryCode?: string): string {
    const countryMap: Record<string, string> = {
      'PL': 'Poland',
      'DE': 'Germany',
      'ES': 'Spain',
      'FR': 'France'
    };
    
    return countryCode ? countryMap[countryCode] || countryCode : 'Unknown';
  }

  /**
   * Sort cities by pollution level (descending)
   */
  static sortByPollution(cities: any[]): any[] {
    return [...cities].sort((a, b) => {
      const pollutionA = a.pollution || 0;
      const pollutionB = b.pollution || 0;
      return pollutionB - pollutionA;
    });
  }

  /**
   * Group cities by country
   */
  static groupByCountry(cities: any[]): Record<string, any[]> {
    return cities.reduce((groups, city) => {
      const country = city.country || 'Unknown';
      if (!groups[country]) {
        groups[country] = [];
      }
      groups[country].push(city);
      return groups;
    }, {} as Record<string, any[]>);
  }

  /**
   * Apply pagination to results
   */
  static paginate<T>(data: T[], page: number, limit: number): {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: data.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}
