import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Target, Wrench } from 'lucide-react';
import { CopyButton } from './copy-button';

type AsoResultsProps = {
  asoData: GenerateAsosOutput;
};

export default function AsoResults({ asoData }: AsoResultsProps) {
  const { aims, skills, outcomes } = asoData;

  const renderSection = (title: string, items: string[], Icon: React.ElementType) => {
    if (!items || items.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline">
            <Icon className="text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-md">
                <p className="flex-1 text-card-foreground/90">{item}</p>
                <CopyButton textToCopy={item} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderSection('Aims', aims, Target)}
      {renderSection('Skills', skills, Wrench)}
      {renderSection('Outcomes', outcomes, ListChecks)}
    </div>
  );
}
