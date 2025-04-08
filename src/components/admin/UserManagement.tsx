import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, UserRole, UserStatus } from "@/types/admin";
import EditUserDialog, { EditUserDialogRef } from "./EditUserDialog";
import { MoreHorizontal, Search } from "lucide-react";
import AddUserDialog from "./AddUserDialog";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Initial empty users array
const initialUsers: User[] = [];

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const editDialogRef = useRef<EditUserDialogRef>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "suspend" | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if supabase client is properly initialized
        if (!supabase || !supabase.from) {
          throw new Error("Supabase client not properly initialized");
        }

        console.log("Fetching users from Supabase...");
        const { data, error } = await supabase.from("users").select("*");

        console.log("Supabase response:", { data, error });

        if (error) {
          console.error("Supabase error details:", JSON.stringify(error));
          throw error;
        }

        if (!data) {
          throw new Error("No data returned from Supabase");
        }

        console.log(`Successfully fetched ${data.length} users`);

        // Transform the data to match the User interface
        const transformedUsers: User[] = data.map((user: any) => {
          const transformedUser = {
            id: user.id,
            name:
              user.name || (user.email ? user.email.split("@")[0] : "Unknown"),
            email: user.email || "no-email@example.com",
            company: user.company || "Not specified",
            role: user.role === "admin" ? UserRole.ADMIN : UserRole.USER,
            status: user.is_active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
            planId: user.plan_id || "free",
            createdAt: user.created_at || new Date().toISOString(),
            lastLogin:
              user.last_sign_in_at ||
              user.created_at ||
              new Date().toISOString(),
            wordCredits: {
              remaining: user.word_credits_remaining || 0,
              total: user.word_credits_total || 0,
            },
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          };
          return transformedUser;
        });

        console.log("Transformed users:", transformedUsers);
        setUsers(transformedUsers);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        console.error("Error stack:", err.stack);
        setError(`Failed to load users: ${err.message || "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return "success";
      case UserStatus.INACTIVE:
        return "secondary";
      case UserStatus.SUSPENDED:
        return "destructive";
      default:
        return "default";
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    // Use setTimeout to ensure the state is updated before opening the dialog
    setTimeout(() => {
      if (editDialogRef.current) {
        editDialogRef.current.setOpen(true);
      }
    }, 0);
  };

  const handleUserUpdated = async (updatedUser: User) => {
    try {
      // Prepare the data for Supabase update
      const updateData = {
        name: updatedUser.name,
        email: updatedUser.email,
        company: updatedUser.company,
        role: updatedUser.role === UserRole.ADMIN ? "admin" : "user",
        is_active: updatedUser.status === UserStatus.ACTIVE,
        plan_id: updatedUser.planId,
        word_credits_remaining: updatedUser.wordCredits.remaining,
        word_credits_total: updatedUser.wordCredits.total,
      };

      console.log("Updating user with data:", updateData);
      console.log("User ID:", updatedUser.id);

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", updatedUser.id)
        .select();

      console.log("Update response:", { data, error });

      if (error) {
        console.error("Supabase update error details:", JSON.stringify(error));
        throw error;
      }

      // Update local state after successful update
      setUsers(
        users.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );
      console.log("User updated successfully");
    } catch (err: any) {
      console.error("Error updating user:", err);
      console.error("Error stack:", err.stack);
      setError(`Failed to update user: ${err.message || "Unknown error"}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      console.log("Deleting user with ID:", userId);

      const { data, error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId)
        .select();

      console.log("Delete response:", { data, error });

      if (error) {
        console.error("Supabase delete error details:", JSON.stringify(error));
        throw error;
      }

      // Update local state after successful deletion
      setUsers(users.filter((user) => user.id !== userId));
      console.log("User deleted successfully");
    } catch (err: any) {
      console.error("Error deleting user:", err);
      console.error("Error stack:", err.stack);
      setError(`Failed to delete user: ${err.message || "Unknown error"}`);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      console.log("Suspending user with ID:", userId);

      const { data, error } = await supabase
        .from("users")
        .update({ is_active: false }) // Using is_active instead of status to match the schema
        .eq("id", userId)
        .select();

      console.log("Suspend response:", { data, error });

      if (error) {
        console.error("Supabase suspend error details:", JSON.stringify(error));
        throw error;
      }

      // Update local state after successful suspension
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: UserStatus.SUSPENDED } : user,
        ),
      );
      console.log("User suspended successfully");
    } catch (err: any) {
      console.error("Error suspending user:", err);
      console.error("Error stack:", err.stack);
      setError(`Failed to suspend user: ${err.message || "Unknown error"}`);
    }
  };

  const handleConfirmAction = () => {
    if (!selectedUser) return;

    if (actionType === "delete") {
      handleDeleteUser(selectedUser.id);
    } else if (actionType === "suspend") {
      handleSuspendUser(selectedUser.id);
    }

    setConfirmDialogOpen(false);
    setSelectedUser(null);
    setActionType(null);
  };

  const handleCancelAction = () => {
    setConfirmDialogOpen(false);
    setSelectedUser(null);
    setActionType(null);
  };

  const openConfirmDialog = (user: User, type: "delete" | "suspend") => {
    setSelectedUser(user);
    setActionType(type);
    setConfirmDialogOpen(true);
  };

  return (
    <div className="p-6 bg-background">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, permissions, and account status.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users</CardTitle>
              <AddUserDialog
                onUserAdded={(newUser) => setUsers([...users, newUser])}
              />
            </div>
            <CardDescription>Manage your platform users.</CardDescription>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Word Credits</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                      <p className="mt-2 text-muted-foreground">
                        Loading users...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-destructive"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No users found. Try adjusting your search or add a new
                      user.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.company}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role === UserRole.ADMIN ? "Admin" : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status.charAt(0).toUpperCase() +
                            user.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.wordCredits.remaining.toLocaleString()} /{" "}
                        {user.wordCredits.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleEditUser(user);
                              }}
                            >
                              Edit user
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status !== UserStatus.SUSPENDED && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  openConfirmDialog(user, "suspend");
                                }}
                              >
                                Suspend user
                              </DropdownMenuItem>
                            )}
                            {user.status === UserStatus.SUSPENDED && (
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleUserUpdated({
                                    ...user,
                                    status: UserStatus.ACTIVE,
                                  });
                                }}
                              >
                                Reactivate user
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                openConfirmDialog(user, "delete");
                              }}
                            >
                              Delete user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
          ref={(ref) => {
            if (ref) {
              editDialogRef.current = ref;
            }
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "delete" ? "Delete User" : "Suspend User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "delete"
                ? "Are you sure you want to delete this user? This action cannot be undone."
                : "Are you sure you want to suspend this user? They will lose access to the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAction}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                actionType === "delete"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {actionType === "delete" ? "Delete" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
