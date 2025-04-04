import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "@/components/RegistrationForm";

type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  employmentStage: string;
  company: string;
  title: string;
  role: string;
};

export default function Register() {
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] =
    useState<RegistrationData | null>(null);

  const handleRegistration = (data: RegistrationData) => {
    // Store the registration data
    setRegistrationData(data);

    // In a real application, you would send this data to your backend
    console.log("Registration data:", data);

    // Navigate to thank you page
    navigate("/thank-you");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Pocket.HR</h1>
        <p className="text-muted-foreground">
          Your personal HR assistant throughout your employment journey
        </p>
      </div>

      <RegistrationForm onSubmit={handleRegistration} />

      <p className="mt-8 text-sm text-muted-foreground text-center">
        Already have an account?{" "}
        <a href="/" className="text-primary hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
