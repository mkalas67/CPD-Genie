'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud, FileText, X, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COUNTRIES, INDUSTRIES } from '@/lib/constants';

type InputFormProps = {
  isPending: boolean;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
};

export default function InputForm({ isPending, files, setFiles }: InputFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [courseDescription, setCourseDescription] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [industry, setIndustry] = React.useState('');

  const handleFileChange = (newFiles: FileList | null) => {
    if (newFiles) {
      const newFilesArray = Array.from(newFiles);
      const combined = [...files, ...newFilesArray];
      const uniqueFiles = combined.filter(
        (file, index, self) =>
          index === self.findIndex((f) => f.name === file.name && f.size === file.size)
      );
      setFiles(uniqueFiles.slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const isButtonDisabled = isPending || (files.length === 0 && courseDescription.trim() === '');

  return (
    <div className="bg-card p-6 sm:p-8 rounded-lg shadow-sm border">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Your Course Outline</h2>
          <p className="text-muted-foreground mt-1">
            Describe your course, provide context, and let the genie work its magic.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-description">Describe Your Course (Optional)</Label>
          <Textarea
            id="course-description"
            name="courseDescription"
            placeholder="e.g., A training module for social care professionals focusing on safeguarding and best practices."
            className="bg-background"
            rows={8}
            maxLength={5000}
            value={courseDescription}
            onChange={(e) => setCourseDescription(e.target.value)}
          />
          <p className="text-sm text-muted-foreground text-right">{courseDescription.length} / 5000</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Course Material (Optional, up to 5 files)</Label>
            <div
              className={cn(
                'relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
                isDragging ? 'border-primary bg-primary/10' : 'border-input'
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-10 h-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD (Up to 5 files, 25MB total)</p>
              <input
                type="file"
                ref={fileInputRef}
                name="documents"
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Target Country (Optional)</Label>
            {/* Hidden input so the value is included in FormData on submit */}
            <input type="hidden" name="country" value={country} />
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="country" className="bg-background">
                <SelectValue placeholder="Select a country..." />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry (Optional)</Label>
            {/* Hidden input so the value is included in FormData on submit */}
            <input type="hidden" name="industry" value={industry} />
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger id="industry" className="bg-background">
                <SelectValue placeholder="Select an industry..." />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isButtonDisabled}>
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
