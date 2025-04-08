import React, { useState, forwardRef, useImperativeHandle } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserForm from "./UserForm";
import { User, UserRole } from "@/types/admin";
import OpenAISettings from "./OpenAISettings";

interface EditUserDialogProps {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
  trigger?: React.ReactNode;
}

export interface EditUserDialogRef {
  setOpen: (open: boolean) => void;
}

const EditUserDialog = forwardRef<EditUserDialogRef, EditUserDialogProps>(
  ({ user, onUserUpdated, trigger }, ref) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useImperativeHandle(ref, () => ({
      setOpen,
    }));

    const handleSubmit = async (values: any) => {
      setIsSubmitting(true);
      try {
        // In a real application, you would make an API call here
        // For now, we'll simulate a successful update
        setTimeout(() => {
          // Create updated user by merging the original user with the form values
          const updatedUser = {
            ...user,
            ...values,
          };
          onUserUpdated(updatedUser);
          setOpen(false);
          setIsSubmitting(false);
        }, 1000);
      } catch (error) {
        console.error("Error updating user:", error);
        setIsSubmitting(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || <Button variant="outline">Edit User</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            defaultValues={{
              name: user.name,
              email: user.email,
              company: user.company,
              role: user.role,
              status: user.status,
              wordCredits: {
                total: user.wordCredits.total,
                remaining: user.wordCredits.remaining,
              },
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          {/* OpenAI Settings section - only fully accessible to admins */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">OpenAI Configuration</h3>
            <OpenAISettings userRole={user.role} />
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

EditUserDialog.displayName = "EditUserDialog";

export default EditUserDialog;
