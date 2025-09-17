import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchOrders = async ({ params }) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.order,
      params,
    });

    return apiResponse;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};
