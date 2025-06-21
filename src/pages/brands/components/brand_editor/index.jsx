import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AddBrandCard from "./AddBrandCard";
import { fetchBrandById } from "../../helpers/fetchBrandById";

const BrandEditor = () => {
  const { id } = useParams();

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["brand", id],
    queryFn: () => fetchBrandById({ id }),
    enabled: !!id,
  });

  console.log("Fetched Brand API Response:", initialDataRes);
  const initialData = initialDataRes?.response?.data;

  console.log("Extracted Initial Data:", initialData);

  const breadcrumbs = [
    { title: "Brands", isNavigation: true, path: "/dashboard/brands" },
    { title: id ? "Edit Brand" : "Add Brand", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Brand" : "Add Brand"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">Loading...</div>
        ) : error ? (
          <p className="text-red-500 text-center">Failed to load Brand data.</p>
        ) : id && !initialData ? (
          <p className="text-red-500 text-center">No brand data found.</p>
        ) : (
          <AddBrandCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default BrandEditor;
