
import type { ChartData, ChartOptions, ChartType as ChartJsType } from 'chart.js';

export interface ChartConfig {
  type: ChartJsType;
  data: ChartData;
  options: ChartOptions;
}

// Allow any Chart.js type
export type SupportedChartType = ChartJsType;
