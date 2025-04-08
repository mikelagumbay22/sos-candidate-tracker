import LoginForm from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/card";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full ">
        <div className="text-center">
          <img
            src="https://muiubouxyyiweauhciff.supabase.co/storage/v1/object/public/images//SOS%20Logo.webp"
            alt="SOS Logo"
            className="w-[450px]"
          />
        </div>

        <Card className="p-6 shadow-lg border-t-4 border-t-[#421820]">
          <LoginForm />
        </Card>
      </div>
    </div>
  );
};

export default Login;
