"use client";
import { useState } from "react";
import { useExpenses, useCreateExpense } from "@/hooks/use-expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const { mutateAsync: createExpense } = useCreateExpense();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ description: "", amount: 0, date: new Date().toISOString().split('T')[0], category: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExpense(formData);
      toast({ title: "Success", description: "Expense logged successfully" });
      setIsOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to log expense", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Description</Label><Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} /></div>
              <div className="space-y-2"><Label>Category</Label><Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              <Button type="submit" className="w-full">Save Expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
            ) : expenses?.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{formatDate(e.date)}</TableCell>
                <TableCell className="font-medium">{e.description}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell>{formatCurrency(e.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}