
'use client';

import type { ChartConfig, SupportedChartType } from '@/types';
import { ChartRenderer } from '@/components/ChartRenderer';
import { ActionToolbar } from '@/components/ActionToolbar';
import { AISuggestionDialog } from '@/components/AISuggestionDialog';
import { getAISuggestion } from '@/lib/actions';
import type { SuggestChartConfigurationOutput } from '@/ai/flows/suggest-chart-configuration';
import { useToast } from '@/hooks/use-toast';

import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Chart as ChartJS, ChartData, ChartOptions } from 'chart.js';
import { AlertTriangle, Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const [aiSuggestion, setAISuggestion] = useState<SuggestChartConfigurationOutput | null>(null);
  const [isAISuggestionDialogOpen, setIsAISuggestionDialogOpen] = useState(false);
  
  const chartRef = useRef<ChartJS | null>(null);

  const updateUrlParams = useCallback((newConfig: ChartConfig) => {
    const params = new URLSearchParams();
    params.set('chartType', newConfig.type);
    params.set('chartData', JSON.stringify(newConfig.data));
    params.set('chartOptions', JSON.stringify(newConfig.options));
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const chartTypeParam = searchParams.get('chartType') as SupportedChartType | null;
    const chartDataParam = searchParams.get('chartData');
    const chartOptionsParam = searchParams.get('chartOptions');
    const aiPromptParam = searchParams.get('aiPrompt');
    const aiDataParam = searchParams.get('aiData');

    if (aiPromptParam && aiDataParam) {
      setIsLoadingAI(true);
      getAISuggestion({ description: aiPromptParam, data: aiDataParam })
        .then((suggestionResult) => {
          if ('error' in suggestionResult) {
            toast({ variant: 'destructive', title: 'AI Suggestion Error', description: suggestionResult.error });
            // Fallback to default or existing params if AI fails
            if (chartTypeParam && chartDataParam) {
               try {
                const data = JSON.parse(chartDataParam);
                const options = chartOptionsParam ? JSON.parse(chartOptionsParam) : {};
                setChartConfig({ type: chartTypeParam, data, options });
              } catch (e) {
                toast({ variant: 'destructive', title: 'URL Parsing Error', description: 'Invalid chart data or options in URL.' });
                setChartConfig(DEFAULT_CHART_CONFIG); // Fallback to default
              }
            } else {
              setChartConfig(DEFAULT_CHART_CONFIG);
            }
          } else {
            setAISuggestion(suggestionResult);
            setIsAISuggestionDialogOpen(true);
            // Don't apply suggestion automatically, let user do it.
            // If no other params, show default chart in background
            if (!chartTypeParam || !chartDataParam) {
                setChartConfig(DEFAULT_CHART_CONFIG);
            } else {
                 try {
                    const data = JSON.parse(chartDataParam);
                    const options = chartOptionsParam ? JSON.parse(chartOptionsParam) : {};
                    setChartConfig({ type: chartTypeParam, data, options });
                } catch (e) {
                    setChartConfig(DEFAULT_CHART_CONFIG);
                }
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
        updateUrlParams(DEFAULT_CHART_CONFIG); // Reset URL to default if params are bad
      }
    } else {
      // No specific params, load default or empty state
      setChartConfig(null); // Initially null to show placeholder
    }
  }, [searchParams, toast, updateUrlParams]);

  const handleApplyAISuggestion = (suggestion: SuggestChartConfigurationOutput) => {
    try {
      const parsedConfig = JSON.parse(suggestion.configuration);
      const newChartConfig: ChartConfig = {
        type: suggestion.chartType as SupportedChartType,
        data: parsedConfig.data as ChartData,
        options: parsedConfig.options as ChartOptions,
      };
      setChartConfig(newChartConfig);
      updateUrlParams(newChartConfig); // Update URL with AI suggested config
      setIsAISuggestionDialogOpen(false);
      setAISuggestion(null);
      // Remove AI params from URL
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.delete('aiPrompt');
      currentParams.delete('aiData');
      router.replace(`/?${currentParams.toString()}`, { scroll: false });
      toast({ title: 'AI Suggestion Applied', description: 'Chart updated with AI configuration.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'AI Suggestion Error', description: 'Could not apply AI suggestion due to invalid configuration format.' });
    }
  };

  const handleDownloadImage = (format: 'png' | 'jpeg') => {
    if (chartRef.current) {
      const dataUrl = chartRef.current.toBase64Image(format === 'jpeg' ? 'image/jpeg' : 'image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `chartverse_chart.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Download Started', description: `Chart downloaded as ${format.toUpperCase()}.` });
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
      link.download = 'chartverse_config.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Download Started', description: 'Chart configuration downloaded.' });
    } else {
      toast({ variant: 'destructive', title: 'Download Error', description: 'No chart configuration available to download.' });
    }
  };

  const handleShareUrl = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast({ title: 'URL Copied', description: 'Chart URL copied to clipboard.' }))
      .catch(() => toast({ variant: 'destructive', title: 'Copy Error', description: 'Could not copy URL to clipboard.' }));
  };
  
  const handleLoadSample = () => {
    setChartConfig(DEFAULT_CHART_CONFIG);
    updateUrlParams(DEFAULT_CHART_CONFIG);
    toast({ title: 'Sample Chart Loaded', description: 'A sample chart configuration has been loaded.' });
  };

  if (isLoadingAI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Generating AI Suggestion...</h2>
        <p className="text-muted-foreground">Please wait while our AI crafts the perfect chart for you.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 flex flex-col min-h-screen">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">ChartVerse</h1>
          </div>
          <ActionToolbar
            onDownloadImage={handleDownloadImage}
            onDownloadConfig={handleDownloadConfig}
            onShareUrl={handleShareUrl}
            isAIEnabled={true} 
            hasChartData={!!chartConfig}
          />
        </div>
      </header>

      <main className="flex-grow">
        {chartConfig ? (
          <ChartRenderer
            chartType={chartConfig.type}
            chartData={chartConfig.data}
            chartOptions={chartConfig.options}
            chartRef={chartRef}
          />
        ) : (
          <Card className="w-full max-w-2xl mx-auto text-center shadow-xl border-2 border-dashed border-border">
            <CardHeader>
              <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                 <BarChart3 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl mt-4">Welcome to ChartVerse!</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Visualize your data dynamically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                To get started, provide chart configuration via URL parameters (&lt;code&gt;chartType&lt;/code&gt;, &lt;code&gt;chartData&lt;/code&gt;, &lt;code&gt;chartOptions&lt;/code&gt;).
              </p>
              <p>
                Or, use our AI to suggest a chart by adding &lt;code&gt;aiPrompt&lt;/code&gt; (your visualization goal) and &lt;code&gt;aiData&lt;/code&gt; (your data in JSON/CSV) to the URL.
              </p>
              <Button onClick={handleLoadSample} size="lg" className="mt-4">
                Load Sample Chart
              </Button>
               <p className="text-xs text-muted-foreground mt-2">
                Example for AI: &lt;code&gt;{`?aiPrompt=Show sales per region&aiData=[{"region":"North","sales":100},{"region":"South","sales":150}]`}&lt;/code&gt;
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {aiSuggestion && (
        <AISuggestionDialog
          isOpen={isAISuggestionDialogOpen}
          onOpenChange={setIsAISuggestionDialogOpen}
          suggestion={aiSuggestion}
          onApplySuggestion={handleApplyAISuggestion}
        />
      )}

      <footer className="mt-8 py-4 text-center text-sm text-muted-foreground border-t">
        ChartVerse - Dynamic and AI-Powered Chart Generation.
      </footer>
    </div>
  );
}

export default function Page() {
  // Suspense is required for useSearchParams hook
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

