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
          className="rounded-full shadow-lg h-12 w-12 bg-primary hover:bg-primary/90"
        >
          <Sparkles className="h-5 w-5" />
          <span className="sr-only">Get AI Suggestions</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <h4 className="font-medium leading-none flex items-center gap-2 text-sm">
            <BrainCircuit className="text-primary h-4 w-4"/>
            AI Suggestions
          </h4>
          <div className="min-h-[80px] max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 h-full">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              suggestions.length > 0 ? (
                <ul className="space-y-1.5 list-none text-xs text-muted-foreground">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">No suggestions available</p>
              )
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
