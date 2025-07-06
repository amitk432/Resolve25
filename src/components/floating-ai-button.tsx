'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { getModuleSuggestions } from '@/app/actions';
import type { ModuleSuggestionInput } from '@/ai/flows/generate-module-suggestions';

interface FloatingAiButtonProps {
  moduleName: ModuleSuggestionInput['module'];
  contextData: any;
}

export default function FloatingAiButton({ moduleName, contextData }: FloatingAiButtonProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    // Reset state for new suggestions
    setSuggestions([]);
    setIsLoading(true);
    
    const result = await getModuleSuggestions({
      module: moduleName,
      context: contextData,
    });
    
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error generating suggestions',
        description: result.error,
      });
      setSuggestions([]);
    } else if (result) {
      setSuggestions(result.suggestions);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      handleGetSuggestions();
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="rounded-full shadow-lg h-14 w-14 bg-primary hover:bg-primary/90"
        >
          <Sparkles className="h-6 w-6" />
          <span className="sr-only">Get AI Suggestions</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium leading-none flex items-center gap-2">
            <BrainCircuit className="text-primary h-5 w-5"/>
            AI Suggestions
          </h4>
          <div className="min-h-[100px] max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-4 h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              suggestions.length > 0 ? (
                <ul className="space-y-2 list-none text-sm text-muted-foreground">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary mt-1 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-4">No suggestions available at the moment.</p>
              )
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
