import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Verify Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            We've sent you a verification email. Please check your inbox and click the verification link to activate your account.
          </p>
          <p className="mb-8 text-sm text-muted-foreground">
            If you don't see the email, please check your spam folder.
          </p>
          <div className="space-y-4">
            <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
              Return to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 