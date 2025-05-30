
'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react'; // Removed Download, FileJson, Share2
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
  onTriggerAISuggestion?: () => void; 
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
  const buttonClassName = "text-xs px-2 py-1 h-auto text-muted-foreground hover:text-foreground";

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {isAIEnabled && onTriggerAISuggestion && (
        <Button 
          variant="outline" 
          onClick={onTriggerAISuggestion} 
          className={`${buttonClassName} bg-accent hover:bg-accent/90 text-accent-foreground`}
        >
          <Sparkles className="mr-1 h-3 w-3" />
          AI Suggest
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={buttonClassName} disabled={!hasChartData}>
            Download
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
            JSON Config
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" className={buttonClassName} onClick={onShareUrl}>
        Share URL
      </Button>
    </div>
  );
}
