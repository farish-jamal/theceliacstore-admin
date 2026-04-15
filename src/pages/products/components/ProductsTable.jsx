import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, Trash2, Loader2, CheckCircle, XCircle, X } from "lucide-react";
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
import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

const STATUS_CONFIGS = {
  liveInStock: { label: "Live & In Stock", bg: "bg-green-100", text: "text-green-700" },
  liveOutOfStock: { label: "Live & Out of Stock", bg: "bg-amber-100", text: "text-amber-700" },
  hidden: { label: "Hidden / Draft", bg: "bg-gray-100", text: "text-gray-600" },
};

const getProductStatus = (row) => {
  if (row.status === "published" && row.inventory === 1) return "liveInStock";
  if (row.status === "published" && row.inventory === 0) return "liveOutOfStock";
  return "hidden";
};

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
  const [bulkStatusConfirm, setBulkStatusConfirm] = useState(null); // { label, updates }

  // Bulk status update
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }) => {
      const { response } = await apiService({
        endpoint: endpoints.bulk_update,
        method: "PATCH",
        data: { productIds, updates },
      });
      return response;
    },
    onSuccess: (data) => {
      toast.success(`${data?.data?.updated || 0} products updated successfully.`);
      setSelectedRows([]);
      setBulkStatusConfirm(null);
      queryClient.invalidateQueries(["products"]);
    },
    onError: (error) => {
      toast.error(`Bulk update failed: ${error?.message || "Unknown error"}`);
      setBulkStatusConfirm(null);
    },
  });

  const handleBulkStatusChange = (label, updates) => {
    setBulkStatusConfirm({ label, updates });
  };

  const confirmBulkStatusChange = () => {
    if (!bulkStatusConfirm) return;
    const productIds = selectedRows.map((rowId) => {
      const product = products.find((p) => (p._id || `${products.indexOf(p)}`) === rowId);
      return product?._id;
    }).filter(Boolean);
    bulkUpdateMutation.mutate({ productIds, updates: bulkStatusConfirm.updates });
  };

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
    setSelectedRows([]);
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
      key: "status",
      label: "Status",
      render: (_value, row) => {
        const statusKey = getProductStatus(row);
        const config = STATUS_CONFIGS[statusKey];
        return (
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      },
    },
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
          ]}
        />
      ),
    },
  ];

  return (
    <>
      {/* Floating bulk action bar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">{selectedRows.length} product{selectedRows.length > 1 ? "s" : ""} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => handleBulkStatusChange("Live & In Stock", { status: "published", inventory: 1 })}
              disabled={bulkUpdateMutation.isPending}
            >
              Live &amp; In Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => handleBulkStatusChange("Live & Out of Stock", { status: "published", inventory: 0 })}
              disabled={bulkUpdateMutation.isPending}
            >
              Live &amp; Out of Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => handleBulkStatusChange("Hidden", { status: "draft", inventory: 0 })}
              disabled={bulkUpdateMutation.isPending}
            >
              Hidden
            </Button>
            <button onClick={() => setSelectedRows([])} className="ml-2 text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk status confirmation dialog */}
      {bulkStatusConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setBulkStatusConfirm(null)}>
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Confirm status change</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set {selectedRows.length} product{selectedRows.length > 1 ? "s" : ""} to <strong>{bulkStatusConfirm.label}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setBulkStatusConfirm(null)}>Cancel</Button>
              <Button size="sm" onClick={confirmBulkStatusChange} disabled={bulkUpdateMutation.isPending}>
                {bulkUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

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
