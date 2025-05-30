
'use client';

import { Button } from '@/components/ui/button';
import { Download, FileJson, Share2, Sparkles, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionToolbarProps {
  onDownloadImage: (format: 'png' | 'jpeg') => void;
  onDownloadConfig: () => void;
  onShareUrl: () => void;
  onTriggerAISuggestion?: () => void; // Optional if AI is triggered by URL param
  isAIEnabled: boolean;
  hasChartData: boolean;
}

export function ActionToolbar({
  onDownloadImage,
  onDownloadConfig,
  onShareUrl,
  onTriggerAISuggestion,
  isAIEnabled,
  hasChartData,
}: ActionToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {isAIEnabled && onTriggerAISuggestion && (
        <Button variant="outline" onClick={onTriggerAISuggestion} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Suggest Chart
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={!hasChartData}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Download Chart</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDownloadImage('png')} disabled={!hasChartData}>
            PNG Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDownloadImage('jpeg')} disabled={!hasChartData}>
            JPEG Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownloadConfig} disabled={!hasChartData}>
            <FileJson className="mr-2 h-4 w-4" /> JSON Config
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" onClick={onShareUrl}>
        <Share2 className="mr-2 h-4 w-4" /> Share URL
      </Button>
    </div>
  );
}
