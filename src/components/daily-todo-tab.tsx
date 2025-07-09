'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isToday, isPast, parseISO, startOfDay, isTomorrow, isFuture } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, CalendarIcon, Briefcase, User, ShoppingCart, AlertTriangle, ListTodo, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import AiSuggestionSection from './ai-suggestion-section';
import AiTaskGeneratorDialog from './ai-task-generator-dialog';
import type { SuggestedTask } from '@/ai/flows/generate-task-suggestions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().optional(),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  priority: z.enum(['Low', 'Medium', 'High']),
  category: z.enum(['Work', 'Personal', 'Errands']),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const priorityConfig: Record<DailyTaskPriority, { className: string }> = {
  High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
  Low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
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
  data: AppData;
}

const TaskItem = ({ task, onToggleTask, onEdit, onDelete }: { task: DailyTask, onToggleTask: (id: string, completed: boolean) => void, onEdit: (task: DailyTask) => void, onDelete: (id: string) => void }) => {
  const isOverdue = !task.completed && isPast(startOfDay(parseISO(task.dueDate))) && !isToday(startOfDay(parseISO(task.dueDate)));

  return (
    <div className="flex items-center p-3 rounded-lg bg-background hover:bg-muted/50 border transition-all group">
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={(checked) => onToggleTask(task.id, !!checked)}
        className="mr-4"
      />
      <div className="flex-grow">
        <label htmlFor={`task-${task.id}`} className={cn('font-medium', task.completed && 'line-through text-muted-foreground')}>
          {task.title}
        </label>
        <div className="text-sm text-muted-foreground flex items-center gap-x-4 gap-y-1 mt-1 flex-wrap">
          <div className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
            <CalendarIcon className="h-3 w-3" />
            {format(parseISO(task.dueDate), 'dd-MMMM-yyyy')}
          </div>
          <Badge variant="outline" className={cn('text-xs', priorityConfig[task.priority].className)}>
            {task.priority}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            {categoryIcons[task.category]}
            {task.category}
          </Badge>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(task.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

export default function DailyTodoTab({ tasks, onAddTask, onUpdateTask, onDeleteTask, onToggleTask, data }: DailyTodoTabProps) {
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
    };
    if (editingTask) {
      onUpdateTask({ ...editingTask, ...taskData });
    } else {
      onAddTask(taskData);
    }
    setDialogOpen(false);
  };

  const groupedTasks = useMemo(() => {
    const groups: { title: string; tasks: DailyTask[], defaultOpen?: boolean }[] = [];

    const sortTasks = (taskArray: DailyTask[]) => {
        return taskArray.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // Incomplete tasks first
            }
            return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime(); // Then by due date
        });
    }

    const overdue = sortTasks(tasks.filter(t => !t.completed && isPast(startOfDay(parseISO(t.dueDate))) && !isToday(startOfDay(parseISO(t.dueDate)))));
    const today = sortTasks(tasks.filter(t => isToday(startOfDay(parseISO(t.dueDate)))));
    const tomorrow = sortTasks(tasks.filter(t => !t.completed && isTomorrow(startOfDay(parseISO(t.dueDate)))));
    const upcoming = sortTasks(tasks.filter(t => !t.completed && isFuture(startOfDay(parseISO(t.dueDate))) && !isTomorrow(startOfDay(parseISO(t.dueDate)))));
    const completed = tasks.filter(t => t.completed).sort((a,b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());

    if (overdue.length > 0) groups.push({ title: 'Overdue', tasks: overdue, defaultOpen: true });
    if (today.length > 0) groups.push({ title: 'Today', tasks: today, defaultOpen: true });
    if (tomorrow.length > 0) groups.push({ title: 'Tomorrow', tasks: tomorrow, defaultOpen: true });
    if (upcoming.length > 0) groups.push({ title: 'Upcoming', tasks: upcoming, defaultOpen: false });
    if (completed.length > 0) groups.push({ title: 'Completed', tasks: completed, defaultOpen: false });

    return groups;
  }, [tasks]);

  const handleAiTaskAdd = (suggestedTask: SuggestedTask) => {
    const newTask = {
      ...suggestedTask,
      dueDate: new Date().toISOString(),
    };
    onAddTask(newTask);
  };
  
  const defaultOpenGroups = useMemo(() => {
    return groupedTasks.filter(g => g.defaultOpen).map(g => g.title);
  }, [groupedTasks]);


  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Daily To-Do List</h2>
          <p className="mt-1 text-muted-foreground">Organize your day and stay on top of your tasks.</p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <AiTaskGeneratorDialog data={data} onTaskAdd={handleAiTaskAdd}>
                <Button variant="outline" className="w-full justify-center sm:w-auto">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                </Button>
            </AiTaskGeneratorDialog>
            <Button onClick={() => handleOpenDialog(null)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {tasks.length > 0 ? (
            <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full space-y-2">
                {groupedTasks.map(group => (
                    <AccordionItem value={group.title} key={group.title} className="border rounded-lg px-4 bg-muted/30">
                        <AccordionTrigger className="py-3 hover:no-underline">
                             <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{group.title}</h3>
                                <Badge variant="secondary">{group.tasks.length}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-2">
                            {group.tasks.map(task => (
                                <TaskItem key={task.id} task={task} onToggleTask={onToggleTask} onEdit={handleOpenDialog} onDelete={onDeleteTask} />
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <ListTodo className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No Tasks Yet</h3>
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
      <AiSuggestionSection
          moduleName="DailyTodo"
          title="AI Productivity Assistant"
          description="Get smart suggestions to organize your day and tackle your to-do list efficiently."
          contextData={{ tasks }}
      />
    </div>
  );
}
