import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Upload,
  FileText,
  Download,
  Eye,
  BarChart,
  Filter,
  Edit,
  Check,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useSupabase";
import { useCache } from "@/contexts/CacheContext";
import DocumentList from "./DocumentManager/DocumentList";

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  status: "analyzed" | "pending" | "none";
  fileUrl?: string;
}

interface DatabaseDocument {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: number;
  file_url: string;
  upload_date: string;
  analysis_status: string;
  category: string | null;
  analysis_results: any | null;
}

// Utility functions for document management
const documentUtils = {
  // Format file size helper function
  formatFileSize: (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  },

  // Convert database document to UI document
  convertToUIDocument: (dbDoc: DatabaseDocument): Document => ({
    id: dbDoc.id,
    name: dbDoc.name,
    type: dbDoc.type,
    uploadDate: new Date(dbDoc.upload_date).toISOString().split("T")[0],
    size: documentUtils.formatFileSize(dbDoc.size),
    status: dbDoc.analysis_status as "analyzed" | "pending" | "none",
    fileUrl: dbDoc.file_url,
  }),

  // Ensure the storage bucket exists
  ensureStorageBucket: async (bucketName: string): Promise<boolean> => {
    try {
      console.log(`Checking if bucket '${bucketName}' exists...`);
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error("Error listing buckets:", error);

        // If we can't list buckets, try to use the bucket directly anyway
        // This could work if the bucket exists but user doesn't have list permissions
        try {
          const { data: testData } = await supabase.storage
            .from(bucketName)
            .list();
          if (testData) {
            console.log(
              `Bucket '${bucketName}' seems to exist despite list error.`,
            );
            return true;
          }
        } catch (listErr) {
          console.error(
            `Error testing bucket '${bucketName}' existence:`,
            listErr,
          );
        }

        return false;
      }

      // Check if bucket exists
      const bucketExists = buckets?.some(
        (bucket) => bucket.name === bucketName,
      );

      if (!bucketExists) {
        console.log(`Creating bucket '${bucketName}'...`);
        const { error: createError } = await supabase.storage.createBucket(
          bucketName,
          {
            public: true,
          },
        );

        if (createError) {
          console.error(`Error creating bucket '${bucketName}':`, createError);

          // Even if we can't create the bucket, check if it exists anyway
          // The bucket might have been created by another user or in a migration
          try {
            const { data: testData } = await supabase.storage
              .from(bucketName)
              .list();
            if (testData) {
              console.log(
                `Bucket '${bucketName}' seems to exist despite create error.`,
              );
              return true;
            }
          } catch (listErr) {
            console.error(
              `Error testing bucket '${bucketName}' existence:`,
              listErr,
            );
          }

          return false;
        }

        console.log(`Bucket '${bucketName}' created successfully.`);
      } else {
        console.log(`Bucket '${bucketName}' already exists.`);
      }

      return true;
    } catch (err) {
      console.error(`Error ensuring bucket '${bucketName}' exists:`, err);

      // Final attempt - try to use the bucket directly
      try {
        const { data: testData } = await supabase.storage
          .from(bucketName)
          .list();
        if (testData) {
          console.log(`Bucket '${bucketName}' exists despite earlier errors.`);
          return true;
        }
      } catch (listErr) {
        console.error(
          `Final error testing bucket '${bucketName}' existence:`,
          listErr,
        );
      }

      return false;
    }
  },

  // Upload a file to Supabase storage
  uploadFile: async (
    file: File,
    userId: string,
    onProgress?: (progress: number) => void,
  ): Promise<{ success: boolean; fileUrl?: string; error?: any }> => {
    try {
      console.log("Starting file upload for:", file.name);

      // Ensure bucket exists
      const bucketName = "phr-bucket";
      const bucketReady = await documentUtils.ensureStorageBucket(bucketName);

      if (!bucketReady) {
        throw new Error(`Failed to ensure bucket '${bucketName}' exists`);
      }

      // Create a unique file path
      const filePath = `documents/${userId}/${Date.now()}_${file.name}`;
      console.log("File path:", filePath);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return { success: false, error: uploadError };
      }

      console.log("File uploaded successfully, getting public URL");

      // Get public URL for the file
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        const error = new Error("Failed to get public URL for uploaded file");
        console.error(error);
        return { success: false, error };
      }

      console.log("Public URL obtained:", urlData.publicUrl);
      return { success: true, fileUrl: urlData.publicUrl };
    } catch (err) {
      console.error("Error uploading file:", err);
      return { success: false, error: err };
    }
  },

  // Create a document record in the database
  createDocumentRecord: async (
    userId: string,
    name: string,
    type: string,
    size: number,
    fileUrl: string,
  ): Promise<{ success: boolean; document?: any; error?: any }> => {
    try {
      console.log("Creating document record in database...");

      // First attempt with full data structure
      const payload = {
        user_id: userId,
        name: name,
        type: type,
        size: size,
        file_url: fileUrl,
        upload_date: new Date().toISOString(),
        analysis_status: "none",
      };

      const { data, error } = await supabase
        .from("documents")
        .insert(payload)
        .select()
        .single();

      // If there's an error about missing columns, try a more conservative approach
      if (error && error.code === "PGRST204") {
        console.log("Schema mismatch detected, trying progressive fallbacks");

        // Try removing analysis_status first
        let fallbackPayload = {
          user_id: userId,
          name: name,
          type: type,
          size: size,
          file_url: fileUrl,
          upload_date: new Date().toISOString(),
        };

        const { data: fallbackData, error: fallbackError } = await supabase
          .from("documents")
          .insert(fallbackPayload)
          .select()
          .single();

        if (!fallbackError) {
          console.log("Document created with fallback payload:", fallbackData);
          return { success: true, document: fallbackData };
        }

        // If still failing, try with just the essential fields
        if (fallbackError && fallbackError.code === "PGRST204") {
          console.log(
            "Still having schema issues, trying essential fields only",
          );

          // Essential fields only
          const essentialPayload = {
            user_id: userId,
            name: name,
            file_url: fileUrl,
          };

          const { data: essentialData, error: essentialError } = await supabase
            .from("documents")
            .insert(essentialPayload)
            .select()
            .single();

          if (essentialError) {
            console.error(
              "Error creating document with essential fields:",
              essentialError,
            );
            return { success: false, error: essentialError };
          }

          console.log(
            "Document created with essential fields only:",
            essentialData,
          );
          return { success: true, document: essentialData };
        }

        console.error(
          "Error creating document with fallback payload:",
          fallbackError,
        );
        return { success: false, error: fallbackError };
      }

      if (error) {
        console.error("Error creating document record:", error);
        return { success: false, error };
      }

      console.log("Document record created successfully:", data);
      return { success: true, document: data };
    } catch (err) {
      console.error("Error creating document record:", err);
      return { success: false, error: err };
    }
  },

  // Get a temporary URL for a file (valid for a short time)
  getTemporaryFileUrl: async (
    bucketName: string,
    filePath: string,
  ): Promise<string | null> => {
    try {
      console.log(`Getting temporary URL for file: ${filePath}`);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60 * 60); // Valid for 1 hour

      if (error) {
        console.error("Error creating signed URL:", error);
        return null;
      }

      if (!data || !data.signedUrl) {
        console.error("No signed URL returned");
        return null;
      }

      console.log("Temporary URL created:", data.signedUrl);
      return data.signedUrl;
    } catch (err) {
      console.error("Error generating temporary URL:", err);
      return null;
    }
  },

  // Delete a file from storage
  deleteStorageFile: async (
    bucketName: string,
    filePath: string,
  ): Promise<boolean> => {
    try {
      console.log(`Deleting file from storage: ${filePath}`);
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error("Error deleting file from storage:", error);
        return false;
      }

      console.log("File deleted successfully from storage");
      return true;
    } catch (err) {
      console.error("Error deleting file:", err);
      return false;
    }
  },

  // Extract file path from the full URL
  extractFilePathFromUrl: (fileUrl: string): string | null => {
    try {
      // For URLs like https://dwhnysvvlrffwnhololy.supabase.co/storage/v1/object/public/phr-bucket/documents/user-id/timestamp_filename.jpg
      // We need to extract: documents/user-id/timestamp_filename.jpg

      const url = new URL(fileUrl);
      const pathParts = url.pathname.split("/");

      // Find the bucket name in the path
      const bucketIndex = pathParts.findIndex((part) => part === "public") + 1;
      if (bucketIndex > 0 && bucketIndex < pathParts.length) {
        // Skip the bucket name and join the rest
        const filePath = pathParts.slice(bucketIndex + 1).join("/");
        return filePath;
      }

      console.error("Could not extract file path from URL:", fileUrl);
      return null;
    } catch (err) {
      console.error("Error extracting file path from URL:", err);
      return null;
    }
  },

  // Delete document from database
  deleteDocument: async (docId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error deleting document:", err);
      return false;
    }
  },
};

