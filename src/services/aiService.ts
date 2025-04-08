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

/**
 * Generate career pathways based on resume data
 */
export async function generateCareerPathways(
  resumeData: ResumeData,
): Promise<CareerPathway[]> {
  try {
    // In a real implementation, we would use OpenAI to generate career pathways
    // based on the resume data. For now, we'll use mock data.

    // Extract skills and experience from resume data
    const skills = resumeData.skills.map((skill) => skill.name);
    const industries = resumeData.industries || [];

    // Create a prompt for OpenAI
    const prompt = `
      Based on the following resume information, suggest three career pathways:
      Skills: ${skills.join(", ")}
      Industries: ${industries.join(", ")}
      Education: ${resumeData.education.map((e) => `${e.degree} from ${e.institution}`).join(", ")}
      Certifications: ${resumeData.certifications.join(", ")}
      
      For each pathway, provide:
      1. A pathway type (vertical, diagonal, or leap)
      2. A description of the pathway
      3. Time required to achieve
      4. Expected salary change range
      5. Risk level (Low, Medium, High)
      6. Three potential roles within this pathway
    `;

    // In a real implementation, we would call OpenAI here
    // For now, return mock pathways
    console.log("AI would process this prompt:", prompt);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return mock pathways
    return getMockPathways();
  } catch (error) {
    console.error("Error generating career pathways:", error);
    throw error;
  }
}

