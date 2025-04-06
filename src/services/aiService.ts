import { supabase } from "@/lib/supabase";
import { Role } from "@/types/career";
import { openai } from "./openaiService";

/**
 * Calculate similarity score between two embedding vectors
 * using cosine similarity
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate embeddings for a text using OpenAI's embedding model
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Match a user's resume and skills to potential roles
 */
export async function matchRolesToResume(
  resumeText: string,
  skills: string[],
  industries?: string[],
  preferredSalary?: { min: number; max: number },
): Promise<Role[]> {
  try {
    // Generate embedding for the resume
    const resumeEmbedding = await generateEmbedding(
      `${resumeText}\n\nSkills: ${skills.join(", ")}`,
    );

    // In a real implementation, we would fetch roles from the database
    // and compare their embeddings with the resume embedding
    // For now, we'll use mock data and assign random match scores

    // Fetch roles from database (mock for now)
    const mockRoles = getMockRoles();

    // Calculate match scores
    const rolesWithScores = await Promise.all(
      mockRoles.map(async (role) => {
        // In a real implementation, we would store pre-computed embeddings
        // for each role in the database to avoid generating them on the fly
        const roleEmbedding = await generateEmbedding(
          `${role.title}\n${role.description}\nIndustry: ${role.industry}`,
        );

        const similarity = calculateCosineSimilarity(
          resumeEmbedding,
          roleEmbedding,
        );

        // Convert similarity to a 1-10 scale
        const matchScore = Math.round((similarity * 0.5 + 0.5) * 10);

        return {
          ...role,
          matchScore: Math.min(10, Math.max(1, matchScore)),
        };
      }),
    );

    // Filter by industry if specified
    let filteredRoles = rolesWithScores;
    if (industries && industries.length > 0) {
      filteredRoles = filteredRoles.filter((role) =>
        industries.includes(role.industry),
      );
    }

    // Filter by salary if specified
    if (preferredSalary) {
      filteredRoles = filteredRoles.filter(
        (role) =>
          role.averageSalary.max >= preferredSalary.min &&
          role.averageSalary.min <= preferredSalary.max,
      );
    }

    // Sort by match score (descending)
    return filteredRoles.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Error matching roles to resume:", error);
    throw error;
  }
}

// Mock data for demonstration purposes
function getMockRoles(): Omit<Role, "matchScore">[] {
  return [
    {
      id: "role-1",
      title: "Senior Marketing Manager",
      description:
        "Lead marketing campaigns and team strategy for product lines",
      industry: "Technology",
      requiredSkills: [
        "Marketing Strategy",
        "Team Leadership",
        "Campaign Management",
      ],
      preferredSkills: ["Digital Marketing", "Content Strategy", "Analytics"],
      averageSalary: {
        min: 85000,
        max: 110000,
        currency: "$",
      },
      growthPotential: 12,
      timeToAchieve: "6-12 months",
      riskLevel: "Low",
    },
    {
      id: "role-2",
      title: "UX Researcher",
      description: "Conduct user research to inform product design decisions",
      industry: "Technology",
      requiredSkills: [
        "User Research",
        "Usability Testing",
        "Interview Techniques",
      ],
      preferredSkills: [
        "Prototyping",
        "Data Analysis",
        "Psychology Background",
      ],
      averageSalary: {
        min: 80000,
        max: 105000,
        currency: "$",
      },
      growthPotential: 18,
      timeToAchieve: "3-6 months",
      riskLevel: "Medium",
    },
    {
      id: "role-3",
      title: "Data Scientist",
      description: "Analyze complex data sets to inform business decisions",
      industry: "Technology",
      requiredSkills: ["Python", "Machine Learning", "Statistics"],
      preferredSkills: ["SQL", "Data Visualization", "Big Data"],
      averageSalary: {
        min: 95000,
        max: 130000,
        currency: "$",
      },
      growthPotential: 22,
      timeToAchieve: "1-2 years",
      riskLevel: "High",
    },
  ];
}
