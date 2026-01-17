import NavbarItem from "@/components/navbar/navbar_item";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useDebounce } from "@uidotdev/usehooks";
// Removed DateRangePicker import
import CustomActionMenu from "@/components/custom_action";
import OrdersTable from "./components/OrdersTable";
import SKUTable from "./components/SKUTable";
import ViewSwitcher from "@/components/view_switcher";
import StatusFilter from "@/components/status_filter";
import { fetchProductsWithOrders } from "./helpers/fetchProductsWithOrders";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api_service/apiService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";


const Orders = () => {
  const { serviceId } = useParams();

  const paramInitialState = {
    page: 1,
    per_page: 50,
    search: "",
    service_id: serviceId,
    status: "all",
  };
  const [searchText, setSearchText] = useState("");
  const [params, setParams] = useState(paramInitialState);
  const [ordersLength, setOrdersLength] = useState(0);
  const [currentView, setCurrentView] = useState("orders");
  const [statusFilter, setStatusFilter] = useState("all");

  const debouncedSearch = useDebounce(searchText, 500);

  // Fetch products with orders for SKU analysis
  const {
    data: productsWithOrdersResponse,
    isLoading: productsWithOrdersLoading,
  } = useQuery({
    queryKey: ["products-with-orders", currentView, params],
    queryFn: () => fetchProductsWithOrders({ params }),
    enabled: currentView === "sku", // Only fetch when SKU view is active
  });

  // Parse the API response - apiService wraps response in { response: {...} }
  // Actual structure: { response: { data: { data: [...], total: N }, message: "...", success: true } }
  const productsWithOrders = Array.isArray(productsWithOrdersResponse?.response?.data?.data)
    ? productsWithOrdersResponse.response.data.data
    : [];

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      service_id: serviceId,
    }));
  }, [serviceId]);

  const onRowsPerPageChange = (newRowsPerPage) => {
    setParams((prev) => ({
      ...prev,
      per_page: newRowsPerPage,
      page: 1, // Reset to first page when changing per_page
    }));
  };

  const breadcrumbs = [{ title: "Orders", isNavigation: false }];

  const handleDateRangeChange = (range) => {
    if (!range || !range.from || !range.to) {
      setParams((prev) => {
        if (prev.start_date === undefined && prev.end_date === undefined) {
          return prev;
        }
        return { ...prev, start_date: undefined, end_date: undefined };
      });
      return;
    }

    setParams((prev) => {
      const isSame =
        prev.start_date?.toString() === range.from.toString() &&
        prev.end_date?.toString() === range.to.toString();

      if (isSame) return prev;

      return { ...prev, start_date: range.from, end_date: range.to };
    });
  };

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({ from: '', to: '' });
  const [exportResult, setExportResult] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportOrders = async () => {
    setExportLoading(true);
    setExportResult(null);
    try {
      const paramsObj = {};
      if (exportDateRange.from) paramsObj.start_date = exportDateRange.from;
      if (exportDateRange.to) paramsObj.end_date = exportDateRange.to;
      // Use apiService to get the download link, then fetch the file as blob and download
      const { response: data } = await apiService({
        endpoint: `api/order/export`,
        method: "GET",
        params: paramsObj,
      });
      const fileUrl = data?.cloudinary_url || data?.url;
      if (fileUrl) {
        const res = await fetch(fileUrl);
        const blob = await res.blob();
        const contentDisposition = res.headers.get('content-disposition');
        let filename = 'orders_export.csv';
        if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
          filename = contentDisposition.split('filename=')[1].replace(/"/g, '').trim();
        }
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportResult({ success: true });
      } else {
        setExportResult({ error: true });
      }
    } catch (err) {
      setExportResult({ error: true });
    }
    setExportLoading(false);
  };

  useEffect(() => {
    if (params.search !== debouncedSearch) {
      setParams((prev) => ({
        ...prev,
        search: debouncedSearch,
      }));
    }
  }, [debouncedSearch, params.search]);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setParams((prev) => ({
      ...prev,
      status: status,
      page: 1, // Reset to first page when changing filter
    }));
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Show loading skeleton when switching views and data is loading
  const isInitialLoading = currentView === "sku" && productsWithOrdersLoading && productsWithOrders.length === 0;

  return (
    <div className="flex flex-col">
      <NavbarItem
        title="Orders"
        breadcrumbs={breadcrumbs}
        customBox={
          <div className="flex items-center gap-3">
            <ViewSwitcher 
              currentView={currentView} 
              onViewChange={handleViewChange} 
            />
          </div>
        }
      />

      {/* <OrderStats params={params} /> */}

      <div className="px-4">
        <div className="mb-4 rounded-lg absolute top-10 right-5">
          <ViewSwitcher 
            currentView={currentView} 
            onViewChange={handleViewChange} 
          />
        </div>
        
        {isInitialLoading ? (
          // Loading skeleton for the entire content area
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
              <Skeleton className="h-10 w-36" />
            </div>
            
            {/* Table loading skeleton */}
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                {/* Header row */}
                <div className="grid grid-cols-6 gap-4 p-4 border-b">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-4 w-20" />
                  ))}
                </div>
                
                {/* Data rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 mb-4">
              <CustomActionMenu
                title={currentView === "orders" ? "Orders" : "SKU Analysis"}
                total={ordersLength}
                disableAdd={true}
                searchText={searchText}
                handleSearch={handleSearch}
                onRowsPerPageChange={onRowsPerPageChange}
                showRowSelection={false}
                disableBulkExport={true}
              />
              <div className="flex items-center gap-2">
                <Button onClick={() => setExportDialogOpen(true)} variant="outline">
                  Export Orders
                </Button>
                <StatusFilter
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  placeholder="Filter by Status"
                />
              </div>
              {/* Export Dialog */}
              <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent className="max-w-md w-full p-8 rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl mb-2">Export Orders</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold mb-2 text-base">Select date range to export</div>
                      <div className="flex flex-col sm:flex-row gap-4 bg-muted/50 rounded-lg p-4 border items-center">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="export-from" className="text-xs font-medium">From</label>
                          <input
                            id="export-from"
                            type="date"
                            className="border rounded px-2 py-1"
                            value={exportDateRange.from}
                            max={exportDateRange.to || ''}
                            onChange={e => setExportDateRange(r => ({ ...r, from: e.target.value }))}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="export-to" className="text-xs font-medium">To</label>
                          <input
                            id="export-to"
                            type="date"
                            className="border rounded px-2 py-1"
                            value={exportDateRange.to}
                            min={exportDateRange.from || ''}
                            onChange={e => setExportDateRange(r => ({ ...r, to: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleExportOrders}
                      disabled={exportLoading}
                      className="w-full text-base font-semibold"
                    >
                      {exportLoading ? "Exporting..." : "Export"}
                    </Button>
                    {exportResult && exportResult.success && (
                      <div className="mt-4 text-green-700 text-sm border rounded p-3 bg-green-50">
                        Export successful. File downloaded.
                      </div>
                    )}
                    {exportResult && exportResult.error && (
                      <div className="mt-4 text-red-600 text-sm border rounded p-3 bg-red-50">Failed to export orders.</div>
                    )}
                  </div>
                  <DialogFooter className="mt-6">
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {currentView === "orders" ? (
              <OrdersTable
                setOrdersLength={setOrdersLength}
                params={params}
                setParams={setParams}
                showAllOnSinglePage={true}
              />
            ) : (
              <SKUTable 
                productsWithOrders={productsWithOrders} 
                isLoading={productsWithOrdersLoading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
