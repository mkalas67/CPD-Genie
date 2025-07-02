import GeneratorUI from '@/components/aso-assist/generator-ui';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-grow container mx-auto max-w-3xl px-4 py-12 sm:py-16 flex flex-col">
        <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                CPD Genie
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                Instantly generate Aims, Skills, and Outcomes for your course.
            </p>
        </header>

        <div className="flex-grow">
          <GeneratorUI />
        </div>
      </div>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Powered by Firebase and Google AI
      </footer>
    </main>
  );
}
