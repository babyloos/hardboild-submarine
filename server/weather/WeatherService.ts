import https from "https";
import { WeatherState } from "../../shared/types";
import { MISSION_AREA_LAT, MISSION_AREA_LNG, WEATHER_POLL_INTERVAL_MS } from "../../shared/constants";

const DEFAULT_WEATHER: WeatherState = {
  waveHeight: 1.5,
  windSpeed: 8,
  visibility: 10,
  description: "Moderate seas",
};

export class WeatherService {
  private current: WeatherState = { ...DEFAULT_WEATHER };
  private timer: NodeJS.Timeout | null = null;

  start(): void {
    this.fetchWeather();
    this.timer = setInterval(() => this.fetchWeather(), WEATHER_POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  get(): WeatherState {
    return { ...this.current };
  }

  private fetchWeather(): void {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${MISSION_AREA_LAT}&longitude=${MISSION_AREA_LNG}` +
      `&hourly=wind_speed_10m,visibility,wave_height` +
      `&forecast_days=1&timezone=UTC`;

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const hourly = json.hourly;
            const idx = new Date().getUTCHours();
            this.current = {
              waveHeight: hourly.wave_height?.[idx] ?? DEFAULT_WEATHER.waveHeight,
              windSpeed: hourly.wind_speed_10m?.[idx] ?? DEFAULT_WEATHER.windSpeed,
              visibility: (hourly.visibility?.[idx] ?? 10000) / 1000,
              description: this.describe(
                hourly.wave_height?.[idx] ?? DEFAULT_WEATHER.waveHeight,
                hourly.wind_speed_10m?.[idx] ?? DEFAULT_WEATHER.windSpeed
              ),
            };
          } catch {
            // keep current on parse error
          }
        });
      })
      .on("error", () => {
        // keep current on network error
      });
  }

  private describe(wave: number, wind: number): string {
    if (wave > 5) return "Violent storm";
    if (wave > 3) return "Heavy seas";
    if (wind > 15) return "Strong winds";
    if (wave < 1) return "Calm seas";
    return "Moderate seas";
  }
}
