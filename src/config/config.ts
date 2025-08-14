import dotenv from "dotenv";
dotenv.config();

export const config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  pollutionApi: {
    baseUrl: process.env.POLLUTION_API_BASE_URL || "https://be-recruitment-task.onrender.com",
    username: process.env.POLLUTION_API_USERNAME || "testuser",
    password: process.env.POLLUTION_API_PASSWORD || "testpass",
  },
  wikipediaApi: {
    baseUrl: process.env.WIKIPEDIA_API_BASE_URL || "https://en.wikipedia.org/api/rest_v1/page/summary",
  },
  cache: {
    ttl: Number(process.env.CACHE_TTL) || 3600,
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};
