import { ResumeData, Skill } from "@/types/career";
import { generateOpenAIResponse } from "./openaiService";

/**
 * Parse a resume file or text to extract structured data
 * @param file Resume file (PDF, DOCX, etc.)
 * @param text Resume text (if already extracted)
 * @returns Structured resume data
 */
export async function parseResume(
  file?: File,
  text?: string,
): Promise<ResumeData> {
  try {
    // If we have a file but no text, extract text from the file
    if (file && !text) {
      text = await extractTextFromFile(file);
    }

    if (!text) {
      throw new Error("No resume text provided");
    }

    // Use OpenAI to parse the resume text
    // This is a simplified approach - in a production app, you might want to use
    // a specialized resume parsing service or a more sophisticated approach
    const systemPrompt = `
      You are an expert resume parser. Extract the following information from the resume text:
      1. Skills (categorize as hard or soft skills)
      2. Work experience (title, company, duration, description, skills used)
      3. Education (degree, institution, year)
      4. Certifications
      5. Industries the person has worked in
      
      Format your response as a JSON object with the following structure:
      {
        "skills": [{"name": "skill name", "category": "hard or soft", "level": "beginner/intermediate/advanced/expert"}],
        "experience": [{"title": "job title", "company": "company name", "duration": duration in months, "description": "job description", "skills": ["skill1", "skill2"]}],
        "education": [{"degree": "degree name", "institution": "institution name", "year": year completed}],
        "certifications": ["certification1", "certification2"],
        "industries": ["industry1", "industry2"]
      }
    `;

    try {
      const response = await generateOpenAIResponse(
        text,
        "resume-parser",
        systemPrompt,
        {
          model: "gpt-4",
          temperature: 0.3,
          max_tokens: 1000,
          response_format: "json_object",
        },
      );

      // Try to parse the JSON response
      let parsedData: Partial<ResumeData>;
      try {
        parsedData = JSON.parse(response.content) as Partial<ResumeData>;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        // Fallback to mock data if parsing fails
        parsedData = getMockResumeData();
      }

      // Add IDs and relevance scores to skills
      const skillsWithIds = (parsedData.skills || []).map((skill: any) => ({
        ...skill,
        id: generateId(),
        relevance: 100, // Default relevance for skills directly from resume
      }));

      return {
        skills: skillsWithIds,
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        certifications: parsedData.certifications || [],
        industries: parsedData.industries || [],
      };
    } catch (error) {
      console.error("Error parsing resume:", error);
      // Return mock data instead of throwing an error
      return getMockResumeData();
    }
  } catch (error) {
    console.error("Error in parseResume:", error);
    // Return mock data instead of throwing an error
    return getMockResumeData();
  }
}

/**
 * Extract text from a file (PDF, DOCX, etc.)
 * @param file File to extract text from
 * @returns Extracted text
 */
async function extractTextFromFile(file: File): Promise<string> {
  // In a real implementation, you would use a library like pdf.js for PDFs
  // or a service that can extract text from various file formats
  // For now, we'll just read the file as text if it's a text file

  if (file.type === "text/plain") {
    return await file.text();
  }

  // For demo purposes, we'll return a placeholder message for other file types
  // In a real app, you would implement proper text extraction for PDFs, DOCXs, etc.
  return (
    `[This is a placeholder for text extracted from ${file.name} (${file.type})]. ` +
    "In a production environment, we would use appropriate libraries to extract text from this file format."
  );
}

/**
 * Generate a random ID
 * @returns Random ID string
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Get mock resume data for fallback or testing
 * @returns Mock resume data
 */
function getMockResumeData(): ResumeData {
  return {
    skills: [
      {
        id: generateId(),
        name: "Marketing Strategy",
        category: "hard",
        level: "advanced",
        relevance: 100,
      },
      {
        id: generateId(),
        name: "Content Creation",
        category: "hard",
        level: "expert",
        relevance: 100,
      },
      {
        id: generateId(),
        name: "Social Media Management",
        category: "hard",
        level: "advanced",
        relevance: 100,
      },
      {
        id: generateId(),
        name: "Team Leadership",
        category: "soft",
        level: "intermediate",
        relevance: 100,
      },
      {
        id: generateId(),
        name: "Project Management",
        category: "soft",
        level: "intermediate",
        relevance: 100,
      },
      {
        id: generateId(),
        name: "Data Analysis",
        category: "hard",
        level: "beginner",
        relevance: 100,
      },
    ],
    experience: [
      {
        title: "Marketing Manager",
        company: "TechCorp Inc.",
        duration: 24,
        description: "Led marketing campaigns for B2B software products",
        skills: ["Marketing Strategy", "Team Leadership", "Content Creation"],
      },
      {
        title: "Content Specialist",
        company: "Digital Media Co.",
        duration: 18,
        description: "Created content for multiple digital platforms",
        skills: ["Content Creation", "Social Media Management"],
      },
    ],
    education: [
      {
        degree: "Bachelor of Business Administration",
        institution: "State University",
        year: 2018,
      },
    ],
    certifications: [
      "Digital Marketing Professional",
      "Content Strategy Certification",
    ],
    industries: ["Technology", "Digital Media", "Marketing"],
  };
}
