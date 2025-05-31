import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchProductById = async ({ id }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.product}/${id}/`,
      method: "GET",
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
