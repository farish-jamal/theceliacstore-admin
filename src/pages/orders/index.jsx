import NavbarItem from "@/components/navbar/navbar_item";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useDebounce } from "@uidotdev/usehooks";
import { DateRangePicker } from "@/components/date_filter";
import CustomActionMenu from "@/components/custom_action";
import OrdersTable from "./components/OrdersTable";
import SKUTable from "./components/SKUTable";
import ViewSwitcher from "@/components/view_switcher";
import StatusFilter from "@/components/status_filter";
import { fetchProductsWithOrders } from "./helpers/fetchProductsWithOrders";
import { useQuery } from "@tanstack/react-query";


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

  // Parse the API response - the data structure is { data: [...], message: "...", success: true }
  const productsWithOrders = Array.isArray(productsWithOrdersResponse?.response?.data)
    ? productsWithOrdersResponse.response.data
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
            <DateRangePicker onChange={handleDateRangeChange} />
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
          
          <StatusFilter
            value={statusFilter}
            onChange={handleStatusFilterChange}
            placeholder="Filter by Status"
          />
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
      </div>
    </div>
  );
};

export default Orders;
