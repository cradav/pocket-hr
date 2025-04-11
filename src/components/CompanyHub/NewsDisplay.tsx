import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, ExternalLink } from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  published_at: string;
  source: string;
  category: string;
  url: string;
}

interface NewsDisplayProps {
  isLoading: boolean;
  error: string | null;
  articles: NewsArticle[];
  onRetry: () => void;
  emptyMessage?: string;
}

const NewsDisplay: React.FC<NewsDisplayProps> = ({
  isLoading,
  error,
  articles,
  onRetry,
  emptyMessage = "No news articles found.",
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
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
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground">
            Try changing the search criteria or check back later for updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article, index) => (
        <Card key={article.id || index}>
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
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                Read more <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NewsDisplay;
