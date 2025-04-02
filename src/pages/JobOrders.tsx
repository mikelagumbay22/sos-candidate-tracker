import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, JobOrder } from "@/types";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import JobOrderCard from "@/components/job-orders/JobOrderCard";
import CreateJobOrderDialog from "@/components/job-orders/CreateJobOrderDialog";

interface JobOrdersProps {
  user: User | null;
}

const JobOrders = ({ user }: JobOrdersProps) => {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobOrders();

    // Set up real-time subscription
    const jobOrderSubscription = supabase
      .channel("job-order-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "joborder" },
        () => {
          fetchJobOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jobOrderSubscription);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJobOrders = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("joborder")
        .select(
          `
          *,
          clients(first_name, last_name, company)
        `
        )
        .order("created_at", { ascending: false });

      // Apply status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Fetch applicant counts for each job order
      const jobOrdersWithCounts = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data || []).map(async (job: any) => {
          const { count } = await supabase
            .from("joborder_applicant")
            .select("*", { count: "exact", head: true })
            .eq("joborder_id", job.id);

          return {
            ...job,
            applicant_count: count || 0,
          } as JobOrder;
        })
      );

      setJobOrders(jobOrdersWithCounts);
    } catch (error) {
      console.error("Error fetching job orders:", error);
      toast({
        title: "Error",
        description: "Failed to load job orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (jobId: string) => {
    navigate(`/job-orders/${jobId}`);
  };

  const filteredJobOrders = jobOrders.filter((job) =>
    job.job_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-xl font-semibold">Job Orders</h2>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search job titles..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Kickoff">
                        Kickoff
                      </SelectItem>
                      <SelectItem value="Sourcing">
                        Sourcing
                      </SelectItem>
                      <SelectItem value="Internal Interview">
                        Internal Interview
                      </SelectItem>
                      <SelectItem value="Internal Assessment">
                        Internal Assessment
                      </SelectItem>
                      <SelectItem value="Client Endorsement">
                        Client Endorsement
                      </SelectItem>
                      <SelectItem value="Client Assessment">
                        Client Assessment
                      </SelectItem>
                      <SelectItem value="Client Interview">
                        Client Interview
                      </SelectItem>
                      <SelectItem value="Offer">Offer</SelectItem>
                      <SelectItem value="Hire">Hire</SelectItem>
                      <SelectItem value="On-hold">On-hold</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>

                  {user?.role === "administrator" && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Job
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-[200px]">
                    <CardContent className="p-6">
                      <div className="w-2/3 h-6 bg-gray-200 animate-pulse rounded mb-4"></div>
                      <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                      <div className="w-5/6 h-4 bg-gray-200 animate-pulse rounded mb-4"></div>
                      <div className="flex justify-between mt-6">
                        <div className="w-20 h-6 bg-gray-200 animate-pulse rounded"></div>
                        <div className="w-24 h-6 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJobOrders.map((job) => (
                  <JobOrderCard
                    key={job.id}
                    jobOrder={job}
                    onClick={() => handleCardClick(job.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {searchTerm || statusFilter !== "all"
                    ? "No job orders match your search criteria."
                    : "No job orders found. Create your first job order to get started."}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job Order
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateJobOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          fetchJobOrders();
        }}
        user={user}
      />
    </div>
  );
};

export default JobOrders;
