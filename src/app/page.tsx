
'use client';

import type { ChartConfig, SupportedChartType } from '@/types';
import { ChartRenderer } from '@/components/ChartRenderer';
import { getAISuggestion } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Chart as ChartJS, ChartData, ChartOptions } from 'chart.js';
import { Loader2 } from 'lucide-react';

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
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const chartRef = useRef<ChartJS | null>(null);

  const updateUrlWithChartJs = useCallback((newConfig: ChartConfig) => {
    const params = new URLSearchParams(searchParams.toString()); // Preserve existing params
    params.set('chartType', newConfig.type);
    params.set('chartData', JSON.stringify(newConfig.data));
    params.set('chartOptions', JSON.stringify(newConfig.options));
    
    // Clean up old/irrelevant params
    params.delete('fbrnd');
    params.delete('aiPrompt');
    params.delete('aiData');
    params.delete('diagramType');
    params.delete('mermaidDefinition');

    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    const fbrndParam = searchParams.get('fbrnd');
    let aiPromptParam = searchParams.get('aiPrompt');
    let aiDataParam = searchParams.get('aiData');
    const chartTypeParam = searchParams.get('chartType') as SupportedChartType | null;
    const chartDataParam = searchParams.get('chartData');
    const chartOptionsParam = searchParams.get('chartOptions');

    setAiReasoning(null); // Clear reasoning on any param change

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
            setAiReasoning("Failed to generate chart due to an AI error. Displaying a default chart.");
            updateUrlWithChartJs(DEFAULT_CHART_CONFIG); 
          } else {
            try {
              const parsedConfig = JSON.parse(suggestionResult.chartJsConfiguration);
              const newChartConfig: ChartConfig = {
                type: suggestionResult.chartJsType as SupportedChartType,
                data: parsedConfig.data as ChartData,
                options: parsedConfig.options as ChartOptions,
              };
              setChartConfig(newChartConfig);
              setAiReasoning(suggestionResult.reasoning);
              updateUrlWithChartJs(newChartConfig); 
            } catch (e) {
              toast({ variant: 'destructive', title: 'AI Application Error', description: 'Could not apply AI suggestion due to invalid configuration format.' });
              setChartConfig(DEFAULT_CHART_CONFIG);
              setAiReasoning("Failed to process AI chart configuration. Displaying a default chart.");
              updateUrlWithChartJs(DEFAULT_CHART_CONFIG); 
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
        // No AI reasoning if chart is loaded directly from URL params without AI call
        setAiReasoning(null); 
      } catch (e) {
        toast({ variant: 'destructive', title: 'URL Parsing Error', description: 'Invalid chart data or options in URL.' });
        setChartConfig(DEFAULT_CHART_CONFIG);
        setAiReasoning("Failed to load chart from URL. Displaying a default chart.");
        updateUrlWithChartJs(DEFAULT_CHART_CONFIG); 
      }
    } else {
      // No params, show nothing or a welcome message (currently shows spinner then nothing if chartConfig remains null)
      setChartConfig(null);
      setAiReasoning(null);
    }
  }, [searchParams, toast, updateUrlWithChartJs]);


  if (isLoadingAI) {
    return <LoadingSpinner />; 
  }

  if (!chartConfig) {
    // This state could be used to show a welcome message or instructions
    // For now, it might show a spinner indefinitely if no params lead to chartConfig setting
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-1 sm:p-2 md:p-1 flex flex-col min-h-screen">
      <main className="flex-grow pt-2">
        <ChartRenderer
          chartType={chartConfig.type}
          chartData={chartConfig.data}
          chartOptions={chartConfig.options}
          chartRef={chartRef}
        />
        {aiReasoning && (
          <p className="mt-4 text-center text-accent text-[15px] px-4 pb-4">
            {aiReasoning}
          </p>
        )}
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
