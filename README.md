# Pollution Backend Service

A Node.js backend service that integrates data from an external pollution API and enriches it with Wikipedia descriptions for cities.

## Features

- **GET /cities** endpoint that returns the most polluted cities by country
- Intelligent filtering of corrupted or invalid data entries
- Wikipedia integration for city descriptions
- In-memory caching to reduce API calls
- Comprehensive error handling and logging
- Production-ready code structure

## How to Run

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation
```bash
npm install
npm run dev
```

The server will start on port 3000 by default.

## API Endpoints

### GET /cities
Returns the list of most polluted cities by country.

**Query Parameters:**
- `country` (optional): Country code (PL, DE, ES, FR)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "page": 1,
  "limit": 10,
  "total": 200,
  "cities": [
    {
      "name": "Berlin",
      "country": "Germany",
      "pollution": 51.3,
      "description": "Berlin is the capital of Germany..."
    }
  ]
}
```

### Health Endpoints
- **GET /health**: Basic health check
- **GET /health/detailed**: Detailed health check with external API status
- **GET /health/ping**: Simple ping endpoint

## City Validation Logic

The service uses intelligent filtering to distinguish between valid cities and invalid entries. The external API contains mixed data including cities, monitoring stations, industrial facilities, and corrupted entries.

### How City Filtering Works

1. **Basic Validation**: Checks for required fields, length constraints, and character validity
2. **Non-City Indicators**: Filters out entries containing terms like "zone", "area", "plant", "station", "monitoring", "unknown"
3. **Corruption Detection**: Identifies entries with excessive special characters, numbers, or mixed-case corruption
4. **Specific Invalid Patterns**: Removes entries matching known invalid patterns (power plants, monitoring stations, etc.)

### Filtered Out Examples
- **Monitoring Stations**: "Berlin (District)", "Munich (Station)", "Frankfurt (District)"
- **Industrial Facilities**: "PowerPlant-East", "Monitoring Station A", "Plant East"
- **Unknown Areas**: "Unknown Area 22", "Unknown âreã 22", "Zone X"
- **Corrupted Data**: "kâTöwìce", "lúBLïn", "Zarãgoza" (with special characters)
- **Test Entries**: "test city", "sample", "example", "invalid"

### Valid Cities (Preserved)
Valid cities are preserved regardless of case variations:
- "Barcelona", "bARceloNA", "DELHI", "dElhi" - all valid
- "Berlin", "Hamburg", "Stuttgart", "Warsaw", "Kraków" - all valid
- Cities with international characters and accents are supported

### Validation Accuracy
The filtering system achieves high accuracy by combining multiple validation strategies while being case-insensitive for legitimate city names.

## Rate Limiting & Caching

- **Wikipedia API**: Results are cached in memory for 1 hour to reduce API calls
- **Error Handling**: Graceful degradation when external APIs are unavailable

## Environment Variables

Create a `.env` file in the root directory:

```
PORT=3000
NODE_ENV=development
POLLUTION_API_BASE_URL=https://be-recruitment-task.onrender.com
POLLUTION_API_USERNAME=testuser
POLLUTION_API_PASSWORD=testpass
WIKIPEDIA_API_BASE_URL=https://en.wikipedia.org/api/rest_v1
CACHE_TTL=3600
LOG_LEVEL=info
```

## Error Handling

The service implements comprehensive error handling:
- **400**: Validation errors
- **401**: Authentication failures
- **502**: External service failures
- **503**: Service temporarily unavailable
- **500**: Internal server errors
