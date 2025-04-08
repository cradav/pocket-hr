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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Upload,
  FileText,
  Download,
  Eye,
  BarChart,
  Trash2,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useSupabase";

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  status: "analyzed" | "pending" | "none";
  fileUrl?: string;
}

// Utility functions for document management
const documentUtils = {
  // Format file size helper function
  formatFileSize: (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  },

  // Ensure the storage bucket exists
  ensureStorageBucket: async (bucketName: string): Promise<boolean> => {
    try {
      console.log(`Checking if bucket '${bucketName}' exists...`);
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error("Error listing buckets:", error);
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
            fileSizeLimit: 10485760, // 10MB limit
          },
        );

        if (createError) {
          console.error(`Error creating bucket '${bucketName}':`, createError);
          return false;
        }

        // Set bucket public policy
        const { error: policyError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(
            "test.txt", // Dummy file path
            60, // 60 seconds
            {
              download: true,
            },
          );

        if (
          policyError &&
          !policyError.message.includes("The resource was not found")
        ) {
          console.error(
            `Error setting bucket policy for '${bucketName}':`,
            policyError,
          );
          // Continue anyway, this is not critical
        }

        console.log(`Bucket '${bucketName}' created successfully.`);
      } else {
        console.log(`Bucket '${bucketName}' already exists.`);
      }

      return true;
    } catch (err) {
      console.error(`Error ensuring bucket '${bucketName}' exists:`, err);
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
          onUploadProgress: (progress) => {
            const percentage = Math.round(
              (progress.loaded / progress.total) * 100,
            );
            console.log(`Upload progress: ${percentage}%`);
            if (onProgress) onProgress(percentage);
          },
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

      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          name: name,
          type: type,
          size: size,
          file_url: fileUrl,
          upload_date: new Date().toISOString(),
          analysis_status: "none",
        })
        .select()
        .single();

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
};

