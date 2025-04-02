import { formatDistanceToNowEST } from "@/lib/utils";
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
      Kickoff: "bg-[#A74D4A] text-white",
      Sourcing: "bg-cyan-100 text-cyan-800",
      "Internal Interview": "bg-purple-100 text-purple-800",
      "Internal Assessment": "bg-indigo-100 text-indigo-800",
      "Client Endorsement": "bg-amber-100 text-amber-800",
      "Client Assessment": "bg-yellow-100 text-yellow-800",
      "Client Interview": "bg-pink-100 text-pink-800",
      Offer: "bg-orange-100 text-orange-800",
      Hire: "bg-green-100 text-green-800",
      "On-hold": "bg-gray-100 text-gray-800",
      Canceled: "bg-red-100 text-red-800",
    };

    const color = statusColors[status] || "bg-gray-100 text-gray-800";
    console.log("Status:", status, "Color:", color);
    return color;
  };

  const formattedDate = jobOrder.created_at
    ? formatDistanceToNowEST(jobOrder.created_at)
    : "Unknown date";

  // Extract client name from the clients relation
  const clientName = jobOrder.clients
    ? `${jobOrder.clients.first_name} ${jobOrder.clients.last_name}`
    : "Unknown client";

  const clientCompany = jobOrder.clients?.company || "Unknown company";

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-1">
            {jobOrder.job_title}
          </h3>
          <Badge className={getStatusColor(jobOrder.status)}>
            {jobOrder.status}
          </Badge>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{jobOrder.applicant_count || 0} candidates</span>
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
