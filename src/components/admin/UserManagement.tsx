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

// Mock data for users
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    company: "Acme Inc",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    planId: "plan1",
    createdAt: "2023-01-15T10:30:00Z",
    lastLogin: "2023-06-20T14:45:00Z",
    wordCredits: {
      remaining: 5000,
      total: 10000,
    },
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    company: "Tech Solutions",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    planId: "plan2",
    createdAt: "2023-02-10T09:15:00Z",
    lastLogin: "2023-06-22T11:30:00Z",
    wordCredits: {
      remaining: 15000,
      total: 20000,
    },
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
  },
  {
    id: "3",
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    company: "Global Enterprises",
    role: UserRole.USER,
    status: UserStatus.INACTIVE,
    planId: "plan1",
    createdAt: "2023-03-05T13:45:00Z",
    lastLogin: "2023-05-15T10:20:00Z",
    wordCredits: {
      remaining: 2000,
      total: 10000,
    },
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=robert",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    company: "Creative Solutions",
    role: UserRole.USER,
    status: UserStatus.SUSPENDED,
    planId: "plan3",
    createdAt: "2023-01-20T11:30:00Z",
    lastLogin: "2023-04-10T09:15:00Z",
    wordCredits: {
      remaining: 0,
      total: 5000,
    },
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
  },
  {
    id: "5",
    name: "Michael Wilson",
    email: "michael.wilson@example.com",
    company: "Innovative Tech",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    planId: "plan2",
    createdAt: "2023-04-12T15:20:00Z",
    lastLogin: "2023-06-21T16:40:00Z",
    wordCredits: {
      remaining: 8000,
      total: 10000,
    },
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
  },
];

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const editDialogRef = useRef<EditUserDialogRef>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "suspend" | null>(
    null,
  );

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

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(
      users.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
    );
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: UserStatus.SUSPENDED } : user,
      ),
    );
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
                {filteredUsers.map((user) => (
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
                ))}
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
