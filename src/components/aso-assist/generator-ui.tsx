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

export default function GeneratorUI() {
  const [state, formAction, isPending] = useActionState(handleGenerateAsos, initialState);
  const [files, setFiles] = useState<File[]>([]);

  const handleStartOver = () => {
    window.location.reload();
  };

  const wrappedAction = (formData: FormData) => {
    if (files.length > 0) {
      formData.delete('documents');
      files.forEach(file => {
        formData.append('documents', file);
      });
    }
    formAction(formData);
  };
  
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
    <div className="w-full">
      <form action={wrappedAction} className="w-full">
        {isPending ? (
            <LoadingState />
        ) : state.error ? (
             <div className="w-full space-y-6">
                <ErrorDisplay error={state.error} />
                <Button type="button" onClick={handleStartOver} variant="outline" className="w-full !mt-8">
                    <RefreshCw className="mr-2" />
                    Start Over
                </Button>
            </div>
        ) : state.data ? (
            <div className="w-full space-y-6">
              <AsoResults asoData={state.data} />

              {state.data.clarificationQuestions && state.data.clarificationQuestions.length > 0 && (
                <RefineForm 
                  questions={state.data.clarificationQuestions}
                  isPending={isPending}
                  context={state.input?.context}
                />
              )}
              
              {(!state.data.clarificationQuestions || state.data.clarificationQuestions.length === 0) && (
                 <Button type="button" onClick={handleStartOver} variant="outline" className="w-full !mt-8">
                    <RefreshCw className="mr-2" />
                    Start Over
                </Button>
              )}
            </div>
        ) : (
            <div className="w-full">
              <InputForm isPending={isPending} files={files} setFiles={setFiles} />
            </div>
        )}
      </form>
    </div>
  );
}
