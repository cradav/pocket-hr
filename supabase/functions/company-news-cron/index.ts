// Supabase Edge Function to fetch company news for all users
// This function is scheduled to run every day using pg_cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Company {
  id: string;
  company: string;
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  published_at: string;
  source: string;
  category: string;
  url: string;
  company_name: string;
  user_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    // Log credential availability for debugging
    console.log(`Supabase URL available: ${!!supabaseUrl}`);
    console.log(`Supabase Service Key available: ${!!supabaseServiceKey}`);

    // Fall back to client-side credentials if server-side ones aren't available
    const finalSupabaseUrl = supabaseUrl || Deno.env.get("VITE_SUPABASE_URL");
    const finalSupabaseKey =
      supabaseServiceKey ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("VITE_SUPABASE_ANON_KEY");

    if (!finalSupabaseUrl || !finalSupabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    // Create Supabase client with admin privileges
    const supabase = createClient(finalSupabaseUrl, finalSupabaseKey);
    console.log("Supabase client created successfully");

    // Get all unique companies from users table
    const { data: companies, error: companiesError } = await supabase
      .from("users")
      .select("id, company")
      .not("company", "is", null)
      .order("company");

    if (companiesError) {
      throw new Error(`Error fetching companies: ${companiesError.message}`);
    }

    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ message: "No companies found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique company names
    const uniqueCompanies = Array.from(
      new Set(companies.map((c: Company) => c.company).filter(Boolean)),
    );

    console.log(`Found ${uniqueCompanies.length} unique companies`);

    // Process each company
    const results = [];
    for (const companyName of uniqueCompanies) {
      try {
        // Fetch news for this company
        const news = await fetchCompanyNewsFromSerper(companyName);

        if (news && news.length > 0) {
          // Prepare news articles for insertion
          const newsToInsert = news.map((article: any) => ({
            title: article.title,
            summary: article.snippet,
            published_at: article.date
              ? new Date().toISOString()
              : new Date().toISOString(),
            source: article.source,
            category: determineNewsCategory(article.title, article.snippet),
            url: article.link,
            company_name: companyName,
          }));

          // Insert news into company_news table
          const { data: insertedNews, error: insertError } = await supabase
            .from("company_news")
            .upsert(newsToInsert, {
              onConflict: "title,company_name",
              ignoreDuplicates: false,
            })
            .select();

          if (insertError) {
            console.error(
              `Error inserting news for ${companyName}:`,
              insertError,
            );
            results.push({
              company: companyName,
              status: "error",
              message: insertError.message,
            });
          } else {
            results.push({
              company: companyName,
              status: "success",
              count: newsToInsert.length,
            });
          }
        } else {
          results.push({ company: companyName, status: "no_news" });
        }
      } catch (error) {
        console.error(`Error processing company ${companyName}:`, error);
        results.push({
          company: companyName,
          status: "error",
          message: error.message,
        });
      }
    }

    // Update the last run timestamp
    const { error: timestampError } = await supabase.from("cron_logs").upsert(
      {
        job_name: "company_news_fetch",
        last_run: new Date().toISOString(),
        status: "completed",
        details: JSON.stringify(results),
      },
      { onConflict: "job_name" },
    );

    if (timestampError) {
      console.error("Error updating cron log:", timestampError);
    }

    return new Response(
      JSON.stringify({
        message: "Company news fetch completed",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in company news cron job:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Function to fetch company news from Serper API
async function fetchCompanyNewsFromSerper(
  companyName: string,
): Promise<NewsArticle[]> {
  try {
    // Get Serper API key from environment variable or use the provided one
    const apiKey =
      Deno.env.get("SERPER_API_KEY") ||
      "6bc8b8e035ed601348b1f3985d45f6c1534cf6ef";

    if (!apiKey) {
      console.error("Serper API key is not set in environment variables");
      return [];
    }

    // Construct the search query with employment/job focus
    const query = `${companyName} AND (employee OR job OR worker)`;

    const myHeaders = new Headers();
    myHeaders.append("X-API-KEY", apiKey);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      q: query,
      location: "United States",
      tbs: "qdr:w", // Last week
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    // Fetch data from Serper API
    const response = await fetch(
      "https://google.serper.dev/news",
      requestOptions,
    );

    if (!response.ok) {
      throw new Error(
        `Serper API request failed with status ${response.status}`,
      );
    }

    const data = await response.json();

    // Check if news exists in the response
    if (!data.news || !Array.isArray(data.news)) {
      console.warn(`No news results found for ${companyName}`);
      return [];
    }

    // Map the response to our NewsArticle format
    return data.news.map((item: any, index: number) => ({
      id: `serper-${companyName}-${index}-${Date.now()}`,
      title: item.title,
      snippet: item.snippet,
      published_at: new Date().toISOString(),
      source: item.source,
      category: determineNewsCategory(item.title, item.snippet),
      url: item.link,
      company_name: companyName,
    }));
  } catch (error) {
    console.error(
      `Error fetching news from Serper API for ${companyName}:`,
      error,
    );
    return [];
  }
}

// Helper function to determine news category based on content
function determineNewsCategory(title: string, snippet: string): string {
  const content = (title + " " + snippet).toLowerCase();

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
