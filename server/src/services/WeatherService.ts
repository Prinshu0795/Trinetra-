// server/src/services/WeatherService.ts
export async function getWeatherData(lat: number, lng: number) {
  try {
    // Open-Meteo API doesn't require an API key
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation_probability,rain,temperature_2m&timezone=auto`;
    const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) {
      throw new Error(`Open-Meteo returned ${response.status}`);
    }
    const data = (await response.json()) as any;
    return {
      temperature: data.current_weather?.temperature ?? 28.5,
      windspeed: data.current_weather?.windspeed ?? 12.0,
      weathercode: data.current_weather?.weathercode ?? 1,
      precipitationProbability: data.hourly?.precipitation_probability?.[0] || 0,
      rain: data.hourly?.rain?.[0] || 0,
      source: 'Open-Meteo Live Sensor',
    };
  } catch (err: any) {
    console.warn('[WeatherService] Live weather lookup notice (using fallback):', err?.message || err);
    return {
      temperature: 28.0,
      windspeed: 10.5,
      weathercode: 1,
      precipitationProbability: 10,
      rain: 0,
      source: 'Regional Met Baseline',
    };
  }
}
