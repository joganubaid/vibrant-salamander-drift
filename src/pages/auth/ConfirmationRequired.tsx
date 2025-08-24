import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

const ConfirmationRequired = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="mt-4 text-2xl">Check your email</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground space-y-4">
          <p>We've sent a confirmation link to your email address. Please click the link to complete your registration.</p>
          <p className="text-sm">
            Didn't receive an email? Check your spam folder.
          </p>
          <Link to="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmationRequired;