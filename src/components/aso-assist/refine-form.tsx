'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import type { SupportedModel } from '@/ai/models';

type RefineFormProps = {
  questions: string[];
  isPending: boolean;
  context?: string;
  courseDescription?: string;
  suggestedFrameworks?: string[];
  model: SupportedModel;
};

export default function RefineForm({ questions, isPending, context, courseDescription, suggestedFrameworks, model }: RefineFormProps) {
  if (!questions || questions.length === 0) {
    return null;
  }
  
  const frameworkQuestion = suggestedFrameworks && suggestedFrameworks.length > 0 
    ? `Would you like me to align the ASOs using a formal framework such as ${suggestedFrameworks.join(' or ')}? This may help with recognition by clients or employers.`
    : null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 sm:p-8 w-full">
      <div className="flex items-start gap-3 mb-6">
          <Lightbulb className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div>
              <h2 className="text-2xl font-bold tracking-tight">
                  Refine Your Results
              </h2>
              <p className="text-muted-foreground">
                  For even better results, answer the following questions.
              </p>
          </div>
      </div>
    
      <div className="space-y-8">
          {/* Pass original context, description, and model so they're included in refinement submission */}
          {context && <input type="hidden" name="context" value={context} />}
          {courseDescription && <input type="hidden" name="courseDescription" value={courseDescription} />}
          <input type="hidden" name="model" value={model} />
          
          {frameworkQuestion && (
             <div className="space-y-3">
              <Label htmlFor={`answer_framework`} className="font-medium text-foreground">
                {frameworkQuestion}
              </Label>
              <input type="hidden" name={`question_framework`} value={frameworkQuestion} />
              <Textarea
                id={`answer_framework`}
                name={`answer_framework`}
                placeholder="Your answer..."
                className="bg-background"
                rows={2}
              />
            </div>
          )}

          {questions.map((question, index) => (
            <div key={index} className="space-y-3">
              <Label htmlFor={`answer_${index}`} className="font-medium text-foreground">
                {question}
              </Label>
              <input type="hidden" name={`question_${index}`} value={question} />
              <Textarea
                id={`answer_${index}`}
                name={`answer_${index}`}
                placeholder="Your answer..."
                className="bg-background"
                rows={4}
              />
            </div>
          ))}
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Refining...
              </>
            ) : (
              'Refine ASOs'
            )}
          </Button>
      </div>
    </div>
  );
}
