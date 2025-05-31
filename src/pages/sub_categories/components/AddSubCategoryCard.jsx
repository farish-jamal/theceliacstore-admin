import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Typography from "@/components/typography";
import NavbarItem from "@/components/navbar/navbar_item";
import { createSubCategory } from "../helpers/createSubCategory";
import { fetchSubCategory } from "../helpers/fetchsub-cat";
import { fetchCategory } from "../helpers/fetchCategory";

const AddSubCategoryCard = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "", 
  });

  const mutation = useMutation({
    mutationFn: (data) => createSubCategory(data),
    onSuccess: () => {
      toast.success("Sub-Category created successfully!");
      navigate("/dashboard/subcategory");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create Sub-Category");
    },
  });

  const {
    data: apiCategoriesResponse,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategory({ params: {} }),
  });

  useEffect(() => {
    if (apiCategoriesResponse) {
      // console.log("Categories Array:", JSON.stringify(apiCategoriesResponse.data.categories, null, 2));
    }
  }, [apiCategoriesResponse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
    };

    mutation.mutate(payload);
  };

  return (
    <>
      <NavbarItem
        title="Add Sub-Category"
        breadcrumbs={[{ title: "Add Sub-Category", isNavigation: false }]}
      />

      <div className="p-10 max-w-6xl mx-auto w-full space-y-6 bg-white rounded-xl border border-gray-200">
        <Typography variant="h3" className="mb-4">
          Add Sub-Category
        </Typography>

        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Sub-Category Name"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Category Description"
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <select
  name="category"
  onChange={handleChange}
  value={formData.category}
  className="w-60 border border-gray-300 rounded px-3 py-2"
>
  <option value="">-- Select Category --</option>
  {Array.isArray(apiCategoriesResponse?.data?.categories) &&
    apiCategoriesResponse.data.categories.map((cat) => (
      <option key={cat._id} value={cat._id}>
        {cat.name}
      </option>
    ))}
</select>
          {isCategoriesLoading && (
            <p className="text-sm text-gray-500">Loading categories...</p>
          )}
          {categoriesError && (
            <p className="text-sm text-red-500">Failed to load categories</p>
          )}
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? "Submitting..." : "Submit Category"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AddSubCategoryCard;
