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
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCopy} 
                    className="text-accent hover:text-accent h-8 w-8 shrink-0"
                >
                    {isCopied ? <Check className="text-green-500" /> : <ClipboardCopy />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Copy to clipboard</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
