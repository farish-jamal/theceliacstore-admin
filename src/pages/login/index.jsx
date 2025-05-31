import { LoginForm } from "@/components/login-form";
import celiacLogo from "@/assets/celiac_logo.png";

const Login = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start"></div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:flex items-center justify-center">
        <img
          src={celiacLogo}
          alt="Celiac Logo"
          className="max-w-[80%] max-h-[80%] object-contain dark:brightness-[0.8] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default Login;
