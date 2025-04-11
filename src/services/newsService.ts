// News service for fetching company news from SerpApi
import { supabase } from "@/lib/supabase";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  date?: string;
  published_at?: string;
  source: string;
  category: string;
  url: string;
}

// Function to check if news should be refreshed (once per day at 6AM PST)
export async function shouldRefreshNews(
  companyName: string,
  userId?: string,
): Promise<boolean> {
  try {
    // If no user ID, we should refresh (anonymous user)
    if (!userId) return true;

    // Get the last refresh time from Supabase
    const { data, error } = await supabase
      .from("news_refresh")
      .select("last_refresh")
      .eq("company_name", companyName)
      .eq("user_id", userId)
      .single();

    // If error or no data, we should refresh
    if (error || !data) return true;

    const lastRefreshTime = data.last_refresh;
    if (!lastRefreshTime) return true;

    const now = new Date();
    const lastRefresh = new Date(lastRefreshTime);

    // Convert to PST for comparison (UTC-8 or UTC-7 depending on daylight saving)
    const pstOffset = -8; // Standard PST offset from UTC

    // Get current date in PST
    const nowPST = new Date(
      now.getTime() + now.getTimezoneOffset() * 60000 + pstOffset * 3600000,
    );
    const lastRefreshPST = new Date(
      lastRefresh.getTime() +
        lastRefresh.getTimezoneOffset() * 60000 +
        pstOffset * 3600000,
    );

    // Check if it's a different day
    if (nowPST.toDateString() !== lastRefreshPST.toDateString()) {
      // Check if current time is after 6AM PST
      return nowPST.getHours() >= 6;
    }

    return false;
  } catch (error) {
    console.error("Error checking refresh time:", error);
    // If there's an error, default to allowing refresh
    return true;
  }
}

// Function to update the last refresh time in Supabase
export async function updateLastRefreshTime(
  companyName: string,
  userId?: string,
): Promise<void> {
  try {
    // If no user ID, use localStorage fallback
    if (!userId) {
      localStorage.setItem(
        `company_news_refresh_${companyName}`,
        new Date().toISOString(),
      );
      return;
    }

    // Upsert the refresh time in Supabase
    const { error } = await supabase.from("news_refresh").upsert(
      {
        company_name: companyName,
        user_id: userId,
        last_refresh: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "company_name,user_id",
      },
    );

    if (error) {
      console.error("Error updating refresh time in Supabase:", error);
      // Fallback to localStorage if Supabase fails
      localStorage.setItem(
        `company_news_refresh_${companyName}`,
        new Date().toISOString(),
      );
    }
  } catch (error) {
    console.error("Error updating refresh time:", error);
    // Fallback to localStorage if there's an exception
    localStorage.setItem(
      `company_news_refresh_${companyName}`,
      new Date().toISOString(),
    );
  }
}

