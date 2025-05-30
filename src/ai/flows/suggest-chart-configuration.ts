
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

IMPORTANT STYLING GUIDELINES:
- The chart will be rendered on a LIGHT background (e.g., white).
- General chart text (titles, axis labels, legend labels, tick labels) should be DARK (e.g., color: 'hsl(var(--card-foreground))' which is a dark color like #222 or #333).
- Gridlines and axis lines should use a muted color like 'hsl(var(--border))' (e.g., #a3aabf or a light grey).

Prioritize using the following color palette for chart DATA elements (like bars, lines, pie slices, dataset backgrounds, dataset borders etc.):
- #132c76 (Primary Blue)
- #09194a (Darker Blue)
- #4054b2 (Medium Blue)
- #4169e1 (Royal Blue)
- #000c28 (Very Dark Blue/Almost Black - Use this thoughtfully for data elements, perhaps for borders on lighter elements or if it provides good contrast against other data elements on the light chart background. Be mindful it's also the main app background color.)


Consider the data types, the relationships between data points, and the overall goal of the visualization.
Provide a JSON configuration that is compatible with Chart.js. The configuration should include 'data' and 'options' objects.

Example for dataset colors:
"datasets": [{
  "label": "Sample",
  "data": [10, 20],
  "backgroundColor": ["#132c76", "#09194a"], // Use the specified palette
  "borderColor": ["#132c76", "#09194a"]    // Use the specified palette
}]

Example for options to ensure text and gridlines are correctly colored for a light chart background:
"options": {
  "plugins": {
    "legend": { "labels": { "color": "hsl(var(--card-foreground))" } },
    "title": { "display": true, "text": "Chart Title", "color": "hsl(var(--card-foreground))" }
  },
  "scales": {
    "x": {
      "ticks": { "color": "hsl(var(--card-foreground))" },
      "grid": { "color": "hsl(var(--border))" },
      "title": { "display": true, "text": "X-Axis", "color": "hsl(var(--card-foreground))" }
    },
    "y": {
      "ticks": { "color": "hsl(var(--card-foreground))" },
      "grid": { "color": "hsl(var(--border))" },
      "title": { "display": true, "text": "Y-Axis", "color": "hsl(var(--card-foreground))" }
    }
  }
}
For non-cartesian charts (pie, doughnut, polar, radar), ensure legend and title colors are 'hsl(var(--card-foreground))'. For radar/polar area, pointLabels and angleLines/grid lines should also follow this scheme (dark text, light grid).

Output JSON structure:
{
  "chartType": "The suggested chart type",
  "configuration": "The suggested chart configuration in JSON format, including data and options as per Chart.js structure, respecting the light background and dark text/grid color requirements.",
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
