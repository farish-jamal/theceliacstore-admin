import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Typography from "@/components/typography";
import NavbarItem from "@/components/navbar/navbar_item";
import { Checkbox } from "@/components/ui/checkbox";
import { createCategory } from "../helpers/createProduct";
import { XCircle } from "lucide-react";



const AddCategoryCard = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount_label_text: "",
    newly_launched: false,
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState([]);

  const mutation = useMutation({
    mutationFn: (data) => createCategory(data),
    onSuccess: () => {
      toast.success("Category created successfully!");
      navigate("/dashboard/categories");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));

    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleImageRemove = (index) => {
    const updatedImages = [...formData.images];
    const updatedPreviews = [...imagePreviews];

    URL.revokeObjectURL(updatedPreviews[index].url);

    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      images: updatedImages,
    }));
    setImagePreviews(updatedPreviews);
  };
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("discount_label_text", formData.discount_label_text);
    form.append("newly_launched", formData.newly_launched);


    formData.images.forEach((file) => {
      form.append("images", file);
    });

    mutation.mutate(form);
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [imagePreviews]);

  return (
    <>
      <NavbarItem
        title="Add Category"
        breadcrumbs={[{ title: "Add Category", isNavigation: false }]}
      />
      <div className="p-10 max-w-6xl mx-auto w-full space-y-6 bg-white rounded-xl border border-gray-200">
        <Typography variant="h3" className="mb-4">
          Add Category
        </Typography>

        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Category Name"
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
          <Label>Discount Label Text</Label>
          <Input
            type="text"
            name="discount_label_text"
            value={formData.discount_label_text}
            onChange={handleChange}
            placeholder="E.g., 'Up to 50% Off'"
          />
        </div>

        <div className="space-y-2">
          <Label>Category Images</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />

          {imagePreviews.length > 0 && (
            <div className="flex gap-4 flex-wrap mt-4">
              {imagePreviews.map((img, index) => (
                <div
                  key={index}
                  className="relative w-32 h-32 border rounded overflow-hidden"
                >
                  <img
                    src={img.url}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-1 right-1 bg-white text-red-600 rounded-full p-1 hover:bg-red-100 transition"
                    title="Remove image"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Label>Newly Launched</Label>
          <Checkbox
            id="newly_launched"
            checked={formData.newly_launched}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                newly_launched: !!checked,
              }))
            }
          />
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

export default AddCategoryCard;
