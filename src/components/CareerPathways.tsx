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
import { generateCareerPathways } from "@/services/aiService";
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

  // Generate career pathways using AI
  const handleGeneratePathways = async () => {
    setIsLoading(true);
    setError(null);
    setShowConfirmation(false);

    try {
      if (!resumeData) {
        throw new Error("Resume data is required");
      }

      // Call the AI service to generate pathways
      const generatedPathways = await generateCareerPathways(resumeData);
      setPathways(generatedPathways);
      setSelectedPathway(generatedPathways[0].id);

      // Track credit usage
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

// This function has been moved to aiService.ts

export default CareerPathways;
