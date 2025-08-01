
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Send, 
  Bot, 
  ExternalLink, 
  Loader2, 
  User as UserIcon, 
  LayoutDashboard, 
  Target, 
  ListTodo, 
  CalendarDays, 
  Briefcase, 
  Globe, 
  Plane, 
  Car, 
  PiggyBank 
} from 'lucide-react';

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const availableFeatures = [
    { value: 'goals', label: 'Goals', icon: <Target className="h-5 w-5" /> },
    { value: 'daily-todo', label: 'Daily To-Do', icon: <ListTodo className="h-5 w-5" /> },
    { value: 'monthly-plan', label: 'Monthly Plan', icon: <CalendarDays className="h-5 w-5" /> },
    { value: 'job-search', label: 'Job Search', icon: <Briefcase className="h-5 w-5" /> },
    { value: 'living-advisor', label: 'Living Advisor', icon: <Globe className="h-5 w-5" /> },
    { value: 'travel-goals', label: 'Travel Goals', icon: <Plane className="h-5 w-5" /> },
    { value: 'car-sale', label: 'Car Sale', icon: <Car className="h-5 w-5" /> },
    { value: 'finance', label: 'Finance Tracker', icon: <PiggyBank className="h-5 w-5" /> },
    { value: 'ai-task-manager', label: 'AI Task Manager', icon: <Bot className="h-5 w-5" /> },
];

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const { user, updateProfile, loading } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);

    useEffect(() => {
        if (open && user) {
            setName(user?.user_metadata?.name || user?.user_metadata?.full_name || '');
            setAvatarUrl(user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '');
            // Load user's enabled features or default to all features enabled
            const userFeatures = user?.user_metadata?.enabled_features;
            if (userFeatures && Array.isArray(userFeatures) && userFeatures.length > 0) {
                // Remove dashboard from userFeatures if it exists, since it's always enabled
                const featuresWithoutDashboard = userFeatures.filter(f => f !== 'dashboard');
                setEnabledFeatures(featuresWithoutDashboard);
            } else {
                // Default: enable all features for new users (exclude dashboard since it's mandatory)
                // This makes it easier for new users to see all available options
                setEnabledFeatures(availableFeatures.map(f => f.value));
            }
        } else if (!open) {
            // Reset state when dialog closes
            setName('');
            setAvatarUrl('');
            setEnabledFeatures([]);
        }
    }, [open, user]);

    const handleFeatureToggle = (featureValue: string, checked: boolean) => {
        setEnabledFeatures(prev => {
            if (checked) {
                return [...prev, featureValue];
            } else {
                return prev.filter(f => f !== featureValue);
            }
        });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File too large',
                description: 'Please select an image smaller than 5MB.',
            });
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Invalid file type',
                description: 'Please select a valid image file.',
            });
            return;
        }

        // Convert to base64 data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setAvatarUrl(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        try {
            // Always include dashboard as mandatory feature
            const featuresWithDashboard = ['dashboard', ...enabledFeatures.filter(f => f !== 'dashboard')];
            
            console.log('Saving enabled features:', featuresWithDashboard);
            
            await updateProfile({
                name,
                avatar_url: avatarUrl,
                enabled_features: featuresWithDashboard,
            });
            
            toast({
                title: 'Profile updated',
                description: 'Your profile and feature preferences have been successfully updated.',
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Profile update error:', error);
            toast({
                variant: 'destructive',
                title: 'Update failed',
                description: 'Failed to update your profile. Please try again.',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information and select which features you want to use.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Profile Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Profile Information</h3>
                            
                            {/* Profile Picture in Left Column */}
                            <div className="flex flex-col items-center gap-4">
                                <Avatar className="h-20 w-20 border-4 border-muted">
                                    <AvatarImage src={avatarUrl || undefined} alt="Profile preview" />
                                    <AvatarFallback className="bg-white dark:bg-card">
                                       <UserIcon className="h-10 w-10 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="avatar">Profile Picture</Label>
                                    <div className="space-y-3">
                                        <Input
                                            id="avatar"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Upload a profile picture (JPG, PNG, GIF - Max 5MB)
                                        </p>
                                        {avatarUrl && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>Current image set</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAvatarUrl('')}
                                                    className="text-destructive hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Feature Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Available Features</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Select which features you want to see in your dashboard. You can change this anytime.
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md">
                                    📌 Dashboard is always enabled as it's the main navigation hub
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 border rounded-lg p-4">
                                {availableFeatures.map((feature) => (
                                    <div key={feature.value} className="flex flex-col items-center space-y-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                            {feature.icon}
                                        </div>
                                        <Label 
                                            htmlFor={feature.value} 
                                            className="text-xs text-center cursor-pointer font-medium leading-tight"
                                        >
                                            {feature.label}
                                        </Label>
                                        <Checkbox
                                            id={feature.value}
                                            checked={enabledFeatures.includes(feature.value)}
                                            onCheckedChange={(checked) => handleFeatureToggle(feature.value, checked as boolean)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={typeof loading === 'boolean' && loading}>
                        {(typeof loading === 'boolean' && loading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {(typeof loading === 'boolean' && loading) ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
