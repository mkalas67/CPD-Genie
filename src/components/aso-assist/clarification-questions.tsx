import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

type ClarificationQuestionsProps = {
  questions: string[];
};

export default function ClarificationQuestions({ questions }: ClarificationQuestionsProps) {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-amber-500/10 border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-headline text-amber-700 dark:text-amber-400">
          <Lightbulb />
          Clarification Needed
        </CardTitle>
        <CardDescription className="text-amber-600 dark:text-amber-500">
          For better results, please consider the following questions and refine your documents or context:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 list-disc pl-5 text-amber-700 dark:text-amber-400">
          {questions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
