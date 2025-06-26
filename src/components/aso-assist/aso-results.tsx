import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">{title}</h3>
          <CopyButton textToCopy={textToCopy} />
        </div>
        <div className="bg-secondary p-6 rounded-lg">
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8">
       <div className="flex flex-col items-center gap-2 text-center">
        <Wand2 className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">
          Generated Aims, Skills, and Outcomes
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Here are the suggested ASOs for your course material. You can copy each section to your clipboard.
        </p>
      </div>
      
      <div className="space-y-6">
        <Section title="Aims" items={aims} />
        <Section title="Skills" items={skills} />
        <Section title="Outcomes" items={outcomes} />
      </div>
    </div>
  );
}
