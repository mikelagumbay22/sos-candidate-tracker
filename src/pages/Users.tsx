import { useState, useEffect } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { formatDateToEST } from "@/lib/utils";

interface UsersProps {
  user: User | null;
}

const Users = ({ user }: UsersProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // Only allow administrators to fetch users
      if (user?.role !== 'administrator') {
        toast({
          title: "Access Denied",
          description: "Only administrators can view users",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, role, created_at, username")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data as User[] || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Add user as a dependency

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ats-blue-600"></div>
        </div>
      </div>
    );
  }

  // If user is not an administrator, show access denied message
  if (user?.role !== 'administrator') {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators can view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <Button>Add User</Button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{formatDateToEST(user.created_at!, "MM/dd/yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users; 