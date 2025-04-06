import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Linkedin, Pencil, Trash2 } from "lucide-react";
import { formatDateToEST } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import ViewResumeDialog from "@/components/Applicants/ViewResumeDialog";
import EditApplicantDialog from "@/components/Applicants/EditApplicantDialog";
import ApplicantJobOrdersDialog from "@/components/Applicants/ApplicantJobOrdersDialog";
import { Database } from "@/types/supabase";

type Applicant = Database['public']['Tables']['applicants']['Row'] & {
  author?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  joborder_applicant: Array<{
    id: string;
    joborder: {
      id: string;
      title: string;
      client: {
        name: string;
      };
      status: string;
      candidate_start_date: string;
    };
    status: string;
    count: number;
  }>;
  linkedin_profile: string;
};

interface ApplicantsTableProps {
  applicants: Applicant[];
  loading: boolean;
  onUpdate: () => void;
}

const ApplicantsTable = ({ applicants, loading, onUpdate }: ApplicantsTableProps) => {
  const { user } = useAuth();
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isJobOrdersDialogOpen, setIsJobOrdersDialogOpen] = useState(false);

  const handleDeleteApplicant = async (id: string) => {
    try {
      const response = await fetch('/api/applicants', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const { error } = await response.json();
      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error("Error deleting applicant:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="h-14 bg-gray-200"></div>
          {[1, 2, 3, 4, 5].map((i) => (
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
    );
  }

  if (applicants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No applicants found. Add your first applicant to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-md shadow overflow-hidden">
        <Table>
          <TableHeader className="bg-primary text-primary-foreground font-bold">
            <TableRow>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Phone</TableHead>
              <TableHead className="text-white">Location</TableHead>
              <TableHead className="text-white">Resume</TableHead>
              <TableHead className="text-white">LinkedIn</TableHead>
              <TableHead className="text-white">Added By</TableHead>
              <TableHead className="text-white">Jobs</TableHead>
              <TableHead className="text-center text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applicants.map((applicant) => (
              <TableRow key={applicant.id}>
                <TableCell className="font-medium">
                  {applicant.first_name} {applicant.last_name}
                </TableCell>
                <TableCell>{applicant.email}</TableCell>
                <TableCell>{applicant.phone || "N/A"}</TableCell>
                <TableCell>{applicant.location || "N/A"}</TableCell>
                <TableCell>
                  {applicant.cv_link && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedApplicant(applicant);
                        setIsResumeDialogOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View Resume</span>
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {applicant.linkedin_profile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(applicant.linkedin_profile, "_blank")}
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">View LinkedIn</span>
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {applicant.author
                        ? user?.role === "administrator"
                          ? `${applicant.author.first_name} ${applicant.author.last_name}`
                          : applicant.author.username
                        : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {applicant.created_at
                        ? formatDateToEST(applicant.created_at)
                        : "N/A"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {applicant.joborder_applicant && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedApplicant(applicant);
                        setIsJobOrdersDialogOpen(true);
                      }}
                    >
                      <span className="text-sm font-medium">
                        {applicant.joborder_applicant[0].count}
                      </span>
                      <span className="sr-only">View Job Orders</span>
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {(user?.role === "administrator" ||
                    user?.id === applicant.author_id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setSelectedApplicant(applicant);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {user?.role === "administrator" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteApplicant(applicant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedApplicant && (
        <>
          <ViewResumeDialog
            open={isResumeDialogOpen}
            onOpenChange={setIsResumeDialogOpen}
            applicantName={`${selectedApplicant.first_name} ${selectedApplicant.last_name}`}
            cvLink={selectedApplicant.cv_link}
            applicantId={selectedApplicant.id}
            onSuccess={onUpdate}
          />
          <ApplicantJobOrdersDialog
            open={isJobOrdersDialogOpen}
            onOpenChange={setIsJobOrdersDialogOpen}
            applicant={selectedApplicant}
            user={user}
          />
          <EditApplicantDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            applicant={selectedApplicant}
            onSuccess={onUpdate}
          />
        </>
      )}
    </>
  );
};

export default ApplicantsTable; 