
'use client';

import type { ChartData, ChartOptions, ChartType as ChartJSChartType } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter, Bubble, Radar, PolarArea } from 'react-chartjs-2';
import type { ForwardedRef } from 'react';
import React, { useEffect, useRef } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler
);

interface ChartRendererProps {
  chartType: ChartJSChartType;
  chartData: ChartData;
  chartOptions?: ChartOptions;
  chartRef?: ForwardedRef<ChartJS | null>;
}

const chartComponentsMap: { [key in ChartJSChartType]?: React.ComponentType<any> } = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
  scatter: Scatter,
  bubble: Bubble,
  radar: Radar,
  polarArea: PolarArea,
};

export function ChartRenderer({ chartType, chartData, chartOptions, chartRef }: ChartRendererProps) {
  const ChartComponent = chartComponentsMap[chartType] || Bar; // Default to Bar chart if type is unknown

  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'hsl(var(--foreground))', 
        },
      },
      title: {
        display: true,
        text: 'Chart',
        color: 'hsl(var(--foreground))',
      },
      tooltip: {
        backgroundColor: 'hsl(var(--background))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: 'hsl(var(--foreground))' },
        grid: { color: 'hsl(var(--border))' },
        title: { color: 'hsl(var(--foreground))', display: true }
      },
      y: {
        ticks: { color: 'hsl(var(--foreground))' },
        grid: { color: 'hsl(var(--border))' },
        title: { color: 'hsl(var(--foreground))', display: true }
      },
    },
    color: 'hsl(var(--foreground))', 
  };

  const mergedOptions = { ...defaultOptions, ...chartOptions };

  if (chartType === 'bar' || chartType === 'line' || chartType === 'scatter' || chartType === 'bubble') {
    if (!mergedOptions.scales) mergedOptions.scales = {};
    if (!mergedOptions.scales.x) mergedOptions.scales.x = { type: 'category', ticks: { color: 'hsl(var(--foreground))' }, grid: { color: 'hsl(var(--border))' } };
    if (!mergedOptions.scales.y) mergedOptions.scales.y = { type: 'linear', ticks: { color: 'hsl(var(--foreground))' }, grid: { color: 'hsl(var(--border))' } };
  }

  return (
    // Adjusted height calculation: reduced top/bottom combined spacing (e.g. header, page padding)
    // Old: h-[calc(100vh-160px)] md:h-[calc(100vh-200px)]
    // New: h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] 
    // Further reduced after footer removal and header shrinking:
    // Assuming header is now ~40px, page padding (p-4) ~32px top/bottom
    // Let's try a more aggressive height for the chart area
    <div className="relative h-[calc(100vh-60px)] w-full bg-card p-1 rounded-lg shadow-md">
      <ChartComponent ref={chartRef} data={chartData} options={mergedOptions} />
    </div>
  );
}
