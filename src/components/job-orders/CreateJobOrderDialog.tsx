
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@/types";
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

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
}

interface CreateJobOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: User | null;
}

const formSchema = z.object({
  job_title: z.string().min(3, { message: "Job title must be at least 3 characters" }),
  client_id: z.string().min(1, { message: "Please select a client" }),
  status: z.string().min(1, { message: "Please select a status" }),
  responsibilities_requirements: z.string().optional(),
  schedule: z.string().optional(),
  client_budget: z.string().optional(),
});

const CreateJobOrderDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  user 
}: CreateJobOrderDialogProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_title: "",
      client_id: "",
      status: "kickoff sourcing",
      responsibilities_requirements: "",
      schedule: "",
      client_budget: "",
    },
  });
  
  useEffect(() => {
    if (open) {
      fetchClients();
      form.reset();
    }
  }, [open, form]);
  
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, company")
        .order("company", { ascending: true });
        
      if (error) {
        throw error;
      }
      
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a job order.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.from("joborder").insert({
        job_title: values.job_title,
        client_id: values.client_id,
        author_id: user.id,
        status: values.status,
        responsibilities_requirements: values.responsibilities_requirements || null,
        schedule: values.schedule || null,
        client_budget: values.client_budget || null,
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Job order created successfully!",
      });
      
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Error creating job order:", error);
      toast({
        title: "Error",
        description: "Failed to create job order. Please try again.",
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
          <DialogTitle>Create New Job Order</DialogTitle>
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
                    <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length > 0 ? (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name} - {client.company}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-clients" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                      placeholder="Enter job responsibilities and requirements..."
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
                      <Input placeholder="e.g., Full-time, Remote" {...field} />
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
                      <Input placeholder="e.g., $100,000 - $120,000" {...field} />
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
                {isLoading ? "Creating..." : "Create Job Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobOrderDialog;
