"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, TrendingUp, AlertTriangle } from "lucide-react";

export default function AiPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <BrainCircuit className="h-8 w-8 text-primary" />
        AI Insights
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <CardTitle>Demand Forecast</CardTitle>
              <CardDescription>Predicted sales for next 30 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">Based on historical data and seasonal trends.</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b pb-2"><span>Product A</span> <span className="font-medium">+25% demand</span></li>
              <li className="flex justify-between border-b pb-2"><span>Product B</span> <span className="font-medium">+10% demand</span></li>
              <li className="flex justify-between"><span>Product C</span> <span className="font-medium text-red-500">-5% demand</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Actions to optimize business</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-2">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                <p>Follow up with <strong>Acme Corp</strong> for invoice #INV-004. They typically pay 5 days after the due date.</p>
              </li>
              <li className="flex gap-2">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                <p>Consider running a promotion on <strong>Product C</strong> to clear excess inventory before Q3.</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}