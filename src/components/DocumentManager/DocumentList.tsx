import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Eye, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  status: "analyzed" | "pending" | "none";
  fileUrl?: string;
}

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  onDocumentClick: (doc: Document) => void;
  documentUtils: any;
  onDocumentDelete: (docId: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  error,
  onDocumentClick,
  documentUtils,
  onDocumentDelete,
}) => {
  return (
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
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <TableRow
                key={doc.id}
                className="cursor-pointer"
                onClick={() => onDocumentClick(doc)}
              >
                <TableCell className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {doc.name}
                </TableCell>
                <TableCell>
                  <Select
                    value={doc.type}
                    onValueChange={(newType) => {
                      // Stop event propagation to prevent row click
                      event.stopPropagation();
                      // Call the parent component's handler to update the document type
                      onDocumentClick({ ...doc, type: newType });
                    }}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder={doc.type} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Resume">Resume</SelectItem>
                      <SelectItem value="Document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
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
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (doc.fileUrl) {
                          try {
                            // Extract file path from URL
                            const filePath =
                              documentUtils.extractFilePathFromUrl(doc.fileUrl);
                            if (!filePath) {
                              throw new Error(
                                "Could not extract file path from URL",
                              );
                            }

                            // Get temporary URL for viewing
                            const tempUrl =
                              await documentUtils.getTemporaryFileUrl(
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
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (doc.fileUrl) {
                          try {
                            // Extract file path from URL
                            const filePath =
                              documentUtils.extractFilePathFromUrl(doc.fileUrl);
                            if (!filePath) {
                              throw new Error(
                                "Could not extract file path from URL",
                              );
                            }

                            // Get temporary URL for download
                            const tempUrl =
                              await documentUtils.getTemporaryFileUrl(
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
                            link.download = doc.name; // Set filename for download
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
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async (e) => {
                        e.stopPropagation();

                        // Confirmation dialog
                        const confirmDelete = confirm(
                          "Are you sure you want to delete this document? This action cannot be undone.",
                        );

                        if (confirmDelete) {
                          try {
                            // Delete from database first
                            const { error } = await supabase
                              .from("documents")
                              .delete()
                              .eq("id", doc.id);

                            if (error) throw error;

                            // If successful, delete from storage
                            if (doc.fileUrl) {
                              const filePath =
                                documentUtils.extractFilePathFromUrl(
                                  doc.fileUrl,
                                );
                              if (filePath) {
                                await documentUtils.deleteStorageFile(
                                  "phr-bucket",
                                  filePath,
                                );
                              }
                            }

                            // Update parent component
                            onDocumentDelete(doc.id);
                          } catch (err) {
                            console.error("Error deleting document:", err);
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
                No documents found. Try adjusting your search or upload a new
                document.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default DocumentList;
