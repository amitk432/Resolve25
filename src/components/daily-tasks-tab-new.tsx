'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { AppData, DailyTask, DailyTaskPriority, DailyTaskCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Sparkles, User, Briefcase, ShoppingCart, ChevronDown, ChevronRight, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isToday, isPast } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DailyTasksTabProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
}

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  category: z.enum(['Work', 'Personal', 'Errands']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
});

const DailyTasksTab: React.FC<DailyTasksTabProps> = ({ data, onUpdate }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isAiDialogOpen, setAiDialogOpen] = useState(false);
  const [isAiAdviceDialogOpen, setAiAdviceDialogOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set([format(new Date(), 'yyyy-MM-dd')]));
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Personal',
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const dailyTasks = data?.dailyTasks || [];

  // Group tasks by date and sort dates
  const groupedTasks = dailyTasks.reduce((groups, task) => {
    const date = task.dueDate.split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {} as Record<string, typeof dailyTasks>);

  // Get all dates with tasks, sorted with today first
  const allDates = Object.keys(groupedTasks).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    const today = new Date();
    
    // Today comes first
    if (isToday(dateA)) return -1;
    if (isToday(dateB)) return 1;
    
    // Future dates before past dates
    const isPastA = isPast(dateA) && !isToday(dateA);
    const isPastB = isPast(dateB) && !isToday(dateB);
    
    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;
    
    // Sort by date
    return dateA.getTime() - dateB.getTime();
  });

  const handleAddTask = (values: z.infer<typeof taskSchema>) => {
    onUpdate(draft => {
      if (!draft.dailyTasks) {
        draft.dailyTasks = [];
      }
      draft.dailyTasks.push({
        id: `task-${Date.now()}`,
        title: values.title,
        description: values.description,
        completed: false,
        category: values.category || 'Personal',
        priority: values.priority || 'Medium',
        dueDate: values.dueDate + 'T00:00:00.000Z',
        source: 'manual',
      });
    });
    
    form.reset();
    setDialogOpen(false);
    toast({
      title: "Task added!",
      description: "Your daily task has been added successfully.",
    });
  };

  const handleToggleTask = (taskId: string) => {
    onUpdate(draft => {
      const task = draft.dailyTasks?.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
      }
    });
  };

  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleGetAiAdvice = async () => {
    setIsGeneratingAi(true);
    try {
      const advice = `Based on your current tasks, here are some optimization tips:

1. **Time Management**: You have ${dailyTasks.length} tasks across multiple days. Consider using time-blocking to allocate specific time slots for each task.

2. **Priority Focus**: Focus on high-priority tasks first, especially those marked as 'Work' category during business hours.

3. **Task Completion**: You have ${dailyTasks.filter(t => !t.completed).length} incomplete tasks. Break down larger tasks into smaller, manageable subtasks.

4. **Daily Planning**: Start each day by reviewing your tasks and identifying the top 3 most important items to complete.

5. **Energy Management**: Schedule demanding tasks during your peak energy hours and routine tasks during low-energy periods.`;

      setAiAdvice(advice);
      setAiAdviceDialogOpen(true);
    } catch (error) {
      console.error('AI advice error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI advice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGetAiSuggestions = async () => {
    setIsGeneratingAi(true);
    try {
      const { generateTaskSuggestions } = await import('@/ai/flows/generate-task-suggestions');
      
      const result = await generateTaskSuggestions({ context: data });
      
      onUpdate(draft => {
        if (!draft.dailyTasks) {
          draft.dailyTasks = [];
        }
        
        result.suggestions.forEach((suggestion, index) => {
          draft.dailyTasks.push({
            id: `ai-suggestion-${Date.now()}-${index}`,
            title: suggestion.title,
            description: suggestion.description || 'AI generated task suggestion',
            completed: false,
            category: suggestion.category,
            priority: suggestion.priority,
            dueDate: new Date().toISOString(),
            source: 'ai',
          });
        });
      });

      setAiDialogOpen(false);
      toast({
        title: "AI suggestions added!",
        description: `Added ${result.suggestions.length} personalized task suggestions.`,
      });
    } catch (error) {
      console.error('AI suggestions error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getCategoryIcon = (category: DailyTaskCategory) => {
    switch (category) {
      case 'Work': return <Briefcase className="h-3 w-3" />;
      case 'Personal': return <User className="h-3 w-3" />;
      case 'Errands': return <ShoppingCart className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: DailyTaskPriority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-white text-foreground dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Daily To-Do List</h1>
          <p className="text-muted-foreground">Organize your day and stay on top of your tasks.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Tasks with AI</DialogTitle>
                <DialogDescription>
                  Get personalized task suggestions based on your monthly plans and existing tasks.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  AI will analyze your monthly plans and suggest relevant daily tasks to help you achieve your goals.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGetAiSuggestions} disabled={isGeneratingAi}>
                  {isGeneratingAi ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Tasks
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add a New Task</DialogTitle>
                <DialogDescription>
                  What do you need to get done?
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddTask)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Finalize project report" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description <span className="text-muted-foreground">(Optional)</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add more details..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Personal">Personal</SelectItem>
                              <SelectItem value="Errands">Errands</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Task</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tasks by Date - Collapsible */}
      <div className="space-y-4">
        {allDates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start by adding your first task or use AI to generate some suggestions.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          allDates.map((dateKey) => {
            const date = new Date(dateKey);
            const tasksForDate = groupedTasks[dateKey] || [];
            const completedCount = tasksForDate.filter(task => task.completed).length;
            const totalCount = tasksForDate.length;
            const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isExpanded = expandedDates.has(dateKey);
            const isCurrentDay = isToday(date);
            const isPastDay = isPast(date) && !isCurrentDay;
            const incompleteCount = totalCount - completedCount;

            return (
              <Card key={dateKey} className={`overflow-hidden ${isCurrentDay ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleDateExpansion(dateKey)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {format(date, 'EEEE, MMMM d, yyyy')}
                              {isCurrentDay && <span className="text-primary ml-2">(Today)</span>}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
                            </Badge>
                            {isPastDay && incompleteCount > 0 && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs">{incompleteCount} incomplete</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {completedCount}/{totalCount} completed
                            </div>
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {tasksForDate.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${task.completed ? 'bg-white dark:bg-card opacity-75' : 'bg-card hover:bg-accent/30'} transition-all duration-200`}
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className={`text-xs ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              {task.completed && (
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                {getCategoryIcon(task.category)}
                                {task.category}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                              {task.source === 'ai' && (
                                <Badge variant="outline" className="text-xs flex items-center gap-1 text-purple-600 border-purple-200">
                                  <Sparkles className="h-3 w-3" />
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>

      {/* AI Productivity Assistant */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Productivity Assistant</CardTitle>
          </div>
          <CardDescription>
            Get personalized optimization tips and helpful advice based on your task management patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetAiAdvice} disabled={isGeneratingAi} className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4 mr-2" />
            {isGeneratingAi ? 'Generating...' : 'Get AI Suggestions'}
          </Button>
        </CardContent>
      </Card>

      {/* AI Advice Dialog */}
      <Dialog open={isAiAdviceDialogOpen} onOpenChange={setAiAdviceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Productivity Insights
            </DialogTitle>
            <DialogDescription>
              Personalized tips to optimize your daily task management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {aiAdvice}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAiAdviceDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyTasksTab;
