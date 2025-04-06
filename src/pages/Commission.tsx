import { useEffect, useState } from "react";
import { User } from "@/types";
import { type JobOrderCommission } from "@/types";
import { Layout } from "@/components/layout/Layout";
import CommissionTable from "@/components/commission/CommissionTable";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { formatCurrency, formatCurrencyPHP } from "@/lib/utils";
import CommissionSummary from "@/components/commission/CommissionSummary";

interface CommissionPageProps {
  user: User | null;
}

const Commission = ({ user }: CommissionPageProps) => {
  const [commissions, setCommissions] = useState<JobOrderCommission[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState(0);
  const [pendingCommission, setPendingCommission] = useState(0);

  useEffect(() => {
    fetchCommissionData();
    fetchAdminUsers();
  }, []);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      
      // First, get the joborder_applicant IDs for the current user if they're a recruiter
      let joborderApplicantIds: string[] = [];
      if (user?.role === "recruiter") {
        const { data: joborderApplicants, error: joborderError } = await supabase
          .from("joborder_applicant")
          .select("id")
          .eq("author_id", user.id);

        if (joborderError) throw joborderError;
        joborderApplicantIds = joborderApplicants?.map(ja => ja.id) || [];
      }

      // Build the main query
      let query = supabase
        .from("joborder_commission")
        .select(`
          *,
          joborder_applicant:joborder_applicant_id (
            *,
            joborder:joborder_id (
              job_title
            ),
            applicant:applicant_id (
              first_name,
              last_name
            ),
            author:author_id (
              username
            )
          )
        `)
        .is("deleted_at", null);

      // Add role-based filtering
      if (user?.role === "recruiter" && joborderApplicantIds.length > 0) {
        query = query.in("joborder_applicant_id", joborderApplicantIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort the data by candidate_start_date
      const sortedData = [...(data || [])].sort((a, b) => {
        const dateA = new Date(a.joborder_applicant?.candidate_start_date || 0);
        const dateB = new Date(b.joborder_applicant?.candidate_start_date || 0);
        return dateA.getTime() - dateB.getTime();
      });

      setCommissions(sortedData);
      
      // Calculate total and pending commissions
      let total = 0;
      let pending = 0;
      
      sortedData?.forEach(commission => {
        try {
          if (commission.commission_details) {
            const details = JSON.parse(commission.commission_details);
            const totalAmount = Array.isArray(details) 
              ? details.reduce((sum, detail) => sum + (detail.amount || 0), 0)
              : details.amount || 0;
            total += totalAmount;
            // Calculate pending as current_commission - received_commission
            pending += (commission.current_commission || 0) - (commission.received_commission || 0);
          } else {
            total += commission.received_commission || 0;
            // Calculate pending as current_commission - received_commission
            pending += (commission.current_commission || 0) - (commission.received_commission || 0);
          }
        } catch (error) {
          console.error("Error calculating commission amount:", error);
          total += commission.received_commission || 0;
          // Calculate pending as current_commission - received_commission
          pending += (commission.current_commission || 0) - (commission.received_commission || 0);
        }
      });
      
      setTotalCommission(total);
      setPendingCommission(pending);
      
    } catch (error) {
      console.error("Error fetching commission data:", error);
      toast({
        title: "Error",
        description: "Failed to load commission data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "administrator");

      if (error) throw error;

      setAdminUsers(data || []);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  // Update the access control check
  if (!user || (user.role !== "administrator" && user.role !== "recruiter")) {
    return (
      <Layout pageTitle="Access Denied" user={user}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Commission" user={user}>
      <div className="container mx-auto py-6">
        <CommissionSummary commissions={commissions} />
        <CommissionTable
          commissions={commissions}
          onUpdate={fetchCommissionData}
          adminUsers={adminUsers}
        />
      </div>
    </Layout>
  );
};

export default Commission;
