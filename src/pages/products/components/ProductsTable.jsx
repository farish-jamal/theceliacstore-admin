import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { CustomDialog } from "@/components/custom_dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { fetchProducts } from "./helpers/fetchProducts";
import { deleteProduct } from "./helpers/deleteProduct";
import { migrateProductImages } from "./helpers/migrateProductImages";

const ProductsTable = ({ setProductLength, params, setParams }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: apiProductsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts({ params }),
  });

  const [openDelete, setOpenDelete] = useState(false);
  const [productData, setProductData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkMigrating, setBulkMigrating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  // Bulk migrate handler
  const handleBulkMigrate = async () => {
    setBulkMigrating(true);
    setBulkProgress(0);
    for (let i = 0; i < selectedRows.length; i++) {
      const rowId = selectedRows[i];
      const product = products.find((p) => (p._id || `${products.indexOf(p)}`) === rowId);
      if (product) {
        try {
          await migrateProductImages({ id: product._id });
        } catch (e) {
          // Optionally handle error per product
        }
      }
      setBulkProgress(i + 1);
    }
    toast.success("Bulk migration complete");
    setBulkMigrating(false);
    setBulkProgress(0);
    // Uncheck all checkboxes after migration (force clear selection for CustomTable)
    setSelectedRows([]); // for controlled selection
    // Also trigger a rerender for CustomTable's internal state if needed
    queryClient.invalidateQueries(["products"]);
  };

  const onOpenDialog = (row) => {
    setOpenDelete(true);
    setProductData(row);
  };

  const onCloseDialog = () => {
    setOpenDelete(false);
    setProductData(null);
  };

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page,
    }));
    // window.scrollTo(0, 0);
  };

  const { mutate: deleteProuductsMutation, isLoading: isDeleting } =
    useMutation({
      mutationFn: deleteProduct,
      onSuccess: () => {
        toast.success("Products deleted successfully.");
        queryClient.invalidateQueries(["products"]);
        onCloseDialog();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to delete product.");
      },
    });

  const onDeleteClick = (id) => {
    deleteProuductsMutation(id);
  };

  // Track loading state for migration per product
  const [migratingId, setMigratingId] = useState(null);
  const migrateImages = async (row) => {
    setMigratingId(row._id);
    try {
      await migrateProductImages({ id: row._id });
      toast.success("Images migration triggered");
      queryClient.invalidateQueries(["products"]);
    } catch (e) {
      toast.error("Failed to migrate images");
    } finally {
      setMigratingId(null);
    }
  };
  const products = apiProductsResponse?.data || [];
  const total = apiProductsResponse?.total || 0;

  const onNavigateToEdit = (product) => {
    navigate(`/dashboard/product/edit/${product._id}`);
  };

  const onNavigateDetails = (product) => {
    navigate(`/dashboard/products/${product._id}`);
  };

  const onNavigateInventoryHistory = (product) => {
    navigate(`/dashboard/products/inventory-history/${product._id}`);
  };

  useEffect(() => {
    setProductLength(products?.length);
    // console.log("Fetched products:", products);
    // console.log("API response:", apiProductsResponse);
  }, [products, setProductLength]);

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
    // {
    //   key: "small_description",
    //   label: "Short Description",
    //   render: (value) => (
    //     <Typography variant="p" className="text-sm w-[20rem] text-wrap line-clamp-2">
    //       {value}
    //     </Typography>
    //   ),
    // },
    {
      key: "price",
      label: "Price",
      render: (value) => `₹${value?.$numberDecimal || value || ""}`,
    },
    {
      key: "discounted_price",
      label: "Discounted Price",
      render: (value) => `₹${value?.$numberDecimal || value || ""}`,
    },
    {
      key: "brand",
      label: "Brand",
      render: (value) => value?.name || "No Brand",
    },
    {
      key: "instock",
      label: "In Stock",
      render: (value) => (value ? "Yes" : "No"),
    },
    // {
    //   key: "inventory",
    //   label: "Inventory",
    // },
    // {
    //   key: "product_type",
    //   label: "Product type",
    //   render: (value) => {
    //     let bg = "bg-blue-100";
    //     let text = "text-blue-700";
    //     if (value === "service") {
    //       bg = "bg-purple-100";
    //       text = "text-purple-700";
    //     } else if (value === "product") {
    //       bg = "bg-blue-100";
    //       text = "text-blue-700";
    //     }
    //     return (
    //       <span
    //         className={`inline-block px-2 py-1 rounded-full ${bg} ${text} text-xs font-medium`}
    //       >
    //         {value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"}
    //       </span>
    //     );
    //   },
    // },
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
      label: "Created At",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography>
            {format(new Date(value), "dd/MM/yyyy hh:mm a")}
          </Typography>
          {value !== row.updatedAt && (
            <Typography className="text-gray-500 text-sm">
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
      key: "isImported",
      label: "Imported",
      render: (value, row) => {
        const images = row.images || [];
        const isImported = images.some(
          (img) => typeof img === "string" && img.includes("res.cloudinary.com")
        );
        return isImported ? (
          <CheckCircle className="text-green-500 w-5 h-5 mx-auto" title="Imported" />
        ) : (
          <XCircle className="text-red-500 w-5 h-5 mx-auto" title="Not Imported" />
        );
      },
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
              label: "Migrate images to Cloudinary",
              icon: Loader2,
              action: () => migrateImages(row),
              disabled: migratingId === row._id,
              renderRight:
                migratingId === row._id
                  ? () => <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  : undefined,
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
      <div className="flex items-center gap-4 mb-4">
        <Button
          className="gap-2"
          disabled={
            bulkMigrating ||
            selectedRows.length === 0 ||
            selectedRows.length > 10
          }
          onClick={handleBulkMigrate}
        >
          Bulk Migrate
          {bulkMigrating && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
        </Button>
        {selectedRows.length > 10 && (
          <span className="text-red-500 text-sm">You can only migrate up to 10 products at once.</span>
        )}
        {bulkMigrating && (
          <div className="flex items-center gap-2 w-48">
            <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded"
                style={{ width: `${(bulkProgress / selectedRows.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-700">{bulkProgress}/{selectedRows.length}</span>
          </div>
        )}
      </div>
      <CustomTable
        columns={columns}
        data={products || []}
        isLoading={isLoading}
        error={error}
        totalPages={totalPages}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={onPageChange}
        enableRowSelection={true}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
      />
      <CustomDialog
        onOpen={openDelete}
        onClose={onCloseDialog}
        title={productData?.name}
        modalType="Delete"
        onDelete={onDeleteClick}
        id={productData?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ProductsTable;