const DocumentManager = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { user } = useAuth();

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Authentication state:", {
      isAuthenticated: !!user,
      userId: user?.id,
    });
  }, [user]);

  // Fetch documents from Supabase with improved error handling
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) {
        setError("Failed to load documents: User not defined.");
        setIsLoading(false);
        return;
      };
      
      try {
        console.log("Fetching documents for user:", user.id);
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("upload_date", { ascending: false });

        if (error) {
          console.error("Error fetching documents:", error);
          let errorMessage =
            "Failed to load documents. Please try again later.";

          // Provide more specific error messages based on error code
          if (error.code === "PGRST116") {
            errorMessage =
              "The documents table doesn't exist. Please contact support.";
          } else if (error.code === "42501") {
            errorMessage =
              "You don't have permission to access these documents.";
          } else if (error.code === "23505") {
            errorMessage = "There was a conflict with existing documents.";
          } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
          }

          setError(errorMessage);
          throw error;
        }

        console.log("Documents fetched:", data);

        if (data) {
          const formattedDocs: Document[] = data.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            uploadDate: new Date(doc.upload_date).toISOString().split("T")[0],
            size: documentUtils.formatFileSize(doc.size),
            status: doc.analysis_status || "none",
            fileUrl: doc.file_url,
          }));

          setDocuments(formattedDocs);
        } else {
          // Handle case where data is null but no error occurred
          setDocuments([]);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
        // Only set a generic error if one hasn't been set already
        if (!error) {
          setError("Failed to load documents. Please try again later.");
        }
        // Set empty documents array if fetch fails
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  // Handle file upload with improved error handling
  const handleFileUpload = async (file: File, name: string, type: string) => {
    if (!user) {
      console.error("User authentication missing", { user });
      throw new Error(
        "You must be logged in to upload files. Please refresh the page or log in again.",
      );
    }

    if (!file) {
      console.error("File missing in upload handler");
      throw new Error(
        "No file was provided for upload. Please select a file and try again.",
      );
    }

    // Validate file size
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      throw new Error(
        `File size exceeds the maximum limit of 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
    }

    // Validate file type
    const allowedTypes = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(
        `File type ${fileExtension} is not supported. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      console.log(
        `Starting upload for file: ${file.name}, size: ${file.size} bytes`,
      );

      // Upload file to storage
      const {
        success,
        fileUrl,
        error: uploadError,
      } = await documentUtils.uploadFile(file, user.id, setUploadProgress);

      if (!success || !fileUrl) {
        console.error("Upload failed:", uploadError);
        const errorMessage =
          uploadError instanceof Error
            ? uploadError.message
            : typeof uploadError === "object" && uploadError !== null
              ? JSON.stringify(uploadError)
              : "Upload failed: Could not store file";
        throw new Error(errorMessage);
      }

      console.log("File uploaded successfully to storage, URL:", fileUrl);

      // Create document record in the database
      const {
        success: recordSuccess,
        document: docRecord,
        error: recordError,
      } = await documentUtils.createDocumentRecord(
        user.id,
        name || file.name,
        type,
        file.size,
        fileUrl,
      );

      if (!recordSuccess) {
        console.error("Failed to create document record:", recordError);
        const errorMessage =
          recordError instanceof Error
            ? recordError.message
            : typeof recordError === "object" && recordError !== null
              ? JSON.stringify(recordError)
              : "Failed to create document record in database";
        throw new Error(errorMessage);
      }

      console.log("Document record created in database:", docRecord);

      // Add the new document to the state
      const newDoc: Document = {
        id: docRecord.id,
        name: docRecord.name,
        type: docRecord.type,
        uploadDate: new Date(docRecord.upload_date).toISOString().split("T")[0],
        size: documentUtils.formatFileSize(docRecord.size),
        status: "none",
        fileUrl: docRecord.file_url,
      };

      setDocuments((prevDocs) => [newDoc, ...prevDocs]);
      console.log("Document added to UI state");
      return newDoc;
    } catch (err) {
      console.error("Error uploading document:", err);
      // Set the error message for display in the UI
      setUploadError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during upload",
      );
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
      console.log("Upload process completed");
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
        } catch (err) {
          console.error("Error completing document analysis:", err);
        }
      }, 5000); // Simulate 5 second analysis time
    } catch (err) {
      console.error("Error requesting document analysis:", err);
      alert("Failed to request document analysis. Please try again.");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    // Filter by search query
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by tab
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "contracts")
      return matchesSearch && doc.type === "Contract";
    if (activeTab === "reviews") return matchesSearch && doc.type === "Review";
    if (activeTab === "analyzed")
      return matchesSearch && doc.status === "analyzed";

    return matchesSearch;
  });

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const handleAnalyzeRequest = () => {
    if (selectedDocument) {
      if (selectedDocument.status === "none") {
        // Request analysis for the document
        requestDocumentAnalysis(selectedDocument.id);
      } else {
        // Show analysis results dialog
        setShowAnalysisDialog(true);
      }
    }
  };

  return (
    <div className="bg-background w-full h-full p-6">
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
                          setSelectedFile(file);

                          // Update the dialog button to say "Upload File"
                          const dialogFooter = document.querySelector(
                            '[role="dialog"] [data-dialog-footer]',
                          );
                          if (dialogFooter) {
                            const uploadButton =
                              dialogFooter.querySelector("button:last-child");
                            if (uploadButton) {
                              uploadButton.textContent = "Upload File";
                              uploadButton.setAttribute(
                                "data-upload-button",
                                "true",
                              );
                            }
                          }
                        } catch (err) {
                          console.error("File selection error:", err);
                          setUploadError(
                            "Failed to select file. Please try again.",
                          );
                        }
                      }
                    }}
                  />

                  {!selectedFile ? (
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
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-green-100 text-green-800 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <Button
                          variant="link"
                          className="text-sm mt-2"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById("file-upload")?.click();
                          }}
                        >
                          Change file
                        </Button>
                      </div>
                    </div>
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

                {/* Error Message */}
                {uploadError && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                    <p className="text-sm text-red-700">{uploadError}</p>
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
                  setSelectedFile(null);
                  setUploadError(null);
                  setUploadProgress(0);
                  setIsUploading(false);

                  // Close dialog
                  document
                    .querySelector('[role="dialog"]')
                    ?.querySelector('button[aria-label="Close"]')
                    ?.click();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async (e) => {
                  e.preventDefault();

                  // If no file is selected, open file browser
                  if (!selectedFile) {
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

                    setUploadError(null);
                    setIsUploading(true);
                    setUploadProgress(0);

                    // Determine file type based on extension
                    const fileType = selectedFile.name.endsWith(".pdf")
                      ? "Contract"
                      : selectedFile.name.endsWith(".docx") ||
                          selectedFile.name.endsWith(".doc")
                        ? "Review"
                        : "Document";

                    // Start the upload with progress tracking
                    const uploadProgressInterval = setInterval(() => {
                      setUploadProgress((prev) => {
                        if (prev < 90) return prev + 10;
                        return prev;
                      });
                    }, 300);

                    await handleFileUpload(
                      selectedFile,
                      selectedFile.name,
                      fileType,
                    );

                    // Clear the interval and set to 100%
                    clearInterval(uploadProgressInterval);
                    setUploadProgress(100);

                    // Reset state and close dialog after successful upload
                    setTimeout(() => {
                      setSelectedFile(null);
                      const closeButton = document
                        .querySelector('[role="dialog"]')
                        ?.querySelector('button[aria-label="Close"]');
                      if (closeButton) {
                        closeButton.click();
                      }
                    }, 500);
                  } catch (err) {
                    console.error("Upload error:", err);
                    setUploadError(
                      err instanceof Error
                        ? err.message
                        : "Upload failed. Please try again.",
                    );
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }}
              >
                {selectedFile ? "Upload File" : "Select File"}
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                onValueChange={setActiveTab}
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
              <ScrollArea className="h-[500px] w-full pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                          <p className="mt-2 text-muted-foreground">
                            Loading documents...
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-10 text-destructive"
                        >
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <TableRow
                          key={doc.id}
                          className="cursor-pointer"
                          onClick={() => handleDocumentClick(doc)}
                        >
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.name}
                          </TableCell>
                          <TableCell>{doc.type}</TableCell>
                          <TableCell>{doc.uploadDate}</TableCell>
                          <TableCell>{doc.size}</TableCell>
                          <TableCell>
                            {doc.status === "analyzed" && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                Analyzed
                              </Badge>
                            )}
                            {doc.status === "pending" && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800"
                              >
                                Pending
                              </Badge>
                            )}
                            {doc.status === "none" && (
                              <Badge variant="outline">Not Analyzed</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (doc.fileUrl) {
                                    window.open(doc.fileUrl, "_blank");
                                  }
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (doc.fileUrl) {
                                    const link = document.createElement("a");
                                    link.href = doc.fileUrl;
                                    link.download = doc.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this document?",
                                    )
                                  ) {
                                    try {
                                      const { error } = await supabase
                                        .from("documents")
                                        .delete()
                                        .eq("id", doc.id);

                                      if (error) throw error;

                                      // Update local state
                                      setDocuments(
                                        documents.filter(
                                          (d) => d.id !== doc.id,
                                        ),
                                      );
                                      if (selectedDocument?.id === doc.id) {
                                        setSelectedDocument(null);
                                      }
                                    } catch (err) {
                                      console.error(
                                        "Error deleting document:",
                                        err,
                                      );
                                      alert(
                                        "Failed to delete document. Please try again.",
                                      );
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No documents found. Try adjusting your search or
                          upload a new document.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
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
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Type:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedDocument.type}
                      </span>
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
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="gap-2">
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
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Key Information</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Document Type:
                  </span>
                  <span className="text-sm font-medium">
                    Employment Contract
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Effective Date:
                  </span>
                  <span className="text-sm font-medium">January 15, 2023</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Parties Involved:
                  </span>
                  <span className="text-sm font-medium">
                    Acme Corporation, John Doe
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Contract Duration:
                  </span>
                  <span className="text-sm font-medium">
                    12 months (renewable)
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground">
                This is a standard employment contract between Acme Corporation
                and John Doe. The contract outlines the terms of employment,
                including compensation, benefits, working hours, and termination
                conditions. The contract includes a non-compete clause valid for
                12 months after termination and a confidentiality agreement.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Key Clauses</h3>
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-md">
                  <h4 className="text-sm font-medium">Compensation</h4>
                  <p className="text-sm text-muted-foreground">
                    Annual salary of $85,000 paid bi-weekly, with
                    performance-based bonus eligibility up to 15% of base
                    salary.
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-md">
                  <h4 className="text-sm font-medium">Termination</h4>
                  <p className="text-sm text-muted-foreground">
                    Either party may terminate with 30 days written notice.
                    Severance package of 2 weeks per year of service in case of
                    company-initiated termination without cause.
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-md">
                  <h4 className="text-sm font-medium">Non-Compete</h4>
                  <p className="text-sm text-muted-foreground">
                    Employee agrees not to work for direct competitors for 12
                    months after termination within a 50-mile radius.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Potential Concerns</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
                <p className="text-sm">
                  The non-compete clause may be overly restrictive and
                  potentially unenforceable in some jurisdictions. Consider
                  consulting with a legal professional for clarification.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Download Analysis</Button>
            <Button>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManager;
