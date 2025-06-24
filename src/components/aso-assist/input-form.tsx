'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, FileText, X } from 'lucide-react';

type InputFormProps = {
  action: (formData: FormData) => void;
  isPending: boolean;
};

export default function InputForm({ action, isPending }: InputFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles].slice(0, 5)); // Limit to 5 files
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    // Reset file input to allow re-adding the same file
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    files.forEach(file => {
      formData.append('documents', file);
    });
    action(formData);
  };


  return (
    <Card>
      <form ref={formRef} onSubmit={handleFormSubmit}>
        <CardHeader>
          <CardTitle className="font-headline">1. Provide Context</CardTitle>
          <CardDescription>
            Enter the details for your training program.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Target Country</Label>
            <Input id="country" name="country" placeholder="e.g., United Kingdom" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Target Industry</Label>
            <Input id="industry" name="industry" placeholder="e.g., Software Development" required />
          </div>
          <div className="space-y-2">
            <Label>2. Upload Documents</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.pptx,.txt"
              multiple
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mr-2" />
              Click to upload (PDF, DOCX, PPTX, TXT)
            </Button>
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Selected files:</h4>
                    <ul className="space-y-2">
                        {files.map((file, index) => (
                            <li key={index} className="flex items-center justify-between text-sm bg-secondary p-2 rounded-md">
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="shrink-0" size={16}/>
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                                    <X size={16}/>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              'Generate ASOs'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
