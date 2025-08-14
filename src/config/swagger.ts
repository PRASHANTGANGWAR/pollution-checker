import swaggerJsdoc from "swagger-jsdoc";
import { config } from "../config/config";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pollution Backend Service API",
      version: "1.0.0",
      description:
        "A backend service that integrates pollution data from external APIs and enriches it with Wikipedia descriptions for cities.",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: "Development server",
      },
      {
        url: `http://localhost:${config.server.port}`,
        description: "Alternative development port",
      },
      {
        url: "https://your-production-domain.com",
        description: "Production server",
      },
    ],
    components: {
      schemas: {
        City: {
          type: "object",
          required: ["city", "country", "pollution_level", "description"],
          properties: {
            city: {
              type: "string",
              description:
                "Name of the city (filtered from external API results)",
              example: "Warsaw",
            },
            country: {
              type: "string",
              description: "Name of the country (derived from API call)",
              example: "Poland",
            },
            pollution_level: {
              type: "number",
              description: "Pollution level from external API",
              example: 58.2,
              minimum: 0,
              maximum: 1000,
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Timestamp when data was processed",
              example: "2024-01-15T10:30:00.000Z",
            },
            description: {
              type: "string",
              description: "Short description of the city from Wikipedia",
              example:
                "Warsaw is the capital and largest city of Poland, located in the east-central part of the country.",
            },
          },
        },
        ExternalApiResponse: {
          type: "object",
          required: ["meta", "results"],
          properties: {
            meta: {
              type: "object",
              required: ["page", "totalPages"],
              properties: {
                page: {
                  type: "integer",
                  description: "Current page number",
                  example: 1,
                },
                totalPages: {
                  type: "integer",
                  description: "Total number of pages available",
                  example: 4,
                },
              },
            },
            results: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "pollution"],
                properties: {
                  name: {
                    type: "string",
                    description:
                      "Location name (may be city, zone, area, etc.)",
                    example: "Warsaw",
                  },
                  pollution: {
                    type: "number",
                    description: "Pollution level value",
                    example: 58.2,
                  },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          required: ["success", "error"],
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              required: ["message", "statusCode"],
              properties: {
                message: {
                  type: "string",
                  description: "Error message",
                  example: "Internal Server Error",
                },
                statusCode: {
                  type: "integer",
                  description: "HTTP status code",
                  example: 500,
                },
                details: {
                  type: "string",
                  description: "Additional error details",
                  example: "Validation failed for field: city",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  description: "Timestamp of the error",
                  example: "2024-01-15T10:30:00.000Z",
                },
              },
            },
          },
        },
        BadRequest: {
          type: "object",
          required: ["success", "error"],
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              required: ["message", "statusCode"],
              properties: {
                message: {
                  type: "string",
                  description: "Bad request error message",
                  example:
                    "Invalid country code. Must be one of: PL, DE, ES, FR",
                },
                statusCode: {
                  type: "integer",
                  description: "HTTP status code",
                  example: 400,
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  description: "Timestamp of the error",
                  example: "2024-01-15T10:30:00.000Z",
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: "object",
          required: ["success", "data", "count", "timestamp"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/City",
              },
              description: "Array of city objects",
            },
            count: {
              type: "integer",
              description: "Number of cities returned",
              example: 25,
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Timestamp of the response",
              example: "2024-01-15T10:30:00.000Z",
            },
          },
        },
        Unauthorized: {
          type: "object",
          required: ["success", "error"],
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              required: ["message", "statusCode"],
              properties: {
                message: {
                  type: "string",
                  description: "Unauthorized error message",
                  example: "Authentication failed",
                },
                statusCode: {
                  type: "integer",
                  description: "HTTP status code",
                  example: 401,
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  description: "Timestamp of the error",
                  example: "2024-01-15T10:30:00.000Z",
                },
              },
            },
          },
        },
        InternalServerError: {
          type: "object",
          required: ["success", "error"],
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              required: ["message", "statusCode"],
              properties: {
                message: {
                  type: "string",
                  description: "Internal server error message",
                  example: "Internal Server Error",
                },
                statusCode: {
                  type: "integer",
                  description: "HTTP status code",
                  example: 500,
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  description: "Timestamp of the error",
                  example: "2024-01-15T10:30:00.000Z",
                },
              },
            },
          },
        },
        HealthResponse: {
          type: "object",
          required: ["status", "timestamp"],
          properties: {
            status: {
              type: "string",
              example: "OK",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00.000Z",
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT token authentication for external pollution API. Tokens are automatically refreshed when expired.",
        },
      },
    },
    tags: [
      {
        name: "Cities",
        description: "Operations related to polluted cities data",
      },
      {
        name: "Health",
        description: "Health check and status endpoints",
      },
    ],
  },
  apis: ["./src/controllers/*.ts", "./src/server.ts"],
};

const specs = swaggerJsdoc(options);

export default specs;
