import NavbarItem from "@/components/navbar/navbar_item";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminById } from "./helper/getAdminById";;
import { Skeleton } from "@/components/ui/skeleton";
import AddAdminCard from "../AddAdminCard";

const AdminEditor = () => {
  const { id } = useParams();

  const { data: initialDataRes, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getAdminById({ id }),
    enabled: !!id,
  });

  const breadcrumbs = [
    {
      title: "Admins",
      isNavigation: true,
      path: "/dashboard/admins",
    },
    { title: id ? "Edit Product" : "Add Admin", isNavigation: false },
  ];

  const initialData = initialDataRes?.response?.data;

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem title="Admins" breadcrumbs={breadcrumbs} />

      <div className="px-8 py-4">
        {isLoading ? (
          <div className="flex flex-1 justify-center items-center ">
            <Skeleton/>
          </div>
        ) : (
          <AddAdminCard initialData={initialData} isEdit={!!id} />
        )}
      </div>
    </div>
  );
};

export default AdminEditor;
