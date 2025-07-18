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
import { Mail, Eye, EyeOff } from "lucide-react";
export function LoginForm() {
  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

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
          userRole: userData.role,      
          });
      
        toast.success("Logged in successfully!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
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
  <div className="relative">
    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
    <Input
      id="email"
      type="email"
      placeholder="m@example.com"
      value={formData.email}
      onChange={handleChange}
      required
      className="pl-10" 
    />
  </div>
</div>

<div className="grid gap-3">
  <Label htmlFor="password">Password</Label>
  <div className="relative">
    <Input
      id="password"
      type={showPassword ? "text" : "password"}
      value={formData.password}
      onChange={handleChange}
      required
      className="pr-10" 
    />
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      tabIndex={-1}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
</div>
  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </Button>
      </div>
    </form>
  );
}
