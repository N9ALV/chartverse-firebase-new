// use server'
'use server';

/**
 * @fileOverview AI-powered chart configuration suggestion flow.
 *
 * - suggestChartConfiguration - A function that suggests chart configurations based on a high-level description and data.
 * - SuggestChartConfigurationInput - The input type for the suggestChartConfiguration function.
 * - SuggestChartConfigurationOutput - The return type for the suggestChartConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestChartConfigurationInputSchema = z.object({
  description: z.string().describe('A high-level description of the desired chart visualization.'),
  data: z.string().describe('The data to be visualized, preferably in JSON or CSV format.'),
});
export type SuggestChartConfigurationInput = z.infer<typeof SuggestChartConfigurationInputSchema>;

const SuggestChartConfigurationOutputSchema = z.object({
  chartType: z.string().describe('The suggested chart type (e.g., bar, line, pie, scatter).'),
  configuration: z.string().describe('The suggested chart configuration in JSON format.'),
  reasoning: z.string().describe('Explanation of why the chart type and configuration were suggested.'),
});
export type SuggestChartConfigurationOutput = z.infer<typeof SuggestChartConfigurationOutputSchema>;

export async function suggestChartConfiguration(input: SuggestChartConfigurationInput): Promise<SuggestChartConfigurationOutput> {
  return suggestChartConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestChartConfigurationPrompt',
  input: {schema: SuggestChartConfigurationInputSchema},
  output: {schema: SuggestChartConfigurationOutputSchema},
  prompt: `You are an expert data visualization specialist. Given a description of the desired visualization and the data to be used, you will suggest an appropriate chart type and configuration.

Description: {{{description}}}
Data: {{{data}}}

Consider the data types, the relationships between data points, and the overall goal of the visualization. Provide a JSON configuration that is compatible with Chart.js.

{
  "chartType": "The suggested chart type",
  "configuration": "The suggested chart configuration in JSON format",
  "reasoning": "Explanation of why the chart type and configuration were suggested"
}
`,
});

const suggestChartConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestChartConfigurationFlow',
    inputSchema: SuggestChartConfigurationInputSchema,
    outputSchema: SuggestChartConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
