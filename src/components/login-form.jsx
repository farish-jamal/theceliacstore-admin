import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { endpoints } from "@/api/endpoints";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/api/api_service/apiService";
import { setToken } from "@/utils/auth";  
import { setItem } from "@/utils/local_storage";

export function LoginForm() {
  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const loginMutation = useMutation({
    mutationFn: (data) =>
      apiService({
        endpoint: endpoints.login,
        method: "POST",
        data,
        removeToken: true,
      }),
      onSuccess: (data) => {
        console.log(":", data); 
        const userData = data?.response?.data;
      
        if (!userData?.token) {
          toast.error(userData?.message || "Login failed: No token received.");
          return;
        }
      
        console.log("User ID:", userData.id);
        console.log("Stored role:", userData.role); // ✅ Add this line here
      
        setToken(userData.token);
      
        setItem({
          userId: userData.id,
          userName: userData.name,
          userEmail: userData.email,
          userRole: userData.role,        });
      
        toast.success("Logged in successfully!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      },
      
      
    onError: (error) => {
      toast.error("Invalid email or password");
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </Button>
      </div>
    </form>
  );
}
