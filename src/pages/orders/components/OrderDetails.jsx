import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Plus, Minus, Save, Trash2, Mail, CreditCard, Edit } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Typography from "@/components/typography";

import { dummyOrders } from "../data/dummyOrders";

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

  // Find order from dummy data
  const order = dummyOrders.find(order => order._id === orderId);

  // Update status mutation (simulated)
  const { mutate: updateStatus, isLoading: isUpdatingStatus } = useMutation({
    mutationFn: ({ orderId, status }) => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast.success("Order status updated successfully.");
      setStatusChanged(false);
    },
    onError: () => {
      toast.error("Failed to update order status.");
    },
  });

  // Update order items mutation (simulated)
  const { mutate: updateOrder, isLoading: isUpdating } = useMutation({
    mutationFn: ({ orderId, items }) => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast.success("Order items updated successfully.");
      setHasChanges(false);
    },
    onError: () => {
      toast.error("Failed to update order items.");
    },
  });

  // Send order details mutation (simulated)
  const { mutate: sendDetails } = useMutation({
    mutationFn: ({ orderId }) => {
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
    mutationFn: ({ orderId }) => {
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
    setStatusChanged(newStatus !== order.status);
  };

  // Update entire order (status + items)
  const handleUpdateOrder = async () => {
    try {
      // Update status if changed
      if (statusChanged) {
        updateStatus({
          orderId,
          status: selectedStatus,
        });
      }
      
      // Update items if changed
      if (hasChanges) {
        const updateData = {
          orderId,
          items: orderItems.map((item, index) => ({
            index,
            quantity: item.quantity,
          }))
        };
        updateOrder(updateData);
      }
      
      // If no changes, show info message
      if (!statusChanged && !hasChanges) {
        toast.info("No changes to update");
      }
    } catch (error) {
      console.error("Update order error:", error);
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
      const price = item.price || 0;
      return total + (price * (item.quantity || 0));
    }, 0);
  };

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Typography variant="h3" className="text-red-500">Order Not Found</Typography>
        <Typography variant="p" className="text-muted-foreground">
          Order with ID "{orderId}" could not be found.
        </Typography>
        <Button onClick={() => navigate("/dashboard/orders")} variant="outline">
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
              <Typography variant="p" className="font-medium">{order.customer.name}</Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Email</Typography>
              <Typography variant="p">{order.customer.email}</Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Phone</Typography>
              <Typography variant="p">{order.customer.phone}</Typography>
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
                {format(new Date(order.createdAt), "dd/MM/yyyy hh:mm a")}
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
                {order.status.toUpperCase()}
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
              <Typography variant="p" className="font-medium">{order.shippingAddress.street}</Typography>
              <Typography variant="p">{order.shippingAddress.city}, {order.shippingAddress.state}</Typography>
              <Typography variant="p">{order.shippingAddress.pincode}</Typography>
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
                const itemPrice = item.price || 0;
                
                return (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Typography variant="p" className="font-medium">{itemName}</Typography>
                      <Typography variant="small" className="text-muted-foreground">
                        SKU: {item.product?.sku} • ₹{itemPrice.toFixed(2)} each
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
            {order.totalAmount !== order.discountedPriceAfterCoupon && (
              <div className="flex justify-between items-center mt-2">
                <Typography variant="small" className="text-muted-foreground">
                  Original Total: ₹{order.totalAmount?.toFixed(2)}
                </Typography>
                <Typography variant="small" className="text-green-600">
                  Final Total: ₹{order.discountedPriceAfterCoupon?.toFixed(2)}
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
          disabled={isUpdating || isUpdatingStatus}
          className={`${
            hasChanges || statusChanged 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } px-8 py-3 text-base font-semibold`}
          size="lg"
        >
          <Save className="h-5 w-5 mr-2" />
          {(isUpdating || isUpdatingStatus) ? "Updating..." : 
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