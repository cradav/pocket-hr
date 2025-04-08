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
} from "lucide-react";
import { fetchCompanyNews } from "../services/newsService";
import { supabase } from "@/lib/supabase";

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
  const [activeTab, setActiveTab] = useState("companyNews");
  const [companyName, setCompanyName] = useState("Acme Corporation");
  const [publicNews, setPublicNews] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  // Fetch internal news articles from Supabase
  useEffect(() => {
    const fetchInternalNews = async () => {
      try {
        const { data, error } = await supabase
          .from("company_news")
          .select("*")
          .order("published_at", { ascending: false });

        if (error) throw error;

        if (data) {
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
        }
      } catch (err) {
        console.error("Error fetching internal news:", err);
        // Set default news if database fetch fails
        setNewsArticles([
          {
            id: "1",
            title: "Company Announces New Remote Work Policy",
            summary:
              "Effective next month, all employees will have the option to work remotely up to 3 days per week.",
            published_at: "2023-06-15",
            source: "Company Intranet",
            category: "Policy Update",
            url: "#",
          },
          {
            id: "2",
            title: "Annual Performance Review Process Changes",
            summary:
              "HR department announces simplified performance review process with quarterly check-ins.",
            published_at: "2023-05-28",
            source: "HR Newsletter",
            category: "HR Update",
            url: "#",
          },
        ]);
      }
    };

    fetchInternalNews();
  }, []);

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

  // Fetch public news about the company using the news service
  useEffect(() => {
    const getCompanyNews = async () => {
      setIsLoadingNews(true);
      try {
        setError(null);
        const news = await fetchCompanyNews(companyName);
        setPublicNews(news);
      } catch (error) {
        console.error("Error fetching public news:", error);
        setPublicNews([]);
        setError("Failed to fetch company news. Please try again later.");
      } finally {
        setIsLoadingNews(false);
      }
    };

    if (activeTab === "companyNews") {
      getCompanyNews();
    }
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
                  <Input
                    type="text"
                    placeholder="Company name..."
                    className="w-48 mr-2"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeTab === "companyNews") {
                        setIsLoadingNews(true);
                        setError(null);
                        fetchCompanyNews(companyName)
                          .then((news) => setPublicNews(news))
                          .catch((err) => {
                            console.error("Error fetching news:", err);
                            setError(
                              "Failed to fetch company news. Please try again later.",
                            );
                          })
                          .finally(() => setIsLoadingNews(false));
                      }
                    }}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNews ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-destructive font-medium">{error}</p>
                    <p className="text-sm text-muted-foreground">
                      Please check your API key or try again later.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        if (activeTab === "companyNews") {
                          setIsLoadingNews(true);
                          fetchCompanyNews(companyName)
                            .then((news) => {
                              setPublicNews(news);
                              setError(null);
                            })
                            .catch((err) => {
                              console.error("Error retrying fetch:", err);
                              setError(
                                "Failed to fetch company news. Please try again later.",
                              );
                            })
                            .finally(() => setIsLoadingNews(false));
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : filteredPublicNews.length > 0 ? (
                <div className="space-y-4">
                  {filteredPublicNews.map((article, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{article.title}</CardTitle>
                            <div className="flex items-center mt-1 text-sm text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              {article.published_at}
                              <span className="mx-2">•</span>
                              {article.source}
                            </div>
                          </div>
                          <Badge variant="secondary">{article.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{article.summary}</p>
                        <Button
                          variant="link"
                          className="p-0 h-auto mt-2 flex items-center"
                          asChild
                        >
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Read more <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No public news articles found for {companyName}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try changing the company name or check back later for
                      updates.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          {filteredNews.length > 0 ? (
            filteredNews.map((article) => (
              <Card key={article.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{article.title}</CardTitle>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {article.published_at}
                        <span className="mx-2">•</span>
                        {article.source}
                      </div>
                    </div>
                    <Badge variant="secondary">{article.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{article.summary}</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto mt-2 flex items-center"
                    asChild
                  >
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read more <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No news articles found matching your search.
              </p>
            </div>
          )}
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
