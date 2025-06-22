import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const productBulkUpload = async ({payload}) => {
    try {
      const apiResponse = await apiService({
        endpoint: endpoints.bulk_upload,
        method: "POST",
        data: payload
      });
  
      if (apiResponse?.response?.success) {
        return apiResponse?.response;
      }
  
      return [];
    } catch (error) {
      console.error(error);
    }
  };