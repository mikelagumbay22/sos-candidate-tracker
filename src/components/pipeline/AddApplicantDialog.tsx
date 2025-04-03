import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { Applicant } from "@/types";
import { Search } from "lucide-react";

interface AddApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  onApplicantAdded: () => void;
}

export const AddApplicantDialog = ({
  open,
  onOpenChange,
  cardId,
  onApplicantAdded,
}: AddApplicantDialogProps) => {
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all applicants created by the current user
  const { data: applicants, isLoading: isLoadingApplicants } = useQuery({
    queryKey: ["applicants-for-card"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("applicants")
        .select("*")
        .eq("author_id", user.id)
        .is("deleted_at", null)
        .order("first_name", { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load applicants",
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
    enabled: open,
  });

  // Fetch already added applicants to exclude them
  const { data: existingApplicants } = useQuery({
    queryKey: ["existing-applicants", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_card_applicants")
        .select("applicant_id")
        .eq("card_id", cardId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load existing applicants",
          variant: "destructive",
        });
        throw error;
      }

      return data.map((item) => item.applicant_id);
    },
    enabled: open && cardId !== "",
  });

  const toggleApplicant = (applicantId: string) => {
    setSelectedApplicantIds((prev) =>
      prev.includes(applicantId)
        ? prev.filter((id) => id !== applicantId)
        : [...prev, applicantId]
    );
  };

  const handleAddApplicants = async () => {
    if (selectedApplicantIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one applicant",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const applicantsToAdd = selectedApplicantIds.map((applicantId) => ({
      card_id: cardId,
      applicant_id: applicantId,
    }));

    const { error } = await supabase
      .from("pipeline_card_applicants")
      .insert(applicantsToAdd);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add applicants to card",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `${selectedApplicantIds.length} applicant(s) added to card`,
    });
    setSelectedApplicantIds([]);
    onOpenChange(false);
    onApplicantAdded();
  };

  const isApplicantAdded = (applicantId: string) => {
    return existingApplicants?.includes(applicantId) || false;
  };

  const filteredApplicants = applicants?.filter((applicant) => {
    const matchesSearch =
      searchQuery === "" ||
      applicant.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchQuery.toLowerCase());

    return !isApplicantAdded(applicant.id) && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add Applicants to Card</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="py-4">
          {isLoadingApplicants ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : filteredApplicants && filteredApplicants.length > 0 ? (
            <div className="space-y-2">
              {filteredApplicants.map((applicant: Applicant) => (
                <div
                  key={applicant.id}
                  className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md"
                >
                  <Checkbox
                    id={`applicant-${applicant.id}`}
                    checked={selectedApplicantIds.includes(applicant.id)}
                    onCheckedChange={() => toggleApplicant(applicant.id)}
                  />
                  <label
                    htmlFor={`applicant-${applicant.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      <div className="font-medium">
                        {applicant.first_name} {applicant.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        <div>{applicant.email}</div>
                        {applicant.phone && (
                          <div className="text-xs text-gray-500">
                            {applicant.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery
                  ? "No applicants found matching your search."
                  : "No available applicants to add. All your applicants are already added to this card or you haven't created any applicants yet."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedApplicantIds([]);
              setSearchQuery("");
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddApplicants}
            disabled={selectedApplicantIds.length === 0 || isLoading}
          >
            {isLoading
              ? "Adding..."
              : `Add Selected (${selectedApplicantIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
