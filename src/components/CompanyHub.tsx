import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  BookOpen,
  FileText,
  Calendar,
  ExternalLink,
  Clock,
  AlertCircle,
  RefreshCw,
  Building,
} from "lucide-react";
import NewsDisplay from "./CompanyHub/NewsDisplay";
import {
  fetchCompanyNews,
  shouldRefreshNews,
  updateLastRefreshTime,
} from "../services/newsService";
import { supabase } from "@/lib/supabase";
import { useAuth, useProfile } from "@/hooks/useSupabase";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  published_at: string;
  source: string;
  category: string;
  url: string;
}

interface Policy {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  summary: string;
}

const CompanyHub = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState("companyNews");
  const [companyName, setCompanyName] = useState("");
  const [publicNews, setPublicNews] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  // Set company name from user profile
  useEffect(() => {
    if (profile && profile.company) {
      setCompanyName(profile.company);
    } else if (!profileLoading && !profile?.company) {
      setCompanyName("Acme Corporation"); // Default fallback
    }
  }, [profile, profileLoading]);

  // Fetch internal news articles from Supabase for the user's company
  useEffect(() => {
    const fetchInternalNews = async () => {
      if (!companyName) return;

      try {
        const query = supabase
          .from("company_news")
          .select("*")
          .order("published_at", { ascending: false });

        // Filter by company name if available
        const { data, error } = await query.eq("company_name", companyName);

        if (error) throw error;

        if (data && data.length > 0) {
          setNewsArticles(
            data.map((item: any) => ({
              id: item.id,
              title: item.title,
              summary: item.summary,
              published_at: item.published_at,
              source: item.source,
              category: item.category,
              url: item.url || "#",
            })),
          );
        } else {
          // If no company-specific news found, set default news
          setNewsArticles([
            {
              id: "1",
              title: `${companyName} Announces New Remote Work Policy`,
              summary: `Effective next month, all employees at ${companyName} will have the option to work remotely up to 3 days per week.`,
              published_at: new Date().toISOString().split("T")[0],
              source: "Company Intranet",
              category: "Policy Update",
              url: "#",
            },
            {
              id: "2",
              title: `Annual Performance Review Process Changes at ${companyName}`,
              summary: `HR department announces simplified performance review process with quarterly check-ins.`,
              published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              source: "HR Newsletter",
              category: "HR Update",
              url: "#",
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching internal news:", err);
        // Set default news if database fetch fails
        setNewsArticles([
          {
            id: "1",
            title: `${companyName} Announces New Remote Work Policy`,
            summary: `Effective next month, all employees at ${companyName} will have the option to work remotely up to 3 days per week.`,
            published_at: new Date().toISOString().split("T")[0],
            source: "Company Intranet",
            category: "Policy Update",
            url: "#",
          },
          {
            id: "2",
            title: `Annual Performance Review Process Changes at ${companyName}`,
            summary: `HR department announces simplified performance review process with quarterly check-ins.`,
            published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            source: "HR Newsletter",
            category: "HR Update",
            url: "#",
          },
        ]);
      }
    };

    if (companyName) {
      fetchInternalNews();
    }
  }, [companyName]);

  // Fetch company policies from Supabase
  useEffect(() => {
    const fetchPolicies = async () => {
      if (activeTab === "policies") {
        setIsLoadingPolicies(true);
        setPolicyError(null);

        try {
          const { data, error } = await supabase
            .from("company_policies")
            .select("*")
            .order("updated_at", { ascending: false });

          if (error) throw error;

          if (data) {
            setPolicies(
              data.map((item: any) => ({
                id: item.id,
                title: item.title,
                category: item.category,
                lastUpdated: item.updated_at,
                summary: item.summary,
              })),
            );
          }
        } catch (err) {
          console.error("Error fetching policies:", err);
          setPolicyError(
            "Failed to load company policies. Please try again later.",
          );
          // Set default policies if database fetch fails
          setPolicies([
            {
              id: "1",
              title: "Remote Work Policy",
              category: "Work Arrangements",
              lastUpdated: "2023-06-01",
              summary:
                "Guidelines for remote work eligibility, expectations, and procedures.",
            },
            {
              id: "2",
              title: "Code of Conduct",
              category: "Ethics",
              lastUpdated: "2023-03-15",
              summary:
                "Standards of behavior expected from all employees in the workplace.",
            },
          ]);
        } finally {
          setIsLoadingPolicies(false);
        }
      }
    };

    fetchPolicies();
  }, [activeTab]);

  // Function to schedule the next news update at 6AM PST
  const scheduleNextNewsUpdate = () => {
    const now = new Date();

    // Convert to PST for scheduling (UTC-8)
    const pstOffset = -8; // Standard PST offset from UTC
    const nowPST = new Date(
      now.getTime() + now.getTimezoneOffset() * 60000 + pstOffset * 3600000,
    );

    // Set target time to 6AM PST today
    const targetTime = new Date(nowPST);
    targetTime.setHours(6, 0, 0, 0);

    // If it's already past 6AM, schedule for tomorrow
    if (nowPST > targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    // Calculate milliseconds until next 6AM PST
    const msUntilTarget = targetTime.getTime() - nowPST.getTime();

    console.log(
      `Scheduling next news update in ${Math.round(msUntilTarget / 1000 / 60)} minutes`,
    );

    // Set timeout for the next update
    const timerId = setTimeout(() => {
      if (document.visibilityState === "visible") {
        // Only refresh if the page is visible
        refreshCompanyNews(true);
      }
      // Schedule the next update
      scheduleNextNewsUpdate();
    }, msUntilTarget);

    // Store the timer ID for cleanup
    return timerId;
  };

  // Function to fetch company news
  const refreshCompanyNews = async (isScheduledUpdate = false) => {
    if (!isScheduledUpdate) {
      // For manual refreshes, check if we should allow it
      const shouldRefresh = await shouldRefreshNews(companyName, user?.id);

      if (!shouldRefresh) {
        setError(
          "News is already up to date. Next refresh will be available tomorrow at 6AM PST.",
        );
        return;
      }
    }

    setIsLoadingNews(true);
    try {
      setError(null);
      const news = await fetchCompanyNews(
        companyName,
        isScheduledUpdate,
        user?.id,
      );
      setPublicNews(news);
    } catch (error) {
      console.error("Error fetching public news:", error);
      setPublicNews([]);
      setError("Failed to fetch company news. Please try again later.");
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Fetch public news about the company using the news service
  useEffect(() => {
    let timerId: number | undefined;

    if (activeTab === "companyNews") {
      // Initial fetch
      refreshCompanyNews();

      // Schedule next update
      timerId = scheduleNextNewsUpdate();
    }

    // Cleanup function
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [activeTab, companyName]);

  // Filter news articles based on search query
  const filteredNews = newsArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter public news articles based on search query
  const filteredPublicNews = publicNews.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter policies based on search query
  const filteredPolicies = policies.filter(
    (policy) =>
      policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.summary.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-background w-full h-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Company Hub</h1>
        {companyName && (
          <div className="flex items-center mt-1 text-muted-foreground">
            <Building className="h-4 w-4 mr-1" />
            <span>{companyName}</span>
          </div>
        )}
        <p className="text-muted-foreground mt-2">
          Access company news and policy information
        </p>
      </div>

      <div className="flex mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search news or policies..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="ml-2"
          onClick={() => setSearchQuery("")}
        >
          Clear
        </Button>
      </div>

      <Tabs
        defaultValue="companyNews"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="companyNews" className="flex items-center">
            <ExternalLink className="mr-2 h-4 w-4" />
            Company News
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Internal News
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Policy Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companyNews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Latest News About {companyName}</CardTitle>
                  <CardDescription>
                    Public news articles about your company from various sources
                  </CardDescription>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeTab === "companyNews") {
                        refreshCompanyNews();
                      }
                    }}
                    className="flex items-center"
                    disabled={isLoadingNews}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoadingNews ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <NewsDisplay
                isLoading={isLoadingNews}
                error={error}
                articles={filteredPublicNews}
                onRetry={() => refreshCompanyNews()}
                emptyMessage={`No public news articles found for ${companyName}.`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <NewsDisplay
            isLoading={false}
            error={null}
            articles={filteredNews}
            onRetry={() => {}}
            emptyMessage="No news articles found matching your search."
          />
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Policies</CardTitle>
              <CardDescription>
                Browse and search through company policies and guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {filteredPolicies.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPolicies.map((policy) => (
                      <div key={policy.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary" />
                            <h3 className="font-medium">{policy.title}</h3>
                          </div>
                          <Badge variant="outline">{policy.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {policy.summary}
                        </p>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-xs text-muted-foreground">
                            Last updated: {policy.lastUpdated}
                          </span>
                          <Button size="sm" variant="outline">
                            View Policy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">
                      No policies found matching your search.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyHub;
