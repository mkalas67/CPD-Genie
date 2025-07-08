'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type CopyButtonProps = {
  textToCopy: string;
};

export function CopyButton({ textToCopy }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    type="button"
                    variant="default" 
                    size="icon" 
                    onClick={handleCopy} 
                    className="h-9 w-9 shrink-0"
                >
                    {isCopied ? <Check /> : <ClipboardCopy />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{isCopied ? 'Copied!' : 'Copy to clipboard'}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
