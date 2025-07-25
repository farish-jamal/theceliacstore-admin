import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Plus, Minus, Search, Save, Trash2, Mail, CreditCard, Edit } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Typography from "@/components/typography";

import { fetchOrderById } from "../helpers/fetchOrderById";
import { updateOrderItems } from "../helpers/updateOrderItems";
import { updateOrderStatus } from "../helpers/updateOrderStatus";
import { sendOrderDetails } from "../helpers/sendOrderDetails";
import { sendPaymentLink } from "../helpers/sendPaymentLink";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Fetch order details
  const {
    data: orderResponse,
    isLoading: orderLoading,
    error: orderError,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrderById({ id: orderId }),
    enabled: !!orderId,
  });

  // Update order mutation
  const { mutate: updateOrder, isLoading: isUpdating } = useMutation({
    mutationFn: updateOrderItems,
    onSuccess: () => {
      toast.success("Order updated successfully!");
      setHasChanges(false);
      queryClient.invalidateQueries(["order", orderId]);
      queryClient.invalidateQueries(["orders"]);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Failed to update order");
    },
  });

  // Update status mutation
  const { mutate: updateStatus, isLoading: isUpdatingStatus } = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      toast.success("Order status updated successfully!");
      setStatusChanged(false);
      queryClient.invalidateQueries(["order", orderId]);
      queryClient.invalidateQueries(["orders"]);
    },
    onError: (error) => {
      console.error("Status update error:", error);
      toast.error("Failed to update order status");
    },
  });

  // Send order details mutation
  const { mutate: sendDetails, isLoading: isSendingDetails } = useMutation({
    mutationFn: sendOrderDetails,
    onSuccess: () => {
      toast.success("Order details sent to customer successfully!");
    },
    onError: (error) => {
      console.error("Send details error:", error);
      toast.error("Failed to send order details");
    },
  });

  // Send payment link mutation
  const { mutate: sendPayment, isLoading: isSendingPayment } = useMutation({
    mutationFn: sendPaymentLink,
    onSuccess: () => {
      toast.success("Payment link sent to customer successfully!");
    },
    onError: (error) => {
      console.error("Send payment error:", error);
      toast.error("Failed to send payment link");
    },
  });

  const order = orderResponse?.response?.data || orderResponse?.data;

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
  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setOrderItems(prev => 
      prev.map(item => 
        item._id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
    setHasChanges(true);
  };

  // Remove item from order
  const removeItem = (itemId) => {
    setOrderItems(prev => prev.filter(item => item._id !== itemId));
    setHasChanges(true);
  };

  // Handle status change
  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    setStatusChanged(newStatus !== order.status);
  };

  // Save order changes
  const handleSaveChanges = () => {
    const updateData = {
      orderId,
      items: orderItems.map(item => ({
        _id: item._id,
        quantity: item.quantity,
      }))
    };
    
    updateOrder(updateData);
  };

  // Save status changes
  const handleSaveStatus = () => {
    updateStatus({
      orderId,
      status: selectedStatus,
    });
  };

  // Update entire order (status + items)
  const handleUpdateOrder = async () => {
    try {
      // Update status if changed
      if (statusChanged) {
        await updateStatus({
          orderId,
          status: selectedStatus,
        });
      }
      
      // Update items if changed
      if (hasChanges) {
        const updateData = {
          orderId,
          items: orderItems.map(item => ({
            _id: item._id,
            quantity: item.quantity,
          }))
        };
        await updateOrder(updateData);
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
      const isBundle = item.bundle;
      const itemData = isBundle ? item.bundle : item.product;
      const price = isBundle 
        ? parseFloat(itemData?.discounted_price?.$numberDecimal || itemData?.discounted_price || 0)
        : parseFloat(itemData?.discounted_price || 0);
      return total + (price * (item.quantity || 0));
    }, 0);
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Typography variant="p">Loading order details...</Typography>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="flex items-center justify-center h-64">
        <Typography variant="p" className="text-red-500">Failed to load order details</Typography>
      </div>
    );
  }



  return (
    <div className="space-y-6 p-6">
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
                 onClick={handleSendOrderDetails}
                 disabled={isSendingDetails}
                 variant="outline"
                 size="sm"
               >
                 <Mail className="h-4 w-4 mr-2" />
                 {isSendingDetails ? "Sending..." : "Send Details"}
               </Button>

               <Button
                 onClick={handleSendPaymentLink}
                 disabled={isSendingPayment}
                 variant="outline"
                 size="sm"
               >
                 <CreditCard className="h-4 w-4 mr-2" />
                 {isSendingPayment ? "Sending..." : "Payment Link"}
               </Button>
             </div>
         </div>
       </div>

      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <Typography variant="small" className="text-muted-foreground">Order Date</Typography>
            <Typography variant="p" className="font-medium">
              {format(new Date(order.createdAt), "dd/MM/yyyy hh:mm a")}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
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
              {order.status?.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Typography variant="small" className="text-muted-foreground">Original Total</Typography>
            <Typography variant="p" className="font-medium">
              ₹{(order.totalAmount || order.discountedPriceAfterCoupon || 0).toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Typography variant="small" className="text-muted-foreground">Current Total</Typography>
            <Typography variant="p" className={`font-medium text-lg ${hasChanges ? 'text-orange-600' : ''}`}>
              ₹{calculateTotal().toFixed(2)}
            </Typography>
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
                orderItems.map((item) => {
              const isBundle = item.bundle;
              const itemData = isBundle ? item.bundle : item.product;
              const itemName = itemData?.name || 'Unknown Item';
              const itemImage = itemData?.banner_image || itemData?.images?.[0];
              const itemPrice = isBundle 
                ? parseFloat(itemData?.discounted_price?.$numberDecimal || itemData?.discounted_price || 0)
                : parseFloat(itemData?.discounted_price || 0);
              const itemType = isBundle ? 'Bundle' : 'Product';
              
              return (
                <div key={item._id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {itemImage && (
                    <img
                      src={itemImage}
                      alt={itemName}
                      className="h-16 w-16 rounded-md object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <div className="flex-1">
                    <Typography variant="p" className="font-medium">{itemName}</Typography>
                    <Typography variant="small" className="text-muted-foreground">
                      {itemType} • ₹{itemPrice.toFixed(2)} each
                    </Typography>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateItemQuantity(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item._id, parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                      min="1"
                    />
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateItemQuantity(item._id, item.quantity + 1)}
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
                    onClick={() => removeItem(item._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                                                  </div>
               );
             })
             )}
           </div>
                                       </CardContent>
               </Card>

       {/* Update Order Button - Below Table */}
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