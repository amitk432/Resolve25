'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { AppData, DailyTask, DailyTaskPriority, DailyTaskCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Sparkles, User, Briefcase, ShoppingCart, ChevronDown, ChevronRight, AlertTriangle, Calendar, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isToday, isPast } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AiSuggestionSection from '@/components/ai-suggestion-section';

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
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [isAiDialogOpen, setAiDialogOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    id: string;
    title: string;
    description: string;
    category: DailyTaskCategory;
    priority: DailyTaskPriority;
    selected: boolean;
  }>>([]);
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

  const editForm = useForm<z.infer<typeof taskSchema>>({
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

  // Memoize expensive calculations
  const { groupedTasks, allDates, taskStats } = useMemo(() => {
    // Group tasks by date
    const grouped = dailyTasks.reduce((groups, task) => {
      const date = task.dueDate.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
      return groups;
    }, {} as Record<string, typeof dailyTasks>);

    // Get all dates with tasks, sorted with today first
    const dates = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      
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

    // Calculate task statistics
    const stats = {
      total: dailyTasks.length,
      completed: dailyTasks.filter(t => t.completed).length,
      incomplete: dailyTasks.filter(t => !t.completed).length,
      byCategory: dailyTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: dailyTasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return { groupedTasks: grouped, allDates: dates, taskStats: stats };
  }, [dailyTasks]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleToggleTask = useCallback((taskId: string) => {
    onUpdate(draft => {
      const task = draft.dailyTasks?.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
      }
    });
  }, [onUpdate]);

  const handleEditTask = useCallback((task: DailyTask) => {
    setEditingTask(task);
    editForm.reset({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate.split('T')[0], // Extract date part only
    });
    setEditDialogOpen(true);
  }, [editForm]);

  const handleUpdateTask = (values: z.infer<typeof taskSchema>) => {
    if (!editingTask) return;

    onUpdate(draft => {
      const taskIndex = draft.dailyTasks?.findIndex(t => t.id === editingTask.id);
      if (taskIndex !== undefined && taskIndex >= 0 && draft.dailyTasks) {
        draft.dailyTasks[taskIndex] = {
          ...draft.dailyTasks[taskIndex],
          title: values.title,
          description: values.description || '',
          category: values.category as DailyTaskCategory,
          priority: values.priority as DailyTaskPriority,
          dueDate: new Date(values.dueDate).toISOString(),
        };
      }
    });

    editForm.reset();
    setEditDialogOpen(false);
    setEditingTask(null);
    toast({
      title: "Task updated!",
      description: "Your daily task has been updated successfully.",
    });
  };

  const handleDeleteTask = useCallback((taskId: string) => {
    onUpdate(draft => {
      if (draft.dailyTasks) {
        draft.dailyTasks = draft.dailyTasks.filter(t => t.id !== taskId);
      }
    });
    toast({
      title: "Task deleted!",
      description: "Your daily task has been deleted successfully.",
    });
  }, [onUpdate, toast]);

  const toggleDateExpansion = useCallback((date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  }, []);

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

  const handleGetAiSuggestions = async () => {
    setIsGeneratingAi(true);
    try {
      const { generateTaskSuggestions } = await import('@/ai/flows/generate-task-suggestions');
      
      const result = await generateTaskSuggestions({ context: data });
      
      const suggestions = result.suggestions.map((suggestion, index) => ({
        id: `ai-suggestion-${Date.now()}-${index}`,
        title: suggestion.title,
        description: suggestion.description || 'AI generated task suggestion',
        category: suggestion.category,
        priority: suggestion.priority,
        selected: false,
      }));
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI suggestions error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
      setAiDialogOpen(false);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddSelectedSuggestions = () => {
    const selectedSuggestions = aiSuggestions.filter(s => s.selected);
    
    if (selectedSuggestions.length === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select at least one task to add.",
        variant: "destructive",
      });
      return;
    }

    onUpdate(draft => {
      if (!draft.dailyTasks) {
        draft.dailyTasks = [];
      }
      
      selectedSuggestions.forEach(suggestion => {
        draft.dailyTasks.push({
          id: suggestion.id,
          title: suggestion.title,
          description: suggestion.description,
          completed: false,
          category: suggestion.category,
          priority: suggestion.priority,
          dueDate: new Date().toISOString(),
          source: 'ai',
        });
      });
    });

    setAiDialogOpen(false);
    setAiSuggestions([]);
    toast({
      title: "Tasks added!",
      description: `Added ${selectedSuggestions.length} AI-suggested tasks for today.`,
    });
  };

  const toggleSuggestionSelection = (suggestionId: string) => {
    setAiSuggestions(prev => 
      prev.map(s => 
        s.id === suggestionId ? { ...s, selected: !s.selected } : s
      )
    );
  };

  // Memoize utility functions
  const getCategoryIcon = useCallback((category: DailyTaskCategory) => {
    switch (category) {
      case 'Work': return <Briefcase className="h-3 w-3" />;
      case 'Personal': return <User className="h-3 w-3" />;
      case 'Errands': return <ShoppingCart className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  }, []);

  const getPriorityColor = useCallback((priority: DailyTaskPriority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-white text-foreground dark:bg-gray-900 dark:text-gray-200 border';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">Daily To-Do List</h2>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">Organize your day and stay on top of your tasks.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Dialog open={isAiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Generate Tasks with AI</DialogTitle>
                <DialogDescription>
                  {aiSuggestions.length === 0 
                    ? "Get personalized task suggestions based on your monthly plans and existing tasks."
                    : "Select the tasks you'd like to add to today's to-do list."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {aiSuggestions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    AI will analyze your monthly plans and suggest relevant daily tasks to help you achieve your goals.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {aiSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          suggestion.selected 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-white dark:bg-card hover:bg-accent/30'
                        }`}
                        onClick={() => toggleSuggestionSelection(suggestion.id)}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={suggestion.selected}
                            onChange={() => toggleSuggestionSelection(suggestion.id)}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{suggestion.title}</p>
                                <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                {getCategoryIcon(suggestion.category)}
                                {suggestion.category}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                                {suggestion.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs flex items-center gap-1 text-purple-600 border-purple-200">
                                <Sparkles className="h-3 w-3" />
                                AI Generated
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setAiDialogOpen(false);
                  setAiSuggestions([]);
                }}>
                  Cancel
                </Button>
                {aiSuggestions.length === 0 ? (
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
                ) : (
                  <Button onClick={handleAddSelectedSuggestions}>
                    Add Selected Tasks ({aiSuggestions.filter(s => s.selected).length})
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
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

          {/* Edit Task Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>
                  Update your task details.
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleUpdateTask)} className="space-y-4">
                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      control={editForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
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
                  </div>
                  <FormField
                    control={editForm.control}
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
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setEditDialogOpen(false);
                      setEditingTask(null);
                      editForm.reset();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Task</Button>
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
          <Card className="bg-white dark:bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No tasks yet</h3>
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
              <Card key={dateKey} className={`overflow-hidden bg-white dark:bg-card ${isCurrentDay ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleDateExpansion(dateKey)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-4 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            <CardTitle className="text-base sm:text-lg leading-none">
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
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium leading-none mb-2">
                              {completedCount}/{totalCount} completed
                            </div>
                            <div className="w-28 h-2 bg-white dark:bg-secondary border rounded-full overflow-hidden">
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
                          className={`flex items-center gap-4 p-4 rounded-lg border ${task.completed ? 'bg-white dark:bg-card opacity-75' : 'bg-white dark:bg-card hover:bg-accent/30'} transition-all duration-200`}
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task.id)}
                            className="flex-shrink-0"
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
                              <div className="flex items-center gap-2">
                                {task.completed && (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditTask(task)}
                                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete your task "{task.title}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
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
      <AiSuggestionSection
        moduleName="DailyTodo"
        title="AI Productivity Assistant"
        description="Get personalized optimization tips and helpful advice based on your task management patterns."
        contextData={{ 
          dailyTasks, 
          totalTasks: taskStats.total,
          completedTasks: taskStats.completed,
          incompleteTasks: taskStats.incomplete,
          tasksByCategory: taskStats.byCategory,
          tasksByPriority: taskStats.byPriority
        }}
        showInput={true}
      />
    </div>
  );
};

export default DailyTasksTab;
