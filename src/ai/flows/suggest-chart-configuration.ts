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

Prioritize using the following color palette for chart data elements (like bars, lines, pie slices, dataset backgrounds, dataset borders etc.):
- #132c76
- #09194a
- #000c28 (Note: This color is very dark, potentially matching the app background. Use it thoughtfully, ensuring contrast, perhaps for borders on lighter elements or fills that stand out against other chart components.)
- #4054b2
- #4169e1

For general chart text, titles, and labels, use the theme's foreground color (a light color).
For gridlines and axis lines, the theme's border color (#a3aabf) will be applied by default, so you generally don't need to specify these unless a different color is explicitly required by the visualization.

Consider the data types, the relationships between data points, and the overall goal of the visualization.
Provide a JSON configuration that is compatible with Chart.js. The configuration should include 'data' and 'options' objects.
Example for dataset colors:
"datasets": [{
  "label": "Sample",
  "data": [10, 20],
  "backgroundColor": ["#132c76", "#09194a"],
  "borderColor": ["#132c76", "#09194a"]
}]

{
  "chartType": "The suggested chart type",
  "configuration": "The suggested chart configuration in JSON format, including data and options as per Chart.js structure.",
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
