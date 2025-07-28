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
import { Plus, Sparkles, User, Briefcase, ShoppingCart, ChevronDown, ChevronRight, AlertTriangle, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, isSameDay, parseISO, isToday, isPast } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

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
  const [aiPrompt, setAiPrompt] = useState('');
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
    if (isSameDay(dateA, today)) return -1;
    if (isSameDay(dateB, today)) return 1;
    
    // Future dates before past dates
    const isPastA = isPast(dateA) && !isSameDay(dateA, today);
    const isPastB = isPast(dateB) && !isSameDay(dateB, today);
    
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
      });
    });

    form.reset();
    setDialogOpen(false);
    toast({ 
      title: 'Task added successfully!',
      description: `"${values.title}" has been added to your daily tasks.`,
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

  const handleGenerateAiTasks = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingAi(true);
    // Simulate AI generation
    setTimeout(() => {
      const suggestions = [
        { title: 'Review project requirements', category: 'Work' as DailyTaskCategory, priority: 'High' as DailyTaskPriority },
        { title: 'Schedule team meeting', category: 'Work' as DailyTaskCategory, priority: 'Medium' as DailyTaskPriority },
        { title: 'Update documentation', category: 'Work' as DailyTaskCategory, priority: 'Low' as DailyTaskPriority },
      ];

      onUpdate(draft => {
        if (!draft.dailyTasks) {
          draft.dailyTasks = [];
        }
        suggestions.forEach((suggestion, index) => {
          draft.dailyTasks.push({
            id: `ai-task-${Date.now()}-${index}`,
            title: suggestion.title,
            description: `Generated based on: ${aiPrompt}`,
            completed: false,
            category: suggestion.category,
            priority: suggestion.priority,
            dueDate: new Date().toISOString(),
          });
        });
      });

      setIsGeneratingAi(false);
      setAiDialogOpen(false);
      setAiPrompt('');
      toast({ 
        title: 'AI tasks generated!',
        description: `${suggestions.length} tasks have been added based on your request.`,
      });
    }, 2000);
  };

  const toggleDateExpansion = (dateKey: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
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
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleAiAdvice = async () => {
    setAiAdviceDialogOpen(true);
    setAiAdvice('');
    
    // Simulate AI advice generation
    setTimeout(() => {
      setAiAdvice(`Based on your current tasks, here are some productivity tips:

1. **Prioritize High Impact Tasks**: Focus on completing your high-priority work tasks first thing in the morning when your energy is highest.

2. **Time Blocking**: Allocate specific time slots for different categories of tasks to maintain focus and avoid context switching.

3. **Break Down Large Tasks**: If any tasks seem overwhelming, consider breaking them into smaller, manageable subtasks.

4. **Review and Adjust**: At the end of each day, review what you've accomplished and adjust tomorrow's priorities accordingly.`);
    }, 1500);
  };

  const getDateDisplayName = (dateKey: string) => {
    const date = new Date(dateKey);
    if (isSameDay(date, new Date())) {
      return 'Today';
    }
    if (isSameDay(date, addDays(new Date(), 1))) {
      return 'Tomorrow';
    }
    if (isSameDay(date, addDays(new Date(), -1))) {
      return 'Yesterday';
    }
    return format(date, 'EEEE, MMM d');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Daily To-Do List</h1>
          <p className="text-sm md:text-base text-muted-foreground">Organize your day and stay on top of your tasks.</p>
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
                  Tell the AI what kind of tasks you need help with, and it will generate relevant tasks for you.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="e.g., I need help organizing my work projects for this week..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleGenerateAiTasks} disabled={!aiPrompt.trim() || isGeneratingAi}>
                  {isGeneratingAi ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Tasks
                    </>
                  )}
                </Button>
              </div>
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
                        <FormLabel>Task Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter task title" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional details (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
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
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

      {/* Tasks List */}
      <div className="space-y-4">
        {allDates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No tasks yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start by adding your first task or generate some with AI!</p>
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
            const progressPercentage = (completedCount / tasksForDate.length) * 100;
            
            const isExpanded = expandedDates.has(dateKey);
            
            return (
              <Card key={dateKey} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleDateExpansion(dateKey)}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent/50 p-2 rounded-md -m-2">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-base sm:text-lg">
                            {getDateDisplayName(dateKey)}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <CardDescription>
                              {completedCount} of {tasksForDate.length} completed
                            </CardDescription>
                            {isPast(date) && !isSameDay(date, new Date()) && completedCount < tasksForDate.length && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="text-xs">Overdue</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <Badge variant={completedCount === tasksForDate.length ? "default" : "secondary"}>
                          {Math.round(progressPercentage)}%
                        </Badge>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-3 mt-4">
                      {tasksForDate.map((task) => (
                        <div 
                          key={task.id}
                          className="flex items-start justify-between gap-2"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Checkbox 
                              checked={task.completed}
                              onCheckedChange={() => handleToggleTask(task.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </h4>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap mt-2">
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                  {getCategoryIcon(task.category)}
                                  {task.category}
                                </Badge>
                                {task.priority && (
                                  <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </CardHeader>
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
            Get personalized advice to optimize your daily task management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAiAdvice} variant="outline" className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Get Productivity Tips
          </Button>
        </CardContent>
      </Card>

      {/* AI Advice Dialog */}
      <Dialog open={isAiAdviceDialogOpen} onOpenChange={setAiAdviceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Productivity Advice
            </DialogTitle>
            <DialogDescription>
              Personalized recommendations based on your task patterns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {aiAdvice ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {aiAdvice}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyTasksTab;
