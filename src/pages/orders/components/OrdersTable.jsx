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

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const OrdersTable = ({ setOrdersLength, params, setParams, showAllOnSinglePage = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modify params for single page mode
  const queryParams = showAllOnSinglePage 
    ? { ...params, per_page: 1000, page: 1 } // Fetch up to 1000 orders on single page
    : params;

  const {
    data: apiOrdersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders", queryParams],
    queryFn: () => fetchOrders({ params: queryParams }),
  });

  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const { mutate: updateOrderStatusMutation, isLoading: isUpdating } =
    useMutation({
      mutationFn: ({ orderId, status }) =>
        updateOrderStatus({ orderId, status }),
      onSuccess: () => {
        toast.success("Order status updated successfully.");
        queryClient.invalidateQueries(["orders"]);
        setOpenStatusDialog(false);
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to update order status.");
      },
    });

  const orders = Array.isArray(apiOrdersResponse?.response?.data?.data)
    ? apiOrdersResponse.response.data.data
    : [];
  const orderTotal = apiOrdersResponse?.response?.data?.total || 0;

  useEffect(() => {
    setOrdersLength(orders?.length);
  }, [orders, setOrdersLength]);

  const onOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenStatusDialog(true);
  };

  const columns = [
    { key: "sr_no", label: "Order Id", render: (_, row) => row?._id },
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
          <Typography variant="p" className="text-wrap max-w-xs">
            {itemList}
          </Typography>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
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
        >
          {status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (totalAmount, row) => (
        <Typography variant="p" className="font-medium">
          ₹{(totalAmount || row?.discountedPriceAfterCoupon || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      key: "createdAt",
      label: "Order Date",
      render: (date) => format(new Date(date), "dd/MM/yyyy hh:mm a"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, order) => (
        <ActionMenu
          options={[
            {
              label: "View Details",
              icon: Eye,
              action: () => navigate(`/dashboard/orders/${order._id}`),
            },
            {
              label: "Edit Status",
              icon: Pencil,
              action: () => onOpenStatusDialog(order),
            },
          ]}
        />
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
