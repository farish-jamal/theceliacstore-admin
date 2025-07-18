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
import Typography from "@/components/typography";
import NavbarItem from "@/components/navbar/navbar_item";

import { getItem } from "@/utils/local_storage";
import { updateProduct } from "../helpers/updateProduct";
import { createProduct } from "../helpers/createProduct";
import { fetchSubCategory } from "@/pages/sub_categories/helpers/fetchsub-cat";

// ✅ Tag options
const TAG_OPTIONS = [
  { value: "no_palm_oil", label: "No Palm Oil" },
  { value: "organic", label: "Organic" },
  { value: "no_gmo", label: "No GMO" },
  { value: "no_aritificial_flavors", label: "No Artificial Flavours" },
  { value: "vegan", label: "Vegan" },
  { value: "sugar_free", label: "Sugar Free" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "soya_free", label: "Soya Free" },
  { value: "no_preservatives", label: "No Preservatives" },
  { value: "lactose_free", label: "Lactose Free" },
  { value: "no_flavour_enhancer", label: "No Flavour Enhancer" },
];

const AddProductCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    saleprice: "",
    images: [],
    imagePreviews: [],
    bannerImage: null,
    bannerPreview: null,
    tags: [],
    sub_category: "",
    variants: [
      {
        sku: "",
        name: "",
        price: "",
        discounted_price: "",
        inventory: "",
        image: null,
        imagePreview: null,
      },
    ],
  });
  
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: "",
          name: "",
          price: "",
          discounted_price: "",
          inventory: "",
          image: null,
          imagePreview: null,
        },
      ],
    }));
  };
  
  const removeVariant = (index) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
  };
  
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      variants: updatedVariants,
    }));
  };
  
  const handleVariantImageChange = (index, file) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index].image = file;
    updatedVariants[index].imagePreview = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      variants: updatedVariants,
    }));
  };
  const {
    data: apiSubcategoriesResponse,
    isLoading: isSubcategoriesLoading,
    error: subcategoriesError,
  } = useQuery({
    queryKey: ["subcategory"],
    queryFn: fetchSubCategory,
  });

  
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.small_description || "",
        price: initialData.price || "",
        saleprice: initialData.discounted_price || "",
        images: [],
        imagePreviews: Array.isArray(initialData.images)
          ? initialData.images.map((imgUrl) => ({
              file: null,
              preview: imgUrl,
              isFromServer: true,
            }))
          : [],
        bannerImage: null,
        bannerPreview: initialData.banner_image || null,
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        sub_category: initialData.sub_category || "",
        variants: Array.isArray(initialData.variants) && initialData.variants.length > 0
          ? initialData.variants.map(v => ({
              sku: v.sku || "",
              name: v.name || "",
              price: v.price || "",
              discounted_price: v.discounted_price || "",
              inventory: v.inventory || "",
              image: null,
              imagePreview: null,
            }))
          : [
              {
                sku: "",
                name: "",
                price: "",
                discounted_price: "",
                inventory: "",
                image: null,
                imagePreview: null,
              },
            ],
      });
    }
  }, [initialData, isEditMode]);
  

  const createMutation = useMutation({
    mutationFn: ({ formData, params }) => createProduct(formData, params),
    onSuccess: (res) => {
      if (res?.response?.success) {
        toast.success("Product created successfully");
        navigate("/dashboard/products");
      } else {
        toast.error(res?.response?.data?.message || "Failed to create product");
      }
    },
    onError: () => {
      toast.error("Failed to create product");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => updateProduct({ id, payload }),
    onSuccess: (res) => {
      if (res?.response?.success) {
        toast.success("Product updated successfully");
        navigate("/dashboard/products");
      } else {
        toast.error(res?.response?.data?.message || "Failed to update product");
      }
    },
    onError: () => {
      toast.error("Failed to update product");
    },
  });
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        bannerImage: file,
        bannerPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleTagChange = (selectedOptions) => {
    const tags = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    setFormData((prev) => ({ ...prev, tags }));
  };

  // Submit handler
  const handleSubmit = () => {
    const userId = getItem("userId");
  
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }
  
    const form = new FormData();
    form.append("name", formData.name);
    form.append("small_description", formData.description);
    form.append("price", formData.price);
    form.append("discounted_price", formData.saleprice);
    form.append("sub_category", formData.sub_category);
    form.append("user_id", userId);
    form.append("created_by_admin", userId);
  
    // Tags
    formData.tags.forEach((tag) => form.append("tags", tag));
  
    // Product images
    formData.images.forEach((image) => {
      if (image instanceof File) {
        form.append("images", image);
      }
    });
  
    // Banner image
    if (formData.bannerImage instanceof File) {
      form.append("banner_image", formData.bannerImage);
    }
  
    // ✅ Variants
    formData.variants.forEach((variant, i) => {
      form.append(`variants[${i}][sku]`, variant.sku);
      form.append(`variants[${i}][name]`, variant.name);
      form.append(`variants[${i}][price]`, variant.price);
      form.append(`variants[${i}][discounted_price]`, variant.discounted_price);
      form.append(`variants[${i}][inventory]`, variant.inventory);
    
      // Append images for this variant
      if (variant.images && variant.images.length > 0) {
        variant.images.forEach((imageFile) => {
          if (imageFile instanceof File) {
            form.append(`variants[${i}][images]`, imageFile);
          }
        });
      }
    });
    
  
    // Submit
    if (isEditMode) {
      editMutation.mutate({ id: initialData._id, payload: form });
    } else {
      createMutation.mutate({ formData: form, params: { user_id: userId } });
    }
  };
  
  
  

  return (
    <>
      

      <div className="p-10 max-w-6xl mx-auto w-full space-y-6 bg-white rounded-xl border">
        {/* Name */}
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Product Name"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Short Description</Label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Short description"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label>Price</Label>
          <Input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Original Price"
          />
        </div>

        {/* Discounted Price */}
        <div className="space-y-2">
          <Label>Discounted Price</Label>
          <Input
            type="number"
            name="saleprice"
            value={formData.saleprice}
            onChange={handleChange}
            placeholder="Discounted Price"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <Select
            options={TAG_OPTIONS}
            isMulti
            onChange={handleTagChange}
            className="react-select-container"
            classNamePrefix="react-select"
            placeholder="Select tags..."
            value={TAG_OPTIONS.filter((option) => formData.tags.includes(option.value))}
          />
        </div>

        {/* Subcategory */}
        <div className="space-y-2">
          <Label>Sub-Category</Label>
          <select
            name="sub_category"
            onChange={handleChange}
            value={formData.sub_category}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select Subcategory</option>
            {Array.isArray(apiSubcategoriesResponse?.data) &&
              apiSubcategoriesResponse.data.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
          </select>

          {isSubcategoriesLoading && (
            <p className="text-sm text-gray-500">Loading subcategories...</p>
          )}
          {subcategoriesError && (
            <p className="text-sm text-red-500">Failed to load subcategories</p>
          )}
        </div>

        {/* Product Images */}
       {/* Product Images */}
<div className="space-y-2">
  <Label>Product Images</Label>
  <Input
    type="file"
    accept="image/*"
    multiple
    onChange={handleImageChange}
  />
  {formData.imagePreviews.length > 0 && (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
      {formData.imagePreviews.map((img, index) => (
        <div key={index} className="relative group">
          <img
            src={img.preview}
            alt={`preview-${index}`}
            className="w-full h-32 object-contain border rounded"
          />
          <button
            type="button"
            onClick={() => removeImage(index)}
            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow text-red-500 hover:text-red-600"
            title="Remove image"
          >
            <XCircle size={18} />
          </button>
        </div>
      ))}
    </div>
  )}
</div>

{/* Banner Image */}
<div className="space-y-2">
  <Label>Banner Image</Label>
  <Input
    type="file"
    accept="image/*"
    onChange={handleBannerChange}
  />
  {formData.bannerPreview && (
    <div className="relative mt-2">
      <img
        src={formData.bannerPreview}
        alt="Banner Preview"
        className="w-full h-48 object-contain border rounded"
      />
      <button
        type="button"
        onClick={() =>
          setFormData((prev) => ({
            ...prev,
            bannerImage: null,
            bannerPreview: null,
          }))
        }
        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-red-500 hover:text-red-600"
        title="Remove banner image"
      >
        <XCircle size={20} />
      </button>
    </div>
  )}
</div>

{/* Variants */}
<div className="space-y-6">
  <Label>Variants</Label>
  {formData.variants.map((variant, index) => (
    <div
      key={index}
      className="p-6 border rounded relative  space-y-4"
    >
      <button
        type="button"
        onClick={() => removeVariant(index)}
        className="absolute top-4 right-4 text-red-500"
        title="Remove Variant"
      >
        <XCircle size={20} />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col">
          <Label htmlFor={`sku-${index}`} className="mb-1">SKU</Label>
          <Input
            id={`sku-${index}`}
            value={variant.sku}
            onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor={`name-${index}`} className="mb-1">Name</Label>
          <Input
            id={`name-${index}`}
            value={variant.name}
            onChange={(e) => handleVariantChange(index, "name", e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor={`price-${index}`} className="mb-1">Price</Label>
          <Input
            id={`price-${index}`}
            type="number"
            value={variant.price}
            onChange={(e) => handleVariantChange(index, "price", e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor={`discounted_price-${index}`} className="mb-1">Discounted Price</Label>
          <Input
            id={`discounted_price-${index}`}
            type="number"
            value={variant.discounted_price}
            onChange={(e) =>
              handleVariantChange(index, "discounted_price", e.target.value)
            }
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor={`inventory-${index}`} className="mb-1">Inventory</Label>
          <Input
            id={`inventory-${index}`}
            type="number"
            value={variant.inventory}
            onChange={(e) =>
              handleVariantChange(index, "inventory", e.target.value)
            }
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor={`image-${index}`} className="mb-1">Image</Label>
          <Input
            id={`image-${index}`}
            type="file"
            accept="image/*"
            onChange={(e) => handleVariantImageChange(index, e.target.files[0])}
          />
        </div>
      </div>

      {variant.imagePreview && (
        <div className="pt-4">
          <img
            src={variant.imagePreview}
            alt="Variant Preview"
            className="w-32 h-32 object-contain border rounded"
          />
        </div>
      )}
    </div>
  ))}
  <Button onClick={addVariant} type="button" className="mt-4">
    + Add Variant
  </Button>
</div>



        {/* Submit */}
        <div className="pt-4">
        <Button
  onClick={handleSubmit}
  className="w-full"
  disabled={createMutation.isPending || editMutation.isPending}
>
  {(createMutation.isPending || editMutation.isPending)
    ? (isEditMode ? "Updating..." : "Adding...")
    : (isEditMode ? "Update Product" : "Add Product")}
</Button>

        </div>
      </div>
    </>
  );
};

export default AddProductCard;
