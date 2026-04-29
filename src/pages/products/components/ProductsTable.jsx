import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, Trash2, Loader2, CheckCircle, XCircle, X, IndianRupee, ChevronUp, ChevronDown } from "lucide-react";
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
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceEdits, setPriceEdits] = useState({}); // { [productId]: { newPrice, newDiscountedPrice } }
  const [priceModalStep, setPriceModalStep] = useState("edit"); // "edit" | "review"
  const [priceModalError, setPriceModalError] = useState("");
  const [priceUpdating, setPriceUpdating] = useState(false);
  const [priceModalSort, setPriceModalSort] = useState("asc"); // "asc" | "desc"

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

  // Price modify helpers
  const getCurrentPriceNum = (val) => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "object" && val.$numberDecimal !== undefined) {
      const n = parseFloat(val.$numberDecimal);
      return isNaN(n) ? null : n;
    }
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };

  const openPriceModal = () => {
    setPriceEdits({});
    setPriceModalStep("edit");
    setPriceModalError("");
    setPriceModalSort("asc");
    setPriceModalOpen(true);
  };

  const togglePriceModalSort = () => {
    setPriceModalSort((s) => (s === "asc" ? "desc" : "asc"));
  };

  const closePriceModal = () => {
    setPriceModalOpen(false);
    setPriceEdits({});
    setPriceModalStep("edit");
    setPriceModalError("");
  };

  const updatePriceEdit = (productId, field, value) => {
    setPriceEdits((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [field]: value },
    }));
    if (priceModalError) setPriceModalError("");
  };

  const getSelectedProducts = () => {
    const list = selectedRows
      .map((rowId) => products.find((p) => (p._id || `${products.indexOf(p)}`) === rowId))
      .filter(Boolean);
    list.sort((a, b) => {
      const cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      return priceModalSort === "asc" ? cmp : -cmp;
    });
    return list;
  };

  const getChangedEntries = () => {
    return getSelectedProducts().flatMap((p) => {
      const edit = priceEdits[p._id];
      if (!edit) return [];
      const newPriceStr = (edit.newPrice ?? "").toString().trim();
      if (!newPriceStr) return [];
      const newPriceNum = parseFloat(newPriceStr);
      if (isNaN(newPriceNum)) return [];
      const currentPrice = getCurrentPriceNum(p.price);
      const currentDisc = getCurrentPriceNum(p.discounted_price);
      const flags = [];
      if (currentPrice != null && currentPrice > 0) {
        const pct = ((newPriceNum - currentPrice) / currentPrice) * 100;
        if (Math.abs(pct) > 20) flags.push({ field: "price", pct });
      }
      // Auto-sync discounted_price unless a genuine discount currently exists
      const hasGenuineDiscount =
        currentDisc != null &&
        currentDisc > 0 &&
        currentPrice != null &&
        currentDisc < currentPrice;
      const autoSyncDisc = !hasGenuineDiscount;
      return [{
        product: p,
        newPriceStr,
        newPriceNum,
        currentPrice,
        currentDisc,
        flags,
        autoSyncDisc,
      }];
    });
  };

  const onReviewChanges = () => {
    const changed = getChangedEntries();
    if (changed.length === 0) {
      setPriceModalError("No prices were changed");
      return;
    }
    setPriceModalError("");
    setPriceModalStep("review");
  };

  const onConfirmPriceUpdate = async () => {
    const changed = getChangedEntries();
    if (changed.length === 0) return;
    setPriceUpdating(true);
    let successCount = 0;
    let errorCount = 0;
    for (const entry of changed) {
      try {
        const formData = new FormData();
        formData.append("price", entry.newPriceStr);
        if (entry.autoSyncDisc) {
          formData.append("discounted_price", entry.newPriceStr);
        }
        const result = await apiService({
          endpoint: `${endpoints.product}/${entry.product._id}`,
          method: "PUT",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (result?.error || result?.success === false || !result?.response) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        errorCount++;
      }
    }
    setPriceUpdating(false);
    if (errorCount === 0) {
      toast.success(`${successCount} product${successCount === 1 ? "" : "s"} updated successfully`);
      closePriceModal();
      setSelectedRows([]);
      queryClient.invalidateQueries(["products"]);
    } else if (successCount > 0) {
      toast.error(`${successCount} updated, ${errorCount} failed`);
      queryClient.invalidateQueries(["products"]);
    } else {
      toast.error("Failed to update prices");
    }
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
            <Button
              size="sm"
              variant="outline"
              className="bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50 ml-1"
              onClick={openPriceModal}
              disabled={bulkUpdateMutation.isPending}
            >
              <IndianRupee className="w-4 h-4 mr-1" />
              Modify Prices
            </Button>
            <button onClick={() => setSelectedRows([])} className="ml-2 text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modify Prices modal */}
      {priceModalOpen && (() => {
        const selProducts = getSelectedProducts();
        const changed = priceModalStep === "review" ? getChangedEntries() : [];
        const flagged = changed.filter((c) => c.flags.length > 0);
        return (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => { if (!priceUpdating) closePriceModal(); }}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
                <div>
                  <h3 className="text-lg font-semibold">Modify Prices</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {selProducts.length} product{selProducts.length === 1 ? "" : "s"} selected
                      {priceModalStep === "review" && ` · ${changed.length} change${changed.length === 1 ? "" : "s"}`}
                    </p>
                    <button
                      type="button"
                      onClick={togglePriceModalSort}
                      className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 px-2 py-0.5 border border-gray-300 rounded"
                      aria-label="Toggle sort order"
                    >
                      Name {priceModalSort === "asc" ? "A→Z" : "Z→A"}
                      {priceModalSort === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={closePriceModal}
                  disabled={priceUpdating}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {priceModalStep === "edit" && (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b border-gray-200">
                          <th className="py-2 pr-3 font-medium">Product Name</th>
                          <th className="py-2 px-3 font-medium">Current Price</th>
                          <th className="py-2 pl-3 font-medium">New Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selProducts.map((p) => {
                          const curPrice = getCurrentPriceNum(p.price);
                          const edit = priceEdits[p._id] || {};
                          return (
                            <tr key={p._id} className="border-b border-gray-100 align-top">
                              <td className="py-2 pr-3 max-w-[18rem]">
                                <div
                                  className="text-gray-900"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                  title={p.name}
                                >
                                  {p.name}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-gray-700">
                                {curPrice != null ? `₹${curPrice}` : "—"}
                              </td>
                              <td className="py-2 pl-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Enter new price"
                                  value={edit.newPrice ?? ""}
                                  onChange={(e) => updatePriceEdit(p._id, "newPrice", e.target.value)}
                                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {priceModalError && (
                    <p className="mt-3 text-sm text-red-600">{priceModalError}</p>
                  )}
                </div>
              )}

              {priceModalStep === "review" && (
                <div className="p-4 space-y-4">
                  {flagged.length > 0 && (
                    <div className="border border-red-300 bg-red-50 rounded-lg p-3">
                      <h4 className="font-semibold text-red-700 mb-2">
                        ⚠️ Please double-check these prices
                      </h4>
                      <div className="space-y-2">
                        {flagged.map((c) => (
                          <div key={c.product._id} className="text-sm bg-white rounded p-2 border border-red-200">
                            <div className="font-medium text-gray-900 truncate" title={c.product.name}>
                              {c.product.name}
                            </div>
                            <div className="mt-1 space-y-0.5 text-gray-700">
                              {c.flags.map((f) => (
                                <div key={f.field}>
                                  <span className="text-gray-500">Price:</span>{" "}
                                  ₹{c.currentPrice} → ₹{c.newPriceNum}{" "}
                                  <span className={f.pct > 0 ? "text-red-600" : "text-orange-600"}>
                                    ({f.pct > 0 ? "+" : ""}{f.pct.toFixed(1)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 mb-2">Changes to apply</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b border-gray-200">
                            <th className="py-2 pr-3 font-medium">Product</th>
                            <th className="py-2 pl-3 font-medium">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changed.map((c) => {
                            const isFlagged = c.flags.length > 0;
                            return (
                              <tr
                                key={c.product._id}
                                className={`border-b border-gray-100 align-top ${isFlagged ? "bg-red-50/30" : ""}`}
                              >
                                <td className="py-2 pr-3 max-w-[18rem]">
                                  <div
                                    className="text-gray-900"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                    title={c.product.name}
                                  >
                                    {c.product.name}
                                  </div>
                                  {!c.autoSyncDisc && (
                                    <div className="text-[11px] text-gray-500 mt-0.5">
                                      Discount preserved (current ₹{c.currentDisc})
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 pl-3 text-gray-700">
                                  <span className="text-gray-500">{c.currentPrice != null ? `₹${c.currentPrice}` : "—"}</span>
                                  {" → "}
                                  <span className="font-medium text-gray-900">₹{c.newPriceNum}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
                {priceModalStep === "edit" && (
                  <>
                    <Button variant="outline" size="sm" onClick={closePriceModal} disabled={priceUpdating}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={onReviewChanges} disabled={priceUpdating}>
                      Review Changes
                    </Button>
                  </>
                )}
                {priceModalStep === "review" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPriceModalStep("edit")}
                      disabled={priceUpdating}
                    >
                      Back to Edit
                    </Button>
                    <Button size="sm" onClick={onConfirmPriceUpdate} disabled={priceUpdating}>
                      {priceUpdating && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                      Confirm &amp; Update
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
