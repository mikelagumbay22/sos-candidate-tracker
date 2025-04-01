import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { User } from "./types";
import { toast } from "@/components/ui/use-toast";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import JobOrders from "./pages/JobOrders";
import JobOrderDetail from "./pages/JobOrderDetail";
import Applicants from "./pages/Applicants";
import Clients from "./pages/Clients";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user session on initial load
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          try {
            // Get user metadata from auth user
            const { data: authData } = await supabase.auth.getUser();
            
            if (authData.user) {
              const userData: User = {
                id: authData.user.id,
                email: authData.user.email || '',
                first_name: authData.user.user_metadata.first_name || '',
                last_name: authData.user.user_metadata.last_name || '',
                username: authData.user.user_metadata.username || '',
                role: authData.user.user_metadata.role || 'recruiter',
                created_at: authData.user.created_at,
                updated_at: null,
                deleted_at: null,
              };
              
              setUser(userData);
            }
          } catch (profileError) {
            console.error("Error fetching user profile:", profileError);
            // Sign out if profile cannot be fetched
            await supabase.auth.signOut();
            setUser(null);
            toast({
              title: "Authentication Error",
              description: "Please sign in again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          try {
            // Get user metadata from auth user
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata.first_name || '',
              last_name: session.user.user_metadata.last_name || '',
              username: session.user.user_metadata.username || '',
              role: session.user.user_metadata.role || 'recruiter',
              created_at: session.user.created_at || new Date().toISOString(),
              updated_at: null,
              deleted_at: null,
            };
            
            setUser(userData);
          } catch (error) {
            console.error("Error fetching user profile on auth change:", error);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Auth guard component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ats-blue-600"></div>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/job-orders"
              element={
                <ProtectedRoute>
                  <JobOrders user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/job-orders/:id"
              element={
                <ProtectedRoute>
                  <JobOrderDetail user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/applicants"
              element={
                <ProtectedRoute>
                  <Applicants user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Clients user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users user={user} />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
