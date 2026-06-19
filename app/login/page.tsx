import { LoginForm } from "@/components/login-form";
import { Globe } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fortmont Web Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const params = await searchParams;

  return (
    <div className="relative min-h-svh">
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1779464433263-35e2c02d1cc8?q=80&w=1528&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 backdrop-blur" />

      {/* Content */}
      <div className="relative z-10 flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <a href="#" className="flex items-center gap-2 font-medium text-white">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Globe className="size-4" />
              </div>
              Fortmont Web
            </a>
          </div>
         <div className="rounded-xl border bg-background/80 backdrop-blur-md p-6 shadow-xl">
          <LoginForm callbackUrl={params?.callbackUrl ?? "/dashboard"} />
          </div>
        </div>
      </div>
    </div>
  );
}