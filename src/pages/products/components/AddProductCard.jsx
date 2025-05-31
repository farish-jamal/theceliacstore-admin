import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
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
  });

  const mutation = useMutation({
    mutationFn: ({ formData, params }) => createProduct(formData, params),
    onSuccess: (res) => {
      if (res?.response?.success) {
        toast.success("Product created successfully");
        console.log("✅ API Success:", res.response.data);
        navigate("/dashboard/products");
      } else {
        toast.error(res?.response?.data?.message || "Failed to create product");
        console.error(" API Error:", res);
      }
    },
    onError: (error) => {
      toast.error("Failed to create product");
      console.error("Network Error:", error);
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

  const handleSubmit = () => {
    const userId = getItem("userId");
    console.log("User ID from storage:", userId);
        if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }
  
    const form = new FormData();
    form.append("name", formData.name);
    form.append("small_description", formData.description);
    form.append("price", formData.price);
    form.append("discounted_price", formData.saleprice);
    formData.images.forEach((image) => {
      form.append("images", image);
    });
  
    if (formData.bannerImage) {
      form.append("banner_image", formData.bannerImage);
    }
    form.append("user_id", userId);
    form.append("created_by_admin", userId);
    console.log("FormData Preview:");
    for (const [key, value] of form.entries()) {
      console.log(`${key}:`, value);
    }
  
    mutation.mutate({ formData: form, params: { user_id: userId } });
  };
  

  return (
    <>
      <NavbarItem title="Add Product" breadcrumbs={[{ title: "Add Product", isNavigation: false }]} />
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

        {/* Submit Button */}
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
