import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AssistantFormData, CareerStage } from "../AIAssistant/types";

interface AssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AssistantFormData) => void;
  title: string;
  description: string;
  initialData?: AssistantFormData;
  careerStages: CareerStage[];
  selectedStageId?: string;
}

const AssistantDialog: React.FC<AssistantDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  title,
  description,
  initialData,
  careerStages,
  selectedStageId,
}) => {
  const defaultFormData: AssistantFormData = {
    name: "",
    description: "",
    mode: "",
    systemPromptContent:
      "You are an AI HR assistant. Provide helpful, professional advice on career and workplace topics. Be concise, specific, and actionable in your responses.",
    isActive: true,
    careerStageId: "",
    userDataAccess: {
      documents: false,
      profileInfo: false,
      companyData: false,
    },
  };

  const [formData, setFormData] = useState<AssistantFormData>(
    initialData || defaultFormData,
  );

  const [stageId, setStageId] = useState<string>(
    selectedStageId || initialData?.careerStageId || careerStages[0]?.id || "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include the selected career stage ID in the form data
    const updatedFormData = {
      ...formData,
      careerStageId: stageId,
      userDataAccess: {
        documents: formData.userDataAccess?.documents || false,
        profileInfo: formData.userDataAccess?.profileInfo || false,
        companyData: formData.userDataAccess?.companyData || false,
      },
    };
    onSave(updatedFormData);
    onOpenChange(false);
  };

  const handleChange = (
    field: keyof AssistantFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label
                  htmlFor="description"
                  className="text-right font-medium pt-2"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="col-span-3 min-h-[80px]"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mode" className="text-right font-medium">
                  Mode
                </Label>
                <Input
                  id="mode"
                  value={formData.mode}
                  onChange={(e) => handleChange("mode", e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., resume-coach, negotiation-advisor"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="career-stage"
                  className="text-right font-medium"
                >
                  Career Stage
                </Label>
                <Select
                  value={stageId}
                  onValueChange={(value) => setStageId(value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a career stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {careerStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* System Prompt Section */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-lg font-medium">System Prompt</h3>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label
                  htmlFor="system-prompt"
                  className="text-right font-medium pt-2"
                >
                  Content
                </Label>
                <Textarea
                  id="system-prompt"
                  value={formData.systemPromptContent}
                  onChange={(e) =>
                    handleChange("systemPromptContent", e.target.value)
                  }
                  className="col-span-3 min-h-[120px]"
                  rows={5}
                  required
                />
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-lg font-medium">Status</h3>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is-active" className="text-right font-medium">
                  Active
                </Label>
                <div className="flex items-center space-x-3 col-span-3">
                  <Switch
                    id="is-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleChange("isActive", checked)
                    }
                  />
                  <Label htmlFor="is-active" className="cursor-pointer">
                    {formData.isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>

            {/* User Data Access Section */}
            <div className="space-y-4 pt-2 border-t">
              <div>
                <h3 className="text-lg font-medium">User Data Access</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure which user data this assistant can access when
                  granted permission.
                </p>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="access-documents"
                  className="text-right font-medium"
                >
                  User Documents
                </Label>
                <div className="flex items-center space-x-3 col-span-3">
                  <Switch
                    id="access-documents"
                    checked={formData.userDataAccess?.documents || false}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        userDataAccess: {
                          ...prev.userDataAccess,
                          documents: checked,
                        },
                      }));
                    }}
                  />
                  <Label htmlFor="access-documents" className="cursor-pointer">
                    {formData.userDataAccess?.documents
                      ? "Enabled"
                      : "Disabled"}
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="access-profile"
                  className="text-right font-medium"
                >
                  Profile Information
                </Label>
                <div className="flex items-center space-x-3 col-span-3">
                  <Switch
                    id="access-profile"
                    checked={formData.userDataAccess?.profileInfo || false}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        userDataAccess: {
                          ...prev.userDataAccess,
                          profileInfo: checked,
                        },
                      }));
                    }}
                  />
                  <Label htmlFor="access-profile" className="cursor-pointer">
                    {formData.userDataAccess?.profileInfo
                      ? "Enabled"
                      : "Disabled"}
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="access-company"
                  className="text-right font-medium"
                >
                  Company Data
                </Label>
                <div className="flex items-center space-x-3 col-span-3">
                  <Switch
                    id="access-company"
                    checked={formData.userDataAccess?.companyData || false}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        userDataAccess: {
                          ...prev.userDataAccess,
                          companyData: checked,
                        },
                      }));
                    }}
                  />
                  <Label htmlFor="access-company" className="cursor-pointer">
                    {formData.userDataAccess?.companyData
                      ? "Enabled"
                      : "Disabled"}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Assistant</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssistantDialog;
