import { Vec2 } from "../../shared/types";
import { WeatherState } from "../../shared/types";
import {
  WAVE_SPEED_PENALTY_THRESHOLD, WAVE_SONAR_PENALTY_THRESHOLD,
  WIND_PERISCOPE_THRESHOLD, VISIBILITY_FOG_THRESHOLD,
} from "../../shared/constants";

export function getSpeedModifier(weather: WeatherState): number {
  if (weather.waveHeight > WAVE_SPEED_PENALTY_THRESHOLD) return 0.8;
  return 1.0;
}

export function getSonarRangeModifier(weather: WeatherState): number {
  if (weather.waveHeight > WAVE_SONAR_PENALTY_THRESHOLD) return 0.6;
  return 1.0;
}

export function isPeriscopeRestricted(weather: WeatherState): boolean {
  return weather.windSpeed > WIND_PERISCOPE_THRESHOLD || weather.visibility < VISIBILITY_FOG_THRESHOLD;
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function bearing(from: Vec2, to: Vec2, fromHeading: number): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absolute = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const relative = absolute - fromHeading;
  return ((relative % 360) + 360) % 360;
}
