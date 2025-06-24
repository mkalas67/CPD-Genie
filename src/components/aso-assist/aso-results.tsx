import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';
import { CopyButton } from './copy-button';

type AsoResultsProps = {
  asoData: GenerateAsosOutput;
};

export default function AsoResults({ asoData }: AsoResultsProps) {
  const { aims, skills, outcomes } = asoData;

  const Section = ({ title, items }: { title: string; items: string[] | undefined }) => {
    if (!items || items.length === 0) return null;

    const textToCopy = items.join('\n');

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <CopyButton textToCopy={textToCopy} />
        </div>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <Wand2 className="h-6 w-6 text-primary" />
          Generated Aims, Skills, and Outcomes
        </CardTitle>
        <CardDescription>
          Here are the suggested ASOs for your course material. You can copy each section to your clipboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {aims && aims.length > 0 && <Section title="Aims" items={aims} />}
        {skills && skills.length > 0 && <Section title="Skills" items={skills} />}
        {outcomes && outcomes.length > 0 && <Section title="Outcomes" items={outcomes} />}
      </CardContent>
    </Card>
  );
}
