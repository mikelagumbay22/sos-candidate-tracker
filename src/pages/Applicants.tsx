
import { useEffect, useState } from "react";
import { User, Applicant } from "@/types";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import CreateApplicantDialog from "@/components/applicants/CreateApplicantDialog";
import { format } from "date-fns";

interface ApplicantsProps {
  user: User | null;
}

const Applicants = ({ user }: ApplicantsProps) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchApplicants();
    
    // Set up real-time subscription
    const applicantsSubscription = supabase
      .channel('applicants-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'applicants' }, 
        () => {
          fetchApplicants();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(applicantsSubscription);
    };
  }, []);
  
  const fetchApplicants = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("applicants")
        .select("*")
        .is("deleted_at", null)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setApplicants(data || []);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      toast({
        title: "Error",
        description: "Failed to load applicants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteApplicant = async (id: string) => {
    try {
      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from("applicants")
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Applicant deleted successfully!",
      });
      
      // Refresh the list
      fetchApplicants();
    } catch (error) {
      console.error("Error deleting applicant:", error);
      toast({
        title: "Error",
        description: "Failed to delete applicant. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const filteredApplicants = applicants.filter(applicant => 
    applicant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    applicant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    applicant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-xl font-semibold">Applicants</h2>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Applicant
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="bg-white rounded-md shadow overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-14 bg-gray-200"></div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 border-t border-gray-200">
                      <div className="flex p-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="w-24 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredApplicants.length > 0 ? (
              <div className="bg-white rounded-md shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplicants.map((applicant) => (
                      <TableRow key={applicant.id}>
                        <TableCell className="font-medium">
                          {applicant.first_name} {applicant.last_name}
                        </TableCell>
                        <TableCell>{applicant.email}</TableCell>
                        <TableCell>{applicant.phone || "N/A"}</TableCell>
                        <TableCell>{applicant.location || "N/A"}</TableCell>
                        <TableCell>
                          {applicant.created_at ? 
                            format(new Date(applicant.created_at), "MMM d, yyyy") : 
                            "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => {/* View/Edit applicant */}}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteApplicant(applicant.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {searchTerm ? 
                    "No applicants match your search criteria." : 
                    "No applicants found. Add your first applicant to get started."}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Applicant
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <CreateApplicantDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          fetchApplicants();
        }}
        user={user}
      />
    </div>
  );
};

export default Applicants;
