import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Select from "react-select";
import { XCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { getItem } from "@/utils/local_storage";
import { createBundle } from "../../helpers/createBundle";
import { fetchProducts } from "@/pages/products/components/helpers/fetchProducts";
import { updateBundle } from "../../helpers/updateBundle";


const AddBundleCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discounted_price: "",
    products: [],
    images: [],
    imagePreviews: [],
  });

  const {
    data: apiProductsResponse,
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts({ params: {} }), 
  });

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        discounted_price: initialData.discounted_price || "",
        products: Array.isArray(initialData.products)
          ? initialData.products.map((p) => p._id)
          : [],
        images: [],
        imagePreviews: Array.isArray(initialData.images)
          ? initialData.images.map((url) => ({
              file: null,
              preview: url,
              isFromServer: true,
            }))
          : [],
      });
    }
  }, [initialData, isEditMode]);

  const createMutation = useMutation({
    mutationFn: ({ formData, params }) => createBundle(formData, params),
    onSuccess: (res) => {
      toast.success("Bundle created successfully");
      navigate("/dashboard/bundles");
    },
    onError: () => toast.error("Failed to create bundle"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => updateBundle({ id, payload }),
    onSuccess: (res) => {
      toast.success("Product updated successfully");
      navigate("/dashboard/bundles");
    },
    onError: () => toast.error("Failed to update bundle"),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (selectedOptions) => {
    const products = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFormData((prev) => ({ ...prev, products }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
      imagePreviews: [...prev.imagePreviews, ...previews],
    }));
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    const userId = getItem("userId");
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    if (formData.imagePreviews.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("price", formData.price);
    form.append("discounted_price", formData.discounted_price);
    form.append("user_id", userId);
    form.append("created_by_admin", userId);

    formData.products.forEach((id) => form.append("products", id));
    formData.images.forEach((image) => {
      if (image instanceof File) form.append("images", image);
    });

    if (isEditMode) {
      editMutation.mutate({ id: initialData._id, payload: form });
    } else {
      createMutation.mutate({ formData: form, params: { user_id: userId } });
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto w-full space-y-6 bg-white rounded-xl border">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input name="name" value={formData.name} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Products</Label>
        <Select
          isMulti
          placeholder="Select products..."
          isLoading={isProductsLoading}
          options={
            apiProductsResponse?.data?.map((product) => ({
              value: product._id,
              label: product.name,
            })) || []
          }
          value={
            apiProductsResponse?.data
              ?.filter((p) => formData.products.includes(p._id))
              .map((p) => ({ value: p._id, label: p.name })) || []
          }
          onChange={handleProductChange}
        />
        {productsError && <p className="text-red-500">Failed to load products</p>}
      </div>

      <div className="space-y-2">
        <Label>Price</Label>
        <Input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Discounted Price</Label>
        <Input
          type="number"
          name="discounted_price"
          value={formData.discounted_price}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <Input type="file" multiple accept="image/*" onChange={handleImageChange} />
        {formData.imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {formData.imagePreviews.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img.preview}
                  alt=""
                  className="w-full h-32 object-contain border rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow text-red-500 hover:text-red-600"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={createMutation.isPending || editMutation.isPending}
        >
          {(createMutation.isPending || editMutation.isPending)
            ? (isEditMode ? "Updating..." : "Adding...")
            : (isEditMode ? "Update Bundle" : "Add Bundle")}
        </Button>
      </div>
    </div>
  );
};

export default AddBundleCard;
