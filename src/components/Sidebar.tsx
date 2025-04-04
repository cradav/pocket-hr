import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, X, ChevronRight, ChevronDown } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/hooks/useSupabase";
import { careerStages } from "./AIAssistant/data";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedCareerStage: string;
  setSelectedCareerStage: (stageId: string) => void;
  selectedAssistant: string;
  setSelectedAssistant: (assistantId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  toggleSidebar,
  selectedCareerStage,
  setSelectedCareerStage,
  selectedAssistant,
  setSelectedAssistant,
}) => {
  const { signOut } = useAuth();
  const [expandedAIMenu, setExpandedAIMenu] = useState(
    activeTab === "ai-assistant",
  );

  const handleSignOut = async () => {
    await signOut();
    // The auth state change will automatically redirect to login
  };

  const handleCareerStageSelect = (stageId: string) => {
    setSelectedCareerStage(stageId);
    setActiveTab("ai-assistant");

    // Set the first assistant of the selected career stage as default
    const stage = careerStages.find((stage) => stage.id === stageId);
    if (stage && stage.assistants.length > 0) {
      setSelectedAssistant(stage.assistants[0].id);
    }
  };

  return (
    <div
      className={`${sidebarOpen ? "w-64" : "w-0 -ml-64"} fixed md:static h-full z-50 bg-card border-r transition-all duration-300 flex flex-col`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">Pocket.HR</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col flex-grow p-4 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Main</p>
          <Button
            variant={activeTab === "dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </Button>

          {/* AI Assistant with nested menu */}
          <div className="space-y-1">
            <Button
              variant={activeTab === "ai-assistant" ? "secondary" : "ghost"}
              className="w-full justify-between group"
              onClick={() => {
                setExpandedAIMenu(!expandedAIMenu);
                if (!expandedAIMenu) setActiveTab("ai-assistant");
              }}
            >
              <span>AI Assistant</span>
              {expandedAIMenu ? (
                <ChevronDown className="h-4 w-4 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 opacity-70" />
              )}
            </Button>

            {expandedAIMenu && (
              <div className="pl-4 space-y-1 mt-1">
                {careerStages.map((stage) => (
                  <Button
                    key={stage.id}
                    variant={
                      activeTab === "ai-assistant" &&
                      selectedCareerStage === stage.id
                        ? "outline"
                        : "ghost"
                    }
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => handleCareerStageSelect(stage.id)}
                  >
                    {stage.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant={activeTab === "documents" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("documents")}
          >
            Documents
          </Button>
          <Button
            variant={activeTab === "support" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("support")}
          >
            Human Support
          </Button>
          <Button
            variant={activeTab === "company" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("company")}
          >
            Company Hub
          </Button>
          <Button
            variant={activeTab === "pricing" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("pricing")}
          >
            Pricing
          </Button>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Settings</p>
          <Button
            variant={activeTab === "privacy" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("privacy")}
          >
            Privacy & Data
          </Button>
          <Button
            variant={activeTab === "account-settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("account-settings")}
          >
            Account Settings
          </Button>
        </div>
      </div>

      <div className="p-4 border-t mt-auto space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Theme</span>
          <ThemeToggle />
        </div>
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
