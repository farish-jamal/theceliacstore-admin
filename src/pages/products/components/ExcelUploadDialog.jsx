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
import { UploadCloud, FileCheck, X, Download, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { extractDataFromExcel } from "@/utils/excel_reader";
// import { generateTemplate } from "@/utils/excel_generate";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { columnMapper } from "@/constant";
import { productBulkUpload } from "./helpers/bulkUpload";
import { fetchCategory } from "@/pages/categories/helpers/fetchCategory";


const ExcelUploadDialog = ({ openDialog, setOpenDialog,params}) => {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  // const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const bulkUploadMutation = useMutation({
    mutationFn: ({ excelData, onBatchProgress }) => productBulkUpload({ 
      payload: excelData, 
      onBatchProgress 
    }),
    onSuccess: (data) => {
      setBatchProgress(null);
      if (data?.data?.failed?.length === 0) {
        toast.success(`All ${data?.data?.successful} products uploaded successfully!`);
        setFile(null);
        setOpenDialog(false);
      } else {
        toast.error(
          `${data?.data?.successful} products uploaded successfully, ${data?.data?.failed?.length} failed. Check console for details.`
        );
        console.log("Failed items:", data?.data?.failed);
        console.log("Failed batches:", data?.data?.failedBatches);
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
    queryFn: () => fetchCategory({ params }),  });

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
        console.log("Excel data extracted:", excelData);
        
        const categoryMap = new Map(
          apicategorysResponse?.response?.data?.map((cat) => [cat.name, cat._id])
        );
        console.log("Category map:", categoryMap);
        
        const transformedData = excelData.map((row) => {
          const mappedRow = {};

          Object.entries(row).forEach(([key, value]) => {
            const newKey = columnMapper[key] || key.toLowerCase().replace(/\s+/g, '_');
            
            // Handle category mapping
            if (newKey === "category") {
              mappedRow[newKey] = categoryMap.get(value) || value;
            }
            // Handle sub_category mapping if needed
            else if (newKey === "sub_category") {
              mappedRow[newKey] = categoryMap.get(value) || value;
            }
            // Handle tags array (already processed in excel_reader)
            else if (newKey === "tags") {
              mappedRow[newKey] = Array.isArray(value) ? value : [value].filter(Boolean);
            }
            // Handle boolean fields
            else if (newKey === "is_best_seller") {
              mappedRow[newKey] = value === "true" || value === true || value === 1;
            }
            // Handle numeric fields
            else if (["price", "discounted_price", "salesperson_discounted_price", "dnd_discounted_price", "inventory"].includes(newKey)) {
              mappedRow[newKey] = parseFloat(value) || 0;
            }
            // Handle other fields
            else {
              mappedRow[newKey] = value;
            }
          });

          return mappedRow;
        });
        
        console.log("Final transformed data for API:", transformedData);
        
        // Initialize progress
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

  // const handleDownloadTemplate = () => {
  //   setIsGenerating(true);
  //   const categoryDropdownOptions = apicategorysResponse?.response?.data?.map(
  //     (cat) => {
  //       return cat.name;
  //     }
  //   );
  //   const transformedArray = Object.keys(columnMapper);
  //   setTimeout(() => {
  //     generateTemplate(transformedArray, categoryDropdownOptions);
  //     setIsGenerating(false);
  //   }, 1000);
  // };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="p-6 rounded-xl shadow-lg border border-gray-400">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Upload Excel File
          </DialogTitle>
        </DialogHeader>
        <div
          className={`border-2 border-dashed p-6 text-center rounded-lg transition-colors flex flex-col items-center justify-center ${
            dragOver ? "bg-gray-200 border-gray-600" : "border-gray-400"
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
            <label
              htmlFor="fileInput"
              className="cursor-pointer text-sm underline"
            >
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

        {/* Batch Progress Display */}
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
                <span className="text-green-600 font-medium">
                  Upload completed! 
                </span>
                {batchProgress.totalFailed > 0 && (
                  <span className="text-gray-600 ml-2">
                    Check console for failed items details.
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        {/* <Button
          className={`${
            isGenerating ? "pointer-events-none opacity-70" : ""
          } w-full transition cursor-pointer`}
          onClick={handleDownloadTemplate}
        >
          <Download size={18} />{" "}
          {isGenerating ? "Downloading..." : "Download Excel Template"}
        </Button> */}
        <Button
          className={`${
            bulkUploadMutation.isPending ? "pointer-events-none opacity-70" : ""
          } w-full transition cursor-pointer`}
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
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUploadDialog;
