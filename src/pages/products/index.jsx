import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDebounce } from "@uidotdev/usehooks";
import CustomActionMenu from "@/components/custom_action";
import NavbarItem from "@/components/navbar/navbar_item";
import { DateRangePicker } from "@/components/date_filter";
import ProductsTable from "./components/ProductsTable";

const Products = () => {
  const navigate = useNavigate();

  const [productLength, setProductLength] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [params, setParams] = useState({
    page: 1,
    per_page: 25,
    search: "",
    start_date: undefined,
    end_date: undefined,
  });

  const debouncedSearch = useDebounce(searchText, 500);

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const onAdd = () => {
    navigate("/dashboard/product/add"); 
  };

  const onRowsPerPageChange = (newRowsPerPage) => {
    setParams((prev) => ({
      ...prev,
      per_page: newRowsPerPage,
    }));
  };

  const breadcrumbs = [{ title: "Products", isNavigation: true }];



  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      search: debouncedSearch,
    }));
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col">
      <NavbarItem
        title="Products"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-4">
        <CustomActionMenu
          title="products"
          total={productLength}
          onAdd={onAdd}
          searchText={searchText}
          handleSearch={handleSearch}
          onRowsPerPageChange={onRowsPerPageChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
        />
        <ProductsTable
       setProductLength={setProductLength}
       params={params}
       setParams={setParams}
        />
      </div>
    </div>
  );
};

export default Products;
