import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import type { Generation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { History, FileText, Globe, Type, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function getHistory(): Promise<Generation[]> {
  if (!db) {
    console.error("Firestore is not initialised. Check your Firebase config in .env.");
    return [];
  }
  try {
    const generationsRef = collection(db, 'generations');
    const q = query(generationsRef, orderBy('createdAt', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);

    const history: Generation[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        createdAt: typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate()
            : data.createdAt instanceof Date
              ? data.createdAt
              : new Date(0),
      } as Generation);
    });
    return history;
  } catch (error) {
    console.error("Error fetching generation history:", error);
    if (error instanceof Error && error.message.includes('permission-denied')) {
        console.error("Firestore permission denied. Check your security rules and Firebase configuration.");
    }
    return [];
  }
}


export default async function GenerationHistory() {
  const history = await getHistory();

  if (history.length === 0) {
    return null;
  }

  const Section = ({ title, items }: { title: string; items: string[] }) => (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );

  return (
    <div className="mt-16">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History />
                    Generation History
                </CardTitle>
                <CardDescription>
                    Your last 10 generations are saved here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {history.map((item) => (
                        <AccordionItem value={item.id} key={item.id}>
                            <AccordionTrigger>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4">
                                    <div className="flex items-center gap-3 text-left">
                                        {item.docCount > 0 && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <FileText size={16} />
                                                <span>{item.docCount} file(s)</span>
                                            </div>
                                        )}
                                        {item.description && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Type size={16} />
                                                <span className="truncate max-w-[150px]">Text Input</span>
                                            </div>
                                        )}
                                        {item.cpdEstimate && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Clock size={16} />
                                                <span className="truncate max-w-[100px]">{item.cpdEstimate}</span>
                                            </div>
                                        )}
                                        {item.context && (
                                            <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                                                <Globe size={16} />
                                                <span className="truncate max-w-[200px]">{item.context}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-muted-foreground mt-2 sm:mt-0">
                                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-muted/50 p-4 rounded-b-md">
                                <div className="space-y-4">
                                    <Section title="Aims" items={item.aims} />
                                    <Section title="Skills" items={item.skills} />
                                    <Section title="Outcomes" items={item.outcomes} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}
