import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const productBulkUpload = async ({payload}) => {
    try {
      console.log("Sending bulk upload request with payload:", payload);
      console.log("Payload length:", payload.length);
      console.log("Sample payload item:", payload[0]);
      
      const apiResponse = await apiService({
        endpoint: endpoints.bulk_upload,
        method: "POST",
        data: payload
      });

      console.log("Bulk upload API response:", apiResponse);
  
      if (apiResponse?.response?.success) {
        return apiResponse?.response;
      }
  
      return [];
    } catch (error) {
      console.error("Bulk upload error:", error);
      throw error;
    }
  };