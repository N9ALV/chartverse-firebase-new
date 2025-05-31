
'use client';

import type { ChartConfig, SupportedChartType } from '@/types';
import { ChartRenderer } from '@/components/ChartRenderer';
// ActionToolbar removed
// AISuggestionDialog removed
import { getAISuggestion } from '@/lib/actions';
// SuggestChartConfigurationOutput type is no longer needed here directly for a dialog
import { useToast } from '@/hooks/use-toast';

import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Chart as ChartJS, ChartData, ChartOptions } from 'chart.js';
import { Loader2 } from 'lucide-react';
// Card components for welcome screen removed

const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar' as SupportedChartType,
  data: {
    labels: ['Sample A', 'Sample B', 'Sample C'],
    datasets: [
      {
        label: 'Sample Dataset',
        data: [10, 20, 15],
        backgroundColor: 'hsla(var(--primary), 0.7)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Sample Chart' },
    },
  },
};


function ChartVersePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const chartRef = useRef<ChartJS | null>(null);

  const updateUrlParams = useCallback((newConfig: ChartConfig) => {
    const params = new URLSearchParams();
    params.set('chartType', newConfig.type);
    params.set('chartData', JSON.stringify(newConfig.data));
    params.set('chartOptions', JSON.stringify(newConfig.options));
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const fbrndParam = searchParams.get('fbrnd');
    let aiPromptParam = searchParams.get('aiPrompt');
    let aiDataParam = searchParams.get('aiData');
    const chartTypeParam = searchParams.get('chartType') as SupportedChartType | null;
    const chartDataParam = searchParams.get('chartData');
    const chartOptionsParam = searchParams.get('chartOptions');

    if (fbrndParam || (aiPromptParam && aiDataParam)) {
      const effectivePrompt = fbrndParam || aiPromptParam!;
      const effectiveData = fbrndParam ? (searchParams.get('aiData') || '{}') : aiDataParam!;
      
      setIsLoadingAI(true);
      setChartConfig(null); 

      getAISuggestion({ description: effectivePrompt, data: effectiveData })
        .then((suggestionResult) => {
          if ('error' in suggestionResult) {
            toast({ variant: 'destructive', title: 'AI Suggestion Error', description: suggestionResult.error });
            setChartConfig(DEFAULT_CHART_CONFIG);
            updateUrlParams(DEFAULT_CHART_CONFIG); 
          } else {
            try {
              const parsedConfig = JSON.parse(suggestionResult.chartJsConfiguration);
              const newChartConfig: ChartConfig = {
                type: suggestionResult.chartJsType as SupportedChartType,
                data: parsedConfig.data as ChartData,
                options: parsedConfig.options as ChartOptions,
              };
              setChartConfig(newChartConfig); 
              updateUrlParams(newChartConfig); 
            } catch (e) {
              toast({ variant: 'destructive', title: 'AI Application Error', description: 'Could not apply AI suggestion due to invalid configuration format.' });
              setChartConfig(DEFAULT_CHART_CONFIG);
              updateUrlParams(DEFAULT_CHART_CONFIG); 
            }
          }
        })
        .finally(() => setIsLoadingAI(false));
    } else if (chartTypeParam && chartDataParam) {
      try {
        const data = JSON.parse(chartDataParam);
        const options = chartOptionsParam ? JSON.parse(chartOptionsParam) : {};
        const newConfig = { type: chartTypeParam, data, options };
        setChartConfig(newConfig);
      } catch (e) {
        toast({ variant: 'destructive', title: 'URL Parsing Error', description: 'Invalid chart data or options in URL.' });
        setChartConfig(DEFAULT_CHART_CONFIG);
        updateUrlParams(DEFAULT_CHART_CONFIG); 
      }
    } else {
      setChartConfig(null);
    }
  }, [searchParams, toast, updateUrlParams, router]);


  if (isLoadingAI) {
    return <LoadingSpinner />; 
  }

  if (!chartConfig) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-1 sm:p-2 md:p-1 flex flex-col min-h-screen">
      {/* Header with ActionToolbar removed */}
      <main className="flex-grow pt-2">
        <ChartRenderer
          chartType={chartConfig.type}
          chartData={chartConfig.data}
          chartOptions={chartConfig.options}
          chartRef={chartRef}
        />
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChartVersePageContent />
    </Suspense>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
