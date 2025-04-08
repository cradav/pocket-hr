import React, { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUp,
  ArrowUpRight,
  Rocket,
  Upload,
  AlertCircle,
  FileText,
} from "lucide-react";
import { parseResume } from "@/services/resumeService";
import { generateCareerPathways } from "@/services/aiService";
import { CareerPathway, ResumeData, Role } from "@/types/career";
import RoleDetails from "./RoleDetails";
import ComparisonMatrix from "./CareerPathways/ComparisonMatrix";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useSupabase";

interface CareerPathwaysProps {
  wordCredits?: {
    remaining: number;
    total: number;
  };
  onWordUsage?: (wordsUsed: number) => void;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  status: "analyzed" | "pending" | "none";
  fileUrl?: string;
}

const CareerPathways: React.FC<CareerPathwaysProps> = ({
  wordCredits = { remaining: 1000, total: 1000 },
  onWordUsage,
}) => {
  const { user } = useAuth();
  const [resumeSource, setResumeSource] = useState<"upload" | "document">(
    "upload",
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDocuments, setIsFetchingDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pathways, setPathways] = useState<CareerPathway[] | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );

  // Credits required for generating pathways
  const CREDITS_REQUIRED = 5;

  // Fetch user's documents from Supabase
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;

      try {
        setIsFetchingDocuments(true);
        setError(null);

        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("upload_date", { ascending: false });

        if (error) {
          console.error("Error fetching documents:", error);
          return;
        }

        if (data) {
          const formattedDocs: Document[] = data.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            uploadDate: new Date(doc.upload_date).toISOString().split("T")[0],
            size: formatFileSize(doc.size),
            status: doc.analysis_status || "none",
            fileUrl: doc.file_url,
          }));

          setDocuments(formattedDocs);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setIsFetchingDocuments(false);
      }
    };

    fetchDocuments();
  }, [user]);

  // Format file size helper function
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
    setError(null);
  };

  // Handle document selection
  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setError(null);
  };

  // Parse resume
  const handleParseResume = async () => {
    if (resumeSource === "upload" && !resumeFile) {
      setError("Please upload a resume file");
      return;
    }

    if (resumeSource === "document" && !selectedDocumentId) {
      setError("Please select a document");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let data;

      if (resumeSource === "upload" && resumeFile) {
        data = await parseResume(resumeFile);
      } else if (resumeSource === "document" && selectedDocumentId) {
        // Get the selected document
        const selectedDoc = documents.find(
          (doc) => doc.id === selectedDocumentId,
        );

        if (!selectedDoc) {
          throw new Error("Selected document not found");
        }

        if (!selectedDoc.fileUrl) {
          throw new Error("Selected document has no file URL");
        }

        // Use the updated parseResume function to fetch and parse the document from its URL
        data = await parseResume(undefined, undefined, selectedDoc.fileUrl);
      } else {
        throw new Error("Invalid resume source or missing data");
      }

      setResumeData(data);
      setShowConfirmation(true);
    } catch (err) {
      console.error("Resume parsing error:", err);
      setError(
        `Error parsing resume: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      // Still show confirmation with empty data to allow the user to continue
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
              <RadioGroup
                value={resumeSource}
                onValueChange={(value) =>
                  setResumeSource(value as "upload" | "document")
                }
                className="mb-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="upload" />
                  <Label htmlFor="upload">Upload a new resume</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="document" id="document" />
                  <Label htmlFor="document">Select from my documents</Label>
                </div>
              </RadioGroup>

              {resumeSource === "upload" ? (
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
                      {isLoading ? (
                        <>
                          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Resume"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, TXT
                  </p>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="document-select">Select a document</Label>
                  <div className="flex space-x-2">
                    <Select
                      value={selectedDocumentId || ""}
                      onValueChange={handleDocumentSelect}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {isFetchingDocuments ? (
                          <div className="p-2 text-center">
                            Loading documents...
                          </div>
                        ) : documents.length > 0 ? (
                          documents.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              <div className="flex items-center">
                                <FileText className="mr-2 h-4 w-4" />
                                {doc.name}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center">
                            No documents found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleParseResume}
                      disabled={!selectedDocumentId || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                          Parsing...
                        </>
                      ) : (
                        "Parse Resume"
                      )}
                    </Button>
                  </div>
                  {documents.length === 0 && !isFetchingDocuments && (
                    <p className="text-sm text-muted-foreground">
                      No documents found. Please upload a document first or
                      switch to file upload.
                    </p>
                  )}
                </div>
              )}

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
