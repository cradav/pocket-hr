import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  wordCredits: number;
  isActive: boolean;
  features: string[];
}

const mockPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    billingCycle: "monthly",
    wordCredits: 1000,
    isActive: true,
    features: [
      "Access to Live Experts",
      "1,000 AI-Generated Words per Month",
      "Pocket.HR AI Assistants",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro Monthly",
    price: 14.99,
    billingCycle: "monthly",
    wordCredits: 10000,
    isActive: true,
    features: [
      "Access to Live HR Experts",
      "10,000 AI-Generated Words per Month",
      "AI Support",
      "Real-time Employment News Alerts",
    ],
  },
  {
    id: "premium-monthly",
    name: "Premium Monthly",
    price: 39.99,
    billingCycle: "monthly",
    wordCredits: 50000,
    isActive: true,
    features: [
      "Priority Access to Live HR Experts",
      "50,000 AI-Generated Words per Month",
      "AI and Live Support",
      "One 30-Minute Live HR Expert Consultation per month",
    ],
  },
  {
    id: "pro-annual",
    name: "Pro Annual",
    price: 143.9,
    billingCycle: "annual",
    wordCredits: 10000,
    isActive: true,
    features: [
      "Access to Live HR Experts",
      "10,000 AI-Generated Words per Month",
      "AI Support",
      "Real-time Employment News Alerts",
    ],
  },
  {
    id: "premium-annual",
    name: "Premium Annual",
    price: 383.9,
    billingCycle: "annual",
    wordCredits: 50000,
    isActive: true,
    features: [
      "Priority Access to Live HR Experts",
      "50,000 AI-Generated Words per Month",
      "Live Support",
      "One 1-Hour HR Expert Consultation per month",
    ],
  },
];

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "0",
    billingCycle: "monthly",
    wordCredits: "1000",
    isActive: true,
  });

  const handleAddPlan = () => {
    setFormData({
      name: "",
      price: "0",
      billingCycle: "monthly",
      wordCredits: "1000",
      isActive: true,
    });
    setIsAddDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      billingCycle: plan.billingCycle,
      wordCredits: plan.wordCredits.toString(),
      isActive: plan.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setCurrentPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveNewPlan = () => {
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name: formData.name,
      price: parseFloat(formData.price),
      billingCycle: formData.billingCycle,
      wordCredits: parseInt(formData.wordCredits),
      isActive: formData.isActive,
      features: ["Basic features"],
    };
    setPlans([...plans, newPlan]);
    setIsAddDialogOpen(false);
  };

  const handleUpdatePlan = () => {
    if (!currentPlan) return;

    const updatedPlans = plans.map((plan) => {
      if (plan.id === currentPlan.id) {
        return {
          ...plan,
          name: formData.name,
          price: parseFloat(formData.price),
          billingCycle: formData.billingCycle,
          wordCredits: parseInt(formData.wordCredits),
          isActive: formData.isActive,
        };
      }
      return plan;
    });

    setPlans(updatedPlans);
    setIsEditDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!currentPlan) return;
    setPlans(plans.filter((plan) => plan.id !== currentPlan.id));
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="p-6 bg-background">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Plan Management</h1>
          <p className="text-muted-foreground">
            Configure subscription plans, pricing, and features.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscription Plans</CardTitle>
              <Button onClick={handleAddPlan}>
                <Plus className="mr-2 h-4 w-4" /> Add Plan
              </Button>
            </div>
            <CardDescription>
              Manage your platform subscription plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Word Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>${plan.price.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">
                      {plan.billingCycle}
                    </TableCell>
                    <TableCell>{plan.wordCredits.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? "success" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeletePlan(plan)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>
              Manage features available in each plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Feature management interface will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Plan Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan for your platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Plan Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Pro Plan"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                className="col-span-3"
                min="0"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="billing-cycle" className="text-right">
                Billing Cycle
              </Label>
              <Select
                value={formData.billingCycle}
                onValueChange={(value) =>
                  handleSelectChange("billingCycle", value)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="word-credits" className="text-right">
                Word Credits
              </Label>
              <Input
                id="word-credits"
                name="wordCredits"
                type="number"
                value={formData.wordCredits}
                onChange={handleInputChange}
                className="col-span-3"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is-active" className="text-right">
                Status
              </Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  handleSelectChange(
                    "isActive",
                    value === "active" ? "true" : "false",
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewPlan}>Save Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the details of this subscription plan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Plan Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price
              </Label>
              <Input
                id="edit-price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                className="col-span-3"
                min="0"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-billing-cycle" className="text-right">
                Billing Cycle
              </Label>
              <Select
                value={formData.billingCycle}
                onValueChange={(value) =>
                  handleSelectChange("billingCycle", value)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-word-credits" className="text-right">
                Word Credits
              </Label>
              <Input
                id="edit-word-credits"
                name="wordCredits"
                type="number"
                value={formData.wordCredits}
                onChange={handleInputChange}
                className="col-span-3"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is-active" className="text-right">
                Status
              </Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  handleSelectChange(
                    "isActive",
                    value === "active" ? "true" : "false",
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan}>Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plan "{currentPlan?.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
