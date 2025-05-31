import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, Trash2 } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { useEffect, useState } from "react";
import { CustomDialog } from "@/components/custom_dialog";
import { toast } from "sonner";

import { useNavigate } from "react-router";
import { fetchAdmins } from "../helpers/fetchAdmins";

const AdminsTable = ({ setadminsLength, params, setParams }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: adminsRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admins", params],
    queryFn: () => fetchAdmins({ params }),
  });

  const admins = adminsRes?.data;
  const totalAdmins = adminsRes?.total;

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const handleOpenDialog = (admin) => {
    setOpenDelete(true);
    setSelectedAdmin(admin);
  };

  const handleCloseDialog = () => {
    setOpenDelete(false);
    setSelectedAdmin(null);
  };

  // const { mutate: deleteAdminMutation, isLoading: isDeleting } = useMutation({
  //   mutationFn: deleteAdmins,
  //   onSuccess: () => {
  //     toast.success("Admin deleted successfully.");
  //     queryClient.invalidateQueries(["admins"]);
  //     handleCloseDialog();
  //   },
  //   onError: (error) => {
  //     console.error(error);
  //     toast.error("Failed to delete admin.");
  //   },
  // });

  const handleDeleteAdmin = (id) => {
    deleteAdminMutation(id);
  };

  const onNavigateToEdit = (id) => {
    navigate(`/dashboard/admins/edit/${id}`);
  };

  useEffect(() => {
    setadminsLength(totalAdmins);
  }, [totalAdmins]);

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            {value}
          </Typography>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="text-gray-600 dark:text-white">
            {row.email}
          </Typography>
        </div>
      ),
    },
    // {
    //   key: "services",
    //   label: "Services",
    //   render: (value, row) => (
    //     <div className="flex flex-col gap-1">
    //       {row.services &&
    //         row.services.length > 0 &&
    //         row.services.map((service) => (
    //           <Typography
    //             key={service._id}
    //             variant="p"
    //             className="text-gray-600 dark:text-white"
    //           >
    //             {service.name}
    //           </Typography>
    //         ))}
    //     </div>
    //   ),
    // },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span className="capitalize bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
          {value}
        </span>
      ),
    },
    // {
    //   key: "is_active",
    //   label: "Status",
    //   render: (value) => (
    //     <span
    //       className={`px-2 py-1 rounded-full text-sm ${
    //         value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    //       }`}
    //     >
    //       {value ? "Active" : "Inactive"}
    //     </span>
    //   ),
    // },
    {
      key: "createdAt",
      label: "Created at",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography>
            {format(new Date(value), "dd/MM/yyyy hh:mm a")}
          </Typography>
          {value !== row.updatedAt && (
            <Typography className="text-gray-500 text-sm">
              Last updated -{" "}
              {formatDistanceToNow(new Date(row.updatedAt), {
                addSuffix: true,
              })}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, row) => (
        <ActionMenu
          options={[
            // {
            //   label: "View Admin Details",
            //   icon: Eye,
            //   action: () => console.log("View admin details"),
            // },
            {
              label: "Edit Admin",
              icon: Pencil,
              action: () => onNavigateToEdit(row._id),
            },
            {
              label: "Delete Admin",
              icon: Trash2,
              action: () => handleOpenDialog(row),
              className: "text-red-500",
            },
          ]}
        />
      ),
    },
  ];

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page: page + 1,
    }));
  };

  const perPage = params.per_page;
  const currentPage = params.page;
  const totalPages = Math.ceil(totalAdmins / perPage);

  return (
    <>
      <CustomTable
        columns={columns}
        data={admins}
        isLoading={isLoading}
        error={error}
        emptyStateMessage="No admins found"
        perPage={perPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <CustomDialog
        onOpen={openDelete}
        onClose={handleCloseDialog}
        title={`Delete ${selectedAdmin?.name}`}
        description="This action will permanently remove the admin account."
        modalType="Delete"
        onConfirm={() => handleDeleteAdmin(selectedAdmin?._id)}
        // isLoading={isDeleting}
      />
    </>
  );
};

export default AdminsTable;
