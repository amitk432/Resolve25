'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { getModuleSuggestions } from '@/app/actions';
import type { ModuleSuggestionInput } from '@/ai/flows/generate-module-suggestions';


interface AiSuggestionSectionProps {
  moduleName: ModuleSuggestionInput['module'];
  title: string;
  description: string;
  contextData: any;
  showInput?: boolean;
}

export default function AiSuggestionSection({
  moduleName,
  title,
  description,
  contextData,
  showInput = false,
}: AiSuggestionSectionProps) {
  const [userInput, setUserInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);
    const result = await getModuleSuggestions({
      module: moduleName,
      context: contextData,
      userQuery: userInput || undefined,
    });
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error generating suggestions',
        description: result.error,
      });
    } else {
      setSuggestions(result.suggestions);
    }
  };

  return (
    <Card className="mt-8 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <BrainCircuit />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {showInput && (
          <div className="mb-4">
            <Textarea
              placeholder="Add specific details or questions for the AI..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="bg-background"
            />
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {suggestions.length > 0 && !isLoading && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Here are a few suggestions:</h4>
            <ul className="space-y-2 list-none">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{suggestion}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={handleGetSuggestions} disabled={isLoading} className="mt-4">
          <Wand2 className="mr-2 h-4 w-4" />
          {isLoading ? 'Generating...' : 'Get AI Suggestions'}
        </Button>
      </CardContent>
    </Card>
  );
}
