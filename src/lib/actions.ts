
'use server';

import { suggestChartConfiguration, type SuggestChartConfigurationInput, type SuggestChartConfigurationOutput } from '@/ai/flows/suggest-chart-configuration';

export async function getAISuggestion(input: SuggestChartConfigurationInput): Promise<SuggestChartConfigurationOutput | { error: string }> {
  try {
    const result = await suggestChartConfiguration(input);
    return result;
  } catch (error) {
    console.error("AI suggestion error:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred while fetching AI suggestion." };
  }
}
