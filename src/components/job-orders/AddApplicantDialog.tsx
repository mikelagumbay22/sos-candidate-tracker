
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobOrder, User } from "@/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrder: JobOrder;
  user: User | null;
  onSuccess: () => void;
}

const applicantFormSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  location: z.string().optional(),
  cv_link: z.string().optional(),
});

const applicationFormSchema = z.object({
  asking_salary: z.string().optional(),
  interview_notes: z.string().optional(),
  application_stage: z.string({ required_error: "Please select a stage" }),
  application_status: z.string({ required_error: "Please select a status" }),
});

const AddApplicantDialog = ({ 
  open, 
  onOpenChange, 
  jobOrder,
  user,
  onSuccess 
}: AddApplicantDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("applicant-info");
  
  const applicantForm = useForm<z.infer<typeof applicantFormSchema>>({
    resolver: zodResolver(applicantFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      location: "",
      cv_link: "",
    },
  });
  
  const applicationForm = useForm<z.infer<typeof applicationFormSchema>>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      asking_salary: "",
      interview_notes: "",
      application_stage: "Sourced",
      application_status: "Pending",
    },
  });
  
  const resetForms = () => {
    applicantForm.reset();
    applicationForm.reset({
      asking_salary: "",
      interview_notes: "",
      application_stage: "Sourced",
      application_status: "Pending",
    });
    setActiveTab("applicant-info");
  };
  
  const onSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add an applicant.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First validate both forms
      const applicantData = await applicantForm.trigger();
      const applicationData = await applicationForm.trigger();
      
      if (!applicantData || !applicationData) {
        // Switch to the tab with validation errors
        if (!applicantData) {
          setActiveTab("applicant-info");
        } else {
          setActiveTab("job-info");
        }
        return;
      }
      
      const applicantValues = applicantForm.getValues();
      const applicationValues = applicationForm.getValues();
      
      // 1. Create the applicant
      const { data: applicantResult, error: applicantError } = await supabase
        .from("applicants")
        .insert({
          first_name: applicantValues.first_name,
          last_name: applicantValues.last_name,
          email: applicantValues.email,
          phone: applicantValues.phone || null,
          location: applicantValues.location || null,
          cv_link: applicantValues.cv_link || null,
          author_id: user.id,
        })
        .select("id")
        .single();
      
      if (applicantError) throw applicantError;
      
      const applicantId = applicantResult.id;
      
      // 2. Create the job order applicant entry
      const { error: applicationError } = await supabase
        .from("joborder_applicant")
        .insert({
          joborder_id: jobOrder.id,
          client_id: jobOrder.client_id,
          author_id: user.id,
          asking_salary: applicationValues.asking_salary ? 
            Number(applicationValues.asking_salary.replace(/[^0-9]/g, '')) : null,
          interview_notes: applicationValues.interview_notes || null,
          application_stage: applicationValues.application_stage,
          application_status: applicationValues.application_status,
        });
      
      if (applicationError) throw applicationError;
      
      toast({
        title: "Success",
        description: "Applicant added successfully!",
      });
      
      onSuccess();
      resetForms();
    } catch (error) {
      console.error("Error adding applicant:", error);
      toast({
        title: "Error",
        description: "Failed to add applicant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForms();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Applicant</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="applicant-info">Applicant Info</TabsTrigger>
            <TabsTrigger value="job-info">Job Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="applicant-info">
            <Form {...applicantForm}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={applicantForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={applicantForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={applicantForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={applicantForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={applicantForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={applicantForm.control}
                  name="cv_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CV/Resume Link</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setActiveTab("job-info")}
                >
                  Next
                </Button>
              </div>
            </Form>
          </TabsContent>
          
          <TabsContent value="job-info">
            <Form {...applicationForm}>
              <div className="space-y-4">
                <FormField
                  control={applicationForm.control}
                  name="asking_salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asking Salary</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $80,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={applicationForm.control}
                  name="interview_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any initial notes about the applicant..."
                          className="resize-y min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={applicationForm.control}
                  name="application_stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Stage*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={applicationForm.control}
                  name="application_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
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
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Pass">Pass</SelectItem>
                          <SelectItem value="Fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActiveTab("applicant-info")}
                  >
                    Back
                  </Button>
                  
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={onSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Adding..." : "Add Applicant"}
                  </Button>
                </div>
              </div>
            </Form>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForms();
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddApplicantDialog;
