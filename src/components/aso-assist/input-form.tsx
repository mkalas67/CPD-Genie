'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, FileText, X, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type InputFormProps = {
  isPending: boolean;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
};

export default function InputForm({ isPending, files, setFiles }: InputFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (newFiles: FileList | null) => {
    if (newFiles) {
      const newFilesArray = Array.from(newFiles);
      // Combine with existing files, but prevent duplicates and respect the limit.
      const combined = [...files, ...newFilesArray];
      const uniqueFiles = combined.filter(
        (file, index, self) =>
          index === self.findIndex((f) => f.name === file.name && f.size === file.size)
      );
      setFiles(uniqueFiles.slice(0, 5)); // Limit to 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      // Reset file input to allow re-selecting the same file if needed
      fileInputRef.current.value = ""; 
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="bg-card p-6 sm:p-8 rounded-lg shadow-sm border">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Your Course Outline</h2>
          <p className="text-muted-foreground mt-1">
            Upload your material, provide context, and let the genie work its magic.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Course Material (up to 5 files)</Label>
            <div
              className={cn(
                "relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                isDragging ? "border-primary bg-primary/10" : "border-input"
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-10 h-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD (Max 5 files)</p>
              <input
                type="file"
                ref={fileInputRef}
                name="documents" // This name is for semantics, but files are handled in page.tsx
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                multiple
              />
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected files:</Label>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between text-sm bg-secondary p-2 rounded-md">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="shrink-0" size={16} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                      <X size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="context">Target Country and/or Industry (Optional)</Label>
          <Textarea
            id="context"
            name="context"
            placeholder="e.g., Digital marketing in the UK"
            className="bg-background"
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending || files.length === 0}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2" />
              Generate ASOs
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
