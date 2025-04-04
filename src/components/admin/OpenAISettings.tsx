import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserRole } from "@/types/admin";
import { AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OpenAISettingsProps {
  userRole: UserRole;
}

const OpenAISettings: React.FC<OpenAISettingsProps> = ({ userRole }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const isAdmin = userRole === UserRole.ADMIN;

  const handleSaveSettings = async () => {
    if (!isAdmin) return;

    setIsSaving(true);
    try {
      // In a real application, this would be an API call to save the settings
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving OpenAI settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenAI Configuration</CardTitle>
        <CardDescription>
          Configure the OpenAI API key and model settings for the AI assistant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAdmin && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              Only administrators can view and modify OpenAI settings.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4" style={{ opacity: isAdmin ? 1 : 0.5 }}>
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={!isAdmin}
            />
            <p className="text-sm text-muted-foreground">
              Your OpenAI API key is stored securely and used for all AI
              assistant interactions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select">Default AI Model</Label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={!isAdmin}
            >
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select the default model to use for AI assistant responses.
            </p>
          </div>

          {showSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                OpenAI settings have been saved successfully.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSaveSettings}
            disabled={!isAdmin || isSaving}
            className="w-full"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenAISettings;