const DocumentManager = () => {
  const { user } = useAuth();
  const { documents: dbDocuments, refreshDocuments, isLoading, error } = useCache();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [filter, setFilter] = useState<"all" | "analyzed" | "pending" | "none">("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Convert database documents to UI documents
  const documents = dbDocuments?.map(doc => documentUtils.convertToUIDocument(doc)) || [];

  // Filter documents based on search term and filter
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || doc.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload file to storage
      const { success, fileUrl, error: uploadError } = await documentUtils.uploadFile(
        file,
        user.id,
        (progress) => setUploadProgress(progress)
      );

      if (!success || !fileUrl) {
        throw uploadError || new Error("Failed to upload file");
      }

      // Create document record
      const { success: recordSuccess, document, error: recordError } = 
        await documentUtils.createDocumentRecord(
          user.id,
          file.name,
          file.type,
          file.size,
          fileUrl
        );

      if (!recordSuccess) {
        throw recordError || new Error("Failed to create document record");
      }

      // Refresh the documents cache
      await refreshDocuments();
    } catch (err) {
      console.error("Error uploading document:", err);
      alert(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  // Handle document deletion
  const handleDocumentDelete = async (docId: string) => {
    try {
      const success = await documentUtils.deleteDocument(docId);
      if (success) {
        await refreshDocuments();
        if (selectedDocument?.id === docId) {
          setSelectedDocument(null);
        }
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to delete document");
    }
  };

  // Handle document click
  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  // Save document type changes
  const saveDocumentType = async () => {
    if (!user || !selectedDocument) return;

    try {
      // Update document type in the database
      const { error } = await supabase
        .from("documents")
        .update({ type: documentType })
        .eq("id", selectedDocument.id);

      if (error) throw error;

      // Update local state
      setDocuments(
        documents.map((doc) =>
          doc.id === selectedDocument.id ? { ...doc, type: documentType } : doc,
        ),
      );

      // Update selected document
      setSelectedDocument({ ...selectedDocument, type: documentType });
      setShowTypeDialog(false);
    } catch (err) {
      console.error("Error updating document type:", err);
      alert("Failed to update document type. Please try again.");
    }
  };

  // Handle document analysis request
  const requestDocumentAnalysis = async (documentId: string) => {
    if (!user) return;

    try {
      // Update document status to pending
      const { error } = await supabase
        .from("documents")
        .update({ analysis_status: "pending" })
        .eq("id", documentId);

      if (error) throw error;

      // Update local state
      setDocuments(
        documents.map((doc) =>
          doc.id === documentId ? { ...doc, status: "pending" } : doc,
        ),
      );

      if (selectedDocument && selectedDocument.id === documentId) {
        setSelectedDocument({ ...selectedDocument, status: "pending" });
      }

      // Generate real analysis results based on document type
      const docToAnalyze = documents.find((doc) => doc.id === documentId);
      const analysisResults = await generateMockAnalysisResults(
        docToAnalyze?.type || "Document",
      );
      setAnalysisResults(analysisResults);

      // In a real app, you would trigger an analysis job here
      // For demo purposes, we'll simulate analysis completion after a delay
      setTimeout(async () => {
        try {
          const { error } = await supabase
            .from("documents")
            .update({ analysis_status: "analyzed" })
            .eq("id", documentId);

          if (error) throw error;

          // Update local state
          setDocuments(
            documents.map((doc) =>
              doc.id === documentId ? { ...doc, status: "analyzed" } : doc,
            ),
          );

          if (selectedDocument && selectedDocument.id === documentId) {
            setSelectedDocument({ ...selectedDocument, status: "analyzed" });
          }

          setShowAnalysisDialog(true);
        } catch (err) {
          console.error("Error completing document analysis:", err);
          setShowAnalysisDialog(false);
        }
      }, 3000); // Simulate 3 second analysis time
    } catch (err) {
      console.error("Error requesting document analysis:", err);
      alert("Failed to request document analysis. Please try again.");
      setShowAnalysisDialog(false);
    }
  };

  // Generate document analysis results using OpenAI
  const generateMockAnalysisResults = async (docType: string) => {
    try {
      // Import the OpenAI service
      const { generateOpenAIResponse } = await import(
        "@/services/openaiService"
      );

      // Create a prompt based on document type
      let prompt = `Analyze this ${docType} document and extract the following information:\n`;
      prompt += `1. Document Type (be specific)\n`;
      prompt += `2. Effective Date or Review Date\n`;
      prompt += `3. Parties Involved\n`;
      prompt += `4. Duration or Period (if applicable)\n`;
      prompt += `5. A comprehensive summary (2-3 sentences)\n`;
      prompt += `6. 3 Key Clauses or Sections with titles and content\n`;
      prompt += `7. Any potential concerns or issues that should be addressed\n\n`;

      // Add document type specific context
      if (docType === "Contract") {
        prompt += `This is an employment contract. Focus on compensation, termination conditions, non-compete clauses, and any restrictive covenants.`;
      } else if (docType === "Review") {
        prompt += `This is a performance review. Focus on achievements, areas for improvement, goals for next period, and overall rating.`;
      } else if (docType === "Resume") {
        prompt += `This is a resume/CV. Focus on skills, experience, education, certifications, and career highlights. Identify key strengths and potential skill gaps.`;
      } else {
        prompt += `This is a general document. Extract the most important information and highlight any actionable items.`;
      }

      // Call OpenAI API
      const response = await generateOpenAIResponse(
        prompt,
        "document-analyzer",
        "You are an expert document analyzer specializing in employment documents. Extract key information accurately and present it in a structured format. Be thorough but concise.",
        {
          model: "gpt-3.5-turbo",
          temperature: 0.3,
          max_tokens: 800,
        },
      );

      // Parse the response
      const content = response.content;
      console.log("OpenAI Analysis Response:", content);

      // Extract information from the response
      // This is a simple parsing approach - could be improved with regex or more sophisticated parsing
      const lines = content.split("\n").filter((line) => line.trim() !== "");

      // Default structure
      const result: any = {
        documentType: "Unknown",
        summary: "Analysis could not be completed.",
        keyClauses: [],
        concerns: "",
      };

      // Extract document type
      const docTypeMatch = content.match(/Document Type:?\s*([^\n]+)/i);
      if (docTypeMatch && docTypeMatch[1]) {
        result.documentType = docTypeMatch[1].trim();
      } else {
        result.documentType =
          docType === "Contract"
            ? "Employment Contract"
            : docType === "Review"
              ? "Performance Review"
              : docType === "Resume"
                ? "Resume/CV"
                : "General Document";
      }

      // Extract dates
      const dateMatch = content.match(/(Effective|Review) Date:?\s*([^\n]+)/i);
      if (dateMatch && dateMatch[2]) {
        if (dateMatch[1].toLowerCase() === "effective") {
          result.effectiveDate = dateMatch[2].trim();
        } else {
          result.reviewDate = dateMatch[2].trim();
        }
      } else {
        // Default dates if not found
        if (docType === "Contract") {
          result.effectiveDate = new Date().toLocaleDateString();
        } else if (docType === "Review") {
          result.reviewDate = new Date().toLocaleDateString();
        } else {
          result.date = new Date().toLocaleDateString();
        }
      }

      // Extract parties
      const partiesMatch = content.match(/Parties( Involved)?:?\s*([^\n]+)/i);
      if (partiesMatch && partiesMatch[2]) {
        result.parties = partiesMatch[2].trim();
      } else {
        result.parties = "Not specified";
      }

      // Extract duration/period
      const durationMatch = content.match(/(Duration|Period):?\s*([^\n]+)/i);
      if (durationMatch && durationMatch[2]) {
        if (durationMatch[1].toLowerCase() === "duration") {
          result.duration = durationMatch[2].trim();
        } else {
          result.period = durationMatch[2].trim();
        }
      }

      // Extract summary
      const summaryMatch = content.match(/Summary:?\s*([^\n]+(?:\n[^\n]+)*)/i);
      if (summaryMatch && summaryMatch[1]) {
        result.summary = summaryMatch[1].trim();
      }

      // Extract key clauses
      const keyClausesMatch = content.match(
        /Key Clauses:?\s*([\s\S]*?)(?:\n\s*Concerns|$)/i,
      );
      if (keyClausesMatch && keyClausesMatch[1]) {
        const clausesText = keyClausesMatch[1].trim();
        const clauseMatches = clausesText.match(
          /\d\.?\s*([^:\n]+):?\s*([^\d][^\n]+(?:\n(?!\d\.)[^\n]+)*)/g,
        );

        if (clauseMatches) {
          result.keyClauses = clauseMatches.map((clause) => {
            const titleMatch = clause.match(/\d\.?\s*([^:\n]+):?/i);
            const contentMatch = clause.match(/\d\.?\s*[^:\n]+:?\s*([\s\S]+)/i);

            return {
              title: titleMatch ? titleMatch[1].trim() : "Key Point",
              content: contentMatch ? contentMatch[1].trim() : clause.trim(),
            };
          });
        }
      }

      // If no key clauses were found, add default ones
      if (!result.keyClauses || result.keyClauses.length === 0) {
        result.keyClauses = [
          {
            title: "Main Point",
            content:
              "The document contains important information that should be reviewed carefully.",
          },
        ];
      }

      // Extract concerns
      const concernsMatch = content.match(
        /Concerns:?\s*([^\n]+(?:\n[^\n]+)*)/i,
      );
      if (concernsMatch && concernsMatch[1]) {
        result.concerns = concernsMatch[1].trim();
      }

      // Add reviewer/reviewee for performance reviews
      if (docType === "Review" && !result.reviewer) {
        const reviewerMatch = content.match(/Reviewer:?\s*([^\n]+)/i);
        if (reviewerMatch && reviewerMatch[1]) {
          result.reviewer = reviewerMatch[1].trim();
        } else {
          result.reviewer = "Not specified";
        }

        const revieweeMatch = content.match(/Reviewee:?\s*([^\n]+)/i);
        if (revieweeMatch && revieweeMatch[1]) {
          result.reviewee = revieweeMatch[1].trim();
        } else {
          result.reviewee = "Not specified";
        }
      }

      console.log("Parsed Analysis Result:", result);
      return result;
    } catch (error) {
      console.error("Error generating document analysis:", error);

      // Fallback to basic analysis if OpenAI fails
      switch (docType) {
        case "Contract":
          return {
            documentType: "Employment Contract",
            effectiveDate: new Date().toLocaleDateString(),
            parties: "Employee and Employer",
            duration: "Standard term",
            summary:
              "This appears to be an employment contract. Due to technical limitations, a detailed analysis could not be performed. Please review the document manually.",
            keyClauses: [
              {
                title: "Important Note",
                content:
                  "AI analysis is currently unavailable. Please check the document manually for important terms.",
              },
            ],
            concerns:
              "Unable to identify concerns due to analysis limitations.",
          };
        case "Review":
          return {
            documentType: "Performance Review",
            reviewDate: new Date().toLocaleDateString(),
            reviewer: "Manager",
            reviewee: "Employee",
            period: "Recent performance period",
            summary:
              "This appears to be a performance review document. Due to technical limitations, a detailed analysis could not be performed. Please review the document manually.",
            keyClauses: [
              {
                title: "Important Note",
                content:
                  "AI analysis is currently unavailable. Please check the document manually for important details.",
              },
            ],
            concerns: "",
          };
        case "Resume":
          return {
            documentType: "Resume/CV",
            date: new Date().toLocaleDateString(),
            parties: "Candidate",
            summary:
              "This appears to be a resume or CV. Due to technical limitations, a detailed analysis could not be performed. Please review the document manually.",
            keyClauses: [
              {
                title: "Important Note",
                content:
                  "AI analysis is currently unavailable. Please check the document manually for skills and experience details.",
              },
            ],
            skills: ["Not analyzed"],
            experience: "Not analyzed",
            education: "Not analyzed",
            certifications: "Not analyzed",
            concerns: "",
          };
        default:
          return {
            documentType: "Document",
            date: new Date().toLocaleDateString(),
            parties: "Various",
            summary:
              "This document could not be analyzed due to technical limitations. Please review it manually.",
            keyClauses: [
              {
                title: "Important Note",
                content:
                  "AI analysis is currently unavailable. Please check the document manually.",
              },
            ],
            concerns: "",
          };
      }
    }
  };

  const handleAnalyzeRequest = () => {
    if (selectedDocument) {
      if (
        selectedDocument.status === "none" ||
        selectedDocument.status === "analyzed"
      ) {
        // Request analysis for the document
        requestDocumentAnalysis(selectedDocument.id);
      } else if (selectedDocument.status === "pending") {
        // Show a message that analysis is in progress
        alert("Analysis is currently in progress. Please wait.");
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Document Manager</h1>
          <p className="text-muted-foreground">
            Upload, view, and analyze your employment documents
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload size={16} />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload your employment documents for secure storage and AI
                analysis.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-4">
                {/* File Upload Area */}
                <div className="relative">
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          await handleFileUpload(file);
                        } catch (err) {
                          console.error("File selection error:", err);
                          alert(
                            "Failed to select file. Please try again.",
                          );
                        }
                      }
                    }}
                  />

                  {!selectedDocument && (
                    <label
                      htmlFor="file-upload"
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center justify-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="font-medium">
                          Drag and drop your file here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse files
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-2">{uploadProgress}% Uploaded</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Supported file types: PDF, DOCX, JPG, PNG
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            </div>
            <DialogFooter data-dialog-footer>
              <Button
                variant="outline"
                onClick={() => {
                  // Reset state when canceling
                  setSelectedDocument(null);
                  setUploadProgress(0);
                  setIsUploading(false);

                  // Close dialog
                  const closeButton = document
                    .querySelector('[role="dialog"]')
                    ?.querySelector(
                      'button[aria-label="Close"]',
                    ) as HTMLElement;
                  if (closeButton) {
                    closeButton.click();
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async (e) => {
                  e.preventDefault();

                  // If no file is selected, open file browser
                  if (!selectedDocument) {
                    document.getElementById("file-upload")?.click();
                    return;
                  }

                  // Otherwise, upload the selected file
                  try {
                    // Check if user is authenticated before attempting upload
                    if (!user) {
                      throw new Error(
                        "You must be logged in to upload files. Please refresh the page or log in again.",
                      );
                    }

                    setIsUploading(true);
                    setUploadProgress(0);

                    // Start the upload with progress tracking
                    const uploadProgressInterval = setInterval(() => {
                      setUploadProgress((prev) => {
                        if (prev < 90) return prev + 10;
                        return prev;
                      });
                    }, 300);

                    await handleFileUpload(selectedDocument);

                    // Clear the interval and set to 100%
                    clearInterval(uploadProgressInterval);
                    setUploadProgress(100);

                    // Reset state and close dialog after successful upload
                    setTimeout(() => {
                      setSelectedDocument(null);
                      setIsUploading(false);
                    }, 500);
                  } catch (err) {
                    console.error("Upload error:", err);
                    alert(
                      err instanceof Error
                        ? err.message
                        : "Upload failed. Please try again.",
                    );
                    setIsUploading(false);
                    setUploadProgress(0);
                    // Don't close dialog on error
                  }
                }}
              >
                {selectedDocument ? "Upload File" : "Select File"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>My Documents</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search documents..."
                      className="pl-8 w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Tabs
                defaultValue="all"
                className="w-full"
                onValueChange={(value) => setFilter(value as "all" | "analyzed" | "pending" | "none")}
              >
                <TabsList className="grid grid-cols-4 w-full max-w-md">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="contracts">Contracts</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="analyzed">Analyzed</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={filteredDocuments}
                onDocumentClick={handleDocumentClick}
                onAnalyzeClick={handleAnalyzeRequest}
                isLoading={isLoading}
                error={error}
                documentUtils={documentUtils}
                onDocumentDelete={handleDocumentDelete}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedDocument ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedDocument.name}
                </CardTitle>
                <CardDescription>
                  Uploaded on {selectedDocument.uploadDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-ratio-4/3 bg-muted rounded-md flex items-center justify-center h-[200px]">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Type:
                      </span>
                      {showTypeDialog ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={documentType}
                            onValueChange={(value) => setDocumentType(value)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Contract">Contract</SelectItem>
                              <SelectItem value="Review">Review</SelectItem>
                              <SelectItem value="Resume">Resume</SelectItem>
                              <SelectItem value="Document">Document</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={saveDocumentType}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setShowTypeDialog(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {selectedDocument.type}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setDocumentType(selectedDocument.type);
                              setShowTypeDialog(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Size:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedDocument.size}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status:
                      </span>
                      <span className="text-sm font-medium capitalize">
                        {selectedDocument.status}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {selectedDocument.status === "analyzed" ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Analysis Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        This document has been analyzed by our AI. Click below
                        to view the detailed analysis.
                      </p>
                      <Button
                        className="w-full gap-2"
                        onClick={handleAnalyzeRequest}
                      >
                        <BarChart className="h-4 w-4" />
                        View Analysis
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Document Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Request an AI analysis to extract key information and
                        insights from this document.
                      </p>
                      <Button
                        className="w-full gap-2"
                        onClick={handleAnalyzeRequest}
                      >
                        <BarChart className="h-4 w-4" />
                        Analyze Document
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    if (selectedDocument?.fileUrl) {
                      try {
                        // Extract file path from URL
                        const filePath = documentUtils.extractFilePathFromUrl(
                          selectedDocument.fileUrl,
                        );
                        if (!filePath) {
                          throw new Error(
                            "Could not extract file path from URL",
                          );
                        }

                        // Get temporary URL for download
                        const tempUrl = await documentUtils.getTemporaryFileUrl(
                          "phr-bucket",
                          filePath,
                        );
                        if (!tempUrl) {
                          throw new Error(
                            "Failed to generate temporary URL for download",
                          );
                        }

                        // Create link and trigger download
                        const link = document.createElement("a");
                        link.href = tempUrl;
                        link.download = selectedDocument.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (err) {
                        console.error("Error downloading document:", err);
                        alert(
                          "Error downloading document. Please try again later.",
                        );
                      }
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    if (selectedDocument?.fileUrl) {
                      try {
                        // Extract file path from URL
                        const filePath = documentUtils.extractFilePathFromUrl(
                          selectedDocument.fileUrl,
                        );
                        if (!filePath) {
                          throw new Error(
                            "Could not extract file path from URL",
                          );
                        }

                        // Get temporary URL for viewing
                        const tempUrl = await documentUtils.getTemporaryFileUrl(
                          "phr-bucket",
                          filePath,
                        );
                        if (!tempUrl) {
                          throw new Error(
                            "Failed to generate temporary URL for viewing",
                          );
                        }

                        // Open in new tab
                        window.open(tempUrl, "_blank");
                      } catch (err) {
                        console.error("Error viewing document:", err);
                        alert(
                          "Error viewing document. Please try again later.",
                        );
                      }
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
                <CardDescription>
                  Select a document to view details and options
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No document selected</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click on a document from the list to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Analysis</DialogTitle>
            <DialogDescription>
              AI-powered analysis of {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          {analysisResults ? (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Key Information</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Document Type:
                    </span>
                    <span className="text-sm font-medium">
                      {analysisResults.documentType}
                    </span>
                  </li>
                  {analysisResults.effectiveDate && (
                    <li className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Effective Date:
                      </span>
                      <span className="text-sm font-medium">
                        {analysisResults.effectiveDate}
                      </span>
                    </li>
                  )}
                  {analysisResults.reviewDate && (
                    <li className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Review Date:
                      </span>
                      <span className="text-sm font-medium">
                        {analysisResults.reviewDate}
                      </span>
                    </li>
                  )}
                  {analysisResults.parties && (
                    <li className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Parties Involved:
                      </span>
                      <span className="text-sm font-medium">
                        {analysisResults.parties}
                      </span>
                    </li>
                  )}
                  {analysisResults.duration && (
                    <li className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Duration:
                      </span>
                      <span className="text-sm font-medium">
                        {analysisResults.duration}
                      </span>
                    </li>
                  )}
                  {analysisResults.period && (
                    <li className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Review Period:
                      </span>
                      <span className="text-sm font-medium">
                        {analysisResults.period}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">
                  {analysisResults.summary}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Key Clauses</h3>
                <div className="space-y-3">
                  {analysisResults.keyClauses.map(
                    (clause: any, index: number) => (
                      <div key={index} className="bg-muted/50 p-3 rounded-md">
                        <h4 className="text-sm font-medium">{clause.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {clause.content}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {analysisResults.concerns && (
                <div>
                  <h3 className="font-medium mb-2">Potential Concerns</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
                    <p className="text-sm">{analysisResults.concerns}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                No analysis data available
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline">Download Analysis</Button>
            <Button onClick={() => setShowAnalysisDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManager;
