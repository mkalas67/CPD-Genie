'use client';

import React from 'react';
import { useActionState, useState } from 'react';
import { handleGenerateAsos } from '@/lib/actions';
import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
import InputForm from '@/components/aso-assist/input-form';
import AsoResults from '@/components/aso-assist/aso-results';
import RefineForm from '@/components/aso-assist/refine-form';
import LoadingState from '@/components/aso-assist/loading-state';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
  const [files, setFiles] = useState<File[]>([]);

  const handleStartOver = () => {
    window.location.reload();
  };

  const wrappedAction = (formData: FormData) => {
    // The `files` state is the source of truth for documents.
    formData.delete('documents');
    files.forEach(file => {
      formData.append('documents', file);
    });
    formAction(formData);
  };
  
  const showRefineForm = state.data?.clarificationQuestions && state.data.clarificationQuestions.length > 0;
  const showResults = state.data && !showRefineForm;

  const ErrorDisplay = ({ error }: { error: string }) => (
    <Alert variant="destructive" className="bg-red-500/5 border-red-500/20 text-red-700 dark:bg-red-950/20 dark:border-red-500/20 dark:text-red-500">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-bold">An Error Occurred</AlertTitle>
        <AlertDescription className="text-red-700/90 dark:text-red-500/90">
            {error}
        </AlertDescription>
    </Alert>
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-grow container mx-auto max-w-3xl px-4 py-12 sm:py-16 flex flex-col">
        <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                Course Genie
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                Instantly generate Aims, Skills, and Outcomes for your course.
            </p>
        </header>

        <div className="mt-8 flex-grow flex items-center justify-center">
          <form action={wrappedAction} className="w-full">
            {isPending ? (
                <LoadingState />
            ) : state.error ? (
                 <div className="w-full space-y-6">
                    <ErrorDisplay error={state.error} />
                    <Button onClick={handleStartOver} variant="outline" className="w-full !mt-8">
                        <RefreshCw className="mr-2" />
                        Start Over
                    </Button>
                </div>
            ) : showRefineForm ? (
                <RefineForm 
                  questions={state.data.clarificationQuestions!}
                  isPending={isPending}
                  context={state.input?.context}
                />
            ) : showResults ? (
                <div className="w-full space-y-6">
                  <AsoResults asoData={state.data} />
                   <Button onClick={handleStartOver} variant="outline" className="w-full !mt-8">
                        <RefreshCw className="mr-2" />
                        Start Over
                    </Button>
                </div>
            ) : (
                <div className="w-full">
                  <InputForm isPending={isPending} files={files} setFiles={setFiles} />
                </div>
            )}
          </form>
        </div>
      </div>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Powered by Firebase and Google AI
      </footer>
    </main>
  );
}
