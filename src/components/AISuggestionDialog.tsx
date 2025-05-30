
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SuggestChartConfigurationOutput } from '@/ai/flows/suggest-chart-configuration';

interface AISuggestionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  suggestion: SuggestChartConfigurationOutput | null;
  onApplySuggestion: (suggestion: SuggestChartConfigurationOutput) => void;
}

export function AISuggestionDialog({
  isOpen,
  onOpenChange,
  suggestion,
  onApplySuggestion,
}: AISuggestionDialogProps) {
  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Chart Suggestion</DialogTitle>
          <DialogDescription>
            Our AI has analyzed your request and data. Here's a suggested chart configuration.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
          <div className="grid gap-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested Chart Type</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary font-semibold">{suggestion.chartType}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reasoning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration Preview (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-60">
                  {JSON.stringify(JSON.parse(suggestion.configuration), null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onApplySuggestion(suggestion)}>Apply Suggestion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
