import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function ThankYou() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to Pocket.HR!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            Thank you for registering with Pocket.HR. We're excited to help you navigate your workplace challenges.
          </p>
          <p className="mb-8 text-muted-foreground">
            You now have access to AI-driven HR support, document management, and on-demand human advocacy.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
