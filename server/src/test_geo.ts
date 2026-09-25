import { getWeatherData } from './services/WeatherService.js';
import { findNearbyResources, findNearbyIncidents, findNearbyAlerts, getFloodBuffers } from './services/GeoService.js';
import { ShelterDiscoveryService } from './services/ShelterDiscoveryService.js';
import { calculateLocationRisk } from './services/RiskEngine.js';

async function test() {
  try {
    const lat = 28.6139, lng = 77.2090, radius = 25;
    console.log('Testing services for lat:', lat, 'lng:', lng);
    const t0 = Date.now();
    const [weather, resources, shelterResult, incidents, alerts, allFloodBuffers] = await Promise.all([
      getWeatherData(lat, lng),
      findNearbyResources(lat, lng, radius),
      ShelterDiscoveryService.getInstantShelters(lat, lng, radius),
      findNearbyIncidents(lat, lng, radius),
      findNearbyAlerts(lat, lng, radius),
      getFloodBuffers(),
    ]);
    console.log(`Fetched in ${Date.now() - t0}ms`);
    console.log('Weather:', weather);
    console.log('Resources:', resources.length);
    console.log('Shelters:', shelterResult.shelters.length);
    console.log('Incidents:', incidents.length);
    console.log('Alerts:', alerts.length);
    console.log('FloodBuffers:', allFloodBuffers.length);
    const risk = calculateLocationRisk(weather, incidents, alerts, allFloodBuffers);
    console.log('Risk calculated:', risk);
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}
test();
