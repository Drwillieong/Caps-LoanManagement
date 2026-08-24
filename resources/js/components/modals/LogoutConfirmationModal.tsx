import React from 'react';
import { router } from '@inertiajs/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';


interface LogoutConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function LogoutConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmationModalProps) {
  const cleanup = useMobileNavigation();

  const handleConfirm = () => {
    cleanup();
    router.flushAll();
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to log out? You will need to log in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            className="mt-4 w-full border-0 bg-gradient-to-r from-green-600 to-green-500 font-semibold text-white shadow-lg shadow-green-600/25 transition-all duration-300 hover:scale-[1.02] hover:from-green-700 hover:to-green-600 hover:shadow-xl hover:shadow-green-600/30"
            onClick={handleConfirm}
          >
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
