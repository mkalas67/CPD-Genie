import type { AnalyticsLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

type AnalyticsDisplayProps = {
  logs: AnalyticsLog[];
};

export default function AnalyticsDisplay({ logs }: AnalyticsDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BarChart2 />
          Analytics Log
        </CardTitle>
        <CardDescription>
          Shows a log of generation requests for demonstration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <div className="bg-muted/50 rounded-md p-3 max-h-60 overflow-y-auto">
            <pre className="text-sm font-code whitespace-pre-wrap">
              {JSON.stringify(logs, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center p-4">No requests logged yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
