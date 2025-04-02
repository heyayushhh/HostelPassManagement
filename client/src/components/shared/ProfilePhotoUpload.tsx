import { useState, useRef } from 'react';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface ProfilePhotoUploadProps {
  user: User;
  onPhotoUpdated?: (updatedUser: User) => void;
}

export default function ProfilePhotoUpload({ user, onPhotoUpdated }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user: authUser, isLoading } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size exceeds 10MB limit',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Only image files are allowed',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      const response = await fetch('/api/users/profile-photo', {
        method: 'POST',
        body: formData,
        // Let the browser set the Content-Type to multipart/form-data
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload profile photo');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Profile photo updated successfully',
      });
      
      if (onPhotoUpdated) {
        onPhotoUpdated(data.user);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload profile photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Don't render anything if the user isn't loaded yet
  if (isLoading) return null;
  
  // Only show the upload component for the current user
  if (authUser?.id !== user.id) {
    return (
      <Avatar className="h-20 w-20">
        {user.profilePhoto ? (
          <AvatarImage src={user.profilePhoto} alt={user.name} />
        ) : (
          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        )}
      </Avatar>
    );
  }
  
  return (
    <Card className="p-4 flex flex-col items-center">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/png, image/jpeg, image/gif, image/webp"
      />
      
      <div className="relative mb-4">
        <Avatar className="h-24 w-24">
          {user.profilePhoto ? (
            <AvatarImage src={user.profilePhoto} alt={user.name} />
          ) : (
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      
      <CardContent className="p-0">
        <Button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Max size: 10MB. Supported formats: JPEG, PNG, GIF, WebP
        </p>
      </CardContent>
    </Card>
  );
}