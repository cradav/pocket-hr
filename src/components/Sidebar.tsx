import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  X,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Bot,
  FileText,
  HeadsetIcon,
  Building,
  GraduationCap,
  ShieldCheck,
  Settings,
  CreditCard,
} from "lucide-react";
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const [expandedAIMenu, setExpandedAIMenu] = useState(
    activeTab === "ai-assistant",
  );
  const [visibleCategories, setVisibleCategories] = useState<
    Record<string, boolean>
  >({});

  // Load category visibility preferences from localStorage
  useEffect(() => {
    const storedPreferences = localStorage.getItem("aiCategoryVisibility");
    if (storedPreferences) {
      try {
        const parsedPreferences = JSON.parse(storedPreferences);
        setVisibleCategories(parsedPreferences);
      } catch (e) {
        console.error("Error parsing stored AI category preferences", e);
        // If there's an error, show all categories by default
        const defaultVisibility: Record<string, boolean> = {};
        careerStages.forEach((stage) => {
          defaultVisibility[stage.id] = true;
          stage.assistants.forEach((assistant) => {
            defaultVisibility[assistant.id] = true;
          });
        });
        setVisibleCategories(defaultVisibility);
      }
    } else {
      // If no preferences are stored, show all categories by default
      const defaultVisibility: Record<string, boolean> = {};
      careerStages.forEach((stage) => {
        defaultVisibility[stage.id] = true;
        stage.assistants.forEach((assistant) => {
          defaultVisibility[assistant.id] = true;
        });
      });
      setVisibleCategories(defaultVisibility);
    }
  }, []);

  // Handle clicks outside the sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle clicks outside if sidebar is open and we're on mobile
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 768
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen, toggleSidebar]);

  const handleSignOut = async () => {
    await signOut();
    // The auth state change will automatically redirect to login
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  };

  const handleCareerStageSelect = (stageId: string) => {
    setSelectedCareerStage(stageId);
    setActiveTab("ai-assistant");

    // Set the first visible assistant of the selected career stage as default
    const stage = careerStages.find((stage) => stage.id === stageId);
    if (stage) {
      // Filter assistants based on visibility
      const filteredAssistants = stage.assistants.filter(
        (assistant) => visibleCategories[assistant.id] !== false,
      );

      if (filteredAssistants.length > 0) {
        // Use the first visible assistant
        setSelectedAssistant(filteredAssistants[0].id);
      } else if (stage.assistants.length > 0) {
        // If no visible assistants, use the first one anyway
        setSelectedAssistant(stage.assistants[0].id);
      }
    }

    // Close sidebar on mobile after selection
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  };

  // Filter visible career stages
  const filteredCareerStages = careerStages.filter(
    (stage) => visibleCategories[stage.id] !== false,
  );

  // Filter visible assistants for each career stage
  const getFilteredAssistants = (stage) => {
    return stage.assistants.filter(
      (assistant) => visibleCategories[assistant.id] !== false,
    );
  };

  // Helper function to close sidebar on mobile after menu item selection
  const handleMenuItemClick = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <div
      ref={sidebarRef}
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
            onClick={() => handleMenuItemClick("dashboard")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
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
              <span>
                <Bot className="h-4 w-4 mr-2 inline" /> AI HR assistants
              </span>
              {expandedAIMenu ? (
                <ChevronDown className="h-4 w-4 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 opacity-70" />
              )}
            </Button>

            {expandedAIMenu && (
              <div className="pl-4 space-y-1 mt-1">
                {filteredCareerStages.map((stage) => {
                  // Only show career stages that have at least one visible assistant
                  const filteredAssistants = getFilteredAssistants(stage);
                  if (filteredAssistants.length === 0) return null;

                  return (
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
                  );
                })}
              </div>
            )}
          </div>

          <Button
            variant={activeTab === "documents" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleMenuItemClick("documents")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </Button>
          <Button
            variant={activeTab === "support" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleMenuItemClick("support")}
          >
            <HeadsetIcon className="h-4 w-4 mr-2" />
            Human Support
          </Button>
          <Button
            variant={activeTab === "company" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleMenuItemClick("company")}
          >
            <Building className="h-4 w-4 mr-2" />
            Company Hub
          </Button>
          <Button
            variant={activeTab === "career-pathways" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleMenuItemClick("career-pathways")}
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Career Pathways
          </Button>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Settings</p>
          <Button
            variant={activeTab === "privacy" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleMenuItemClick("privacy")}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Privacy & Data
          </Button>
          <Button
            variant={activeTab === "account-settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleMenuItemClick("account-settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
          <Button
            variant={activeTab === "pricing" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleMenuItemClick("pricing")}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Plans
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
