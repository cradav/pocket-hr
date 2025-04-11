import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function CredentialTest() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const testCredentials = async () => {
    setStatus("loading");
    setMessage("");

    try {
      // Get credentials from environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          "Supabase credentials not found in environment variables",
        );
      }

      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Test connection by querying the credential_test table
      const { data, error } = await supabase
        .from("credential_test")
        .select("*")
        .limit(1);

      if (error) throw error;

      setStatus("success");
      setMessage(`Connection successful! Found ${data.length} test records.`);
    } catch (error) {
      setStatus("error");
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardHeader>
        <CardTitle>Supabase Credential Test</CardTitle>
        <CardDescription>
          Test if your Supabase credentials are properly configured
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={testCredentials}
            disabled={status === "loading"}
            className="w-full"
          >
            {status === "loading" ? "Testing..." : "Test Credentials"}
          </Button>

          {message && (
            <div
              className={`p-3 rounded-md ${status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {message}
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p>Environment variables being checked:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
