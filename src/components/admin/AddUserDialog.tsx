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
      // Import supabase client
      const { supabase } = await import("@/lib/supabase");

      // Prepare the data for Supabase insert
      const userData = {
        name: values.name,
        email: values.email,
        company: values.company || "Not specified",
        role: values.role === UserRole.ADMIN ? "admin" : "user",
        is_active: values.status === UserStatus.ACTIVE,
        plan_id: values.planId || "free",
        word_credits_remaining: values.wordCredits?.remaining || 0,
        word_credits_total: values.wordCredits?.total || 0,
      };

      console.log("Sending user data to Supabase:", userData);

      // Insert the new user into Supabase
      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) throw error;

      if (!data) throw new Error("Failed to create user");

      // Create a new user with the form values and returned data
      const newUser: User = {
        id: data.id,
        name: values.name,
        email: values.email,
        company: values.company || "Not specified",
        role: values.role,
        status: values.status,
        planId: values.planId || "free",
        createdAt: data.created_at || new Date().toISOString(),
        lastLogin: data.last_sign_in_at || new Date().toISOString(),
        wordCredits: values.wordCredits || { remaining: 0, total: 0 },
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.name.toLowerCase().replace(/\s+/g, "")}`,
      };

      // Call the onUserAdded callback with the new user
      onUserAdded(newUser);

      // Close the dialog
      setOpen(false);
    } catch (error: any) {
      console.error("Error adding user:", error);
      alert(`Failed to add user: ${error.message || "Unknown error"}`);
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
