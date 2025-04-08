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
      console.log("Supabase client initialized:", !!supabase);
      console.log("Supabase URL:", supabase.supabaseUrl);

      // Insert the new user into Supabase
      try {
        const response = await supabase
          .from("users")
          .insert(userData)
          .select("*")
          .single();

        const { data, error } = response;

        console.log("Insert response full details:", JSON.stringify(response));
        console.log("Insert data:", data);
        console.log("Insert error:", error);

        if (error) {
          console.error(
            "Supabase insert error details:",
            JSON.stringify(error),
          );
          throw error;
        }

        if (!data) {
          console.error("No data returned from insert operation");
          throw new Error("Failed to create user: No data returned");
        }

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

        console.log("New user created successfully:", newUser);

        // Call the onUserAdded callback with the new user
        onUserAdded(newUser);

        // Close the dialog
        setOpen(false);
      } catch (insertError: any) {
        console.error("Error during insert operation:", insertError);
        console.error("Error stack:", insertError.stack);
        throw new Error(`Insert operation failed: ${insertError.message}`);
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      console.error("Error stack:", error.stack);
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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
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
