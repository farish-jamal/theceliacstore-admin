import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, Trash2 } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { CustomDialog } from "@/components/custom_dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { fetchBundle } from "../helpers/fetchBundle";
import { deleteBundle } from "../helpers/deleteBundle";

const BundlesTable = ({ setBundleLength, params, setParams }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: apiBundlesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bundles", params],
    queryFn: () => fetchBundle({ params }),
  });
  useEffect(() => {
    if (apiBundlesResponse) {
      console.log("Fetched bundles:", apiBundlesResponse);
    }
  }, [apiBundlesResponse]);
  
  const [openDelete, setOpenDelete] = useState(false);
  const [bundleData, setBundleData] = useState(null);

  const onOpenDialog = (row) => {
    setOpenDelete(true);
    setBundleData(row);
  };

  const onCloseDialog = () => {
    setOpenDelete(false);
    setBundleData(null);
  };

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const { mutate: deleteBundleMutation, isLoading: isDeleting } = useMutation({
    mutationFn: deleteBundle,
    onSuccess: () => {
      toast.success("Bundle deleted successfully.");
      queryClient.invalidateQueries(["bundles"]);
      onCloseDialog();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to delete bundle.");
    },
  });

  const onDeleteClick = (id) => {
    deleteBundleMutation(id);
  };

  const bundles = apiBundlesResponse?.data?.data || [];
const total = apiBundlesResponse?.data?.total || 0;

  const onNavigateToEdit = (bundle) => {
    navigate(`/dashboard/bundle/edit/${bundle._id}`);
  };

  const onNavigateDetails = (bundle) => {
    navigate(`/dashboard/bundles/${bundle._id}`);
  };

  const onNavigateInventoryHistory = (bundle) => {
    navigate(`/dashboard/bundles/inventory-history/${bundle._id}`);
  };

  useEffect(() => {
    setBundleLength(bundles?.length);
  }, [bundles, setBundleLength]);

  const perPage = params.per_page;
  const totalPages = Math.ceil(total / perPage);
  const currentPage = params.page;

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <img
            src={row.banner_image || row.images?.[0]}
            alt={value}
            className="h-16 w-16 rounded-lg object-contain"
          />
          <Typography variant="p" className="text-wrap w-[15rem]">
            {value}
          </Typography>
        </div>
      ),
    },

    {
      key: "products",
      label: "Products",
      render: (value) => (
        <div className="flex flex-col gap-1 w-[18rem]">
          <Typography variant="p" className="font-semibold text-sm">
            {value?.length || 0} Product{(value?.length || 0) !== 1 ? 's' : ''}
          </Typography>
          {value && value.length > 0 && (
            <div className="text-xs text-gray-500">
              {value.slice(0, 2).map((product) => (
                <div key={product._id} className="truncate">
                  • {product.name}
                </div>
              ))}
              {value.length > 2 && (
                <div className="text-gray-400">
                  +{value.length - 2} more...
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (value) => `₹${value?.$numberDecimal ?? value ?? "0"}`,
    },
    {
      key: "discounted_price",
      label: "Discounted Price",
      render: (value) => `₹${value?.$numberDecimal ?? value ?? "0"}`,
    },
    
    
    {
      key: "createdAt",
      label: "Created At",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography className="text-sm">
            {format(new Date(value), "dd/MM/yyyy hh:mm a")}
          </Typography>
          {value !== row.updatedAt && (
            <Typography className="text-gray-500 text-xs">
              Updated -{" "}
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
            {
              label: "View Details",
              icon: Eye,
              action: () => onNavigateDetails(row),
            },
            {
              label: "Edit",
              icon: Pencil,
              action: () => onNavigateToEdit(row),
            },
            {
              label: "Delete",
              icon: Trash2,
              action: () => onOpenDialog(row),
              className: "text-red-500",
            },
            // {
            //   label: "Inventory history",
            //   icon: Eye,
            //   action: () => onNavigateInventoryHistory(row),
            // },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <CustomTable
        columns={columns}
        data={bundles}
        isLoading={isLoading}
        error={error}
        totalPages={totalPages}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={onPageChange}
      />
      <CustomDialog
        onOpen={openDelete}
        onClose={onCloseDialog}
        title={bundleData?.name}
        modalType="Delete"
        onDelete={onDeleteClick}
        id={bundleData?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default BundlesTable;
