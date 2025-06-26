import { Loader2 } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Analyzing your materials...
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          The genie is working its magic. This might take a moment.
        </p>
      </div>
    </div>
  );
}
