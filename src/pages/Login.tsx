import React from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Pocket.HR</h1>
        <p className="text-muted-foreground">
          Your personal HR assistant throughout your employment journey
        </p>
      </div>

      <AuthForm />
    </div>
  );
}
