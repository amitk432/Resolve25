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
    <Card className="mt-6 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary text-base">
          <BrainCircuit className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {showInput && (
          <div className="mb-3">
            <Textarea
              placeholder="Add specific details or questions for the AI..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="bg-background text-sm min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {suggestions.length > 0 && !isLoading && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground text-sm">AI Suggestions:</h4>
            <ul className="space-y-1.5 list-none">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{suggestion}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button 
          onClick={handleGetSuggestions} 
          disabled={isLoading} 
          className="mt-3 h-8 text-sm"
          size="sm"
        >
          <Wand2 className="mr-1.5 h-3.5 w-3.5" />
          {isLoading ? 'Generating...' : 'Get AI Suggestions'}
        </Button>
      </CardContent>
    </Card>
  );
}
