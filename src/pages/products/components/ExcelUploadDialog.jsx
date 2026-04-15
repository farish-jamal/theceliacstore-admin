import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileCheck, X, Download, Upload, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { extractDataFromExcel } from "@/utils/excel_reader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { columnMapper } from "@/constant";
import { productBulkUpload } from "./helpers/bulkUpload";
import { fetchCategory } from "@/pages/categories/helpers/fetchCategory";
import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

const ExcelUploadDialog = ({ openDialog, setOpenDialog, params }) => {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [importResult, setImportResult] = useState(null); // { success, updated, failed, flagged }
  const [step, setStep] = useState("upload"); // "upload" | "summary" | "review"
  const [flaggedStatuses, setFlaggedStatuses] = useState({}); // { [productId]: "keep" | "outOfStock" | "hidden" }
  const [failedExpanded, setFailedExpanded] = useState(false);
  const [applyingFlagged, setApplyingFlagged] = useState(false);
  const queryClient = useQueryClient();

  const bulkUploadMutation = useMutation({
    mutationFn: ({ excelData, onBatchProgress }) => productBulkUpload({
      payload: excelData,
      onBatchProgress
    }),
    onSuccess: (data) => {
      setBatchProgress(null);

      // Collect results across all batches
      const apiData = data?.data || {};
      const result = {
        success: apiData.success || [],
        updated: apiData.updated || [],
        failed: apiData.failed || [],
        flagged: apiData.flagged || [],
      };
      setImportResult(result);
      setStep("summary");

      // Initialize flagged statuses
      if (result.flagged.length > 0) {
        const statuses = {};
        result.flagged.forEach((p) => { statuses[p._id] = "keep"; });
        setFlaggedStatuses(statuses);
      }

      queryClient.invalidateQueries(["products"]);
    },
    onError: (error) => {
      setBatchProgress(null);
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const {
    data: apicategorysResponse,
  } = useQuery({
    queryKey: ["category", params],
    queryFn: () => fetchCategory({ params }),
  });

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    validateFile(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const selectedFile = event.dataTransfer.files[0];
    validateFile(selectedFile);
  };

  const validateFile = (selectedFile) => {
    if (
      selectedFile &&
      (selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel")
    ) {
      setFile(selectedFile);
    } else {
      toast.error("Please select a valid .xls or .xlsx format");
    }
  };

  const handleBatchProgress = (progress) => {
    setBatchProgress(progress);
  };

  const handleUploadBulk = async () => {
    if (!file) {
      toast.error("Upload a file to proceed");
    } else {
      try {
        const excelData = await extractDataFromExcel(file);

        const categoryMap = new Map(
          apicategorysResponse?.response?.data?.map((cat) => [cat.name, cat._id])
        );

        const transformedData = excelData.map((row) => {
          const mappedRow = {};

          Object.entries(row).forEach(([key, value]) => {
            const newKey = columnMapper[key] || key.toLowerCase().replace(/\s+/g, '_');

            if (newKey === "category") {
              mappedRow[newKey] = categoryMap.get(value) || value;
            } else if (newKey === "sub_category") {
              mappedRow[newKey] = categoryMap.get(value) || value;
            } else if (newKey === "tags") {
              mappedRow[newKey] = Array.isArray(value) ? value : [value].filter(Boolean);
            } else if (newKey === "is_best_seller" || newKey === "celiacFriendly") {
              mappedRow[newKey] = value === "true" || value === true || value === 1;
            } else if (["price", "discounted_price", "salesperson_discounted_price", "dnd_discounted_price", "inventory"].includes(newKey)) {
              mappedRow[newKey] = parseFloat(value) || 0;
            } else {
              mappedRow[newKey] = value;
            }
          });

          return mappedRow;
        });

        setBatchProgress({
          currentBatch: 0,
          totalBatches: Math.ceil(transformedData.length / 50),
          currentBatchSize: 0,
          totalProcessed: 0,
          totalFailed: 0,
          completed: false
        });

        bulkUploadMutation.mutate({
          excelData: transformedData,
          onBatchProgress: handleBatchProgress
        });

      } catch (error) {
        console.error("Error processing Excel file:", error);
        toast.error("Error processing Excel file. Please check the format.");
      }
    }
  };

  const handleApplyFlaggedChanges = async () => {
    setApplyingFlagged(true);
    try {
      // Group products by target status (skip "keep")
      const outOfStockIds = [];
      const hiddenIds = [];

      Object.entries(flaggedStatuses).forEach(([productId, status]) => {
        if (status === "outOfStock") outOfStockIds.push(productId);
        if (status === "hidden") hiddenIds.push(productId);
      });

      let totalUpdated = 0;

      if (outOfStockIds.length > 0) {
        const { response } = await apiService({
          endpoint: endpoints.bulk_update,
          method: "PATCH",
          data: { productIds: outOfStockIds, updates: { status: "published", inventory: 0 } },
        });
        totalUpdated += response?.data?.updated || 0;
      }

      if (hiddenIds.length > 0) {
        const { response } = await apiService({
          endpoint: endpoints.bulk_update,
          method: "PATCH",
          data: { productIds: hiddenIds, updates: { status: "draft", inventory: 0 } },
        });
        totalUpdated += response?.data?.updated || 0;
      }

      if (totalUpdated > 0) {
        toast.success(`${totalUpdated} products updated`);
      } else {
        toast.info("No changes applied");
      }

      queryClient.invalidateQueries(["products"]);
      handleClose();
    } catch (error) {
      toast.error(`Failed to update flagged products: ${error?.message || "Unknown error"}`);
    } finally {
      setApplyingFlagged(false);
    }
  };

  const handleSetAllFlagged = (status) => {
    if (!importResult?.flagged) return;
    const newStatuses = {};
    importResult.flagged.forEach((p) => { newStatuses[p._id] = status; });
    setFlaggedStatuses(newStatuses);
  };

  const handleClose = () => {
    setFile(null);
    setBatchProgress(null);
    setImportResult(null);
    setStep("upload");
    setFlaggedStatuses({});
    setFailedExpanded(false);
    setOpenDialog(false);
  };

  const hasFlaggedChanges = Object.values(flaggedStatuses).some((s) => s !== "keep");

  return (
    <Dialog open={openDialog} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="p-6 rounded-xl shadow-lg border border-gray-400 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {step === "upload" && "Upload Excel File"}
            {step === "summary" && "Import Complete"}
            {step === "review" && "Review Flagged Products"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP: Upload */}
        {step === "upload" && (
          <>
            <div
              className={`border-2 border-dashed p-6 text-center rounded-lg transition-colors flex flex-col items-center justify-center ${dragOver ? "bg-gray-200 border-gray-600" : "border-gray-400"
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <UploadCloud className="mb-2" size={50} />
              <div className="flex items-center gap-1">
                <p className="text-sm">Drag & drop an Excel file here</p>
                <label htmlFor="fileInput" className="cursor-pointer text-sm underline">
                  or select a file
                </label>
              </div>
              <div className="mt-4 text-center">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="fileInput"
                />
              </div>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between p-3 rounded-lg shadow-md">
                <div className="flex items-center gap-2">
                  <FileCheck size={20} />
                  <p className="text-sm font-medium">{file.name}</p>
                </div>
                <button onClick={() => setFile(null)} disabled={bulkUploadMutation.isPending}>
                  <X size={18} />
                </button>
              </div>
            )}

            {batchProgress && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Upload Progress</h4>
                  <div className="flex items-center gap-2">
                    {batchProgress.completed ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    )}
                    <span className="text-sm text-gray-600">
                      Batch {batchProgress.currentBatch}/{batchProgress.totalBatches}
                    </span>
                  </div>
                </div>

                <Progress
                  value={(batchProgress.currentBatch / batchProgress.totalBatches) * 100}
                  className="mb-2"
                />

                <div className="flex justify-between text-xs text-gray-600">
                  <span>Processed: {batchProgress.totalProcessed}</span>
                  {batchProgress.totalFailed > 0 && (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Failed: {batchProgress.totalFailed}
                    </span>
                  )}
                </div>

                {batchProgress.completed && (
                  <div className="mt-2 text-sm">
                    <span className="text-green-600 font-medium">Upload completed!</span>
                    {batchProgress.totalFailed > 0 && (
                      <span className="text-gray-600 ml-2">Check console for failed items details.</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              className={`${bulkUploadMutation.isPending ? "pointer-events-none opacity-70" : ""} w-full transition cursor-pointer`}
              onClick={handleUploadBulk}
              disabled={bulkUploadMutation.isPending}
            >
              {!bulkUploadMutation.isPending && <Upload size={18} />}{" "}
              {bulkUploadMutation.isPending
                ? (batchProgress
                  ? `Processing Batch ${batchProgress.currentBatch}/${batchProgress.totalBatches}...`
                  : "Uploading..."
                )
                : "Upload"
              }
            </Button>
          </>
        )}

        {/* STEP: Summary */}
        {step === "summary" && importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{importResult.success?.length || 0}</p>
                <p className="text-sm text-green-600">Created</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{importResult.updated?.length || 0}</p>
                <p className="text-sm text-blue-600">Updated</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{importResult.failed?.length || 0}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-700">{importResult.flagged?.length || 0}</p>
                <p className="text-sm text-amber-600">Flagged for review</p>
              </div>
            </div>

            {/* Expandable failed list */}
            {importResult.failed?.length > 0 && (
              <div className="border rounded-lg">
                <button
                  className="w-full flex items-center justify-between p-3 text-sm font-medium text-red-700 hover:bg-red-50"
                  onClick={() => setFailedExpanded(!failedExpanded)}
                >
                  <span>Failed items ({importResult.failed.length})</span>
                  {failedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {failedExpanded && (
                  <div className="border-t max-h-48 overflow-y-auto">
                    {importResult.failed.map((item, i) => (
                      <div key={i} className="px-3 py-2 text-xs border-b last:border-b-0">
                        <span className="font-medium">{item.name || `Row ${item.index}`}</span>
                        <span className="text-red-500 ml-2">— {item.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {importResult.flagged?.length > 0 ? (
                <Button onClick={() => setStep("review")}>Next: Review flagged</Button>
              ) : (
                <Button onClick={handleClose}>Done</Button>
              )}
            </div>
          </div>
        )}

        {/* STEP: Review flagged products */}
        {step === "review" && importResult?.flagged?.length > 0 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-amber-700">
                {importResult.flagged.length} product{importResult.flagged.length > 1 ? "s are" : " is"} live but {importResult.flagged.length > 1 ? "were" : "was"} not in your upload file
              </p>
              <p className="text-xs text-gray-500 mt-1">
                These products are currently live on your store. Please review and set their status.
              </p>
            </div>

            {/* Select all bar */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Set all to:</span>
              <button className="underline text-gray-600 hover:text-gray-900" onClick={() => handleSetAllFlagged("keep")}>Keep as-is</button>
              <button className="underline text-amber-600 hover:text-amber-800" onClick={() => handleSetAllFlagged("outOfStock")}>Out of Stock</button>
              <button className="underline text-gray-600 hover:text-gray-900" onClick={() => handleSetAllFlagged("hidden")}>Hidden</button>
            </div>

            {/* Flagged table */}
            <div className="border rounded-lg max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Product Name</th>
                    <th className="text-left p-2 font-medium">SKU</th>
                    <th className="text-left p-2 font-medium">Brand</th>
                    <th className="text-left p-2 font-medium">Sub-category</th>
                    <th className="text-left p-2 font-medium">New Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.flagged.map((product) => (
                    <tr key={product._id} className="border-t">
                      <td className="p-2 max-w-[12rem] truncate">{product.name}</td>
                      <td className="p-2 text-gray-500">{product.sku}</td>
                      <td className="p-2 text-gray-500">{product.brand?.name || "—"}</td>
                      <td className="p-2 text-gray-500">{product.sub_category?.name || "—"}</td>
                      <td className="p-2">
                        <select
                          className="border rounded px-1.5 py-1 text-xs w-full"
                          value={flaggedStatuses[product._id] || "keep"}
                          onChange={(e) => setFlaggedStatuses((prev) => ({ ...prev, [product._id]: e.target.value }))}
                        >
                          <option value="keep">Keep as-is</option>
                          <option value="outOfStock">Live &amp; Out of Stock</option>
                          <option value="hidden">Hidden</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>Skip</Button>
              <Button onClick={handleApplyFlaggedChanges} disabled={!hasFlaggedChanges || applyingFlagged}>
                {applyingFlagged ? "Applying..." : "Apply changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUploadDialog;
