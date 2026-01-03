import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { useEffect, useState, useMemo } from "react";
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
import { bulkUpdateOrderStatus } from "../helpers/bulkUpdateOrderStatus";

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const OrdersTable = ({
  setOrdersLength,
  params,
  setParams,
  showAllOnSinglePage = false,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const perPage = 10;
  const queryParams = {
    ...params,
    per_page: perPage,
  };

  const {
    data: apiOrdersResponse,
    isLoading: apiLoading,
    error: apiError,
  } = useQuery({
    queryKey: ["orders", queryParams],
    queryFn: () => fetchOrders({ params: queryParams }),
  });

  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [openBulkStatusDialog, setOpenBulkStatusDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");

  const { mutate: updateOrderStatusMutation, isLoading: isUpdating } =
    useMutation({
      mutationFn: ({ orderId, status }) => {
        return updateOrderStatus({ orderId, status });
      },
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

  const { mutate: bulkUpdateOrderStatusMutation, isLoading: isBulkUpdating } =
    useMutation({
      mutationFn: ({ orderIds, status }) => {
        return bulkUpdateOrderStatus({ orderIds, status });
      },
      onSuccess: (_, variables) => {
        toast.success(
          `Successfully updated ${variables.orderIds.length} order(s).`
        );
        queryClient.invalidateQueries(["orders"]);
        setOpenBulkStatusDialog(false);
        setSelectedRowIds([]);
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to update order statuses.");
      },
    });

  const orders = useMemo(() => {
    return Array.isArray(apiOrdersResponse?.response?.data?.data)
      ? apiOrdersResponse.response.data.data
      : [];
  }, [apiOrdersResponse]);

  const orderTotal = apiOrdersResponse?.response?.data?.total || 0;
  const isLoading = apiLoading;
  const error = apiError;

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
          <Typography
            variant="p"
            className="font-mono font-medium text-blue-600"
          >
            {row?._id}
          </Typography>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            {row.address?.name || row.customer?.name || "Unknown Customer"}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            {row.address?.mobile || row.customer?.email || "No contact info"}
          </Typography>
        </div>
      ),
    },
    {
      key: "shippingAddress",
      label: "Shipping Address",
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="text-wrap max-w-xs">
            {row.address?.address || "N/A"}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            {row.address?.city || "N/A"}, {row.address?.state || "N/A"} -{" "}
            {row.address?.pincode || "N/A"}
          </Typography>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (items) => {
        const itemList =
          items
            ?.map((item) => {
              const isBundle = item.type === "bundle";
              const isProduct = item.type === "product" || !item.type;

              let itemData;
              if (isBundle) {
                itemData = item.bundle;
              } else if (isProduct) {
                itemData = item.product;
              }

              const itemName = itemData?.name || "Unknown Item";
              const quantity = item.quantity || 0;

              return `${itemName} x${quantity}`;
            })
            .join(", ") || "No items";

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
      key: "finalTotalAmount",
      label: "Total Amount",
      render: (finalTotalAmount, row) => {
        const finalAmount = finalTotalAmount || row?.finalTotalAmount || 0;
        return (
          <div className="flex flex-col gap-1">
            <Typography variant="p" className="font-semibold text-green-600">
              ₹{finalAmount.toFixed(2)}
            </Typography>
          </div>
        );
      },
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

  const currentPage = (params.page || 1) - 1;
  const totalPages = Math.ceil(orderTotal / perPage);

  const handleBulkStatusUpdate = () => {
    if (selectedRowIds.length === 0) {
      toast.error("Please select at least one order.");
      return;
    }
    bulkUpdateOrderStatusMutation({
      orderIds: selectedRowIds,
      status: bulkStatus,
    });
  };

  return (
    <>
      <div className="mb-4">
        {selectedRowIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Typography variant="p" className="font-medium text-blue-900">
              {selectedRowIds.length} order(s) selected
            </Typography>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSelectedRowIds([])}>
                Clear Selection
              </Button>
              <Button
                onClick={() => setOpenBulkStatusDialog(true)}
                disabled={selectedRowIds.length === 0}
              >
                Update Status
              </Button>
            </div>
          </div>
        )}
      </div>

      <CustomTable
        columns={columns}
        data={orders || []}
        isLoading={isLoading}
        error={error}
        perPage={perPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hidePagination={false}
        emptyStateMessage="No orders found matching your criteria. Try adjusting your filters or search terms."
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRowIds}
      />

      {/* Single Order Status Update Dialog */}
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

      {/* Bulk Status Update Dialog */}
      <Dialog
        open={openBulkStatusDialog}
        onOpenChange={setOpenBulkStatusDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Order Status</DialogTitle>
          </DialogHeader>
          <Typography variant="p" className="font-medium">
            Update {selectedRowIds.length} order(s) to:
          </Typography>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
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
              variant="outline"
              onClick={() => setOpenBulkStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={isBulkUpdating || !bulkStatus}
            >
              {isBulkUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersTable;
