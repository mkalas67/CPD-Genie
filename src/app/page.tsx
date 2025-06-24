'use client';

import React from 'react';
import { useActionState } from 'react';
import { handleGenerateAsos } from '@/lib/actions';
import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
import InputForm from '@/components/aso-assist/input-form';
import AsoResults from '@/components/aso-assist/aso-results';
import ClarificationQuestions from '@/components/aso-assist/clarification-questions';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ActionState = {
  data?: GenerateAsosOutput;
  error?: string;
  input?: {
    context?: string;
    docCount: number;
  };
};

const initialState: ActionState = {};

export default function Home() {
  const [state, formAction, isPending] = useActionState(handleGenerateAsos, initialState);

  const ErrorDisplay = ({ error }: { error: string }) => (
    <Alert variant="destructive" className="bg-red-500/5 border-red-500/20 text-red-700 dark:bg-red-950/20 dark:border-red-500/20 dark:text-red-500">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-bold">Error</AlertTitle>
        <AlertDescription className="text-red-700/90 dark:text-red-500/90">
            {error}
        </AlertDescription>
    </Alert>
  );

  const ResultsSkeleton = () => (
    <div className="space-y-6 mt-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                Course Genie
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                Instantly generate Aims, Skills, and Outcomes for your course.
            </p>
        </header>

        <div className="space-y-8">
            <InputForm action={formAction} isPending={isPending} />

            <div className="mt-8">
                {isPending && <ResultsSkeleton />}

                {state.error && <ErrorDisplay error={state.error} />}

                {state.data && (
                    <div className="space-y-6">
                        {state.data.clarificationQuestions && state.data.clarificationQuestions.length > 0 && (
                            <ClarificationQuestions questions={state.data.clarificationQuestions} />
                        )}
                        {state.data.aims?.length || state.data.skills?.length || state.data.outcomes?.length ? (
                          <AsoResults asoData={state.data} />
                        ) : null}
                    </div>
                )}
            </div>
        </div>
      </div>
    </main>
  );
}
