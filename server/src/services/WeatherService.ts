// server/src/services/WeatherService.ts
export async function getWeatherData(lat: number, lng: number) {
  try {
    // Open-Meteo API doesn't require an API key
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation_probability,rain,temperature_2m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo returned ${response.status}`);
    }
    const data = await response.json();
    return {
      temperature: data.current_weather.temperature,
      windspeed: data.current_weather.windspeed,
      weathercode: data.current_weather.weathercode,
      precipitationProbability: data.hourly?.precipitation_probability?.[0] || 0,
      rain: data.hourly?.rain?.[0] || 0,
      source: 'Open-Meteo',
    };
  } catch (err) {
    console.error('Failed to fetch weather data:', err);
    return null;
  }
}
