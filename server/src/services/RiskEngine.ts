// server/src/services/RiskEngine.ts

export function calculateLocationRisk(
  weather: any,
  nearbyIncidents: any[],
  nearbyAlerts: any[],
  floodBuffers: any[]
) {
  let rainfallScore = 0;
  let floodBufferScore = 0;
  let citizenIncidentScore = 0;
  let alertScore = 0;
  
  const factors: string[] = [];

  // Weather factors
  if (weather) {
    if (weather.precipitationProbability > 50) {
      rainfallScore += 10;
      factors.push('High precipitation probability');
    }
    if (weather.rain > 5) {
      rainfallScore += 15;
      factors.push('Heavy rainfall forecast');
    }
  }

  // Flood Buffer proximity
  // If we had point-in-polygon we'd check if inside, but for now we'll just check if any exist.
  if (floodBuffers.length > 0) {
    floodBufferScore += 30;
    factors.push('Proximity to active flood buffer / water body');
  }

  // Alerts
  if (nearbyAlerts.length > 0) {
    alertScore += 30;
    factors.push(`Active official alerts in the area (${nearbyAlerts.length})`);
  }

  // Citizen incidents
  const floodIncidents = nearbyIncidents.filter((i) => i.disasterType === 'FLOOD' || i.disasterType === 'WATERLOGGING');
  if (floodIncidents.length > 0) {
    citizenIncidentScore += Math.min(25, floodIncidents.length * 5);
    factors.push(`Recent citizen reports of flooding/waterlogging (${floodIncidents.length})`);
  }

  let totalScore = rainfallScore + floodBufferScore + citizenIncidentScore + alertScore;
  totalScore = Math.min(100, Math.max(0, totalScore));

  let riskLevel = 'LOW';
  if (totalScore > 80) riskLevel = 'CRITICAL';
  else if (totalScore > 60) riskLevel = 'HIGH';
  else if (totalScore > 40) riskLevel = 'ELEVATED';
  else if (totalScore > 20) riskLevel = 'MODERATE';

  return {
    riskScore: totalScore,
    riskLevel,
    factors,
  };
}
