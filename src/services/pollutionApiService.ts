import axios, { AxiosInstance } from "axios";

import logger from "../utils/logger";
import { config } from "../config/config";

class PollutionApiService {
  private baseURL: string;
  private username: string | undefined;
  private password: string | undefined;
  private accessToken: string | null;
  private refreshToken: string | null;
  private authClient: AxiosInstance;
  private apiClient: AxiosInstance;

  constructor() {
    this.baseURL = config.pollutionApi.baseUrl;
    this.username = config.pollutionApi.username;
    this.password = config.pollutionApi.password;
    this.accessToken = null;
    this.refreshToken = null;

    this.authClient = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Authenticate with the external API to get access token
   */
  async authenticate(): Promise<string | null> {
    try {
      if (this.accessToken) {
        return this.accessToken;
      }

      if (this.refreshToken) {
        try {
          logger.logTokenRefresh?.("Attempting to refresh access token");
          const refreshResponse = await this.authClient.post("/auth/refresh", {
            refreshToken: this.refreshToken,
          });

          if (refreshResponse.data?.token) {
            this.accessToken = refreshResponse.data.token;
            logger.logTokenRefresh?.("Successfully refreshed access token");
            return this.accessToken;
          }
        } catch (refreshError: any) {
          logger.warn("Refresh token failed, falling back to login", {
            error: refreshError.message,
          });
          this.refreshToken = null;
        }
      }

      logger.logAuth?.("Using username/password authentication", {
        username: this.username,
      });

      const response = await this.authClient.post("/auth/login", {
        username: this.username,
        password: this.password,
      });

      if (response.data?.token) {
        this.accessToken = response.data.token;
        if (response.data.refreshToken) {
          this.refreshToken = response.data.refreshToken;
          logger.logAuth?.("Stored refresh token for future use");
        }
        logger.logAuth?.("Successfully authenticated with external API");
        return this.accessToken;
      } else {
        throw new Error("Invalid authentication response");
      }
    } catch (error: any) {
      logger.error("Authentication failed", { error: error.message });
      throw new Error("Authentication failed with external API");
    }
  }

  /**
   * Fetch pollution data from the external API
   */
  async getPollutionData(country?: string, page = 1, limit = 10): Promise<any> {
    try {
      logger.info("Fetching pollution data from external API", {
        country,
        page,
        limit,
      });
      await this.authenticate();
      this.apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${this.accessToken}`;

      const params: Record<string, any> = {};
      if (country) params.country = country;
      if (page) params.page = page;
      if (limit) params.limit = limit;

      const startTime = Date.now();
      logger.logRequest?.("GET", "/pollution", params);

      const response = await this.apiClient.get("/pollution", { params });
      const responseTime = Date.now() - startTime;
      logger.logResponse?.("GET", "/pollution", response.status, responseTime);

      if (!response?.data) {
        throw new Error("Invalid response format from pollution API");
      }

      logger.info("Successfully fetched pollution data", {
        count: response.data.results?.length || response.data.length,
        country,
        page,
        limit,
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        logger.logError?.(
          "GET",
          "/pollution",
          error.response.status,
          "API error response",
          {
            data: error.response.data,
            params: { country, page, limit },
          }
        );

        if (error.response.status === 401) {
          logger.warn("Access token expired, attempting to refresh");
          this.accessToken = null;

          try {
            await this.refreshAccessToken();
            logger.info("Token refreshed, retrying request");
            return await this.getPollutionData(country, page, limit);
          } catch (refreshError: any) {
            logger.error("Failed to refresh token", {
              error: refreshError.message,
            });
            throw new Error("Authentication failed with pollution API");
          }
        } else if (error.response.status === 429) {
          throw new Error("Rate limit exceeded for pollution API");
        } else if (error.response.status === 400) {
          const errorMessage = error.response.data?.error || "Bad request";
          throw new Error(`Pollution API validation error: ${errorMessage}`);
        } else {
          throw new Error(`Pollution API error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        logger.warn("No response from pollution API", { error: error.message });
        throw new Error("No response from pollution API");
      } else {
        logger.error("Error setting up pollution API request", {
          error: error.message,
        });
        throw new Error("Failed to setup pollution API request");
      }
    }
  }

  /**
   * Refresh the access token using the stored refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      if (!this.refreshToken) {
        throw new Error("No refresh token available");
      }

      logger.logTokenRefresh?.("Refreshing access token");

      const response = await this.authClient.post("/auth/refresh", {
        refreshToken: this.refreshToken,
      });

      if (response.data?.token) {
        this.accessToken = response.data.token;
        logger.logTokenRefresh?.("Successfully refreshed access token");
        return this.accessToken;
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (error: any) {
      logger.error("Token refresh failed", { error: error.message });
      this.refreshToken = null;
      throw error;
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authClient.get("/healthz");
      logger.info("API connection test successful");
      return true;
    } catch (error: any) {
      logger.error("API connection test failed", { error: error.message });
      return false;
    }
  }
}

export default new PollutionApiService();
