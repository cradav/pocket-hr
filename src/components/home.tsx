import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Menu, ShieldCheck } from "lucide-react";
import AIAssistant from "./AIAssistant";
import DocumentManager from "./DocumentManager";
import SupportScheduler from "./SupportScheduler";
import CompanyHub from "./CompanyHub";
import Pricing from "./Pricing";
import DashboardCard from "./DashboardCard";
import Sidebar from "./Sidebar";
import AccountSettings from "./AccountSettings";
import CareerPathways from "./CareerPathways";

const Home = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [wordCredits, setWordCredits] = useState({
    remaining: 1000,
    total: 1000,
  });
  const [selectedCareerStage, setSelectedCareerStage] = useState("excelling");
  const [selectedAssistant, setSelectedAssistant] = useState(
    "performance-advisor",
  );

  const { user: authUser } = useAuth();
  const isAdmin = authUser?.user_metadata?.role === 'admin';

  // Fetch user data from Supabase
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    company: "",
    avatar: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        console.log('Fetching data for user:', authUser.id);
        try {
          const { data, error } = await supabase
            .from('users')
            .select('name, email, company')
            .eq('id', authUser.id)
            .single();

          console.log('Supabase response:', { data, error });

          if (error) {
            console.error('Error fetching user data:', error);
            return;
          }

          if (data) {
            const newUserData = {
              name: data.name || authUser.email?.split('@')[0] || '',
              email: data.email || authUser.email || '',
              company: data.company || 'Not specified',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
            };
            console.log('Setting user data:', newUserData);
            setUserData(newUserData);
          } else {
            console.log('No data found, creating fallback user data');
            // Fallback if no data found
            setUserData({
              name: authUser.email?.split('@')[0] || '',
              email: authUser.email || '',
              company: 'Not specified',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`,
            });
          }
        } catch (error) {
          console.error('Error:', error);
        }
      } else {
        console.log('No authenticated user found');
      }
    };

    fetchUserData();
  }, [authUser]);

  // Mock notifications count
  const notificationsCount = 3;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle window resize to show/hide sidebar appropriately
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleWordUsage = (wordsUsed: number) => {
    setWordCredits((prev) => ({
      ...prev,
      remaining: Math.max(0, prev.remaining - wordsUsed),
    }));
  };

  return (
    <div
      className={`flex flex-col md:flex-row h-screen bg-background overflow-hidden ${theme === "dark" ? "dark" : ""}`}
    >
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        selectedCareerStage={selectedCareerStage}
        setSelectedCareerStage={setSelectedCareerStage}
        selectedAssistant={selectedAssistant}
        setSelectedAssistant={setSelectedAssistant}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden ml-0">
        {/* Header */}
        <header className="bg-card border-b p-3 md:p-4 flex items-center justify-between">
          <div className="flex items-center">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-lg font-semibold">
              {activeTab === "dashboard"
                ? "Dashboard"
                : activeTab === "ai-assistant"
                  ? "AI Assistant"
                  : activeTab === "documents"
                    ? "Document Manager"
                    : activeTab === "support"
                      ? "Support Scheduler"
                      : activeTab === "company"
                        ? "Company Hub"
                        : activeTab === "privacy"
                          ? "Privacy Settings"
                          : activeTab === "pricing"
                            ? "Pricing Plans"
                            : activeTab === "account-settings"
                              ? "Account Settings"
                              : activeTab === "career-pathways"
                                ? "Career Pathways"
                                : "Pocket.HR"}
            </h2>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex items-center gap-1"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Button>
                <Button variant="outline" size="icon" className="md:hidden">
                  <ShieldCheck className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationsCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {notificationsCount}
                </span>
              )}
            </Button>

            <div className="flex items-center space-x-1 md:space-x-2">
              <Avatar>
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback>
                  {userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{userData.name}</p>
                <p className="text-xs text-muted-foreground">{userData.company}</p>
                {isAdmin && <p className="text-xs text-primary">Admin</p>}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-3 md:p-6">
          {activeTab === "dashboard" && (
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardCard
                title="AI Assistant"
                description="Get instant answers to your HR questions"
                content="Ask questions about company policies, prepare for interviews, or get guidance on workplace issues."
                buttonText="Open Assistant"
                onClick={() => setActiveTab("ai-assistant")}
              />

              <DashboardCard
                title="Document Manager"
                description="Securely store and analyze your documents"
                content="Upload contracts, performance reviews, and other employment documents for secure storage and AI analysis."
                buttonText="Manage Documents"
                onClick={() => setActiveTab("documents")}
              />

              <DashboardCard
                title="Human Support"
                description="Schedule consultations with HR advocates"
                content="Book confidential meetings with HR advocates or legal support for personalized guidance."
                buttonText="Schedule Support"
                onClick={() => setActiveTab("support")}
              />

              <DashboardCard
                title="Company Hub"
                description="Access company news and policies"
                content="Stay updated with company news and access the complete policy library in one place."
                buttonText="View Company Hub"
                onClick={() => setActiveTab("company")}
              />

              <DashboardCard
                title="Privacy Settings"
                description="Control your data and privacy preferences"
                content="View how your data is used and adjust privacy settings to maintain control of your information."
                buttonText="Manage Privacy"
                onClick={() => setActiveTab("privacy")}
              />

              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Your activity overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Documents Stored</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">AI Conversations</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Support Sessions</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Word Credits</span>
                      <span className="font-medium">
                        {wordCredits.remaining}/{wordCredits.total}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "ai-assistant" && (
            <AIAssistant
              wordCredits={wordCredits}
              onWordUsage={handleWordUsage}
              selectedCareerStage={selectedCareerStage}
              selectedAssistant={selectedAssistant}
              setSelectedAssistant={setSelectedAssistant}
            />
          )}
          {activeTab === "documents" && <DocumentManager />}
          {activeTab === "support" && <SupportScheduler />}
          {activeTab === "company" && <CompanyHub />}
          {activeTab === "pricing" && <Pricing />}
          {activeTab === "account-settings" && <AccountSettings />}
          {activeTab === "career-pathways" && (
            <CareerPathways
              wordCredits={wordCredits}
              onWordUsage={handleWordUsage}
            />
          )}

          {activeTab === "privacy" && (
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Privacy & Data Settings</CardTitle>
                <CardDescription>
                  Control how your data is used and stored
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="usage">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
                    <TabsTrigger value="usage">Data Usage</TabsTrigger>
                    <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
                    <TabsTrigger value="export">Export/Delete</TabsTrigger>
                  </TabsList>
                  <TabsContent value="usage" className="p-3 md:p-4">
                    <h3 className="text-lg font-medium mb-4">
                      How Your Data Is Used
                    </h3>
                    <div className="space-y-3 md:space-y-4">
                      <div className="border rounded-md p-3 md:p-4">
                        <h4 className="font-medium mb-2">Document Storage</h4>
                        <p className="text-sm text-muted-foreground">
                          Your documents are encrypted and stored securely. They
                          are only used to provide document analysis and AI
                          assistance.
                        </p>
                      </div>
                      <div className="border rounded-md p-3 md:p-4">
                        <h4 className="font-medium mb-2">AI Conversations</h4>
                        <p className="text-sm text-muted-foreground">
                          Your conversations with the AI assistant are stored to
                          improve response quality and provide conversation
                          history.
                        </p>
                      </div>
                      <div className="border rounded-md p-3 md:p-4">
                        <h4 className="font-medium mb-2">Support Sessions</h4>
                        <p className="text-sm text-muted-foreground">
                          Records of your support sessions are kept for
                          scheduling purposes and to maintain continuity of
                          support.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="settings" className="p-3 md:p-4">
                    <h3 className="text-lg font-medium mb-4">
                      Adjust Privacy Preferences
                    </h3>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-md p-3 md:p-4 space-y-2 sm:space-y-0">
                        <div>
                          <h4 className="font-medium">
                            Allow AI to access my documents
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Enable the AI assistant to reference your uploaded
                            documents when answering questions.
                          </p>
                        </div>
                        <Button variant="outline">Enabled</Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-md p-3 md:p-4 space-y-2 sm:space-y-0">
                        <div>
                          <h4 className="font-medium">
                            Store conversation history
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Save your conversations with the AI assistant for
                            future reference.
                          </p>
                        </div>
                        <Button variant="outline">Enabled</Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-md p-3 md:p-4 space-y-2 sm:space-y-0">
                        <div>
                          <h4 className="font-medium">
                            Receive email notifications
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Get updates about support sessions, document
                            analysis, and platform news.
                          </p>
                        </div>
                        <Button variant="outline">Disabled</Button>
                      </div>
                    </div>
                    <Button className="mt-6">Save Preferences</Button>
                  </TabsContent>
                  <TabsContent value="export" className="p-3 md:p-4">
                    <h3 className="text-lg font-medium mb-4">
                      Export or Delete Your Data
                    </h3>
                    <div className="space-y-4 md:space-y-6">
                      <div className="border rounded-md p-3 md:p-4">
                        <h4 className="font-medium mb-2">Export All Data</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Download a complete copy of all your data stored on
                          Pocket.HR, including documents, conversations, and
                          account information.
                        </p>
                        <Button variant="outline">Request Data Export</Button>
                      </div>
                      <div className="border rounded-md p-3 md:p-4">
                        <h4 className="font-medium mb-2">Delete Account</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Permanently delete your account and all associated
                          data. This action cannot be undone.
                        </p>
                        <Button variant="destructive">
                          Request Account Deletion
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;
