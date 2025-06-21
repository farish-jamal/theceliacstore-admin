import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
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

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const OrdersTable = ({ setOrdersLength, params, setParams }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: apiOrdersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders", params],
    queryFn: () => fetchOrders({ params }),
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
      label: "Products",
      render: (items) => (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item._id} className="flex items-center gap-3">
              <img
                src={item.product.banner_image}
                alt={item.product.name}
                className="h-12 w-12 rounded-md object-cover"
              />
              <div>
                <Typography variant="p" className="font-medium">
                  {item.product.name}
                </Typography>
                <Typography variant="small" className="text-muted-foreground">
                  Qty: {item.quantity} · ₹{item.product.discounted_price}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      ),
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
      render: (_,row) => (
        <Typography variant="p" className="font-medium">
          ₹{row?.discountedPriceAfterCoupon.toFixed(2)}
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
              action: () => navigate(`/dashboard/orders/details/${order._id}`),
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

  const perPage = params.per_page;
  const currentPage = params.page;
  const totalPages = Math.ceil(orderTotal / perPage);

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
        onPageChange={onPageChange}
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
