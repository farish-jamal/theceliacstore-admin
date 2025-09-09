import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchOrders } from "../helpers/fetchOrders";
import { updateOrderStatus } from "../helpers/updateOrderStatus";
import { dummyOrders } from "../data/dummyOrders";

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const OrdersTable = ({ setOrdersLength, params, setParams, showAllOnSinglePage = false, useDummyData = true }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modify params for single page mode
  const queryParams = showAllOnSinglePage 
    ? { ...params, per_page: 1000, page: 1 } // Fetch up to 1000 orders on single page
    : params;

  const {
    data: apiOrdersResponse,
    isLoading: apiLoading,
    error: apiError,
  } = useQuery({
    queryKey: ["orders", queryParams],
    queryFn: () => fetchOrders({ params: queryParams }),
    enabled: !useDummyData, // Only fetch from API if not using dummy data
  });

  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [dummyOrdersState, setDummyOrdersState] = useState(dummyOrders);

  const { mutate: updateOrderStatusMutation, isLoading: isUpdating } =
    useMutation({
      mutationFn: ({ orderId, status }) => {
        if (useDummyData) {
          // Simulate API call with dummy data
          return new Promise((resolve) => {
            setTimeout(() => {
              setDummyOrdersState(prev => 
                prev.map(order => 
                  order._id === orderId ? { ...order, status } : order
                )
              );
              resolve({ success: true });
            }, 500);
          });
        }
        return updateOrderStatus({ orderId, status });
      },
      onSuccess: () => {
        toast.success("Order status updated successfully.");
        if (!useDummyData) {
          queryClient.invalidateQueries(["orders"]);
        }
        setOpenStatusDialog(false);
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to update order status.");
      },
    });

  // Use dummy data or API data based on useDummyData prop
  let orders, orderTotal, isLoading, error;
  
  if (useDummyData) {
    // Filter dummy orders based on params
    let filteredOrders = [...dummyOrdersState];
    
    // Filter by status
    if (params.status && params.status !== "all") {
      filteredOrders = filteredOrders.filter(order => order.status === params.status);
    }
    
    // Filter by search text
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order._id.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.email.toLowerCase().includes(searchLower) ||
        order.items.some(item => 
          item.product.name.toLowerCase().includes(searchLower) ||
          item.product.sku.toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Filter by date range
    if (params.start_date && params.end_date) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= params.start_date && orderDate <= params.end_date;
      });
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    orders = filteredOrders;
    orderTotal = filteredOrders.length;
    isLoading = false;
    error = null;
  } else {
    orders = Array.isArray(apiOrdersResponse?.response?.data?.data)
      ? apiOrdersResponse.response.data.data
      : [];
    orderTotal = apiOrdersResponse?.response?.data?.total || 0;
    isLoading = apiLoading;
    error = apiError;
  }

  useEffect(() => {
    setOrdersLength(orders?.length);
  }, [orders, setOrdersLength]);

  const onOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenStatusDialog(true);
  };

  const columns = [
    { 
      key: "sr_no", 
      label: "Order ID", 
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-mono font-medium text-blue-600">
            {row?._id}
          </Typography>
        </div>
      )
    },
    {
      key: "customer",
      label: "Customer",
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            {row.customer?.name || 'Unknown Customer'}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            {row.customer?.email}
          </Typography>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (items) => {
        const itemList = items?.map((item) => {
          // Check if it's a bundle or product
          const isBundle = item.bundle;
          const itemData = isBundle ? item.bundle : item.product;
          const itemName = itemData?.name || 'Unknown Item';
          const quantity = item.quantity || 0;
          
          return `${itemName} x${quantity}`;
        }).join(', ') || 'No items';
        
        return (
          <div className="flex flex-col gap-1">
            <Typography variant="p" className="text-wrap max-w-xs">
              {itemList}
            </Typography>
            <Typography variant="small" className="text-gray-500">
              {items?.length || 0} item(s)
            </Typography>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <div className="flex flex-col gap-1">
          <Badge
            variant={
              status === "delivered"
                ? "success"
                : status === "cancelled"
                ? "destructive"
                : status === "pending"
                ? "outline"
                : status === "processing" || status === "in_progress"
                ? "secondary"
                : "default"
            }
            className="w-fit"
          >
            {status.toUpperCase()}
          </Badge>
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      render: (totalAmount, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-semibold text-green-600">
            ₹{(totalAmount || row?.discountedPriceAfterCoupon || 0).toFixed(2)}
          </Typography>
          {row?.totalAmount !== row?.discountedPriceAfterCoupon && (
            <Typography variant="small" className="text-gray-500 line-through">
              ₹{(row?.totalAmount || 0).toFixed(2)}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Order Date",
      render: (date) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p">
            {format(new Date(date), "dd/MM/yyyy")}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            {format(new Date(date), "hh:mm a")}
          </Typography>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, order) => (
        <div className="flex items-center gap-2">
          <ActionMenu
            options={[
              {
                label: "View Details",
                icon: Eye,
                action: () => navigate(`/dashboard/orders/${order._id}`),
              },
              {
                label: "Update Status",
                icon: Pencil,
                action: () => onOpenStatusDialog(order),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page: page + 1,
    }));
  };

  const perPage = showAllOnSinglePage ? orderTotal : params.per_page;
  const currentPage = showAllOnSinglePage ? 1 : params.page;
  const totalPages = showAllOnSinglePage ? 1 : Math.ceil(orderTotal / params.per_page);

  return (
    <>
      <CustomTable
        columns={columns}
        data={orders || []}
        isLoading={isLoading}
        error={error}
        perPage={perPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={showAllOnSinglePage ? () => {} : onPageChange}
        hidePagination={showAllOnSinglePage}
        emptyStateMessage="No orders found matching your criteria. Try adjusting your filters or search terms."
      />
      <Dialog open={openStatusDialog} onOpenChange={setOpenStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <Typography variant="p" className="font-medium">
            Order ID: {selectedOrder?._id}
          </Typography>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() =>
                updateOrderStatusMutation({
                  orderId: selectedOrder?._id,
                  status: newStatus,
                })
              }
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersTable;
