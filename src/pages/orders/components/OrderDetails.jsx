import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Plus, Minus, Save, Trash2, Mail, CreditCard, Edit } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Typography from "@/components/typography";

import { fetchOrderById } from "../helpers/fetchOrderById";
import { updateOrder } from "../helpers/updateOrder";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // State for order items editing
  const [orderItems, setOrderItems] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // State for status updates
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusChanged, setStatusChanged] = useState(false);

  const ORDER_STATUSES = [
    "pending",
    "processing", 
    "shipped",
    "delivered",
    "cancelled",
  ];

  // Fetch order from API
  const { data: orderResponse, isLoading: isLoadingOrder, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrderById({ id: orderId }),
    enabled: !!orderId,
  });

  const order = orderResponse?.response?.data;

  // Update order mutation using real API
  const { mutate: updateOrderMutation, isLoading: isUpdating } = useMutation({
    mutationFn: (updateData) => updateOrder(updateData),
    onSuccess: () => {
      toast.success("Order updated successfully.");
      setHasChanges(false);
      setStatusChanged(false);
      // Optionally refetch the order data to get the latest state
      // queryClient.invalidateQueries(["order", orderId]);
    },
    onError: (error) => {
      console.error("Update order error:", error);
      toast.error("Failed to update order. Please try again.");
    },
  });

  // Send order details mutation (simulated)
  const { mutate: sendDetails } = useMutation({
    mutationFn: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      toast.success("Order details sent to customer.");
    },
    onError: () => {
      toast.error("Failed to send order details.");
    },
  });

  // Send payment link mutation (simulated)
  const { mutate: sendPayment } = useMutation({
    mutationFn: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      toast.success("Payment link sent to customer.");
    },
    onError: () => {
      toast.error("Failed to send payment link.");
    },
  });

  // Initialize order items and status when order data loads
  useEffect(() => {
    if (order?.items) {
      setOrderItems([...order.items]);
    }
    if (order?.status) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  // Update quantity of an item
  const updateItemQuantity = (itemIndex, newQuantity) => {
    if (newQuantity < 1) return;
    
    setOrderItems(prev => 
      prev.map((item, index) => 
        index === itemIndex 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
    setHasChanges(true);
  };

  // Remove item from order
  const removeItem = (itemIndex) => {
    setOrderItems(prev => prev.filter((_, index) => index !== itemIndex));
    setHasChanges(true);
  };

  // Handle status change
  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    setStatusChanged(newStatus !== (order.status || ''));
  };

  // Update entire order (status + items)
  const handleUpdateOrder = async () => {
    try {
      // If no changes, show info message
      if (!statusChanged && !hasChanges) {
        toast.info("No changes to update");
        return;
      }

      // Prepare update data
      const updateData = {
        orderId,
        // Always include status as it's required by the API
        status: selectedStatus,
      };

      // Add products if items changed
      if (hasChanges) {
        // Convert orderItems to the API format
        updateData.products = orderItems
          .filter(item => item.product?._id) // Only include items with valid product IDs
          .map(item => ({
            productId: item.product._id,
            newQuantity: item.quantity,
          }));

        // If there are bundles in the order, handle them separately
        // Note: You may need to track bundles separately if your order structure includes them
        updateData.bundles = []; // Add bundle logic here if needed
      }


      updateOrderMutation(updateData);
    } catch (error) {
      console.error("Update order error:", error);
      toast.error("Failed to prepare order update.");
    }
  };

  // Send order details to customer
  const handleSendOrderDetails = () => {
    sendDetails({ orderId });
  };

  // Send payment link to customer
  const handleSendPaymentLink = () => {
    sendPayment({ orderId });
  };

  // Calculate totals
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      // Use discounted_total_amount if available, otherwise calculate from product price and quantity
      const itemTotal = item.discounted_total_amount || 
                       (item.product?.discounted_price || item.product?.price || 0) * (item.quantity || 0);
      return total + itemTotal;
    }, 0);
  };

  if (isLoadingOrder) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Items Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions Skeleton */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Typography variant="h3" className="text-red-500">Order Not Found</Typography>
        <Typography variant="p" className="text-muted-foreground">
          Order with ID "{orderId}" could not be found.
        </Typography>
        <Button onClick={() => navigate("/orders")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Typography variant="h3">Order Details</Typography>
            <Typography variant="small" className="text-muted-foreground">
              Order ID: {order._id}
            </Typography>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Status Update Section */}
          <div className="flex items-center gap-2">
            <Typography variant="small" className="text-muted-foreground">Status:</Typography>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusChanged && (
              <Typography variant="small" className="text-orange-600 font-medium">
                Status Changed
              </Typography>
            )}
          </div>

          {/* Communication Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendOrderDetails}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendPaymentLink}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Payment Link
            </Button>
          </div>
        </div>
      </div>

      {/* Order Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Typography variant="small" className="text-muted-foreground">Name</Typography>
              <Typography variant="p" className="font-medium">{order.address?.name || 'N/A'}</Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Email</Typography>
              <Typography variant="p">{order.user?.email || 'N/A'}</Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Phone</Typography>
              <Typography variant="p">{order.address?.mobile || 'N/A'}</Typography>
            </div>
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Typography variant="small" className="text-muted-foreground">Order Date</Typography>
              <Typography variant="p" className="font-medium">
                {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy hh:mm a") : 'N/A'}
              </Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Status</Typography>
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
                {order.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Items Count</Typography>
              <Typography variant="p" className="font-medium">{orderItems.length} items</Typography>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Typography variant="p" className="font-medium">{order.address?.address || 'N/A'}</Typography>
              <Typography variant="p">{order.address?.city || 'N/A'}, {order.address?.state || 'N/A'}</Typography>
              <Typography variant="p">{order.address?.pincode || 'N/A'}</Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Items ({orderItems.length})</CardTitle>
            {hasChanges && (
              <Typography variant="small" className="text-orange-600 font-medium">
                ● Items Modified
              </Typography>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems.length === 0 ? (
              <div className="text-center py-8">
                <Typography variant="p" className="text-muted-foreground">
                  No items in this order
                </Typography>
              </div>
            ) : (
              orderItems.map((item, index) => {
                const itemName = item.product?.name || 'Unknown Item';
                const itemPrice = item.product?.discounted_price || item.product?.price || 0;
                
                return (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Typography variant="p" className="font-medium">{itemName}</Typography>
                      <Typography variant="small" className="text-muted-foreground">
                        {item.product?.sku ? `SKU: ${item.product.sku} • ` : ''}₹{itemPrice.toFixed(2)} each
                      </Typography>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                        min="1"
                      />
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Typography variant="p" className="font-medium w-24 text-right">
                      ₹{(itemPrice * item.quantity).toFixed(2)}
                    </Typography>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Total */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Typography variant="h4">Total Amount:</Typography>
              <Typography variant="h4" className="text-green-600">
                ₹{calculateTotal().toFixed(2)}
              </Typography>
            </div>
            {(order.totalAmount || 0) !== (order.discountedTotalAmount || 0) && (
              <div className="flex justify-between items-center mt-2">
                <Typography variant="small" className="text-muted-foreground">
                  Original Total: ₹{(order.totalAmount || 0).toFixed(2)}
                </Typography>
                <Typography variant="small" className="text-green-600">
                  Final Total: ₹{(order.discountedTotalAmount || 0).toFixed(2)}
                </Typography>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Order Button */}
      <div className="flex justify-start">
        <Button
          onClick={handleUpdateOrder}
          disabled={isUpdating}
          className={`${
            hasChanges || statusChanged 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } px-8 py-3 text-base font-semibold`}
          size="lg"
        >
          <Save className="h-5 w-5 mr-2" />
          {isUpdating ? "Updating..." : 
           (hasChanges || statusChanged) ? "Update Order ●" : "Update Order"}
        </Button>
        
        {/* Change indicator next to button */}
        {(hasChanges || statusChanged) && (
          <div className="flex items-center ml-4">
            <Typography variant="small" className="text-orange-600 font-medium">
              {hasChanges && statusChanged ? "● Status & Items Changed" :
               hasChanges ? "● Items Modified" : "● Status Changed"}
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;