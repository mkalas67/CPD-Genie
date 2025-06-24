'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useActionState } from 'react';
import { handleGenerateAsos } from '@/lib/actions';
import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
import type { AnalyticsLog } from '@/lib/types';
import AsoAssistHeader from '@/components/aso-assist/header';
import InputForm from '@/components/aso-assist/input-form';
import AsoResults from '@/components/aso-assist/aso-results';
import ClarificationQuestions from '@/components/aso-assist/clarification-questions';
import AnalyticsDisplay from '@/components/aso-assist/analytics-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Frown } from 'lucide-react';

type ActionState = {
  data?: GenerateAsosOutput;
  error?: string;
  input?: {
    country: string;
    industry: string;
    docCount: number;
  };
};

const initialState: ActionState = {};

export default function Home() {
  const [state, formAction, isPending] = useActionState(handleGenerateAsos, initialState);
  const [analyticsLogs, setAnalyticsLogs] = useState<AnalyticsLog[]>([]);

  useEffect(() => {
    if (state.data && state.input) {
      const newLog: AnalyticsLog = {
        timestamp: new Date().toISOString(),
        country: state.input.country,
        industry: state.input.industry,
        docCount: state.input.docCount,
      };
      setAnalyticsLogs(prevLogs => [newLog, ...prevLogs]);
    }
  }, [state]);

  const WelcomeOrError = () => {
    if (state.error) {
      return (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Frown />
              An Error Occurred
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>We ran into an issue while generating your ASOs. Please try again.</p>
            <p className="text-sm text-destructive/80 mt-2">{state.error}</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline">
            <Bot size={28} className="text-primary"/>
            Welcome to ASO Assist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Get started by uploading your training documents and providing context on the left. Your generated Aims, Skills, and Outcomes will appear here.
          </p>
        </CardContent>
      </Card>
    )
  };

  const ResultsSkeleton = () => (
    <div className="space-y-6">
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
    <div className="min-h-screen bg-background">
      <AsoAssistHeader />
      <main className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-8 lg:sticky lg:top-8">
            <InputForm action={formAction} isPending={isPending} />
            <AnalyticsDisplay logs={analyticsLogs} />
          </div>

          <div className="space-y-6">
            {isPending ? <ResultsSkeleton /> : (
              !state.data && !state.error ? <WelcomeOrError /> :
              <>
                {state.error && <WelcomeOrError />}
                {state.data?.clarificationQuestions && state.data.clarificationQuestions.length > 0 && (
                  <ClarificationQuestions questions={state.data.clarificationQuestions} />
                )}
                {state.data && <AsoResults asoData={state.data} />}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
