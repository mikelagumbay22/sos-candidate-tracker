
import RegisterForm from "@/components/auth/RegisterForm";
import { Card } from "@/components/ui/card";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-ats-blue-600">
            ATS System
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new account to get started
          </p>
        </div>
        
        <Card className="p-6 shadow-lg border-t-4 border-t-ats-blue-600">
          <RegisterForm />
        </Card>
      </div>
    </div>
  );
};

export default Register;
