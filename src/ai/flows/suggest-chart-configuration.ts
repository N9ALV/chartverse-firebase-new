
// use server'
'use server';
/**
 * @fileOverview AI-powered chart configuration suggestion flow for Chart.js.
 *
 * - suggestChartConfiguration - A function that suggests Chart.js configurations.
 * - SuggestChartConfigurationInput - The input type for the suggestChartConfiguration function.
 * - SuggestChartConfigurationOutput - The return type for the suggestChartConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  SuggestChartConfigurationInputSchema,
  SuggestChartConfigurationOutputSchema,
  type SuggestChartConfigurationInput,
  type SuggestChartConfigurationOutput,
  AIPromptOutputSchema,
  SupportedChartJsTypesEnum,
} from '@/ai/types';

export async function suggestChartConfiguration(input: SuggestChartConfigurationInput): Promise<SuggestChartConfigurationOutput> {
  return suggestChartConfigurationFlow(input);
}

const chartJsPrompt = ai.definePrompt({
  name: 'suggestChartConfigurationPrompt',
  input: {schema: SuggestChartConfigurationInputSchema},
  output: {schema: AIPromptOutputSchema}, // AI outputs this simpler schema
  prompt: `You are an expert data visualization specialist. Your task is to generate a configuration for a Chart.js chart.
Given a description of the desired visualization and the data to be used, you will suggest an appropriate Chart.js chart type and a full JSON configuration for it.

Description: {{{description}}}
Data: {{{data}}}

You MUST provide the following fields in your JSON response:
1.  "chartJsType": A string representing a valid Chart.js chart type (e.g., "bar", "line", "pie", "doughnut", "scatter", "bubble", "radar", "polarArea").
2.  "chartJsConfiguration": A JSON string that represents the complete Chart.js configuration object. This JSON string itself MUST contain 'data' and 'options' objects.
3.  "reasoning": A brief explanation of why this chart type and configuration were suggested.

IMPORTANT STYLING GUIDELINES for 'chartJsConfiguration':
- The chart will be rendered on a LIGHT background (e.g., white).
- General chart text (titles, axis labels, legend labels, tick labels) should be DARK (e.g., color: 'hsl(var(--card-foreground))' which is a dark color like #222 or #333).
- Gridlines and axis lines should use a muted color like 'hsl(var(--border))' (e.g., #a6acc7 or a light grey).

Prioritize using the following color palette for chart DATA elements (like bars, lines, pie slices, dataset backgrounds, dataset borders etc.):
- #132c76 (Primary Blue)
- #09194a (Darker Blue)
- #4054b2 (Medium Blue)
- #4169e1 (Royal Blue)
- #000c28 (Very Dark Blue/Almost Black - Use this thoughtfully for data elements, perhaps for borders on lighter elements or if it provides good contrast against other data elements on the light chart background. Be mindful it's also the main app background color.)

Consider the data types, the relationships between data points, and the overall goal of the visualization.
The 'chartJsConfiguration' field MUST be a string containing valid JSON compatible with Chart.js.

Example for 'chartJsConfiguration' dataset colors:
"datasets": [{
  "label": "Sample",
  "data": [10, 20],
  "backgroundColor": ["#132c76", "#09194a"], // Use the specified palette
  "borderColor": ["#132c76", "#09194a"]    // Use the specified palette
}]

Example for 'chartJsConfiguration' options to ensure text and gridlines are correctly colored for a light chart background:
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

Ensure 'chartJsType' and 'chartJsConfiguration' are ALWAYS provided and are NOT empty strings.

Output JSON structure MUST be:
{
  "chartJsType": "The suggested Chart.js chart type (e.g., 'bar', 'line')",
  "chartJsConfiguration": "The suggested Chart.js configuration as a JSON string. This string must be parseable into an object with 'data' and 'options' keys.",
  "reasoning": "Explanation of why this chart type and configuration were suggested."
}
`,
});

const suggestChartConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestChartConfigurationFlow',
    inputSchema: SuggestChartConfigurationInputSchema,
    outputSchema: SuggestChartConfigurationOutputSchema, // Flow returns the validated, discriminated union
  },
  async (input: SuggestChartConfigurationInput): Promise<SuggestChartConfigurationOutput> => {
    const { output: aiOutput, error: aiError } = await chartJsPrompt(input);

    if (aiError || !aiOutput) {
      const errorMsg = aiError ? aiError.message : 'AI failed to generate a response.';
      console.error('AI Prompt Error:', errorMsg, 'Input was:', JSON.stringify(input, null, 2));
      throw new Error(`AI Prompt Error: ${errorMsg}`);
    }

    if (!aiOutput.chartJsType || !aiOutput.chartJsConfiguration || !aiOutput.reasoning) {
      console.error(
        'AI Incomplete Chart.js Output - AI RESPONSE:', JSON.stringify(aiOutput, null, 2),
        'Input was:', JSON.stringify(input, null, 2)
      );
      throw new Error('AI did not provide chartJsType, chartJsConfiguration, or reasoning.');
    }

    // Validate chartJsType
    const supportedTypes = SupportedChartJsTypesEnum.options;
    if (!supportedTypes.includes(aiOutput.chartJsType as any)) {
        console.error(
            'AI provided an unsupported chartJsType:', aiOutput.chartJsType,
            'Supported types are:', supportedTypes.join(', '),
            'Full AI Response:', JSON.stringify(aiOutput, null, 2)
        );
        throw new Error(`AI provided an unsupported chartJsType: ${aiOutput.chartJsType}. Supported types are: ${supportedTypes.join(', ')}.`);
    }


    // Validate chartJsConfiguration is valid JSON
    try {
      JSON.parse(aiOutput.chartJsConfiguration);
    } catch (e) {
      console.error(
        'AI Invalid Chart.js Configuration JSON - AI RESPONSE:', JSON.stringify(aiOutput, null, 2),
        'Input was:', JSON.stringify(input, null, 2),
        'Parsing error:', e
      );
      throw new Error('AI provided chartJsConfiguration that is not valid JSON.');
    }

    return {
      chartJsType: aiOutput.chartJsType as z.infer<typeof SupportedChartJsTypesEnum>,
      chartJsConfiguration: aiOutput.chartJsConfiguration,
      reasoning: aiOutput.reasoning,
    };
  }
);
