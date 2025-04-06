import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowUp,
  ArrowUpRight,
  Rocket,
  Upload,
  AlertCircle,
} from "lucide-react";
import { parseResume } from "@/services/resumeService";
import { CareerPathway, ResumeData, Role } from "@/types/career";
import RoleDetails from "./RoleDetails";
import ComparisonMatrix from "./CareerPathways/ComparisonMatrix";

interface CareerPathwaysProps {
  wordCredits?: {
    remaining: number;
    total: number;
  };
  onWordUsage?: (wordsUsed: number) => void;
}

const CareerPathways: React.FC<CareerPathwaysProps> = ({
  wordCredits = { remaining: 1000, total: 1000 },
  onWordUsage,
}) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pathways, setPathways] = useState<CareerPathway[] | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Credits required for generating pathways
  const CREDITS_REQUIRED = 5;

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
    setError(null);
  };

  // Parse resume
  const handleParseResume = async () => {
    if (!resumeFile) {
      setError("Please upload a resume file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseResume(resumeFile);
      setResumeData(data);
      setShowConfirmation(true);
    } catch (err) {
      console.error("Resume parsing error:", err);
      // Use mock data instead of showing an error
      setResumeData({
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        industries: [],
      });
      setShowConfirmation(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate career pathways
  const handleGeneratePathways = async () => {
    setIsLoading(true);
    setError(null);
    setShowConfirmation(false);

    try {
      // In a real implementation, this would call a service to generate pathways
      // For now, we'll use mock data
      const mockPathways = getMockPathways();
      setPathways(mockPathways);
      setSelectedPathway(mockPathways[0].id);

      // Simulate credit usage
      if (onWordUsage) {
        onWordUsage(CREDITS_REQUIRED);
      }
    } catch (err) {
      setError(
        `Error generating pathways: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pathway selection
  const handlePathwaySelect = (pathwayId: string) => {
    setSelectedPathway(pathwayId);
    setSelectedRole(null);
  };

  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  // Get the currently selected pathway
  const getSelectedPathway = () => {
    return pathways?.find((p) => p.id === selectedPathway) || null;
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-6xl mx-auto bg-background">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Career Pathways</CardTitle>
          <CardDescription>
            Analyze your resume and discover personalized career paths based on
            your skills and experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!resumeData && (
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="resume">Upload your resume</Label>
                <div className="flex space-x-2">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                  />
                  <Button
                    onClick={handleParseResume}
                    disabled={!resumeFile || isLoading}
                  >
                    {isLoading ? "Parsing..." : "Parse Resume"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, TXT
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {showConfirmation && (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Confirm Pathway Generation</AlertTitle>
                <AlertDescription>
                  Generate career pathways using {CREDITS_REQUIRED} AI credits?
                  This will analyze your resume and current market data to
                  provide personalized recommendations.
                  <div className="mt-2">
                    <span className="font-medium">Credits remaining:</span>{" "}
                    {wordCredits.remaining}/{wordCredits.total}
                  </div>
                </AlertDescription>
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={handleGeneratePathways}
                    disabled={
                      wordCredits.remaining < CREDITS_REQUIRED || isLoading
                    }
                  >
                    {isLoading ? "Generating..." : "Generate Pathways"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </Alert>

              {wordCredits.remaining < CREDITS_REQUIRED && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Insufficient Credits</AlertTitle>
                  <AlertDescription>
                    You don't have enough credits to generate career pathways.
                    You need {CREDITS_REQUIRED} credits, but you only have{" "}
                    {wordCredits.remaining}.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {pathways && (
            <div className="space-y-6 mt-4">
              <ComparisonMatrix
                pathways={pathways}
                selectedPathwayId={selectedPathway}
                onPathwaySelect={handlePathwaySelect}
              />

              <Tabs
                defaultValue={pathways[0].id}
                value={selectedPathway || undefined}
                onValueChange={handlePathwaySelect}
              >
                <TabsList className="grid w-full grid-cols-3">
                  {pathways.map((pathway) => (
                    <TabsTrigger
                      key={pathway.id}
                      value={pathway.id}
                      className="flex items-center space-x-2"
                      style={{ borderBottomColor: pathway.color }}
                    >
                      {pathway.type === "vertical" && (
                        <ArrowUp className="h-4 w-4" />
                      )}
                      {pathway.type === "diagonal" && (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                      {pathway.type === "leap" && (
                        <Rocket className="h-4 w-4" />
                      )}
                      <span>
                        {pathway.type.charAt(0).toUpperCase() +
                          pathway.type.slice(1)}{" "}
                        Move
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {pathways.map((pathway) => (
                  <TabsContent key={pathway.id} value={pathway.id}>
                    <Card>
                      <CardHeader
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: pathway.color,
                        }}
                      >
                        <CardTitle>
                          {pathway.type.charAt(0).toUpperCase() +
                            pathway.type.slice(1)}{" "}
                          Move
                        </CardTitle>
                        <CardDescription>{pathway.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">
                              Pathway Details
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="font-medium">Time Required:</div>
                              <div>{pathway.timeRequired}</div>
                              <div className="font-medium">Salary Change:</div>
                              <div>{pathway.salaryChangeRange}</div>
                              <div className="font-medium">Risk Level:</div>
                              <div>{pathway.riskLevel}</div>
                            </div>
                          </div>

                          <RoleDetails
                            selectedRole={selectedRole}
                            roles={pathway.roles}
                            onRoleSelect={handleRoleSelect}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Mock data for demonstration purposes
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
          requiredSkills: [],
          preferredSkills: [],
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
          requiredSkills: [],
          preferredSkills: [],
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
          requiredSkills: [],
          preferredSkills: [],
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
          requiredSkills: [],
          preferredSkills: [],
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
          requiredSkills: [],
          preferredSkills: [],
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
          requiredSkills: [],
          preferredSkills: [],
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
          requiredSkills: [],
          preferredSkills: [],
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
          requiredSkills: [],
          preferredSkills: [],
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
          requiredSkills: [],
          preferredSkills: [],
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

export default CareerPathways;
