
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
          color: 'hsl(var(--card-foreground))', // Dark text for light chart background
        },
      },
      title: {
        display: true,
        text: 'Chart',
        color: 'hsl(var(--card-foreground))', // Dark text for light chart background
      },
      tooltip: { // Tooltip appears over the chart, on the dark app background
        backgroundColor: 'hsl(var(--popover))', // Dark popover background
        titleColor: 'hsl(var(--popover-foreground))', // Light text
        bodyColor: 'hsl(var(--popover-foreground))', // Light text
        borderColor: 'hsl(var(--border))', // Use border color for tooltip border
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: 'hsl(var(--card-foreground))' }, // Dark text
        grid: { color: 'hsl(var(--border))' }, // Defined border color (e.g., a3aabf)
        title: { color: 'hsl(var(--card-foreground))', display: true } // Dark text
      },
      y: {
        ticks: { color: 'hsl(var(--card-foreground))' }, // Dark text
        grid: { color: 'hsl(var(--border))' }, // Defined border color
        title: { color: 'hsl(var(--card-foreground))', display: true } // Dark text
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...chartOptions };

  // Ensure scales are explicitly defined for relevant chart types if not provided by AI
  if (chartType === 'bar' || chartType === 'line' || chartType === 'scatter' || chartType === 'bubble') {
    if (!mergedOptions.scales) mergedOptions.scales = {};
    if (!mergedOptions.scales.x) mergedOptions.scales.x = { type: 'category', ticks: { color: 'hsl(var(--card-foreground))' }, grid: { color: 'hsl(var(--border))' }, title: { color: 'hsl(var(--card-foreground))', display: true } };
    if (!mergedOptions.scales.y) mergedOptions.scales.y = { type: 'linear', ticks: { color: 'hsl(var(--card-foreground))' }, grid: { color: 'hsl(var(--border))' }, title: { color: 'hsl(var(--card-foreground))', display: true } };
  }
  
  // For pie/doughnut charts, cartesian axes are usually not displayed.
  // For polar/radar charts, ensure radial scale colors are correct.
  if (chartType === 'pie' || chartType === 'doughnut') {
      if (!mergedOptions.scales) {
          mergedOptions.scales = {};
      }
      // Merge with existing scale options from AI/default, but ensure display is false for pie/doughnut
      mergedOptions.scales.x = { ...mergedOptions.scales.x, display: false };
      mergedOptions.scales.y = { ...mergedOptions.scales.y, display: false };
  } else if (chartType === 'polarArea' || chartType === 'radar') {
    if (mergedOptions.scales?.r) { 
        mergedOptions.scales.r.ticks = { ...mergedOptions.scales.r.ticks, color: 'hsl(var(--card-foreground))' };
        mergedOptions.scales.r.grid = { ...mergedOptions.scales.r.grid, color: 'hsl(var(--border))' };
        mergedOptions.scales.r.pointLabels = { ...mergedOptions.scales.r.pointLabels, color: 'hsl(var(--card-foreground))' };
        mergedOptions.scales.r.angleLines = { ...mergedOptions.scales.r.angleLines, color: 'hsl(var(--border))' };
    }
  }


  // The div uses bg-card, which is now white (or light) from globals.css
  return (
    <div className="relative h-[calc(100vh-60px)] w-full bg-card p-1 rounded-lg shadow-md">
      <ChartComponent ref={chartRef} data={chartData} options={mergedOptions} />
    </div>
  );
}
