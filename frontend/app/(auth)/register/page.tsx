"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { registerSchema } from "@/lib/validations";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "", password: "", name: "", businessName: "", businessType: "", address: "", gstNumber: "", upiId: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = registerSchema.parse(formData);
      setIsLoading(true);
      await register({
        full_name: data.name,
        email: data.email,
        password: data.password,
        business_name: data.businessName,
        business_type: data.businessType,
        address: data.address,
        gst_number: data.gstNumber,
        upi_id: data.upiId,
      });
      toast({ title: "Account created!", description: "Your account has been successfully created." });
    } catch (error: any) {
      toast({ title: "Error", description: error.errors?.[0]?.message || error.message || "Registration failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const fields: Array<{ id: keyof typeof formData; label: string; placeholder?: string; type?: string; optional?: boolean }> = [
    { id: "email", label: "Email", type: "email", placeholder: "you@example.com" },
    { id: "password", label: "Password", type: "password", placeholder: "••••••••" },
    { id: "name", label: "Full Name", placeholder: "Your full name" },
    { id: "businessName", label: "Business Name", placeholder: "Your shop / company name" },
    { id: "businessType", label: "Business Type", placeholder: "e.g. Retail, Service, Wholesale" },
    { id: "address", label: "Business Address", placeholder: "Shop address" },
    { id: "gstNumber", label: "GST Number", placeholder: "22AAAAA0000A1Z5", optional: true },
    { id: "upiId", label: "UPI ID", placeholder: "yourname@upi", optional: true },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground">Set up your business profile to get started</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 -mr-1">
          {fields.map((f) => (
            <div className="space-y-2" key={f.id}>
              <Label htmlFor={f.id}>
                {f.label}
                {f.optional && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>}
              </Label>
              <Input
                id={f.id}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                value={formData[f.id]}
                onChange={handleChange}
                required={!f.optional}
              />
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
