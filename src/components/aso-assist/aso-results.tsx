import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
import { Wand2, Clock, CheckSquare } from 'lucide-react';
import { CopyButton } from './copy-button';

type AsoResultsProps = {
  asoData: GenerateAsosOutput;
};

export default function AsoResults({ asoData }: AsoResultsProps) {
  const { aims, skills, outcomes, cpdEstimate, suggestedFrameworks } = asoData;

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
            <ul className="list-disc space-y-2 pl-5 text-foreground">
              {items.map((item, index) => (
                <li key={index} className="break-words">{item}</li>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cpdEstimate && (
          <div className="flex items-start gap-4 rounded-lg border bg-card p-4 shadow-sm">
            <Clock className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-foreground">Estimated CPD</p>
              <p className="text-sm text-muted-foreground">{cpdEstimate}</p>
            </div>
          </div>
        )}
        
        {suggestedFrameworks && suggestedFrameworks.length > 0 && (
          <div className="flex items-start gap-4 rounded-lg border bg-card p-4 shadow-sm">
            <CheckSquare className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
             <div>
              <p className="font-bold text-foreground">Suggested Frameworks</p>
              <p className="text-sm text-muted-foreground">{suggestedFrameworks.join(', ')}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        <Section title="Aims" items={aims} />
        <Section title="Skills" items={skills} />
        <Section title="Outcomes" items={outcomes} />
      </div>
    </div>
  );
}
