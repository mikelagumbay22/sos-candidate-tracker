
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobOrder } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditJobOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrder: JobOrder;
  onSuccess: () => void;
}

const formSchema = z.object({
  job_title: z.string().min(3, { message: "Job title must be at least 3 characters" }),
  status: z.string().min(1, { message: "Please select a status" }),
  responsibilities_requirements: z.string().optional(),
  schedule: z.string().optional(),
  client_budget: z.string().optional(),
});

const EditJobOrderDialog = ({ 
  open, 
  onOpenChange, 
  jobOrder,
  onSuccess 
}: EditJobOrderDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_title: jobOrder.job_title || "",
      status: jobOrder.status || "kickoff sourcing",
      responsibilities_requirements: jobOrder.responsibilities_requirements || "",
      schedule: jobOrder.schedule || "",
      client_budget: jobOrder.client_budget || "",
    },
  });
  
  useEffect(() => {
    if (open && jobOrder) {
      form.reset({
        job_title: jobOrder.job_title || "",
        status: jobOrder.status || "kickoff sourcing",
        responsibilities_requirements: jobOrder.responsibilities_requirements || "",
        schedule: jobOrder.schedule || "",
        client_budget: jobOrder.client_budget || "",
      });
    }
  }, [open, jobOrder, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("joborder")
        .update({
          job_title: values.job_title,
          status: values.status,
          responsibilities_requirements: values.responsibilities_requirements || null,
          schedule: values.schedule || null,
          client_budget: values.client_budget || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", jobOrder.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Job order updated successfully!",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error updating job order:", error);
      toast({
        title: "Error",
        description: "Failed to update job order. Please try again.",
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
          <DialogTitle>Edit Job Order</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="kickoff sourcing">Kickoff Sourcing</SelectItem>
                      <SelectItem value="Initial Interview">Initial Interview</SelectItem>
                      <SelectItem value="Client Endorsement">Client Endorsement</SelectItem>
                      <SelectItem value="Client Interview">Client Interview</SelectItem>
                      <SelectItem value="Offered">Offered</SelectItem>
                      <SelectItem value="Hired">Hired</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responsibilities_requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsibilities & Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="resize-y min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="client_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Budget</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobOrderDialog;
