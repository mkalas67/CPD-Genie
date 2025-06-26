import { Loader2 } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 space-y-6">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Analysing your materials
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          The genie is working its magic. This may take a moment, please don't close the page.
        </p>
      </div>
    </div>
  );
}
