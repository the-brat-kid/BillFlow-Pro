"use client";
import { useState, useEffect } from "react";
import { useBusinessProfile, useUpdateBusinessProfile } from "@/hooks/use-business-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const { data: profile, isLoading } = useBusinessProfile();
  const { mutateAsync: updateProfile } = useUpdateBusinessProfile();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ business_name: "", address: "", gst_number: "", upi_id: "" });

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || "",
        address: profile.address || "",
        gst_number: profile.gst_number || "",
        upi_id: profile.upi_id || ""
      });
    }
  }, [profile]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      toast({ title: "Profile Updated", description: "Your business profile has been updated successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Update your business information and payment details.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Business Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input value={formData.gst_number} onChange={(e) => setFormData({...formData, gst_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>UPI ID (for payments)</Label>
              <Input value={formData.upi_id} onChange={(e) => setFormData({...formData, upi_id: e.target.value})} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}