import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, File, Trash2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AddApplicantDialog } from "./AddApplicantDialog";
import { ViewResumeDialog } from "./ViewResumeDialog";
import { CardDetailsDialog } from "./CardDetailsDialog";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Applicant } from "@/types";

interface PipelineCardProps {
  card: {
    id: string;
    title: string;
    created_at: string;
  };
  onUpdate: () => void;
}

export const PipelineCard = ({ card, onUpdate }: PipelineCardProps) => {
  const [isAddApplicantDialogOpen, setIsAddApplicantDialogOpen] =
    useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [isCardDetailsDialogOpen, setIsCardDetailsDialogOpen] = useState(false);

  // Fetch applicants in this card
  const {
    data: applicants,
    isLoading: isLoadingApplicants,
    refetch,
  } = useQuery({
    queryKey: ["pipeline-card-applicants", card.id],
    queryFn: async () => {
      console.log("Fetching applicants for card:", card.id);
      
      const { data, error } = await supabase
        .from("pipeline_card_applicants")
        .select(`
          id,
          applicant_id,
          added_at,
          applicant:applicant_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            location,
            cv_link,
            author_id,
            created_at
          )
        `)
        .eq("card_id", card.id)
        .order("added_at", { ascending: false });

      if (error) {
        console.error("Error fetching applicants:", error);
        toast({
          title: "Error",
          description: "Failed to load applicants",
          variant: "destructive",
        });
        throw error;
      }

      console.log("Full data with join:", data);
      console.log("Number of applicants:", data?.length);
      if (data?.length > 0) {
        console.log("First applicant structure:", data[0]);
      }
      return data || [];
    },
    enabled: !!card.id,
  });

  // Add a debug effect to log when the dialog opens and when applicants change
  useEffect(() => {
    if (isCardDetailsDialogOpen) {
      console.log("Dialog opened, applicants data:", applicants);
      console.log("Number of applicants:", applicants?.length);
      if (applicants?.length > 0) {
        console.log("First applicant data:", applicants[0]);
      }
    }
  }, [isCardDetailsDialogOpen, applicants]);

  // Add a debug effect to log when the card changes
  useEffect(() => {
    console.log("Card changed:", card);
  }, [card]);

  const handleRemoveApplicant = async (applicantId: string) => {
    const { error } = await supabase
      .from("pipeline_card_applicants")
      .delete()
      .eq("card_id", card.id)
      .eq("applicant_id", applicantId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove applicant",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Applicant removed from card",
    });
    refetch();
  };

  const handleDeleteCard = async () => {
    const { error } = await supabase
      .from("pipeline_cards")
      .delete()
      .eq("id", card.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete card",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Card deleted successfully",
    });
    onUpdate();
  };

  return (
    <>
      <Card
        className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsCardDetailsDialogOpen(true)}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 ">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl truncate ">{card.title}</CardTitle>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Card</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this card? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCard}
                  className="bg-destructive text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <div className="px-6 pb-2 text-xs text-gray-500">
          Created {format(new Date(card.created_at), "MMM d, yyyy")}
        </div>
        <CardContent className="flex-grow ">
          <div className="space-y-4">
            {isLoadingApplicants ? (
              <div className="animate-pulse space-y-2">
                <div className="h-12 bg-gray-100 rounded"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Users className="h-5 w-5" />
                <span className="text-lg font-medium">{applicants?.length || 0}</span>
                <span>candidates</span>
              </div>
            )}
          </div>
        </CardContent>
        <div className="p-4 border-t mt-auto">
          <Button
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddApplicantDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Candidates
          </Button>
        </div>
      </Card>

      <CardDetailsDialog
        open={isCardDetailsDialogOpen}
        onOpenChange={setIsCardDetailsDialogOpen}
        cardTitle={card.title}
        applicants={applicants || []}
        isLoading={isLoadingApplicants}
        onRemoveApplicant={handleRemoveApplicant}
        onViewResume={(applicant) => {
          setSelectedApplicant(applicant);
          setIsResumeDialogOpen(true);
        }}
      />

      <AddApplicantDialog
        open={isAddApplicantDialogOpen}
        onOpenChange={setIsAddApplicantDialogOpen}
        cardId={card.id}
        onApplicantAdded={() => {
          refetch();
        }}
      />

      {selectedApplicant && (
        <ViewResumeDialog
          open={isResumeDialogOpen}
          onOpenChange={setIsResumeDialogOpen}
          applicant={selectedApplicant}
          onResumeUpdated={() => {
            refetch();
          }}
        />
      )}
    </>
  );
};
