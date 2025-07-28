
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isToday, parseISO, startOfDay, isPast, addDays } from 'date-fns';
import { DailyTask, DailyTaskCategory, DailyTaskPriority, AppData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, CalendarIcon, Briefcase, User, ShoppingCart, AlertTriangle, ListTodo, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import AiSuggestionSection from './ai-suggestion-section';
import AiTaskGeneratorDialog from './ai-task-generator-dialog';
import type { SuggestedTask } from '@/ai/flows/generate-task-suggestions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Progress } from './ui/progress';


const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().optional(),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  priority: z.enum(['Low', 'Medium', 'High']),
  category: z.enum(['Work', 'Personal', 'Errands']),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const priorityConfig: Record<DailyTaskPriority, { className: string }> = {
  High: { className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800' },
  Medium: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800' },
  Low: { className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800' },
};

const categoryIcons: Record<DailyTaskCategory, React.ReactNode> = {
  Work: <Briefcase className="h-4 w-4" />,
  Personal: <User className="h-4 w-4" />,
  Errands: <ShoppingCart className="h-4 w-4" />,
};

interface DailyTodoTabProps {
  tasks: DailyTask[];
  onAddTask: (task: Omit<DailyTask, 'id' | 'completed'>) => void;
  onUpdateTask: (task: DailyTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onMoveToNextDay: (taskId: string) => void;
  data: AppData;
}

const TaskItem = ({ task, onToggleTask, onEdit, onDelete, onMoveToNextDay }: { task: DailyTask, onToggleTask: (id: string, completed: boolean) => void, onEdit: (task: DailyTask) => void, onDelete: (id: string) => void, onMoveToNextDay: (id: string) => void }) => {
  const isOverdue = !task.completed && isPast(startOfDay(parseISO(task.dueDate))) && !isToday(startOfDay(parseISO(task.dueDate)));
  const shouldShowWarning = !task.completed && (isOverdue || isToday(startOfDay(parseISO(task.dueDate))));

  return (
    <div className="flex items-start p-3 rounded-lg bg-white dark:bg-background hover:bg-accent/30 border transition-all group">
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={(checked) => onToggleTask(task.id, !!checked)}
        className="mr-4 mt-1"
      />
      <div className="flex-grow min-w-0">
        <label htmlFor={`task-${task.id}`} className={cn('font-medium flex items-center gap-2', task.completed && 'line-through text-muted-foreground')}>
          <span className="line-clamp-2">{task.title}</span>
          {shouldShowWarning && <Badge variant="destructive" className="flex items-center gap-1 text-xs shrink-0"><AlertTriangle className="h-3 w-3" /> Overdue</Badge>}
        </label>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{task.description}</p>
        )}
        <div className="text-sm text-muted-foreground flex items-center gap-x-2 gap-y-1 mt-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', priorityConfig[task.priority].className)}>
              {task.priority}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              {categoryIcons[task.category]}
              {task.category}
            </Badge>
        </div>
      </div>
      <div className="flex-shrink-0 hidden group-hover:flex items-center gap-1 ml-2">
        {isToday(startOfDay(parseISO(task.dueDate))) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMoveToNextDay(task.id)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Move to tomorrow</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}><Edit className="h-4 w-4" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete the task "{task.title}". This cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default function DailyTodoTab({ tasks, onAddTask, onUpdateTask, onDeleteTask, onToggleTask, data, onMoveToNextDay }: DailyTodoTabProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
  });
  
  useEffect(() => {
    if (editingTask) {
      form.reset({
        ...editingTask,
        dueDate: parseISO(editingTask.dueDate),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        dueDate: new Date(),
        priority: 'Medium',
        category: 'Personal',
      });
    }
  }, [editingTask, form, isDialogOpen]);

  const handleOpenDialog = (task: DailyTask | null) => {
    setEditingTask(task);
    setDialogOpen(true);
  };
  
  const onSubmit = (values: TaskFormValues) => {
    const taskData = {
      ...values,
      dueDate: values.dueDate.toISOString(),
      source: 'manual' as const,
    };
    if (editingTask) {
      onUpdateTask({ ...editingTask, ...taskData });
    } else {
      onAddTask(taskData);
    }
    setDialogOpen(false);
  };

  const handleMoveToNextDay = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const nextDay = addDays(parseISO(task.dueDate), 1);
      onUpdateTask({ ...task, dueDate: nextDay.toISOString() });
    }
  };

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: DailyTask[] } = {};

    tasks.forEach(task => {
        const dateKey = format(startOfDay(parseISO(task.dueDate)), 'yyyy-MM-dd');
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(task);
    });

    // Sort tasks within each group: incomplete first, then by priority (High > Medium > Low), then by title
    for (const dateKey in groups) {
        groups[dateKey].sort((a, b) => {
            // First, sort by completion status (incomplete first)
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // Then sort by priority (High > Medium > Low)
            const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            
            // Finally, sort alphabetically by title
            return a.title.localeCompare(b.title);
        });
    }
    
    // Sort the groups by date
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const dateA = startOfDay(new Date(a));
      const dateB = startOfDay(new Date(b));
      const today = startOfDay(new Date());

      if (isToday(dateA) && !isToday(dateB)) return -1;
      if (!isToday(dateA) && isToday(dateB)) return 1;

      return dateA.getTime() - dateB.getTime();
    });

    return sortedGroupKeys.map(key => ({
        date: key,
        tasks: groups[key]
    }));
  }, [tasks]);

  const handleAiTaskAdd = (suggestedTask: SuggestedTask) => {
    const newTask = {
      ...suggestedTask,
      dueDate: new Date().toISOString(),
      source: 'ai' as const,
    };
    onAddTask(newTask);
  };
  
  const defaultOpenGroups = useMemo(() => {
    return groupedTasks
        .filter(g => {
            const groupDate = startOfDay(parseISO(g.date));
            const hasIncompleteTasks = g.tasks.some(t => !t.completed);
            return isToday(groupDate) && hasIncompleteTasks;
        })
        .map(g => g.date);
  }, [groupedTasks]);


  return (
    <TooltipProvider>
      <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">Daily To-Do List</h2>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">Organize your day and stay on top of your tasks.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
            <AiTaskGeneratorDialog data={data} onTaskAdd={handleAiTaskAdd}>
                <Button variant="outline" className="flex-1 justify-center sm:flex-none sm:w-auto">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                </Button>
            </AiTaskGeneratorDialog>
            <Button onClick={() => handleOpenDialog(null)} className="flex-1 sm:flex-none sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {tasks.length > 0 ? (
            <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full space-y-2">
                {groupedTasks.map(group => {
                    const totalTasks = group.tasks.length;
                    const completedTasks = group.tasks.filter(t => t.completed).length;
                    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                    
                    return (
                    <AccordionItem value={group.date} key={group.date} className="border rounded-lg px-4 bg-white dark:bg-card">
                        <AccordionTrigger className="py-3 hover:no-underline">
                             <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full">
                                <div className="flex-grow text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-base sm:text-lg">{format(parseISO(group.date), 'MMMM d, yyyy')}</h3>
                                        <Badge variant="secondary">{totalTasks}</Badge>
                                    </div>
                                </div>
                                <div className="w-full md:w-56 shrink-0 space-y-1 mt-2 md:mt-0">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{completedTasks}/{totalTasks}</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-2">
                            {group.tasks.map(task => (
                                <TaskItem key={task.id} task={task} onToggleTask={onToggleTask} onEdit={handleOpenDialog} onDelete={onDeleteTask} onMoveToNextDay={handleMoveToNextDay} />
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                )})}
            </Accordion>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <ListTodo className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-base sm:text-lg font-medium">No Tasks Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Click "Add Task" above to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add a New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update the details of your task.' : 'What do you need to get done?'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Finalize project report" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Add more details..." {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'dd-MMMM-yyyy') : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
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
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {(['High', 'Medium', 'Low'] as DailyTaskPriority[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(['Work', 'Personal', 'Errands'] as DailyTaskCategory[]).map(c => (
                           <SelectItem key={c} value={c}><div className="flex items-center gap-2">{categoryIcons[c]} {c}</div></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingTask ? 'Save Changes' : 'Add Task'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div className="mt-8">
        <AiSuggestionSection
            moduleName="DailyTodo"
            title="AI Productivity Assistant"
            description="Get smart suggestions to organize your day and tackle your to-do list efficiently."
            contextData={{ tasks }}
        />
      </div>
      </div>
    </TooltipProvider>
  );
}
