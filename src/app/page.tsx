
'use client';

import type { ChartConfig, SupportedChartType } from '@/types';
import { ChartRenderer } from '@/components/ChartRenderer';
import { ActionToolbar } from '@/components/ActionToolbar';
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
  // Removed aiSuggestion and isAISuggestionDialogOpen states
  
  const chartRef = useRef<ChartJS | null>(null);

  const updateUrlParams = useCallback((newConfig: ChartConfig) => {
    const params = new URLSearchParams();
    params.set('chartType', newConfig.type);
    params.set('chartData', JSON.stringify(newConfig.data));
    params.set('chartOptions', JSON.stringify(newConfig.options));
    // This function now solely updates the URL to reflect an applied chart configuration.
    // AI-specific parameters (fbrnd, aiPrompt, aiData) are not included here.
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const fbrndParam = searchParams.get('fbrnd');
    let aiPromptParam = searchParams.get('aiPrompt');
    let aiDataParam = searchParams.get('aiData');
    const chartTypeParam = searchParams.get('chartType') as SupportedChartType | null;
    const chartDataParam = searchParams.get('chartData');
    const chartOptionsParam = searchParams.get('chartOptions');

    // Prioritize AI suggestion if its params are present
    if (fbrndParam || (aiPromptParam && aiDataParam)) {
      const effectivePrompt = fbrndParam || aiPromptParam!;
      // If fbrnd is used, aiData might not be present, so default to '{}'
      // If aiPrompt is used, aiData must be present.
      const effectiveData = fbrndParam ? (searchParams.get('aiData') || '{}') : aiDataParam!;
      
      setIsLoadingAI(true);
      setChartConfig(null); // Clear previous chart while AI is loading

      getAISuggestion({ description: effectivePrompt, data: effectiveData })
        .then((suggestionResult) => {
          if ('error' in suggestionResult) {
            toast({ variant: 'destructive', title: 'AI Suggestion Error', description: suggestionResult.error });
            setChartConfig(DEFAULT_CHART_CONFIG);
            updateUrlParams(DEFAULT_CHART_CONFIG); // Reset URL to default chart
          } else {
            try {
              const parsedConfig = JSON.parse(suggestionResult.configuration);
              const newChartConfig: ChartConfig = {
                type: suggestionResult.chartType as SupportedChartType,
                data: parsedConfig.data as ChartData,
                options: parsedConfig.options as ChartOptions,
              };
              setChartConfig(newChartConfig); // Apply suggestion directly
              updateUrlParams(newChartConfig); // Update URL with applied chart config, AI params implicitly removed
            } catch (e) {
              toast({ variant: 'destructive', title: 'AI Application Error', description: 'Could not apply AI suggestion due to invalid configuration format.' });
              setChartConfig(DEFAULT_CHART_CONFIG);
              updateUrlParams(DEFAULT_CHART_CONFIG); // Reset URL
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
        // No need to call updateUrlParams here if params are already good and read.
      } catch (e) {
        toast({ variant: 'destructive', title: 'URL Parsing Error', description: 'Invalid chart data or options in URL.' });
        setChartConfig(DEFAULT_CHART_CONFIG);
        updateUrlParams(DEFAULT_CHART_CONFIG); // Reset URL to default if params are bad
      }
    } else {
      // No specific params, chartConfig remains null, shows loader
      setChartConfig(null);
    }
  }, [searchParams, toast, updateUrlParams, router]); // Added router to dependencies of useEffect

  const handleDownloadImage = (format: 'png' | 'jpeg') => {
    if (chartRef.current) {
      const dataUrl = chartRef.current.toBase64Image(format === 'jpeg' ? 'image/jpeg' : 'image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `chart.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({ variant: 'destructive', title: 'Download Error', description: 'Chart instance not available.' });
    }
  };

  const handleDownloadConfig = () => {
    if (chartConfig) {
      const configStr = JSON.stringify(chartConfig, null, 2);
      const blob = new Blob([configStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart_config.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      toast({ variant: 'destructive', title: 'Download Error', description: 'No chart configuration available to download.' });
    }
  };

  const handleShareUrl = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        // Informational toast removed
      })
      .catch(() => toast({ variant: 'destructive', title: 'Copy Error', description: 'Could not copy URL to clipboard.' }));
  };
  
  // handleLoadSample and related button removed

  if (isLoadingAI) {
    return <LoadingSpinner />; // Only loader, no text
  }

  if (!chartConfig) {
    // This replaces the welcome card with a loader if no chart is configured and not loading AI
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-1 sm:p-2 md:p-1 flex flex-col min-h-screen">
      <header className="mb-1">
        <div className="flex flex-col sm:flex-row justify-end items-center gap-1">
          <ActionToolbar
            onDownloadImage={handleDownloadImage}
            onDownloadConfig={handleDownloadConfig}
            onShareUrl={handleShareUrl}
            isAIEnabled={false} // Manual AI trigger button removed from toolbar
            hasChartData={!!chartConfig}
          />
        </div>
      </header>

      <main className="flex-grow">
        {/* ChartRenderer will always be rendered if chartConfig is available */}
        <ChartRenderer
          chartType={chartConfig.type}
          chartData={chartConfig.data}
          chartOptions={chartConfig.options}
          chartRef={chartRef}
        />
      </main>

      {/* AISuggestionDialog component usage removed */}
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
