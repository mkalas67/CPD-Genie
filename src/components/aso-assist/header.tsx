import { Bot } from "lucide-react";

export default function AsoAssistHeader() {
  return (
    <header className="p-4 md:px-8 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Bot className="text-primary h-8 w-8" />
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary-foreground">ASO Assist</h1>
          <p className="text-sm text-muted-foreground">AI-Powered Aims, Skills, & Outcomes Generation</p>
        </div>
      </div>
    </header>
  );
}
