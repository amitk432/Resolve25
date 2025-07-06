'use client';

import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const quotes = [
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "The best way to predict the future is to create it.",
  "You are never too old to set another goal or to dream a new dream.",
  "Believe you can and you're halfway there.",
  "The journey of a thousand miles begins with a single step.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts."
];

export default function MotivationalQuote() {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Select a random quote on client-side mount to avoid hydration mismatch
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  if (!quote) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5" />
                     A Spark of Motivation
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-4 bg-muted-foreground/20 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-1/2 animate-pulse mt-2"></div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-accent/10 border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-accent-foreground/80">
          <Lightbulb className="h-5 w-5 text-accent" />
          A Spark of Motivation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <blockquote className="italic text-muted-foreground">
          &ldquo;{quote}&rdquo;
        </blockquote>
      </CardContent>
    </Card>
  );
}
