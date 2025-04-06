import { Link } from "react-router-dom";
import { Briefcase, DollarSign } from "lucide-react";

const Sidebar = () => {
  const user = { role: "administrator" }; // Replace with actual user data

  return (
    <div className="flex flex-col h-screen">
      {/* Rest of the component code */}
      {user?.role === "administrator" && (
        <>
          <Link to="/job-orders" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Orders
          </Link>
          <Link to="/commission" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Commission
          </Link>
        </>
      )}
    </div>
  );
};

export default Sidebar; 