"use client";
import { useState, useMemo } from "react";
import { useCustomers, useCreateCustomer } from "@/hooks/use-customers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Search, Users, Building2 } from "lucide-react";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", gst_number: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer(formData);
      toast({ title: "Success", description: "Customer created successfully" });
      setIsOpen(false);
      setFormData({ name: "", email: "", phone: "", address: "", gst_number: "" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create customer", variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    const list = customers || [];
    const withGst = list.filter((c: any) => c.gst_number).length;
    return { total: list.length, withGst, retail: list.length - withGst };
  }, [customers]);

  const filtered = useMemo(() => {
    if (!customers) return [];
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c: any) =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.gst_number?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  function initials(name: string) {
    return (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div className="bg-stitch-background -m-6 p-6 min-h-screen font-stitch-body">
      <div className="flex flex-col gap-space-xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <span className="font-stitch-heading text-[32px] leading-[40px] font-bold text-stitch-on-background tracking-tight">Customers Directory</span>
            <p className="text-sm text-stitch-on-surface-variant">Manage retail shoppers, B2B buyers, and GST profiles.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-stitch-primary-container hover:bg-stitch-primary text-stitch-on-primary font-semibold text-sm shadow-md transition-all">
                <UserPlus className="w-[18px] h-[18px]" />
                <span>Add Customer</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Save Customer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-stitch-surface-container-low shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stitch-outline">Total Customers</span>
              <div className="w-8 h-8 rounded-lg bg-stitch-primary/15 flex items-center justify-center text-stitch-primary">
                <Users className="w-[18px] h-[18px]" />
              </div>
            </div>
            <span className="font-stitch-heading text-2xl font-bold text-stitch-on-background mt-2">{stats.total}</span>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-stitch-surface-container-low shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stitch-outline">B2B / GST Registered</span>
              <div className="w-8 h-8 rounded-lg bg-stitch-secondary/15 flex items-center justify-center text-stitch-secondary">
                <Building2 className="w-[18px] h-[18px]" />
              </div>
            </div>
            <span className="font-stitch-heading text-2xl font-bold text-stitch-on-background mt-2">{stats.withGst}</span>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-stitch-surface-container-low shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stitch-outline">Retail / Individual</span>
              <div className="w-8 h-8 rounded-lg bg-stitch-tertiary/15 flex items-center justify-center text-stitch-tertiary">
                <Users className="w-[18px] h-[18px]" />
              </div>
            </div>
            <span className="font-stitch-heading text-2xl font-bold text-stitch-on-background mt-2">{stats.retail}</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-stitch-surface-container-low shadow-sm">
          <div className="relative flex-1">
            <Search className="w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-stitch-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-stitch-surface-container-lowest text-stitch-on-background placeholder:text-stitch-outline text-sm focus:outline-none"
              placeholder="Search name, phone, email or GSTIN..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col rounded-xl overflow-hidden bg-stitch-surface-container-low shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stitch-surface-container-lowest/80 text-stitch-outline uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-space-sm px-space-md">Customer</th>
                  <th className="py-space-sm px-space-md">Contact</th>
                  <th className="py-space-sm px-space-md">GST Number</th>
                  <th className="py-space-sm px-space-md">Address</th>
                </tr>
              </thead>
              <tbody className="text-stitch-on-background text-sm divide-y divide-stitch-surface-container-highest/30">
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="py-space-lg text-center text-stitch-on-surface-variant">Loading...</td>
                  </tr>
                )}
                {!isLoading && filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-stitch-surface-container transition-colors">
                    <td className="py-space-sm px-space-md whitespace-nowrap">
                      <div className="flex items-center gap-space-xs">
                        <div className="w-8 h-8 rounded-full bg-stitch-primary-container/30 text-stitch-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {initials(c.name)}
                        </div>
                        <span className="font-semibold text-stitch-on-background">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-md whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-stitch-on-background">{c.email || "—"}</span>
                        <span className="text-xs text-stitch-on-surface-variant">{c.phone || "—"}</span>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-md whitespace-nowrap">
                      {c.gst_number ? (
                        <span className="font-mono text-xs text-stitch-on-background">{c.gst_number}</span>
                      ) : (
                        <span className="text-xs text-stitch-outline">Unregistered</span>
                      )}
                    </td>
                    <td className="py-space-sm px-space-md text-stitch-on-surface-variant text-sm max-w-[220px] truncate">
                      {c.address || "—"}
                    </td>
                  </tr>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-space-lg text-center text-stitch-on-surface-variant">No customers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}