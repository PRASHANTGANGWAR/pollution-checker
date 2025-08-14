const axios = require('axios').default;

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints');
  console.log('========================\n');

  try {
    // Test root endpoint
    console.log('1. Testing root endpoint (/)');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Root endpoint:', rootResponse.data.message);
    console.log('Available endpoints:', Object.keys(rootResponse.data.endpoints));
    console.log('');

    // Test health endpoints
    console.log('2. Testing health endpoints');
    
    const pingResponse = await axios.get(`${BASE_URL}/health/ping`);
    console.log('✅ Ping endpoint:', pingResponse.data.message);
    
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health endpoint:', healthResponse.data.status);
    
    const detailedHealthResponse = await axios.get(`${BASE_URL}/health/detailed`);
    console.log('✅ Detailed health endpoint:', detailedHealthResponse.data.status);
    console.log('External APIs:', detailedHealthResponse.data.externalApis);
    console.log('');

    // Test cities endpoint with country
    console.log('3. Testing cities endpoint with country');
    const citiesResponse = await axios.get(`${BASE_URL}/cities?country=PL&limit=2`, { timeout: 15000 });
    console.log('✅ Cities endpoint (PL):', citiesResponse.data.cities.length, 'cities found');
    if (citiesResponse.data.cities.length > 0) {
      console.log('Sample city:', citiesResponse.data.cities[0]);
    }
    console.log('');

    // Test cities endpoint without country (should fetch all countries)
    console.log('4. Testing cities endpoint without country');
    const allCitiesResponse = await axios.get(`${BASE_URL}/cities?limit=5`, { timeout: 30000 });
    console.log('✅ Cities endpoint (all):', allCitiesResponse.data.cities.length, 'cities found');
    console.log('Response format:', {
      page: allCitiesResponse.data.page,
      limit: allCitiesResponse.data.limit,
      total: allCitiesResponse.data.total
    });
    console.log('');

    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health/ping`, { timeout: 5000 });
    console.log('🚀 Server is running, starting tests...\n');
    await testEndpoints();
  } catch (error) {
    console.log('❌ Server is not running. Please start the server with: npm start');
    console.log('Then run this test again.');
  }
}

checkServer();
