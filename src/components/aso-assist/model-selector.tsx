'use client';

import { useSearchParams } from 'next/navigation';
import { SUPPORTED_MODELS } from '@/ai/models';
import type { SupportedModel } from '@/ai/models';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MODEL_LABELS: Record<SupportedModel, string> = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'claude-sonnet': 'Claude Sonnet',
  'gpt-4o': 'GPT-4o',
};

type ModelSelectorProps = {
  value: SupportedModel;
  onChange: (model: SupportedModel) => void;
};

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const searchParams = useSearchParams();
  const isDevMode = searchParams.get('dev') === 'true';

  if (!isDevMode) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30">
      <Label htmlFor="model-select" className="text-xs text-muted-foreground whitespace-nowrap">
        Model (dev)
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as SupportedModel)}>
        <SelectTrigger id="model-select" className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_MODELS.map((m) => (
            <SelectItem key={m} value={m} className="text-xs">
              {MODEL_LABELS[m]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
