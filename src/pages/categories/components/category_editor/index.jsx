import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import { fetchCategoryById } from "../../helpers/fetchCategorybyId";
import AddCategoryCard from "./AddCategoryCard";

const CategoryEditor = () => {
  const { id } = useParams(); 

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchCategoryById({ id }),
    enabled: !!id, 
  });

  const initialData = initialDataRes?.response?.data;

  const breadcrumbs = [
    { title: "Products", isNavigation: true, path: "/dashboard/category" },
    { title: id ? "Edit Product" : "Add Product", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Category" : "Add Category"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            {/* <CustomSpinner /> */}
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">Failed to load product data.</p>
        ) : id && !initialData ? (
          <p className="text-red-500 text-center">No product data found.</p>
        ) : (
          <AddCategoryCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default CategoryEditor;
