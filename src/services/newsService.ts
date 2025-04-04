// News service for fetching company news from SerpApi

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  date: string;
  source: string;
  category: string;
  url: string;
}

export async function fetchCompanyNews(
  companyName: string,
): Promise<NewsArticle[]> {
  try {
    // Check if we have a SerpApi API key
    const apiKey = import.meta.env.VITE_SERPAPI_API_KEY;

    // If we have an API key, use the SerpApi
    if (apiKey) {
      try {
        return await fetchCompanyNewsFromSerpApi(companyName);
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

    // Mock data for public news
    const mockPublicNews: NewsArticle[] = [
      {
        id: `pub-${Date.now()}-1`,
        title: `${companyName} Reports Record Q2 Earnings`,
        summary: `${companyName} announced record-breaking second quarter earnings, exceeding analyst expectations by 15%.`,
        date: new Date().toISOString().split("T")[0],
        source: "Financial Times",
        category: "Financial",
        url: "#",
      },
      {
        id: `pub-${Date.now()}-2`,
        title: `${companyName} Launches New Sustainability Initiative`,
        summary: `${companyName} has committed to becoming carbon neutral by 2030 with a comprehensive sustainability plan.`,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        source: "Business Insider",
        category: "Sustainability",
        url: "#",
      },
      {
        id: `pub-${Date.now()}-3`,
        title: `${companyName} Expands Operations to Asian Markets`,
        summary: `${companyName} announced plans to open new offices in Singapore and Tokyo as part of its global expansion strategy.`,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        source: "Reuters",
        category: "Expansion",
        url: "#",
      },
    ];

    return mockPublicNews;
  } catch (error) {
    console.error("Error fetching company news:", error);
    return [];
  }
}

// Function to fetch company news from SerpApi
export async function fetchCompanyNewsFromSerpApi(
  companyName: string,
): Promise<NewsArticle[]> {
  try {
    const apiKey = import.meta.env.VITE_SERPAPI_API_KEY;

    if (!apiKey) {
      console.error(
        "SerpApi API key is not set. Please add it to your environment variables.",
      );
      return [];
    }

    // Construct the API URL
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(companyName + " news")}&tbm=nws&api_key=${apiKey}`;

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
      date: item.date || new Date().toISOString().split("T")[0],
      source: item.source,
      category: "News",
      url: item.link,
    }));
  } catch (error) {
    console.error("Error fetching news from SerpApi:", error);
    return [];
  }
}
