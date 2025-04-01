
import { formatDistanceToNow } from "date-fns";
import { JobOrder } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface JobOrderCardProps {
  jobOrder: JobOrder;
  onClick: () => void;
}

const JobOrderCard = ({ jobOrder, onClick }: JobOrderCardProps) => {
  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      "kickoff sourcing": "bg-blue-100 text-blue-800",
      "Initial Interview": "bg-purple-100 text-purple-800",
      "Client Endorsement": "bg-amber-100 text-amber-800",
      "Client Interview": "bg-pink-100 text-pink-800",
      "Offered": "bg-orange-100 text-orange-800",
      "Hired": "bg-green-100 text-green-800",
      "Canceled": "bg-red-100 text-red-800"
    };
    
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };
  
  const formattedDate = jobOrder.created_at ? 
    formatDistanceToNow(new Date(jobOrder.created_at), { addSuffix: true }) :
    "Unknown date";

  // Extract client name from the clients relation
  const clientName = jobOrder.clients ? 
    `${jobOrder.clients.first_name} ${jobOrder.clients.last_name}` : 
    "Unknown client";
    
  const clientCompany = jobOrder.clients?.company || "Unknown company";
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-1">{jobOrder.job_title}</h3>
          <Badge className={getStatusColor(jobOrder.status)}>
            {jobOrder.status}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          {clientName} • {clientCompany}
        </p>
        
        {jobOrder.responsibilities_requirements && (
          <p className="text-sm mt-3 line-clamp-2">
            {jobOrder.responsibilities_requirements}
          </p>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{jobOrder.applicant_count || 0} applicants</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Created {formattedDate}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobOrderCard;
