import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateOrder = async ({ orderId, status, addressId, products = [], bundles = [] }) => {
  try {
    // Status is required by the API
    if (!status) {
      throw new Error("Status is required for order updates");
    }

    const updateData = {
      status, // Always include status as it's required
    };
    
    // Add addressId if provided
    if (addressId) {
      updateData.addressId = addressId;
    }
    
    // Add products if provided
    if (products && products.length > 0) {
      updateData.products = products.map(product => ({
        productId: product.productId,
        newQuantity: product.newQuantity
      }));
    }
    
    // Add bundles if provided
    if (bundles && bundles.length > 0) {
      updateData.bundles = bundles.map(bundle => ({
        bundleId: bundle.bundleId,
        newQuantity: bundle.newQuantity
      }));
    }

    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}`,
      method: "PATCH",
      data: updateData,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};
