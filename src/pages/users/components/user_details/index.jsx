import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, ArrowLeft } from "lucide-react";
import NavbarItem from "@/components/navbar/navbar_item";
import Typography from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchUserById } from "../../helpers/fetchUserById";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: userRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  });

  const user = userRes?.response?.data;

  const breadcrumbs = [
    { title: "Users", isNavigation: true, path: "/dashboard/users" },
    { title: "User Details", isNavigation: false },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <span>Loading user details...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-48 space-y-4">
        <p className="text-red-500">Failed to load user details.</p>
        <Button onClick={() => navigate("/dashboard/users")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title="User Details"
        breadcrumbs={breadcrumbs}
      />
      
      <div className="px-8 pb-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <Typography variant="h2" className="mb-2">
                {user.name}
              </Typography>
              <Badge variant={user.isActive ? "success" : "destructive"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Button 
              onClick={() => navigate(`/dashboard/users/edit/${id}`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit User
            </Button>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Typography variant="h4" className="text-gray-600 mb-1">
                  Email
                </Typography>
                <Typography variant="p">{user.email}</Typography>
              </div>

              <div>
                <Typography variant="h4" className="text-gray-600 mb-1">
                  Phone Number
                </Typography>
                <Typography variant="p">{user.phone || "Not provided"}</Typography>
              </div>

              <div>
                <Typography variant="h4" className="text-gray-600 mb-1">
                  Status
                </Typography>
                <Typography variant="p">
                  {user.isActive ? "Active" : "Inactive"}
                </Typography>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Typography variant="h4" className="text-gray-600 mb-1">
                  Created At
                </Typography>
                <Typography variant="p">
                  {format(new Date(user.createdAt), "PPP")}
                </Typography>
              </div>

              <div>
                <Typography variant="h4" className="text-gray-600 mb-1">
                  Last Updated
                </Typography>
                <Typography variant="p">
                  {format(new Date(user.updatedAt), "PPP")}
                </Typography>
              </div>

              <div>
                <Typography variant="h4" className="text-gray-600 mb-1">
                  User ID
                </Typography>
                <Typography variant="p" className="text-sm text-gray-500">
                  {user._id}
                </Typography>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-start mt-8 pt-8 border-t">
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard/users")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails; 