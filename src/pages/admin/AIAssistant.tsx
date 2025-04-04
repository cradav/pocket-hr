import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Edit,
  Trash2,
  Bot,
  FolderPlus,
  Upload,
  Save,
  FileText,
  ToggleLeft,
  ToggleRight,
  Search,
  User,
  Shield,
  Lock,
} from "lucide-react";
import OpenAISettings from "@/components/admin/OpenAISettings";
import { UserRole } from "@/types/admin";
import {
  careerStages,
  initializeCareerStages,
} from "@/components/AIAssistant/data";
import {
  CareerStage,
  Assistant,
  CareerStageFormData,
  AssistantFormData,
} from "@/components/AIAssistant/types";
import CareerStageDialog from "@/components/admin/CareerStageDialog";
import AssistantDialog from "@/components/admin/AssistantDialog";
import DeleteConfirmationDialog from "@/components/admin/DeleteConfirmationDialog";

export default function AIAssistantConfig() {
  const [stages, setStages] = useState(initializeCareerStages());
  const [activeTab, setActiveTab] = useState("assistants");
  const [searchQuery, setSearchQuery] = useState("");

  // Career Stage Dialog state
  const [careerStageDialogOpen, setCareerStageDialogOpen] = useState(false);
  const [careerStageDialogData, setCareerStageDialogData] = useState<{
    title: string;
    description: string;
    initialData?: CareerStageFormData;
    stageId?: string;
  }>({
    title: "",
    description: "",
  });

  // Delete Confirmation Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogData, setDeleteDialogData] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Function to handle adding a new career stage
  const handleAddCareerStage = () => {
    setCareerStageDialogData({
      title: "Add Career Stage",
      description: "Create a new career stage for organizing AI assistants.",
    });
    setCareerStageDialogOpen(true);
  };

  // Function to save a new career stage
  const handleSaveCareerStage = (data: CareerStageFormData) => {
    if (careerStageDialogData.stageId) {
      // Edit existing career stage
      setStages((prevStages) =>
        prevStages.map((stage) =>
          stage.id === careerStageDialogData.stageId
            ? {
                ...stage,
                name: data.name,
                description: data.description,
                isActive: data.isActive,
                lastUpdated: new Date(),
              }
            : stage,
        ),
      );
    } else {
      // Add new career stage
      const newStage: CareerStage = {
        id: `stage-${Date.now()}`,
        name: data.name,
        description: data.description,
        assistants: [],
        isActive: data.isActive,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };
      setStages((prevStages) => [...prevStages, newStage]);
    }
  };

  // Assistant Dialog state
  const [assistantDialogOpen, setAssistantDialogOpen] = useState(false);
  const [assistantDialogData, setAssistantDialogData] = useState<{
    title: string;
    description: string;
    initialData?: AssistantFormData;
    assistantId?: string;
    stageId: string;
  }>({
    title: "",
    description: "",
    stageId: "",
  });

  // Function to handle adding a new assistant
  const handleAddAssistant = (stageId: string) => {
    setAssistantDialogData({
      title: "Add Assistant",
      description: "Create a new AI assistant for this career stage.",
      stageId,
    });
    setAssistantDialogOpen(true);
  };

  // Function to handle editing a career stage
  const handleEditCareerStage = (stageId: string) => {
    const stageToEdit = stages.find((stage) => stage.id === stageId);
    if (stageToEdit) {
      setCareerStageDialogData({
        title: "Edit Career Stage",
        description: "Update the career stage details.",
        initialData: {
          name: stageToEdit.name,
          description: stageToEdit.description || "",
          isActive: stageToEdit.isActive,
        },
        stageId,
      });
      setCareerStageDialogOpen(true);
    }
  };

  // Function to handle deleting a career stage
  const handleDeleteCareerStage = (stageId: string) => {
    const stageToDelete = stages.find((stage) => stage.id === stageId);
    if (stageToDelete) {
      setDeleteDialogData({
        title: "Delete Career Stage",
        description: `Are you sure you want to delete the "${stageToDelete.name}" career stage? This action cannot be undone.`,
        onConfirm: () => {
          setStages((prevStages) =>
            prevStages.filter((stage) => stage.id !== stageId),
          );
        },
      });
      setDeleteDialogOpen(true);
    }
  };

  // Function to handle editing an assistant
  const handleEditAssistant = (stageId: string, assistantId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      const assistantToEdit = stage.assistants.find(
        (a) => a.id === assistantId,
      );
      if (assistantToEdit) {
        setAssistantDialogData({
          title: "Edit Assistant",
          description: "Update the assistant details.",
          initialData: {
            name: assistantToEdit.name,
            description: assistantToEdit.description,
            mode: assistantToEdit.mode,
            systemPromptContent: assistantToEdit.systemPrompt?.content || "",
            isActive: assistantToEdit.isActive,
            userDataAccess: {
              documents: assistantToEdit.userDataAccess?.documents || false,
              profileInfo: assistantToEdit.userDataAccess?.profileInfo || false,
              companyData: assistantToEdit.userDataAccess?.companyData || false,
            },
            careerStageId: stageId,
          },
          assistantId,
          stageId,
        });
        setAssistantDialogOpen(true);
      }
    }
  };

  // Function to handle deleting an assistant
  const handleDeleteAssistant = (stageId: string, assistantId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      const assistantToDelete = stage.assistants.find(
        (a) => a.id === assistantId,
      );
      if (assistantToDelete) {
        setDeleteDialogData({
          title: "Delete Assistant",
          description: `Are you sure you want to delete the "${assistantToDelete.name}" assistant? This action cannot be undone.`,
          onConfirm: () => {
            setStages((prevStages) =>
              prevStages.map((stage) =>
                stage.id === stageId
                  ? {
                      ...stage,
                      assistants: stage.assistants.filter(
                        (assistant) => assistant.id !== assistantId,
                      ),
                    }
                  : stage,
              ),
            );
          },
        });
        setDeleteDialogOpen(true);
      }
    }
  };

  // Function to handle training an assistant
  const handleTrainAssistant = (stageId: string, assistantId: string) => {
    // This will be implemented in a future iteration
    console.log(`Train assistant ${assistantId} in stage ${stageId}`);
  };

  // Function to save a new or edited assistant
  const handleSaveAssistant = (data: AssistantFormData) => {
    const { stageId } = assistantDialogData;

    if (assistantDialogData.assistantId) {
      // Edit existing assistant
      setStages((prevStages) =>
        prevStages.map((stage) =>
          stage.id === stageId
            ? {
                ...stage,
                assistants: stage.assistants.map((assistant) =>
                  assistant.id === assistantDialogData.assistantId
                    ? {
                        ...assistant,
                        name: data.name,
                        description: data.description,
                        mode: data.mode,
                        isActive: data.isActive,
                        userDataAccess: {
                          documents: data.userDataAccess?.documents || false,
                          profileInfo:
                            data.userDataAccess?.profileInfo || false,
                          companyData:
                            data.userDataAccess?.companyData || false,
                        },
                        systemPrompt: {
                          id:
                            assistant.systemPrompt?.id ||
                            `prompt-${Date.now()}`,
                          name: `${data.name} System Prompt`,
                          content: data.systemPromptContent,
                          lastUpdated: new Date(),
                        },
                        lastUpdated: new Date(),
                      }
                    : assistant,
                ),
              }
            : stage,
        ),
      );
    } else {
      // Add new assistant
      const newAssistant: Assistant = {
        id: `assistant-${Date.now()}`,
        name: data.name,
        description: data.description,
        mode: data.mode,
        conversations: [],
        userDataAccess: {
          documents: data.userDataAccess?.documents || false,
          profileInfo: data.userDataAccess?.profileInfo || false,
          companyData: data.userDataAccess?.companyData || false,
        },
        systemPrompt: {
          id: `prompt-${Date.now()}`,
          name: `${data.name} System Prompt`,
          content: data.systemPromptContent,
          lastUpdated: new Date(),
        },
        isActive: data.isActive,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      setStages((prevStages) =>
        prevStages.map((stage) =>
          stage.id === stageId
            ? {
                ...stage,
                assistants: [...stage.assistants, newAssistant],
              }
            : stage,
        ),
      );
    }
  };

  // Filter assistants based on search query
  const filteredStages = stages
    .map((stage) => ({
      ...stage,
      assistants: stage.assistants.filter(
        (assistant) =>
          assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assistant.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter(
      (stage) =>
        stage.assistants.length > 0 ||
        stage.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  return (
    <div className="p-6 bg-background">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            AI Assistant Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and manage AI assistants for your organization.
          </p>
        </div>

        {/* Career Stage Dialog */}
        <CareerStageDialog
          open={careerStageDialogOpen}
          onOpenChange={setCareerStageDialogOpen}
          onSave={handleSaveCareerStage}
          title={careerStageDialogData.title}
          description={careerStageDialogData.description}
          initialData={careerStageDialogData.initialData}
        />

        {/* Assistant Dialog */}
        <AssistantDialog
          open={assistantDialogOpen}
          onOpenChange={setAssistantDialogOpen}
          onSave={handleSaveAssistant}
          title={assistantDialogData.title}
          description={assistantDialogData.description}
          initialData={assistantDialogData.initialData}
          careerStages={stages}
          selectedStageId={assistantDialogData.stageId}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={deleteDialogData.onConfirm}
          title={deleteDialogData.title}
          description={deleteDialogData.description}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="assistants">Assistants</TabsTrigger>
            <TabsTrigger value="settings">OpenAI Settings</TabsTrigger>
            <TabsTrigger value="training">Training Data</TabsTrigger>
            <TabsTrigger value="prompts">System Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="assistants" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-1/3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assistants..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={handleAddCareerStage}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Career Stage
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-6">
                {filteredStages.map((stage) => (
                  <Card key={stage.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{stage.name}</CardTitle>
                          <CardDescription>
                            {stage.description ||
                              `Manage assistants for the ${stage.name} career stage`}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCareerStage(stage.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCareerStage(stage.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stage.assistants.map((assistant) => (
                          <Card key={assistant.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                                    <Bot className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">
                                      {assistant.name}
                                    </CardTitle>
                                    <Badge variant="outline" className="mt-1">
                                      {assistant.mode}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {assistant.description}
                              </p>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-2 border-t">
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEditAssistant(stage.id, assistant.id)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleTrainAssistant(stage.id, assistant.id)
                                  }
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Train
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleDeleteAssistant(stage.id, assistant.id)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                        <Card className="border-dashed flex flex-col items-center justify-center p-6 h-full">
                          <Button
                            variant="ghost"
                            className="h-full w-full flex flex-col gap-2 p-6"
                            onClick={() => handleAddAssistant(stage.id)}
                          >
                            <PlusCircle className="h-8 w-8" />
                            <span>Add Assistant</span>
                          </Button>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <OpenAISettings userRole={UserRole.ADMIN} />
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User-Specific Training Data</CardTitle>
                <CardDescription>
                  Configure how AI assistants access user-specific data to
                  provide personalized assistance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">User Document Access</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      AI assistants can access user documents when granted
                      permission by the user. This allows for personalized
                      responses based on the user's specific documents.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Configure Document Access
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">User Profile Access</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure which user profile information (name, title,
                      company, etc.) AI assistants can access to provide
                      contextual responses.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline">
                        <User className="mr-2 h-4 w-4" />
                        Configure Profile Access
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Default Training Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload general knowledge documents that all AI assistants
                      can access when user-specific data is not available.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        No files uploaded
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="mt-2">
                  <Save className="mr-2 h-4 w-4" />
                  Save Access Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Prompts</CardTitle>
                <CardDescription>
                  Configure the base prompts that guide the AI assistants'
                  behavior for different modes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-prompt">Default Mode</Label>
                  <Textarea
                    id="default-prompt"
                    rows={4}
                    defaultValue="You are an AI HR assistant. Provide helpful, professional advice on career and workplace topics. Be concise, specific, and actionable in your responses."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume-coach-prompt">Resume Coach Mode</Label>
                  <Textarea
                    id="resume-coach-prompt"
                    rows={4}
                    defaultValue="You are an expert resume coach. Help the user create or optimize their resume for job applications and ATS systems. Provide specific, actionable advice tailored to their industry and experience level."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="negotiation-prompt">
                    Negotiation Advisor Mode
                  </Label>
                  <Textarea
                    id="negotiation-prompt"
                    rows={4}
                    defaultValue="You are an expert negotiation advisor. Provide strategic guidance on negotiating job offers, compensation packages, and benefits. Help the user understand their leverage points and how to professionally advocate for themselves."
                  />
                </div>

                <Button className="mt-2">
                  <Save className="mr-2 h-4 w-4" />
                  Save System Prompts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
