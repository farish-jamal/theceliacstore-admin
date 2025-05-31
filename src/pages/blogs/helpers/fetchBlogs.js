import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchBlogs = async ({ params }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.blogs}`,
      method: "GET",
      params,
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
