import {z} from 'genkit';

// Defines the list of supported Chart.js chart types
export const SupportedChartJsTypesEnum = z.enum([
  "bar", "line", "pie", "doughnut", "scatter", "bubble", "radar", "polarArea"
]);

export const SuggestChartConfigurationInputSchema = z.object({
  description: z.string().describe('The description of the desired visualization.'),
  data: z.string().describe('The data to be used for the chart, as a JSON string.'),
});
export type SuggestChartConfigurationInput = z.infer<typeof SuggestChartConfigurationInputSchema>;


// This is the schema the AI is expected to output directly.
// It should also be the final validated output of the flow for the Chart.js only version.
export const AIPromptOutputSchema = z.object({
  chartJsType: SupportedChartJsTypesEnum.describe("The suggested Chart.js chart type (e.g., 'bar', 'line'). This field is REQUIRED and must not be empty."),
  chartJsConfiguration: z.string().min(1, { message: "chartJsConfiguration cannot be empty." }).describe("The suggested Chart.js configuration as a JSON string. This string must be parseable into an object with 'data' and 'options' keys. This field is REQUIRED and must not be empty."),
  reasoning: z.string().min(1, { message: "Reasoning cannot be empty." }).describe("Explanation of why this chart type and configuration were suggested. This field is REQUIRED and must not be empty."),
});


// This schema defines the final validated output of the flow.
// For Chart.js only version, this is the same as AIPromptOutputSchema.
export const SuggestChartConfigurationOutputSchema = AIPromptOutputSchema;
export type SuggestChartConfigurationOutput = z.infer<typeof SuggestChartConfigurationOutputSchema>;