export async function fetchCompanyNews(
  companyName: string,
  forceRefresh: boolean = false,
  userId?: string,
): Promise<NewsArticle[]> {
  try {
    // Check if we have a SerpApi API key
    const apiKey =
      import.meta.env.VITE_SERPAPI_API_KEY ||
      "d335a901945890ec0786a03afc8f5f71f68df8de8cba6b2d50454c325e39e57c";

    // Check local storage for cached news
    const cachedNewsString = localStorage.getItem(
      `company_news_${companyName}`,
    );
    const cachedData = cachedNewsString ? JSON.parse(cachedNewsString) : null;

    // Check if we should refresh the news
    const shouldRefresh = await shouldRefreshNews(companyName, userId);

    // If we have cached data and shouldn't refresh, return cached data
    if (cachedData && !forceRefresh && !shouldRefresh) {
      console.log("Using cached company news data");
      return cachedData;
    }

    // If we have an API key, use the SerpApi
    if (apiKey) {
      try {
        // Add job and employment related terms to the search
        const newsData = await fetchCompanyNewsFromSerpApi(
          companyName,
          "jobs employment career",
        );

        // Cache the results in localStorage for quick access
        localStorage.setItem(
          `company_news_${companyName}`,
          JSON.stringify(newsData),
        );

        // Update the last refresh time in Supabase
        await updateLastRefreshTime(companyName, userId);

        return newsData;
      } catch (error) {
        console.error(
          "Error fetching from SerpApi, falling back to mock data:",
          error,
        );
        // If SerpApi fails, fall back to mock data
      }
    }

    // If no API key or SerpApi failed, use mock data
    console.log(
      "Using mock data for company news (no API key or API call failed)",
    );

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock data for public news with employment focus
    const mockPublicNews: NewsArticle[] = [
      {
        id: `pub-${Date.now()}-1`,
        title: `${companyName} Announces New Hiring Initiative`,
        summary: `${companyName} plans to hire over 500 new employees in the next quarter as part of its expansion strategy.`,
        date: new Date().toISOString().split("T")[0],
        source: "Business Insider",
        category: "Employment",
        url: "#",
      },
      {
        id: `pub-${Date.now()}-2`,
        title: `${companyName} Implements New Remote Work Policy`,
        summary: `${companyName} has announced a permanent hybrid work model allowing employees to work remotely up to 3 days per week.`,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        source: "HR Magazine",
        category: "Workplace Policy",
        url: "#",
      },
      {
        id: `pub-${Date.now()}-3`,
        title: `${companyName} Named Among Top Employers of 2023`,
        summary: `${companyName} has been recognized for its exceptional workplace culture and employee benefits program.`,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        source: "Forbes",
        category: "Recognition",
        url: "#",
      },
    ];

    // Cache the mock results in localStorage for quick access
    localStorage.setItem(
      `company_news_${companyName}`,
      JSON.stringify(mockPublicNews),
    );

    // Update the last refresh time in Supabase
    await updateLastRefreshTime(companyName, userId);

    return mockPublicNews;
  } catch (error) {
    console.error("Error fetching company news:", error);
    return [];
  }
}

// Function to fetch company news from SerpApi
export async function fetchCompanyNewsFromSerpApi(
  companyName: string,
  additionalTerms: string = "",
): Promise<NewsArticle[]> {
  try {
    const apiKey =
      import.meta.env.VITE_SERPAPI_API_KEY ||
      "d335a901945890ec0786a03afc8f5f71f68df8de8cba6b2d50454c325e39e57c";

    if (!apiKey) {
      console.error(
        "SerpApi API key is not set. Please add it to your environment variables.",
      );
      return [];
    }

    // Construct the search query with employment/job focus
    const searchQuery = `${companyName} ${additionalTerms}`;

    // Construct the API URL
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&tbm=nws&api_key=${apiKey}`;

    // Fetch data from SerpApi
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SerpApi request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Check if news_results exists in the response
    if (!data.news_results || !Array.isArray(data.news_results)) {
      console.warn("No news results found in SerpApi response");
      return [];
    }

    // Map the response to our NewsArticle format
    return data.news_results.map((item: any, index: number) => ({
      id: `serpapi-${index}`,
      title: item.title,
      summary: item.snippet,
      published_at: item.date || new Date().toISOString().split("T")[0],
      source: item.source,
      category: determineNewsCategory(item.title, item.snippet),
      url: item.link,
    }));
  } catch (error) {
    console.error("Error fetching news from SerpApi:", error);
    return [];
  }
}

// Helper function to determine news category based on content
function determineNewsCategory(title: string, summary: string): string {
  const content = (title + " " + summary).toLowerCase();

  if (
    content.includes("hiring") ||
    content.includes("job") ||
    content.includes("career") ||
    content.includes("recruit")
  ) {
    return "Employment";
  } else if (
    content.includes("salary") ||
    content.includes("compensation") ||
    content.includes("pay") ||
    content.includes("wage")
  ) {
    return "Compensation";
  } else if (
    content.includes("policy") ||
    content.includes("benefit") ||
    content.includes("insurance") ||
    content.includes("leave")
  ) {
    return "Policy";
  } else if (
    content.includes("training") ||
    content.includes("development") ||
    content.includes("learning") ||
    content.includes("skill")
  ) {
    return "Training";
  } else if (
    content.includes("layoff") ||
    content.includes("fire") ||
    content.includes("terminate") ||
    content.includes("cut")
  ) {
    return "Workforce Changes";
  } else if (
    content.includes("remote") ||
    content.includes("hybrid") ||
    content.includes("office") ||
    content.includes("work from home")
  ) {
    return "Work Arrangement";
  }

  return "Company News";
}
