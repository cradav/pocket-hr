import { AuthError } from "@supabase/supabase-js";

// Environment-based logging
const isDevelopment = import.meta.env.MODE === "development";

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

// Remove sensitive information from error messages
function removeSensitiveInfo(str: string): string {
  // Remove URLs, especially Supabase endpoints
  str = str.replace(/https?:\/\/[^\s<>"]+/g, '[URL REMOVED]');
  
  // Remove email addresses
  str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REMOVED]');
  
  // Remove UUIDs
  str = str.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[ID REMOVED]');
  
  // Remove JWT tokens
  str = str.replace(/eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/g, '[TOKEN REMOVED]');
  
  return str;
}

// Sanitize error messages to avoid exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const errorWithMessage = toErrorWithMessage(error);
  const message = errorWithMessage.message.toLowerCase();

  // Handle Supabase auth errors
  if (error instanceof AuthError) {
    if (message.includes("invalid login credentials")) {
      return "Invalid email or password";
    }
    if (message.includes("email not confirmed")) {
      return "Please verify your email address";
    }
    if (message.includes("rate limit")) {
      return "Too many attempts. Please try again later";
    }
    return "Authentication error occurred";
  }

  // Generic error messages for different scenarios
  if (message.includes("network") || message.includes("fetch")) {
    return "Network connection error";
  }

  if (message.includes("auth") || message.includes("authentication")) {
    return "Authentication error occurred";
  }

  if (message.includes("permission") || message.includes("access")) {
    return "Access denied";
  }

  if (message.includes("not found") || message.includes("404")) {
    return "Resource not found";
  }

  if (message.includes("database") || message.includes("db")) {
    return "Database error occurred";
  }

  // Default error message
  return "An unexpected error occurred";
}

export const logger = {
  error: (message: string, error?: unknown) => {
    const sanitizedMessage = removeSensitiveInfo(message);
    
    if (isDevelopment) {
      console.error(sanitizedMessage);
      if (error) {
        // In development, still sanitize the error details
        const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
        console.error("Details:", removeSensitiveInfo(errorStr));
      }
    } else {
      // In production, use fully sanitized messages
      console.error(sanitizedMessage);
      if (error) {
        console.error("Error:", sanitizeErrorMessage(error));
      }
    }
  },

  warn: (message: string, details?: unknown) => {
    const sanitizedMessage = removeSensitiveInfo(message);
    if (isDevelopment) {
      console.warn(sanitizedMessage);
      if (details) {
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
        console.warn("Details:", removeSensitiveInfo(detailsStr));
      }
    } else {
      console.warn(sanitizedMessage);
    }
  },

  info: (message: string) => {
    const sanitizedMessage = removeSensitiveInfo(message);
    if (isDevelopment) {
      console.log(sanitizedMessage);
    }
  },

  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      const sanitizedMessage = removeSensitiveInfo(message);
      console.log(sanitizedMessage);
      if (data) {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        console.log("Data:", removeSensitiveInfo(dataStr));
      }
    }
  }
}; 