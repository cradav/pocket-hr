import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import UserForm from "./UserForm";
import { User, UserRole, UserStatus } from "@/types/admin";
import OpenAISettings from "./OpenAISettings";

interface AddUserDialogProps {
  onUserAdded: (user: User) => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onUserAdded }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // In a real application, this would be an API call
      // For now, we'll simulate a network request with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a new user with the form values
      const newUser: User = {
        id: `user-${Date.now()}`, // Generate a temporary ID
        name: values.name,
        email: values.email,
        company: values.company,
        role: values.role,
        status: values.status,
        planId: "plan1", // Default plan
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        wordCredits: values.wordCredits,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.name.toLowerCase().replace(/\s+/g, "")}`,
      };

      // Call the onUserAdded callback with the new user
      onUserAdded(newUser);

      // Close the dialog
      setOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new user account.
          </DialogDescription>
        </DialogHeader>
        <UserForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        {/* OpenAI Settings section - only fully accessible to admins */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-medium mb-4">OpenAI Configuration</h3>
          <OpenAISettings userRole={UserRole.USER} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