// Mock pathways for demonstration purposes
function getMockPathways(): CareerPathway[] {
  return [
    {
      id: "vertical-1",
      type: "vertical",
      description: "Traditional promotion within your current field",
      timeRequired: "6-12 months",
      salaryChangeRange: "+10-20%",
      riskLevel: "Low",
      color: "#3b82f6", // blue
      icon: "arrow-up",
      roles: [
        {
          id: "role-1",
          title: "Senior Marketing Manager",
          description:
            "Lead marketing campaigns and team strategy for product lines",
          industry: "Technology",
          requiredSkills: [
            {
              id: "skill-1",
              name: "Marketing Strategy",
              category: "hard",
              level: "advanced",
              relevance: 90,
            },
            {
              id: "skill-2",
              name: "Team Leadership",
              category: "soft",
              level: "intermediate",
              relevance: 85,
            },
          ],
          preferredSkills: [
            {
              id: "skill-3",
              name: "Digital Marketing",
              category: "hard",
              level: "intermediate",
              relevance: 75,
            },
          ],
          averageSalary: {
            min: 85000,
            max: 110000,
            currency: "$",
          },
          growthPotential: 12,
          timeToAchieve: "6-12 months",
          riskLevel: "Low",
          matchScore: 8,
        },
        {
          id: "role-2",
          title: "Marketing Director",
          description:
            "Oversee all marketing functions and develop long-term strategy",
          industry: "Technology",
          requiredSkills: [
            {
              id: "skill-4",
              name: "Strategic Planning",
              category: "hard",
              level: "expert",
              relevance: 95,
            },
            {
              id: "skill-5",
              name: "Budget Management",
              category: "hard",
              level: "advanced",
              relevance: 90,
            },
          ],
          preferredSkills: [
            {
              id: "skill-6",
              name: "Executive Communication",
              category: "soft",
              level: "advanced",
              relevance: 85,
            },
          ],
          averageSalary: {
            min: 120000,
            max: 150000,
            currency: "$",
          },
          growthPotential: 10,
          timeToAchieve: "12-24 months",
          riskLevel: "Low",
          matchScore: 7,
        },
        {
          id: "role-3",
          title: "Product Marketing Lead",
          description:
            "Develop and execute marketing strategies for specific products",
          industry: "Technology",
          requiredSkills: [
            {
              id: "skill-7",
              name: "Product Positioning",
              category: "hard",
              level: "advanced",
              relevance: 90,
            },
            {
              id: "skill-8",
              name: "Market Research",
              category: "hard",
              level: "intermediate",
              relevance: 85,
            },
          ],
          preferredSkills: [
            {
              id: "skill-9",
              name: "Competitive Analysis",
              category: "hard",
              level: "intermediate",
              relevance: 80,
            },
          ],
          averageSalary: {
            min: 90000,
            max: 115000,
            currency: "$",
          },
          growthPotential: 15,
          timeToAchieve: "6-12 months",
          riskLevel: "Low",
          matchScore: 9,
        },
      ],
    },
    {
      id: "diagonal-1",
      type: "diagonal",
      description: "Skill-adjacent role across industries or functions",
      timeRequired: "3-6 months",
      salaryChangeRange: "+5-15%",
      riskLevel: "Medium",
      color: "#22c55e", // green
      icon: "arrow-up-right",
      roles: [
        {
          id: "role-4",
          title: "UX Researcher",
          description:
            "Conduct user research to inform product design decisions",
          industry: "Technology",
          requiredSkills: [
            {
              id: "skill-10",
              name: "User Interviews",
              category: "hard",
              level: "intermediate",
              relevance: 90,
            },
            {
              id: "skill-11",
              name: "Usability Testing",
              category: "hard",
              level: "intermediate",
              relevance: 85,
            },
          ],
          preferredSkills: [
            {
              id: "skill-12",
              name: "Data Analysis",
              category: "hard",
              level: "intermediate",
              relevance: 75,
            },
          ],
          averageSalary: {
            min: 80000,
            max: 105000,
            currency: "$",
          },
          growthPotential: 18,
          timeToAchieve: "3-6 months",
          riskLevel: "Medium",
          matchScore: 7,
        },
        {
          id: "role-5",
          title: "Content Strategist",
          description: "Develop content strategy and oversee content creation",
          industry: "Media",
          requiredSkills: [
            {
              id: "skill-13",
              name: "Content Planning",
              category: "hard",
              level: "advanced",
              relevance: 90,
            },
            {
              id: "skill-14",
              name: "SEO",
              category: "hard",
              level: "intermediate",
              relevance: 80,
            },
          ],
          preferredSkills: [
            {
              id: "skill-15",
              name: "Editorial Calendar Management",
              category: "hard",
              level: "intermediate",
              relevance: 75,
            },
          ],
          averageSalary: {
            min: 75000,
            max: 95000,
            currency: "$",
          },
          growthPotential: 14,
          timeToAchieve: "3-6 months",
          riskLevel: "Medium",
          matchScore: 8,
        },
        {
          id: "role-6",
          title: "Customer Success Manager",
          description: "Ensure customer satisfaction and drive retention",
          industry: "SaaS",
          requiredSkills: [
            {
              id: "skill-16",
              name: "Customer Relationship Management",
              category: "soft",
              level: "advanced",
              relevance: 95,
            },
            {
              id: "skill-17",
              name: "Product Knowledge",
              category: "hard",
              level: "intermediate",
              relevance: 85,
            },
          ],
          preferredSkills: [
            {
              id: "skill-18",
              name: "Upselling Techniques",
              category: "hard",
              level: "intermediate",
              relevance: 70,
            },
          ],
          averageSalary: {
            min: 70000,
            max: 90000,
            currency: "$",
          },
          growthPotential: 16,
          timeToAchieve: "3-6 months",
          riskLevel: "Medium",
          matchScore: 6,
        },
      ],
    },
    {
      id: "leap-1",
      type: "leap",
      description: "Radical career shift requiring retraining",
      timeRequired: "1-2 years",
      salaryChangeRange: "Variable",
      riskLevel: "High",
      color: "#f97316", // orange
      icon: "rocket",
      roles: [
        {
          id: "role-7",
          title: "Data Scientist",
          description: "Analyze complex data sets to inform business decisions",
          industry: "Technology",
          requiredSkills: [
            {
              id: "skill-19",
              name: "Python",
              category: "hard",
              level: "advanced",
              relevance: 95,
            },
            {
              id: "skill-20",
              name: "Machine Learning",
              category: "hard",
              level: "advanced",
              relevance: 90,
            },
          ],
          preferredSkills: [
            {
              id: "skill-21",
              name: "SQL",
              category: "hard",
              level: "intermediate",
              relevance: 80,
            },
          ],
          averageSalary: {
            min: 95000,
            max: 130000,
            currency: "$",
          },
          growthPotential: 22,
          timeToAchieve: "1-2 years",
          riskLevel: "High",
          matchScore: 5,
        },
        {
          id: "role-8",
          title: "Product Manager",
          description: "Lead product development and strategy",
          industry: "Technology",
          requiredSkills: [
            {
              id: "skill-22",
              name: "Product Roadmapping",
              category: "hard",
              level: "advanced",
              relevance: 90,
            },
            {
              id: "skill-23",
              name: "Stakeholder Management",
              category: "soft",
              level: "advanced",
              relevance: 85,
            },
          ],
          preferredSkills: [
            {
              id: "skill-24",
              name: "Agile Methodologies",
              category: "hard",
              level: "intermediate",
              relevance: 80,
            },
          ],
          averageSalary: {
            min: 100000,
            max: 140000,
            currency: "$",
          },
          growthPotential: 20,
          timeToAchieve: "1-2 years",
          riskLevel: "High",
          matchScore: 6,
        },
        {
          id: "role-9",
          title: "Sustainability Consultant",
          description: "Advise organizations on sustainable business practices",
          industry: "Consulting",
          requiredSkills: [
            {
              id: "skill-25",
              name: "Environmental Regulations",
              category: "hard",
              level: "advanced",
              relevance: 90,
            },
            {
              id: "skill-26",
              name: "Sustainability Frameworks",
              category: "hard",
              level: "advanced",
              relevance: 85,
            },
          ],
          preferredSkills: [
            {
              id: "skill-27",
              name: "Carbon Accounting",
              category: "hard",
              level: "intermediate",
              relevance: 75,
            },
          ],
          averageSalary: {
            min: 85000,
            max: 120000,
            currency: "$",
          },
          growthPotential: 25,
          timeToAchieve: "1-2 years",
          riskLevel: "High",
          matchScore: 4,
        },
      ],
    },
  ];
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
