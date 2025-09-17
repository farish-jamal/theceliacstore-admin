import React, { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { fetchOrdersByProduct } from "../helpers/fetchOrdersByProduct";
const SKUTable = ({ productsWithOrders = [], isLoading = false }) => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openOrdersDialog, setOpenOrdersDialog] = useState(false);

  // Fetch detailed orders for the selected product
  const {
    data: ordersByProductResponse,
    isLoading: ordersLoading,
  } = useQuery({
    queryKey: ["orders-by-product", selectedProduct?.product?._id],
    queryFn: () => fetchOrdersByProduct(selectedProduct.product._id),
    enabled: !!selectedProduct?.product?._id && openOrdersDialog,
  });

  const orderDetails = ordersByProductResponse?.response?.data || null;

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-24" />
          </div>
          
          {/* Table header skeleton */}
          <div className="grid grid-cols-6 gap-4 p-4 border-b">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Table rows skeleton */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
          
          {/* Pagination skeleton */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </Card>
    );
  }

  if (!Array.isArray(productsWithOrders)) {
    return <div className="p-4 text-center text-red-500">Error: Invalid products data</div>;
  }

  // Filter products based on status if needed (this would require order-level filtering)
  const filteredProducts = productsWithOrders;

  if (filteredProducts.length === 0) {
    return <div className="p-4 text-center text-gray-500">No product data available</div>;
  }


  const viewAllOrders = (product) => {
    setSelectedProduct(product);
    setOpenOrdersDialog(true);
  };

  const columns = [
    {
      key: "product",
      label: "Product",
      render: (product) => (
        <div className="flex items-center gap-3">
          {product.banner_image ? (
            <img 
              src={product.banner_image} 
              alt={product.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Typography variant="p" className="font-medium">
              {product.name}
            </Typography>
            <Typography variant="small" className="text-gray-500 font-mono">
              ID: {product._id.slice(-8)}
            </Typography>
          </div>
        </div>
      ),
    },
    {
      key: "pricing",
      label: "Pricing",
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            ₹{row.product.price}
          </Typography>
          {row.product.discounted_price && row.product.discounted_price !== row.product.price && (
            <Typography variant="small" className="text-green-600">
              Discounted: ₹{row.product.discounted_price}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: "totalQuantity",
      label: "Total Quantity",
      render: (totalQuantity) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-semibold text-blue-600">
            {totalQuantity}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            units sold
          </Typography>
        </div>
      ),
    },
    {
      key: "totalOrders",
      label: "Total Orders",
      render: (totalOrders) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            {totalOrders}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            orders
          </Typography>
        </div>
      ),
    },
    {
      key: "totalRevenue",
      label: "Revenue",
      render: (totalRevenue) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-semibold text-green-600">
            ₹{totalRevenue.toFixed(2)}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            original price
          </Typography>
        </div>
      ),
    },
    {
      key: "totalDiscountedRevenue",
      label: "Discounted Revenue",
      render: (totalDiscountedRevenue) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-semibold text-emerald-600">
            ₹{totalDiscountedRevenue.toFixed(2)}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            actual earned
          </Typography>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => viewAllOrders(row)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      ),
    },
  ];

  return (
    <>
      <CustomTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        error={null}
        hidePagination={true}
      />

      {/* Product Details Dialog */}
      <Dialog open={openOrdersDialog} onOpenChange={setOpenOrdersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedProduct?.product?.banner_image && (
                <img 
                  src={selectedProduct.product.banner_image} 
                  alt={selectedProduct.product.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div>
                <div className="text-lg font-semibold">{selectedProduct?.product?.name}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  ID: {selectedProduct?.product?._id}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {ordersLoading ? (
            <div className="space-y-4 p-4">
              {/* Stats skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
              
              {/* Orders list skeleton */}
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4 max-h-96 overflow-auto">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Total Quantity
                </Typography>
                <Typography variant="p" className="font-semibold text-blue-600">
                  {selectedProduct?.totalQuantity} units
                </Typography>
              </div>
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Total Orders
                </Typography>
                <Typography variant="p" className="font-semibold">
                  {selectedProduct?.totalOrders}
                </Typography>
              </div>
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Total Revenue
                </Typography>
                <Typography variant="p" className="font-semibold text-green-600">
                  ₹{selectedProduct?.totalRevenue?.toFixed(2)}
                </Typography>
              </div>
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Discounted Revenue
                </Typography>
                <Typography variant="p" className="font-semibold text-emerald-600">
                  ₹{selectedProduct?.totalDiscountedRevenue?.toFixed(2)}
                </Typography>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Original Price
                </Typography>
                <Typography variant="p" className="font-semibold">
                  ₹{selectedProduct?.product?.price}
                </Typography>
              </div>
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Discounted Price
                </Typography>
                <Typography variant="p" className="font-semibold text-green-600">
                  ₹{selectedProduct?.product?.discounted_price}
                </Typography>
              </div>
            </div>

            {ordersLoading ? (
              <div className="text-center py-8">
                <Typography variant="p" className="text-muted-foreground">
                  Loading order details...
                </Typography>
              </div>
            ) : orderDetails?.orders && orderDetails.orders.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const filteredOrders = orderDetails.orders.filter(order => 
                    order.items.some(item => {
                      // Check if it's a direct product match
                      if (item.type === "product" && item.product._id === selectedProduct?.product?._id) {
                        return true;
                      }
                      // Check if it's part of a bundle
                      if (item.type === "bundle" && item.bundle?.products) {
                        return item.bundle.products.some(bundleProduct => 
                          bundleProduct.product === selectedProduct?.product?._id
                        );
                      }
                      return false;
                    })
                  );
                  return (
                    <Typography variant="h4" className="font-semibold">
                      Order History ({filteredOrders.length} orders)
                    </Typography>
                  );
                })()}
                

                {orderDetails.orders
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((order) => {
                    // Find the specific product item in this order (direct product or within bundle)
                    let productItem = order.items.find(
                      item => item.type === "product" && item.product._id === selectedProduct.product._id
                    );
                    
                    // If not found as direct product, check if it's part of a bundle
                    let bundleItem = null;
                    let bundleProductInfo = null;
                    
                    if (!productItem) {
                      bundleItem = order.items.find(item => 
                        item.type === "bundle" && item.bundle?.products?.some(bundleProduct => 
                          bundleProduct.product === selectedProduct.product._id
                        )
                      );
                      
                      if (bundleItem) {
                        bundleProductInfo = bundleItem.bundle.products.find(bundleProduct => 
                          bundleProduct.product === selectedProduct.product._id
                        );
                      }
                    }
                    
                    // Skip if product is not found in either direct items or bundles
                    if (!productItem && !bundleItem) return null;
                    
                    return (
                      <div key={order._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <Typography variant="p" className="font-medium">
                              Order: {order._id.slice(-8)}
                            </Typography>
                            <Typography variant="small" className="text-muted-foreground">
                              {format(new Date(order.createdAt), "dd/MM/yyyy hh:mm a")}
                            </Typography>
                          </div>
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "success"
                                : order.status === "cancelled"
                                ? "destructive"
                                : order.status === "pending"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Typography variant="small" className="text-muted-foreground">
                              Customer Details
                            </Typography>
                            <Typography variant="p" className="font-medium">
                              {order.address.name}
                            </Typography>
                            <Typography variant="small" className="text-muted-foreground">
                              {order.address.mobile}
                            </Typography>
                            <Typography variant="small" className="text-muted-foreground">
                              {order.address.city}, {order.address.state} - {order.address.pincode}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="small" className="text-muted-foreground">
                              Product Details
                            </Typography>
                            {productItem ? (
                              <>
                                <Typography variant="p">
                                  Quantity: {productItem.quantity} units
                                </Typography>
                                <Typography variant="p" className="text-green-600">
                                  Amount: ₹{productItem.total_amount}
                                </Typography>
                                <Typography variant="small" className="text-muted-foreground">
                                  Type: Direct Product
                                </Typography>
                              </>
                            ) : bundleItem && bundleProductInfo ? (
                              <>
                                <Typography variant="p">
                                  Quantity: {bundleProductInfo.quantity * bundleItem.quantity} units
                                </Typography>
                                <Typography variant="p" className="text-blue-600">
                                  Part of Bundle: {bundleItem.bundle.name}
                                </Typography>
                                <Typography variant="p" className="text-green-600">
                                  Bundle Amount: ₹{bundleItem.total_amount}
                                </Typography>
                                <Typography variant="small" className="text-muted-foreground">
                                  Type: Bundle Product ({bundleProductInfo.quantity} per bundle × {bundleItem.quantity} bundles)
                                </Typography>
                              </>
                            ) : null}
                            <Typography variant="small" className="text-muted-foreground">
                              Total Order: ₹{order.totalAmount}
                            </Typography>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setOpenOrdersDialog(false);
                              navigate(`/dashboard/orders/${order._id}`);
                            }}
                          >
                            View Full Order
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Typography variant="p">
                  No order details available for this product.
                </Typography>
              </div>
            )}
          </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SKUTable;
