
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon } from 'lucide-react';

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const { user, updateProfile, loading } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        if (open && user) {
            setName(user?.user_metadata?.name || user?.user_metadata?.full_name || '');
            setAvatarUrl(user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '');
        } else if (!open) {
            // Reset state when dialog closes
            setName('');
            setAvatarUrl('');
        }
    }, [open, user]);

    const handleSave = async () => {
        try {
            await updateProfile({
                name,
                avatar_url: avatarUrl,
            });
            toast({
                title: 'Profile updated',
                description: 'Your profile has been successfully updated.',
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update failed',
                description: 'Failed to update your profile. Please try again.',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information. Changes will be saved automatically.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-6 py-4">
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
                            <Label htmlFor="avatar">Avatar URL</Label>
                            <Input
                                id="avatar"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                            />
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
