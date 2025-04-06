import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import StatsCards from "@/components/dashboard/StatsCards";
import ChartSection from "@/components/dashboard/ChartSection";

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
            
            <StatsCards />
            
            <div className="mt-6 grid grid-cols-12 gap-4">
              <ChartSection />
              
              <div className="col-span-12 xl:col-span-4 space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-medium mb-2">Recent Activity</h3>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-ats-blue-500 pl-3 py-1">
                      <p className="text-sm font-medium">New job order created</p>
                      <p className="text-xs text-gray-500">Senior Developer - Tech Inc.</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3 py-1">
                      <p className="text-sm font-medium">Applicant hired</p>
                      <p className="text-xs text-gray-500">John Doe - UX Designer</p>
                    </div>
                    <div className="border-l-4 border-amber-500 pl-3 py-1">
                      <p className="text-sm font-medium">Interview scheduled</p>
                      <p className="text-xs text-gray-500">Emma Wilson - Backend Developer</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-3 py-1">
                      <p className="text-sm font-medium">New applicant endorsed</p>
                      <p className="text-xs text-gray-500">Michael Brown - Product Manager</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-medium mb-2">Upcoming Interviews</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="text-sm font-medium">Sarah Johnson</p>
                        <p className="text-xs text-gray-500">Frontend Developer</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">Today</p>
                        <p className="text-xs text-ats-blue-600">2:00 PM</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="text-sm font-medium">Robert Lee</p>
                        <p className="text-xs text-gray-500">DevOps Engineer</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">Tomorrow</p>
                        <p className="text-xs text-ats-blue-600">11:30 AM</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Emily Davis</p>
                        <p className="text-xs text-gray-500">Product Manager</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">May 15</p>
                        <p className="text-xs text-ats-blue-600">3:15 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
