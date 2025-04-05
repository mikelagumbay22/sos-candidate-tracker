import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobOrder } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, toZonedTime } from "date-fns-tz";

interface EditJobOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrder: JobOrder;
  onSuccess: () => void;
}

const formSchema = z.object({
  job_title: z
    .string()
    .min(3, { message: "Job title must be at least 3 characters" }),
  status: z.string().min(1, { message: "Please select a status" }),
  job_description: z.any().optional(),
  schedule: z.string().optional(),
  client_budget: z.string().optional(),
});

const EditJobOrderDialog = ({
  open,
  onOpenChange,
  jobOrder,
  onSuccess,
}: EditJobOrderDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_title: jobOrder.job_title || "",
      status: jobOrder.status || "Kickoff",

      schedule: jobOrder.schedule || "",
      client_budget: jobOrder.client_budget || "",
    },
  });

  useEffect(() => {
    if (open && jobOrder) {
      form.reset({
        job_title: jobOrder.job_title || "",
        status: jobOrder.status || "Kickoff",

        schedule: jobOrder.schedule || "",
        client_budget: jobOrder.client_budget || "",
      });
    }
  }, [open, jobOrder, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      let jobDescriptionUrl = jobOrder.job_description;

      if (uploadedFile) {
        // Format timestamp in EST timezone
        const now = new Date();
        const estDate = toZonedTime(now, "America/New_York");
        const timestamp = format(estDate, "MM-dd-yyyy hh:mm a");

        // Create file path and name
        const fileExt = uploadedFile.name.split(".").pop();
        const sanitizedName = jobOrder.job_title
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .trim();
        const folderPath = `${sanitizedName} (${jobOrder.id})`;
        const fileName = `${timestamp}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("job-descriptions")
          .upload(filePath, uploadedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(uploadError.message);
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("job-descriptions").getPublicUrl(filePath);

        jobDescriptionUrl = publicUrl;
      }

      const { error } = await supabase
        .from("joborder")
        .update({
          job_title: values.job_title,
          status: values.status,
          job_description: jobDescriptionUrl,
          schedule: values.schedule || null,
          client_budget: values.client_budget || null,
          updated_at: new Date().toISOString(),
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
        description:
          error instanceof Error
            ? error.message
            : "Failed to update job order. Please try again.",
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Kickoff">Kickoff</SelectItem>
                      <SelectItem value="Sourcing">Sourcing</SelectItem>
                      <SelectItem value="Internal Interview">
                        Internal Interview
                      </SelectItem>
                      <SelectItem value="Internal Assessment">
                        Internal Assessment
                      </SelectItem>
                      <SelectItem value="Client Endorsement">
                        Client Endorsement
                      </SelectItem>
                      <SelectItem value="Client Assessment">
                        Client Assessment
                      </SelectItem>
                      <SelectItem value="Client Interview">
                        Client Interview
                      </SelectItem>
                      <SelectItem value="Offer">Offer</SelectItem>
                      <SelectItem value="Hire">Hired</SelectItem>
                      <SelectItem value="On-hold">On-hold</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadedFile(file);
                            field.onChange(file);
                          }
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload a PDF or Word document containing the job
                        description
                      </p>
                    </div>
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
