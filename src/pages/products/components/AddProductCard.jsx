import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Typography from "@/components/typography";
import NavbarItem from "@/components/navbar/navbar_item";
import { createProduct } from "./helpers/createProduct";
import { getItem } from "@/utils/local_storage";
import Select from "react-select";
import { fetchSubCategory } from "@/pages/sub_categories/helpers/fetchsub-cat";

// ✅ Tag options
const TAG_OPTIONS = [
  { value: "no_palm_oil", label: "No Palm Oil" },
  { value: "organic", label: "Organic" },
  { value: "no_gmo", label: "No GMO" },
  { value: "no_artificial_flavors", label: "No Artificial Flavours" },
  { value: "vegan", label: "Vegan" },
  { value: "sugar_free", label: "Sugar Free" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "soya_free", label: "Soya Free" },
  { value: "no_preservatives", label: "No Preservatives" },
  { value: "lactose_free", label: "Lactose Free" },
  { value: "no_flavour_enhancer", label: "No Flavour Enhancer" },
];

const AddProductCard = () => {
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
  });

  const {
    data: apiSubcategoriesResponse,
    isLoading: isSubcategoriesLoading,
    error: subcategoriesError,
  } = useQuery({
    queryKey: ["subcategory"],
    queryFn: fetchSubCategory,
  });

  const mutation = useMutation({
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
    const tags = selectedOptions.map((option) => option.value);
    setFormData((prev) => ({ ...prev, tags }));
  };

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
    formData.tags.forEach((tag) => {
      form.append("tags", tag);
    });
    formData.images.forEach((image) => {
      form.append("images", image);
    });
    if (formData.bannerImage) {
      form.append("banner_image", formData.bannerImage);
    }
    form.append("user_id", userId);
    form.append("created_by_admin", userId);

    mutation.mutate({ formData: form, params: { user_id: userId } });
  };

  return (
    <>
      <NavbarItem
        title="Add Product"
        breadcrumbs={[{ title: "Add Product", isNavigation: false }]}
      />
      <div className="p-10 max-w-6xl mx-auto w-full space-y-6 bg-white rounded-xl border">
        <Typography variant="h3">Add Product</Typography>

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
            <option value="">-- Select Subcategory --</option>
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
        <div className="space-y-2">
          <Label>Product Images</Label>
          <Input type="file" accept="image/*" multiple onChange={handleImageChange} />
          {formData.imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {formData.imagePreviews.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`img-${index}`}
                    className="w-full h-32 object-contain rounded border"
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

        {/* Banner Image */}
        <div className="space-y-2">
          <Label>Banner Image</Label>
          <Input type="file" accept="image/*" onChange={handleBannerChange} />
          {formData.bannerPreview && (
            <img
              src={formData.bannerPreview}
              alt="Banner Preview"
              className="mt-2 w-full h-48 object-contain border rounded"
            />
          )}
        </div>

        {/* Submit */}
        <div className="pt-4">
          <Button className="w-full" onClick={handleSubmit} disabled={mutation.isLoading}>
            {mutation.isLoading ? "Submitting..." : "Submit Product"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AddProductCard;
