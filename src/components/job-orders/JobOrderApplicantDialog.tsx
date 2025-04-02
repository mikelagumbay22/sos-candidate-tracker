import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { ApplicantWithDetails } from "@/types";

interface JobOrderApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: ApplicantWithDetails;
  userRole?: string;
  onSuccess?: () => void;
}

const JobOrderApplicantDialog = ({
  open,
  onOpenChange,
  applicant,
  userRole,
  onSuccess
}: JobOrderApplicantDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedApplicant, setEditedApplicant] = useState(applicant);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      console.log("Updating joborder_applicant with data:", {
        id: editedApplicant.id,
        application_stage: editedApplicant.application_stage,
        application_status: editedApplicant.application_status,
        client_feedback: editedApplicant.client_feedback,
      });

      // First, perform the update
      const { error: updateError } = await supabase
        .from("joborder_applicant")
        .update({
          application_stage: editedApplicant.application_stage,
          application_status: editedApplicant.application_status,
          client_feedback: editedApplicant.client_feedback,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editedApplicant.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      // Then, fetch the updated record
      const { data: updatedData, error: fetchError } = await supabase
        .from("joborder_applicant")
        .select(`
          *,
          applicant:applicants(*),
          author:users!joborder_applicant_author_id_fkey (
            first_name,
            last_name,
            username
          )
        `)
        .eq("id", editedApplicant.id)
        .single();

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }

      if (!updatedData) {
        throw new Error("Failed to fetch updated data");
      }

      console.log("Updated data:", updatedData);

      // Update local state with the fetched data
      setEditedApplicant(updatedData);

      toast({
        title: "Success",
        description: "Applicant details updated successfully!",
      });

      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating applicant:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update applicant details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedApplicant(applicant);
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold underline">
            {applicant.applicant?.first_name} {applicant.applicant?.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">
                Contact Information
              </h4>
              <div className="mt-2 space-y-1">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {applicant.applicant?.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {applicant.applicant?.phone || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {applicant.applicant?.location || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">
                Application Details
              </h4>
              <div className="mt-2 space-y-1">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stage</label>
                      <Select
                        value={editedApplicant.application_stage}
                        onValueChange={(value) =>
                          setEditedApplicant({
                            ...editedApplicant,
                            application_stage: value as 'Sourced' | 'Interview' | 'Assessment' | 'Client Endorsement' | 'Client Interview' | 'Offer' | 'Hired',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sourced">Sourced</SelectItem>
                          <SelectItem value="Interview">Interview</SelectItem>
                          <SelectItem value="Assessment">Assessment</SelectItem>
                          <SelectItem value="Client Endorsement">Client Endorsement</SelectItem>
                          <SelectItem value="Client Interview">Client Interview</SelectItem>
                          <SelectItem value="Offer">Offer</SelectItem>
                          <SelectItem value="Hired">Hired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={editedApplicant.application_status}
                        onValueChange={(value) =>
                          setEditedApplicant({
                            ...editedApplicant,
                            application_status: value as 'Pending' | 'Pass' | 'Fail',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Pass">Pass</SelectItem>
                          <SelectItem value="Fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      <span className="font-medium">Stage:</span>{" "}
                      {editedApplicant.application_stage}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {editedApplicant.application_status}
                    </p>
                  </>
                )}
                <p>
                  <span className="font-medium">Asking Salary:</span>{" "}
                  {editedApplicant.asking_salary || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Added By:</span>{" "}
                  {editedApplicant.author?.first_name} {editedApplicant.author?.last_name}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm text-muted-foreground underline">
              Interview Notes
            </h4>
            <p className="mt-2 whitespace-pre-wrap">
              {editedApplicant.interview_notes || "No interview notes available"}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-sm text-muted-foreground underline">
              Client Feedback
            </h4>
            {isEditing ? (
              <Textarea
                value={editedApplicant.client_feedback || ""}
                onChange={(e) =>
                  setEditedApplicant({
                    ...editedApplicant,
                    client_feedback: e.target.value,
                  })
                }
                className="mt-2"
                placeholder="Enter client feedback..."
              />
            ) : (
              <p className="mt-2 whitespace-pre-wrap">
                {editedApplicant.client_feedback || "No client feedback available"}
              </p>
            )}
          </div>
        </div>

        {userRole === "administrator" && (
          <DialogFooter>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>Edit Details</Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JobOrderApplicantDialog; 