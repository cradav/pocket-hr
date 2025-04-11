import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Migration {
  id: number;
  name: string;
  hash: string;
  executed_at: string;
  status: string;
}

export default function MigrationStatus() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [message, setMessage] = useState("");

  const fetchFailedMigrations = async () => {
    setStatus("loading");
    setMessage("");

    try {
      // First try to use the edge function
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-failed-migrations`;
      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMigrations(data.migrations || []);
        setStatus("success");
        setMessage(
          data.migrations.length > 0
            ? `Found ${data.migrations.length} failed migrations.`
            : "No failed migrations found.",
        );
        return;
      }

      // If edge function fails, try direct RPC call
      const { data, error } = await supabase.rpc("list_failed_migrations");

      if (error) {
        // If RPC fails, try a more basic approach
        console.error("RPC error:", error);

        // Try to query all migrations and filter client-side
        const { data: allMigrations, error: queryError } = await supabase
          .from("migrations")
          .select("*");

        if (queryError) {
          throw new Error(`Failed to fetch migrations: ${queryError.message}`);
        }

        // Filter failed migrations client-side
        const failedMigrations =
          allMigrations?.filter((m) => m.status !== "applied") || [];

        setMigrations(failedMigrations);
        setStatus("success");
        setMessage(
          failedMigrations.length > 0
            ? `Found ${failedMigrations.length} failed migrations.`
            : "No failed migrations found.",
        );
        return;
      }

      setMigrations(data || []);
      setStatus("success");
      setMessage(
        data && data.length > 0
          ? `Found ${data.length} failed migrations.`
          : "No failed migrations found.",
      );
    } catch (error) {
      console.error("Error fetching migrations:", error);
      setStatus("error");
      setMessage(`Error: ${error.message}`);
      setMigrations([]);
    }
  };

  useEffect(() => {
    fetchFailedMigrations();
  }, []);

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>Migration Status</CardTitle>
        <CardDescription>
          View the status of your Supabase migrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              {status === "success" && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
              {status === "error" && (
                <div className="flex items-center text-destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <p className="text-sm">{message}</p>
                </div>
              )}
            </div>
            <Button
              onClick={fetchFailedMigrations}
              disabled={status === "loading"}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {migrations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Migration Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {migrations.map((migration) => (
                  <TableRow key={migration.id}>
                    <TableCell className="font-medium">
                      {migration.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          migration.status === "failed"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {migration.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {migration.executed_at
                        ? new Date(migration.executed_at).toLocaleString()
                        : "Not executed"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : status !== "loading" ? (
            <div className="text-center py-8 text-muted-foreground">
              {status === "success"
                ? "No failed migrations found. All migrations have been applied successfully."
                : "Unable to retrieve migration status."}
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
