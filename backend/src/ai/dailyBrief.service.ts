import type { AiProvider } from './aiProvider.interface.js';
import type { ForecastResponse } from '../types/weather.types.js';

const SYSTEM_PROMPT = `You are a weather brief writer for the Climeo app. You will be given
real, already-computed forecast numbers. Your job is ONLY to explain what
those numbers mean for someone's day in plain, warm, concise language.

Strict rules:
- Never invent, adjust, or estimate any number not given to you.
- Every temperature, percentage, or time you mention must come directly
  from the data provided.
- Keep it to 3-4 short sentences.
- No greeting, no sign-off, no markdown — just the brief itself.`;

export interface DailyBriefResult {
  brief: string;
  generatedBy: string;
  basedOn: {
    date: string;
    tempMinC: number;
    tempMaxC: number;
    condition: string;
    precipitationProbabilityPct: number;
  };
}

export class DailyBriefService {
  constructor(private readonly aiProvider: AiProvider) {}

  async generate(forecast: ForecastResponse): Promise<DailyBriefResult> {
    const today = forecast.daily[0];
    if (!today) {
      throw new Error('No daily forecast data available to brief from');
    }

    const upcomingHours = forecast.hourly.slice(0, 12);
    const maxPrecipHour = upcomingHours.reduce(
      (max, h) => (h.precipitationProbabilityPct > max.precipitationProbabilityPct ? h : max),
      upcomingHours[0],
    );

    const userPrompt = `Today's forecast data:
- Date: ${today.date}
- Low: ${today.temperatureMinC}°C, High: ${today.temperatureMaxC}°C
- Condition: ${today.condition}
- Chance of precipitation (daily max): ${today.precipitationProbabilityPct}%
- Sunrise: ${today.sunrise}, Sunset: ${today.sunset}
- Current conditions right now: ${forecast.current.temperatureC}°C, feels like ${forecast.current.feelsLikeC}°C, ${forecast.current.condition}
- Highest precipitation chance in the next 12 hours: ${maxPrecipHour.precipitationProbabilityPct}% at ${maxPrecipHour.time}
- Current wind: ${forecast.current.windSpeedKph} km/h

Write today's brief.`;

    const brief = await this.aiProvider.generate({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 200,
      temperature: 0.5,
    });

    return {
      brief: brief.trim(),
      generatedBy: this.aiProvider.name,
      basedOn: {
        date: today.date,
        tempMinC: today.temperatureMinC,
        tempMaxC: today.temperatureMaxC,
        condition: today.condition,
        precipitationProbabilityPct: today.precipitationProbabilityPct,
      },
    };
  }
}
