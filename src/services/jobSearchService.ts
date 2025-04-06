import { Role } from "@/types/career";

// Interface for job search results
interface JobSearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  datePosted: Date;
  source: "linkedin" | "indeed" | "glassdoor" | "other";
}

// Interface for job search parameters
interface JobSearchParams {
  title?: string;
  keywords?: string[];
  location?: string;
  remote?: boolean;
  experienceLevel?: "entry" | "mid" | "senior" | "executive";
  datePosted?:
    | "past24Hours"
    | "past3Days"
    | "pastWeek"
    | "pastMonth"
    | "anytime";
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
}

/**
 * Search for jobs across multiple platforms
 * This is a mock implementation that would be replaced with actual API calls
 */
export async function searchJobs(
  params: JobSearchParams,
): Promise<JobSearchResult[]> {
  try {
    // In a real implementation, this would make API calls to job search platforms
    // For now, we'll return mock data

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return getMockJobResults(params);
  } catch (error) {
    console.error("Error searching for jobs:", error);
    throw error;
  }
}

/**
 * Find job listings that match a specific role
 */
export async function findJobsForRole(
  role: Role,
  location?: string,
  remote?: boolean,
): Promise<JobSearchResult[]> {
  try {
    return await searchJobs({
      title: role.title,
      keywords: [...role.requiredSkills, ...role.preferredSkills],
      location,
      remote,
      salary: role.averageSalary,
    });
  } catch (error) {
    console.error("Error finding jobs for role:", error);
    throw error;
  }
}

// Mock data for demonstration purposes
function getMockJobResults(params: JobSearchParams): JobSearchResult[] {
  const baseResults = [
    {
      id: "job-1",
      title: "Senior Marketing Manager",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      description: "Leading marketing team for innovative tech products...",
      url: "https://example.com/job/1",
      salary: {
        min: 90000,
        max: 110000,
        currency: "$",
      },
      datePosted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      source: "linkedin" as const,
    },
    {
      id: "job-2",
      title: "UX Researcher",
      company: "DesignHub",
      location: "Remote",
      description: "Conducting user research to inform product design...",
      url: "https://example.com/job/2",
      salary: {
        min: 85000,
        max: 100000,
        currency: "$",
      },
      datePosted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      source: "indeed" as const,
    },
    {
      id: "job-3",
      title: "Data Scientist",
      company: "DataDriven Co.",
      location: "New York, NY",
      description: "Analyzing complex datasets to drive business decisions...",
      url: "https://example.com/job/3",
      salary: {
        min: 100000,
        max: 130000,
        currency: "$",
      },
      datePosted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      source: "glassdoor" as const,
    },
    {
      id: "job-4",
      title: "Marketing Director",
      company: "Global Brands Inc.",
      location: "Chicago, IL",
      description:
        "Overseeing all marketing functions and developing strategy...",
      url: "https://example.com/job/4",
      salary: {
        min: 120000,
        max: 150000,
        currency: "$",
      },
      datePosted: new Date(), // Today
      source: "linkedin" as const,
    },
    {
      id: "job-5",
      title: "Product Marketing Lead",
      company: "SaaS Solutions",
      location: "Remote",
      description:
        "Developing and executing marketing strategies for products...",
      url: "https://example.com/job/5",
      salary: {
        min: 90000,
        max: 115000,
        currency: "$",
      },
      datePosted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      source: "indeed" as const,
    },
  ];

  // Filter results based on parameters
  return baseResults.filter((job) => {
    // Filter by title
    if (
      params.title &&
      !job.title.toLowerCase().includes(params.title.toLowerCase())
    ) {
      return false;
    }

    // Filter by location
    if (
      params.location &&
      !job.location.toLowerCase().includes(params.location.toLowerCase())
    ) {
      return false;
    }

    // Filter by remote
    if (
      params.remote === true &&
      !job.location.toLowerCase().includes("remote")
    ) {
      return false;
    }

    // Filter by salary
    if (params.salary) {
      if (!job.salary) return false;
      if (
        job.salary.max < params.salary.min ||
        job.salary.min > params.salary.max
      ) {
        return false;
      }
    }

    // Filter by date posted
    if (params.datePosted) {
      const now = new Date();
      const jobDate = job.datePosted;
      const diffDays = Math.floor(
        (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      switch (params.datePosted) {
        case "past24Hours":
          if (diffDays > 1) return false;
          break;
        case "past3Days":
          if (diffDays > 3) return false;
          break;
        case "pastWeek":
          if (diffDays > 7) return false;
          break;
        case "pastMonth":
          if (diffDays > 30) return false;
          break;
      }
    }

    return true;
  });
}
