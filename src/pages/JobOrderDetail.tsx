import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { User, JobOrder, JobOrderApplicant, Applicant } from "@/types";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Edit, UserPlus, Upload, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import EditJobOrderDialog from "@/components/job-orders/EditJobOrderDialog";
import AddApplicantDialog from "@/components/job-orders/AddApplicantDialog";
import EndorseApplicantDialog from "@/components/job-orders/EndorseApplicantDialog";
import { formatDateToEST } from "@/lib/utils";

interface JobOrderDetailProps {
  user: User | null;
}

interface JobOrderWithClient extends JobOrder {
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
    position: string;
    email: string;
    phone?: string;
  };
}

interface ApplicantWithDetails extends JobOrderApplicant {
  applicant: Applicant;
  author: {
    first_name: string;
    last_name: string;
  };
}

const JobOrderDetail = ({ user }: JobOrderDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobOrder, setJobOrder] = useState<JobOrderWithClient | null>(null);
  const [applicants, setApplicants] = useState<ApplicantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
  const [isEndorseOpen, setIsEndorseOpen] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchJobOrderDetails();
      fetchJobOrderApplicants();
      
      // Set up real-time subscriptions
      const jobOrderSubscription = supabase
        .channel('job-order-detail-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'joborder', filter: `id=eq.${id}` }, 
          () => {
            fetchJobOrderDetails();
          }
        )
        .subscribe();
        
      const applicantsSubscription = supabase
        .channel('job-order-applicants-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'joborder_applicant', filter: `joborder_id=eq.${id}` }, 
          () => {
            fetchJobOrderApplicants();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(jobOrderSubscription);
        supabase.removeChannel(applicantsSubscription);
      };
    }
  }, [id]);
  
  const fetchJobOrderDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("joborder")
        .select(`
          *,
          clients(*)
        `)
        .eq("id", id)
        .single();
        
      if (error) {
        throw error;
      }
      
      setJobOrder(data as JobOrderWithClient);
    } catch (error) {
      console.error("Error fetching job order details:", error);
      toast({
        title: "Error",
        description: "Failed to load job order details. Please try again.",
        variant: "destructive",
      });
      navigate("/job-orders");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchJobOrderApplicants = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("joborder_applicant")
        .select(`
          *,
          applicant:applicants(*),
          author:users!joborder_applicant_author_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq("joborder_id", id);
        
      if (error) {
        throw error;
      }
      
      setApplicants(data as ApplicantWithDetails[]);
    } catch (error) {
      console.error("Error fetching job order applicants:", error);
    }
  };
  
  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      "kickoff sourcing": "bg-blue-100 text-blue-800",
      "Initial Interview": "bg-purple-100 text-purple-800",
      "Client Endorsement": "bg-amber-100 text-amber-800",
      "Client Interview": "bg-pink-100 text-pink-800",
      "Offered": "bg-orange-100 text-orange-800",
      "Hired": "bg-green-100 text-green-800",
      "Canceled": "bg-red-100 text-red-800"
    };
    
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };
  
  const getApplicationStageColor = (stage: string): string => {
    const stageColors: Record<string, string> = {
      "Sourced": "bg-gray-100 text-gray-800",
      "Interview": "bg-blue-100 text-blue-800",
      "Assessment": "bg-purple-100 text-purple-800",
      "Client Endorsement": "bg-amber-100 text-amber-800",
      "Client Interview": "bg-pink-100 text-pink-800",
      "Offer": "bg-orange-100 text-orange-800",
      "Hired": "bg-green-100 text-green-800"
    };
    
    return stageColors[stage] || "bg-gray-100 text-gray-800";
  };
  
  const getApplicationStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      "Pending": "bg-yellow-100 text-yellow-800",
      "Pass": "bg-green-100 text-green-800",
      "Fail": "bg-red-100 text-red-800"
    };
    
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };
  
  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="h-64 w-full bg-gray-200 rounded"></div>
                <div className="h-96 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!jobOrder) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Job Order Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The job order you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/job-orders")}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Job Orders
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/job-orders")}
                className="mr-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              
              <h2 className="text-xl font-semibold flex-1">{jobOrder.job_title}</h2>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(jobOrder.status)}>
                        {jobOrder.status}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created</p>
                      <p>{jobOrder.created_at ? formatDateToEST(jobOrder.created_at, 'PPP') : 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                      <p>{jobOrder.schedule || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Budget</p>
                      <p>{jobOrder.client_budget || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  {jobOrder.responsibilities_requirements && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Responsibilities & Requirements
                      </p>
                      <p className="whitespace-pre-line">
                        {jobOrder.responsibilities_requirements}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {user?.role === 'administrator' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p>{jobOrder.clients.first_name} {jobOrder.clients.last_name}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Company</p>
                        <p>{jobOrder.clients.company}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Position</p>
                        <p>{jobOrder.clients.position}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="truncate">{jobOrder.clients.email}</p>
                      </div>
                      
                      {jobOrder.clients.phone && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p>{jobOrder.clients.phone}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Applicants</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEndorseOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Endorse Applicant
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddApplicantOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add New Applicant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applicants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endorse by</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applicants.map((applicant) => (
                        <TableRow key={applicant.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {applicant.author ? 
                                  `${applicant.author.first_name} ${applicant.author.last_name}` : 
                                  "N/A"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {applicant.created_at ? 
                                  formatDateToEST(applicant.created_at) : 
                                  "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {applicant.applicant?.first_name} {applicant.applicant?.last_name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{applicant.applicant?.email}</p>
                            {applicant.applicant?.phone && (
                              <p className="text-xs text-muted-foreground">
                                {applicant.applicant.phone}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getApplicationStageColor(applicant.application_stage)}>
                              {applicant.application_stage}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getApplicationStatusColor(applicant.application_status)}>
                              {applicant.application_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {applicant.asking_salary ? 
                              `$${applicant.asking_salary.toLocaleString()}` : 
                              'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => navigate(`/applicants/${applicant.applicant?.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No applicants have been added to this job order yet.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsAddApplicantOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add First Applicant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {jobOrder && (
        <>
          <EditJobOrderDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            jobOrder={jobOrder}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              fetchJobOrderDetails();
            }}
          />
          
          <AddApplicantDialog
            open={isAddApplicantOpen}
            onOpenChange={setIsAddApplicantOpen}
            jobOrder={jobOrder}
            user={user}
            onSuccess={() => {
              setIsAddApplicantOpen(false);
              fetchJobOrderApplicants();
            }}
          />
          
          <EndorseApplicantDialog
            open={isEndorseOpen}
            onOpenChange={setIsEndorseOpen}
            jobOrder={jobOrder}
            user={user}
            onSuccess={() => {
              setIsEndorseOpen(false);
              fetchJobOrderApplicants();
            }}
          />
        </>
      )}
    </div>
  );
};

export default JobOrderDetail;
