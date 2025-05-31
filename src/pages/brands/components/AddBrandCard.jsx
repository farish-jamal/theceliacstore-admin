import { useState } from "react";
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
import { createBrand } from "../helpers/createBrand";


const AddBrandCard = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount_label_text: "",
    newly_launched: false,
    image: null, // new field
  });

  const mutation = useMutation({
    mutationFn: (data) => createBrand(data),
    onSuccess: () => {
      toast.success("Brand created successfully!");
      navigate("/dashboard/brands"); // Adjust route as needed
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create brand");
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

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Brand name is required");
      return;
    }
  
    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("discount_label_text", formData.discount_label_text);
    form.append("newly_launched", formData.newly_launched);
  
    if (formData.image) {
      form.append("image", formData.image);
    }
  
    console.log("📦 FormData Preview:");
    for (const [key, value] of form.entries()) {
      console.log(`${key}:`, value);
    }
  
    mutation.mutate(form);
  };
  

  return (
    <>
      <NavbarItem
        title="Add Brands"
        breadcrumbs={[{ title: "Add Brands", isNavigation: false }]}
      />
      <div className="p-10 max-w-6xl mx-auto w-full space-y-6 bg-white rounded-xl border border-gray-200">
        <Typography variant="h3" className="mb-4">
          Add Brand
        </Typography>

        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Brand Name"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brand Description"
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
            {mutation.isLoading ? "Submitting..." : "Submit Brand"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AddBrandCard;
