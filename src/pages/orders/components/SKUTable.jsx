import React, { useState } from "react";
import { format } from "date-fns";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router";
import { generateSKUData } from "../data/dummyOrders";

const SKUTable = ({ orders }) => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedSKU, setSelectedSKU] = useState(null);
  const [openOrdersDialog, setOpenOrdersDialog] = useState(false);

  if (!orders || !Array.isArray(orders)) {
    return <div className="p-4 text-center text-red-500">Error: Invalid orders data</div>;
  }

  const skuData = generateSKUData(orders);

  if (!skuData || skuData.length === 0) {
    return <div className="p-4 text-center text-gray-500">No SKU data available</div>;
  }

  const toggleRowExpansion = (sku) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(sku)) {
      newExpanded.delete(sku);
    } else {
      newExpanded.add(sku);
    }
    setExpandedRows(newExpanded);
  };

  const viewAllOrders = (skuItem) => {
    setSelectedSKU(skuItem);
    setOpenOrdersDialog(true);
  };

  const columns = [
    {
      key: "expand",
      label: "",
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleRowExpansion(row.sku)}
          className="p-1 h-8 w-8 hover:bg-gray-100"
        >
          {expandedRows.has(row.sku) ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
        </Button>
      ),
    },
    {
      key: "sku",
      label: "SKU",
      render: (sku) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-mono font-medium text-blue-600">
            {sku}
          </Typography>
        </div>
      ),
    },
    {
      key: "productName", 
      label: "Product Name",
      render: (productName) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            {productName}
          </Typography>
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
      key: "orderCount",
      label: "Total Orders",
      render: (orderCount) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            {orderCount}
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
            total earned
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
          View Orders
        </Button>
      ),
    },
  ];

  // Create expanded data for rendering
  const expandedData = [];
  skuData.forEach((skuItem) => {
    expandedData.push(skuItem);
    
    if (expandedRows.has(skuItem.sku)) {
      // Add recent orders as sub-rows
      const recentOrders = skuItem.orders
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 3); // Show only 3 most recent orders
      
      recentOrders.forEach((order, index) => {
        expandedData.push({
          ...order,
          isSubRow: true,
          parentSku: skuItem.sku,
          subRowIndex: index,
        });
      });
    }
  });

  // Custom row renderer for sub-rows
  const renderRow = (item, index) => {
    if (item.isSubRow) {
      return (
        <tr key={`${item.parentSku}-${item.subRowIndex}`} className="bg-gray-50">
          <td className="px-4 py-2"></td>
          <td className="px-4 py-2 pl-8">
            <Typography variant="small" className="text-muted-foreground">
              Order: {item.orderId}
            </Typography>
          </td>
          <td className="px-4 py-2">
            <Typography variant="small">
              {item.customer.name}
            </Typography>
          </td>
          <td className="px-4 py-2">
            <Typography variant="small" className="font-medium">
              {item.quantity} units
            </Typography>
          </td>
          <td className="px-4 py-2">
            <Badge
              variant={
                item.orderStatus === "delivered"
                  ? "success"
                  : item.orderStatus === "cancelled"
                  ? "destructive"
                  : item.orderStatus === "pending"
                  ? "outline"
                  : "secondary"
              }
              className="text-xs"
            >
              {item.orderStatus.toUpperCase()}
            </Badge>
          </td>
          <td className="px-4 py-2">
            <Typography variant="small" className="text-green-600">
              ₹{(item.price * item.quantity).toFixed(2)}
            </Typography>
          </td>
          <td className="px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/dashboard/orders/${item.orderId}`)}
              className="text-xs"
            >
              View
            </Button>
          </td>
        </tr>
      );
    }
    return null;
  };

  return (
    <>
      <CustomTable
        columns={columns}
        data={skuData}
        isLoading={false}
        error={null}
        hidePagination={true}
      />

      {/* Orders Dialog */}
      <Dialog open={openOrdersDialog} onOpenChange={setOpenOrdersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Orders for {selectedSKU?.productName} ({selectedSKU?.sku})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Total Quantity
                </Typography>
                <Typography variant="p" className="font-semibold text-blue-600">
                  {selectedSKU?.totalQuantity} units
                </Typography>
              </div>
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Total Orders
                </Typography>
                <Typography variant="p" className="font-semibold">
                  {selectedSKU?.orderCount}
                </Typography>
              </div>
              <div>
                <Typography variant="small" className="text-muted-foreground">
                  Total Revenue
                </Typography>
                <Typography variant="p" className="font-semibold text-green-600">
                  ₹{selectedSKU?.totalRevenue?.toFixed(2)}
                </Typography>
              </div>
            </div>

            <div className="space-y-3">
              {selectedSKU?.orders
                ?.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                .map((order, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Typography variant="p" className="font-medium">
                        Order: {order.orderId}
                      </Typography>
                      <Typography variant="small" className="text-muted-foreground">
                        {format(new Date(order.orderDate), "dd/MM/yyyy hh:mm a")}
                      </Typography>
                    </div>
                    <Badge
                      variant={
                        order.orderStatus === "delivered"
                          ? "success"
                          : order.orderStatus === "cancelled"
                          ? "destructive"
                          : order.orderStatus === "pending"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {order.orderStatus.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Typography variant="small" className="text-muted-foreground">
                        Customer
                      </Typography>
                      <Typography variant="p">
                        {order.customer.name}
                      </Typography>
                      <Typography variant="small" className="text-muted-foreground">
                        {order.customer.email}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" className="text-muted-foreground">
                        Quantity & Amount
                      </Typography>
                      <Typography variant="p">
                        {order.quantity} units × ₹{order.price} = ₹{(order.quantity * order.price).toFixed(2)}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpenOrdersDialog(false);
                        navigate(`/dashboard/orders/${order.orderId}`);
                      }}
                    >
                      View Order Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SKUTable;
