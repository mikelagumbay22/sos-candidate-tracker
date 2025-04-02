import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobOrder, User, Applicant } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EndorseApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrder: JobOrder;
  user: User | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  applicant_id: z.string({ required_error: "Please select an applicant" }),
  asking_salary: z.string().optional(),
  interview_notes: z.string().optional(),
});

const EndorseApplicantDialog = ({ 
  open, 
  onOpenChange, 
  jobOrder,
  user,
  onSuccess 
}: EndorseApplicantDialogProps) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicant_id: "",
      asking_salary: "",
      interview_notes: "",
    },
  });
  
  useEffect(() => {
    if (open) {
      form.reset();
      fetchApplicants();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form]);
  
  const fetchApplicants = async () => {
    try {
      setIsLoading(true);
      
      // Get existing applicants associated with this job order
      const { data: existingApplicantIds } = await supabase
        .from("joborder_applicant")
        .select("applicant_id")
        .eq("joborder_id", jobOrder.id);
      
      const existingIds = existingApplicantIds?.map(item => item.applicant_id) || [];
      
      // Fetch all applicants that are not already associated with this job order
      const { data, error } = await supabase
        .from("applicants")
        .select("*")
        .not("id", "in", `(${existingIds.join(',')})`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setApplicants(data || []);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      toast({
        title: "Error",
        description: "Failed to load applicants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to endorse an applicant.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("joborder_applicant")
        .insert({
          joborder_id: jobOrder.id,
          client_id: jobOrder.client_id,
          applicant_id: values.applicant_id,
          author_id: user.id,
          application_stage: "Sourced",
          application_status: "Pending",
          asking_salary: values.asking_salary ? 
            Number(values.asking_salary.replace(/[^0-9]/g, '')) : null,
          interview_notes: values.interview_notes || null,
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Applicant endorsed successfully!",
      });
      
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Error endorsing applicant:", error);
      toast({
        title: "Error",
        description: "Failed to endorse applicant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cross-endorse candidate to</DialogTitle>
          <DialogTitle>{jobOrder.job_title}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {applicants.length > 0 ? (
              <>
                <FormField
                  control={form.control}
                  name="applicant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Applicant</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an applicant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {applicants.map((applicant) => (
                            <SelectItem key={applicant.id} value={applicant.id}>
                              {applicant.first_name} {applicant.last_name} - {applicant.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="asking_salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asking Salary (USD)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: $1,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interview_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profiler</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add updated profiler"
                          className="resize-y min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <div className="py-4">
                <p className="text-center text-muted-foreground">
                  No available applicants to endorse. All existing applicants are already associated with this job order.
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || applicants.length === 0}
              >
                {isLoading ? "Endorsing..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EndorseApplicantDialog;
