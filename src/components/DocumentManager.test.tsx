import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DocumentManager from "./DocumentManager";
import { supabase } from "@/lib/supabase";
import userEvent from "@testing-library/user-event";

// Mock the entire supabase module
jest.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      listBuckets: jest.fn(),
      createBucket: jest.fn(),
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      createSignedUrl: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock the useAuth hook
jest.mock("@/hooks/useSupabase", () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: "test-user-id" },
  }),
}));

// Mock window.open
window.open = jest.fn();

// Mock document.createElement and related methods for download functionality
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
Document.prototype.createElement = jest.fn().mockImplementation(() => ({
  href: "",
  download: "",
  click: mockClick,
}));
Document.prototype.body = {
  appendChild: mockAppendChild,
  removeChild: mockRemoveChild,
};

// Mock window.alert
window.alert = jest.fn();

// Mock console.error to prevent test output noise
const originalConsoleError = console.error;
console.error = jest.fn();

describe("DocumentManager Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock responses
    (supabase.storage.listBuckets as jest.Mock).mockResolvedValue({
      data: [{ name: "phr-bucket" }],
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "doc-id", name: "test-doc.pdf" },
        error: null,
      }),
    });

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Mock storage functions
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: "documents/test-user-id/test-doc.pdf" },
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/test-doc.pdf" },
      }),
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: "https://example.com/signed-test-doc.pdf" },
        error: null,
      }),
    });
  });

  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  test("renders document manager component", async () => {
    // Mock the from().select().eq().order() chain for fetching documents
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      order: mockOrder,
    });

    render(<DocumentManager />);

    // Check if the component renders correctly
    expect(screen.getByText("Document Manager")).toBeInTheDocument();
    expect(
      screen.getByText("Upload, view, and analyze your employment documents"),
    ).toBeInTheDocument();

    // Wait for the documents to load
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("documents");
    });
  });

  test("displays documents when data is loaded", async () => {
    // Mock document data
    const mockDocuments = [
      {
        id: "doc-1",
        name: "Contract.pdf",
        type: "Contract",
        upload_date: "2023-05-15T10:30:00Z",
        size: 1024 * 1024, // 1MB
        analysis_status: "analyzed",
        file_url: "https://example.com/contract.pdf",
      },
      {
        id: "doc-2",
        name: "Review.docx",
        type: "Review",
        upload_date: "2023-06-20T14:45:00Z",
        size: 512 * 1024, // 512KB
        analysis_status: "none",
        file_url: "https://example.com/review.docx",
      },
    ];

    // Setup mock for document fetching
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: mockDocuments,
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      order: mockOrder,
    });

    render(<DocumentManager />);

    // Wait for documents to load and verify they're displayed
    await waitFor(() => {
      expect(screen.getByText("Contract.pdf")).toBeInTheDocument();
      expect(screen.getByText("Review.docx")).toBeInTheDocument();
      expect(screen.getByText("Contract")).toBeInTheDocument();
      expect(screen.getByText("Review")).toBeInTheDocument();
    });
  });

  test("successfully uploads a file", async () => {
    // Mock document fetching
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      order: mockOrder,
    });

    // Mock successful upload
    const uploadMock = jest.fn().mockResolvedValue({
      data: { path: "documents/test-user-id/test-doc.pdf" },
      error: null,
    });

    const getPublicUrlMock = jest.fn().mockReturnValue({
      data: { publicUrl: "https://example.com/test-doc.pdf" },
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    // Mock successful document record creation
    const insertMock = jest.fn().mockReturnThis();
    const selectAfterInsertMock = jest.fn().mockReturnThis();
    const singleMock = jest.fn().mockResolvedValue({
      data: {
        id: "new-doc-id",
        name: "test-doc.pdf",
        type: "Contract",
        size: 1024 * 1024,
        file_url: "https://example.com/test-doc.pdf",
        upload_date: new Date().toISOString(),
        analysis_status: "none",
      },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "documents") {
        return {
          select: mockSelect,
          insert: insertMock,
          eq: mockEq,
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
    });

    insertMock.mockReturnValue({
      select: selectAfterInsertMock,
    });

    selectAfterInsertMock.mockReturnValue({
      single: singleMock,
    });

    // Render the component
    render(<DocumentManager />);

    // Open the upload dialog
    fireEvent.click(screen.getByText("Upload Document"));

    // Create a test file
    const file = new File(["test content"], "test-doc.pdf", {
      type: "application/pdf",
    });

    // Get the file input and simulate file selection
    const fileInput = document.getElementById(
      "file-upload",
    ) as HTMLInputElement;
    await waitFor(() => expect(fileInput).not.toBeNull());

    // Use userEvent to set the file
    Object.defineProperty(fileInput, "files", {
      value: [file],
    });
    fireEvent.change(fileInput);

    // Wait for the file to be selected and displayed
    await waitFor(() => {
      expect(screen.getByText("test-doc.pdf")).toBeInTheDocument();
    });

    // Click the upload button
    const uploadButton = screen.getByText("Upload File");
    fireEvent.click(uploadButton);

    // Wait for the upload to complete and verify the API calls
    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalled();
      expect(getPublicUrlMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalled();
    });
  });

  // File upload failure scenarios
  describe("File upload failure scenarios", () => {
    test("handles file size exceeding limit", async () => {
      render(<DocumentManager />);

      // Open the upload dialog
      fireEvent.click(screen.getByText("Upload Document"));

      // Create a test file that exceeds the size limit (11MB)
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)], // 11MB file (exceeds 10MB limit)
        "large-file.pdf",
        { type: "application/pdf" },
      );

      // Get the file input and simulate file selection
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      await waitFor(() => expect(fileInput).not.toBeNull());

      // Set the file
      Object.defineProperty(fileInput, "files", {
        value: [largeFile],
      });
      fireEvent.change(fileInput);

      // Wait for the file to be selected and displayed
      await waitFor(() => {
        expect(screen.getByText("large-file.pdf")).toBeInTheDocument();
      });

      // Click the upload button
      const uploadButton = screen.getByText("Upload File");
      fireEvent.click(uploadButton);

      // Check for error message about file size
      await waitFor(() => {
        expect(
          screen.getByText(/File size exceeds the maximum limit of 10MB/i),
        ).toBeInTheDocument();
      });
    });

    test("handles invalid file type", async () => {
      render(<DocumentManager />);

      // Open the upload dialog
      fireEvent.click(screen.getByText("Upload Document"));

      // Create a test file with invalid extension
      const invalidFile = new File(["test content"], "invalid-file.exe", {
        type: "application/octet-stream",
      });

      // Get the file input and simulate file selection
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      await waitFor(() => expect(fileInput).not.toBeNull());

      // Set the file
      Object.defineProperty(fileInput, "files", {
        value: [invalidFile],
      });
      fireEvent.change(fileInput);

      // Wait for the file to be selected and displayed
      await waitFor(() => {
        expect(screen.getByText("invalid-file.exe")).toBeInTheDocument();
      });

      // Click the upload button
      const uploadButton = screen.getByText("Upload File");
      fireEvent.click(uploadButton);

      // Check for error message about invalid file type
      await waitFor(() => {
        expect(
          screen.getByText(/File type .exe is not supported/i),
        ).toBeInTheDocument();
      });
    });

    test("handles storage upload failure", async () => {
      // Mock document fetching
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      // Mock storage upload failure
      const uploadMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Storage upload failed" },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: uploadMock,
        getPublicUrl: jest.fn(),
      });

      render(<DocumentManager />);

      // Open the upload dialog
      fireEvent.click(screen.getByText("Upload Document"));

      // Create a test file
      const file = new File(["test content"], "test-doc.pdf", {
        type: "application/pdf",
      });

      // Get the file input and simulate file selection
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      await waitFor(() => expect(fileInput).not.toBeNull());

      // Set the file
      Object.defineProperty(fileInput, "files", {
        value: [file],
      });
      fireEvent.change(fileInput);

      // Wait for the file to be selected and displayed
      await waitFor(() => {
        expect(screen.getByText("test-doc.pdf")).toBeInTheDocument();
      });

      // Click the upload button
      const uploadButton = screen.getByText("Upload File");
      fireEvent.click(uploadButton);

      // Check for error message about storage upload failure
      await waitFor(() => {
        expect(screen.getByText(/Storage upload failed/i)).toBeInTheDocument();
      });

      // Verify the upload was attempted
      expect(uploadMock).toHaveBeenCalled();
    });

    test("handles database record creation failure", async () => {
      // Mock document fetching
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      // Mock successful storage upload
      const uploadMock = jest.fn().mockResolvedValue({
        data: { path: "documents/test-user-id/test-doc.pdf" },
        error: null,
      });

      const getPublicUrlMock = jest.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/test-doc.pdf" },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      });

      // Mock database record creation failure
      const insertMock = jest.fn().mockReturnThis();
      const selectAfterInsertMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database record creation failed" },
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "documents") {
          return {
            select: mockSelect,
            insert: insertMock,
            eq: mockEq,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        };
      });

      insertMock.mockReturnValue({
        select: selectAfterInsertMock,
      });

      selectAfterInsertMock.mockReturnValue({
        single: singleMock,
      });

      render(<DocumentManager />);

      // Open the upload dialog
      fireEvent.click(screen.getByText("Upload Document"));

      // Create a test file
      const file = new File(["test content"], "test-doc.pdf", {
        type: "application/pdf",
      });

      // Get the file input and simulate file selection
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      await waitFor(() => expect(fileInput).not.toBeNull());

      // Set the file
      Object.defineProperty(fileInput, "files", {
        value: [file],
      });
      fireEvent.change(fileInput);

      // Wait for the file to be selected and displayed
      await waitFor(() => {
        expect(screen.getByText("test-doc.pdf")).toBeInTheDocument();
      });

      // Click the upload button
      const uploadButton = screen.getByText("Upload File");
      fireEvent.click(uploadButton);

      // Check for error message about database record creation failure
      await waitFor(() => {
        expect(
          screen.getByText(/Database record creation failed/i),
        ).toBeInTheDocument();
      });

      // Verify the upload was successful but database insertion failed
      expect(uploadMock).toHaveBeenCalled();
      expect(getPublicUrlMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalled();
      expect(singleMock).toHaveBeenCalled();
    });
  });

  describe("Document management operations", () => {
    test("handles document deletion", async () => {
      // Mock document data
      const mockDocuments = [
        {
          id: "doc-1",
          name: "Contract.pdf",
          type: "Contract",
          upload_date: "2023-05-15T10:30:00Z",
          size: 1024 * 1024, // 1MB
          analysis_status: "analyzed",
          file_url: "https://example.com/contract.pdf",
        },
      ];

      // Setup mock for document fetching
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
      });

      // Mock for document deletion
      const mockDelete = jest.fn().mockReturnThis();
      const mockDeleteEq = jest.fn().mockResolvedValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "documents") {
          return {
            select: mockSelect,
            delete: mockDelete,
            eq: mockEq,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        };
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      mockDelete.mockReturnValue({
        eq: mockDeleteEq,
      });

      // Mock window.confirm to return true
      window.confirm = jest.fn().mockReturnValue(true);

      render(<DocumentManager />);

      // Wait for documents to load
      await waitFor(() => {
        expect(screen.getByText("Contract.pdf")).toBeInTheDocument();
      });

      // Find and click the delete button
      const deleteButtons = screen.getAllByRole("button", { hidden: true });
      const deleteButton = deleteButtons.find((button) => {
        return (
          button.querySelector("svg") &&
          button.parentElement?.textContent?.includes("Contract.pdf")
        );
      });

      expect(deleteButton).not.toBeUndefined();
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      // Verify confirm was called and delete was executed
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(mockDelete).toHaveBeenCalled();
        expect(mockDeleteEq).toHaveBeenCalled();
      });
    });
  });
});
