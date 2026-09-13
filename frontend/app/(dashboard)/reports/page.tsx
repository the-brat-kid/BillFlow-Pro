"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { useSalesReports, useGstReports, useReceivables } from "@/hooks/use-reports";

export default function ReportsPage() {
  const { data: salesData } = useSalesReports();
  const { data: gstData } = useGstReports();
  const { data: receivables } = useReceivables();

  const mockSales =
    Array.isArray(salesData) && salesData.length > 0
      ? salesData
      : [
          { name: "Jan", invoiced: 340000, collected: 310000 },
          { name: "Feb", invoiced: 420000, collected: 395000 },
          { name: "Mar", invoiced: 380000, collected: 360000 },
          { name: "Apr", invoiced: 450000, collected: 410000 },
          { name: "May", invoiced: 470000, collected: 440000 },
          { name: "Jun", invoiced: 542100, collected: 500000 },
        ];

  const defaultGst = {
    slabs: [
      { slab: "5% GST", taxable: 340000, cgst: 8500, sgst: 8500, igst: 0 },
      { slab: "12% GST", taxable: 510000, cgst: 15300, sgst: 15300, igst: 30600 },
      { slab: "18% GST", taxable: 2680000, cgst: 134000, sgst: 134000, igst: 214400 },
      { slab: "28% GST", taxable: 390000, cgst: 8100, sgst: 8100, igst: 75000 },
    ],
    totalTaxable: 3920000,
    totalCgst: 165900,
    totalSgst: 165900,
    totalIgst: 320000,
  };

  const mockGst =
    gstData && Array.isArray((gstData as any).slabs) ? (gstData as any) : defaultGst;

  const defaultReceivables = {
    totalOverdue: 345000,
    buckets: [
      { label: "Current (0–30d)", amount: 234600, pct: 68, color: "bg-emerald-500" },
      { label: "31–60 Days", amount: 62100, pct: 18, color: "bg-blue-500" },
      { label: "61–90 Days", amount: 34500, pct: 10, color: "bg-purple-400" },
      { label: "90+ Days (Critical)", amount: 13800, pct: 4, color: "bg-red-500" },
    ],
  };

  const mockReceivables =
    receivables &&
    Array.isArray((receivables as any).buckets) &&
    typeof (receivables as any).totalOverdue === "number"
      ? (receivables as any)
      : defaultReceivables;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">
          Sales performance, GST filing summary, and receivables health.
        </p>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="gst">GST Summary</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase text-muted-foreground font-semibold">
                  Gross Revenue Realized
                </p>
                <p className="text-2xl font-bold mt-1">
                  ₹
                  {mockSales
                    .reduce((s: number, m: any) => s + (m.invoiced || 0), 0)
                    .toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-emerald-600 mt-1">+22.4% vs last year</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase text-muted-foreground font-semibold">
                  Total GST Collected
                </p>
                <p className="text-2xl font-bold mt-1">
                  ₹{(mockGst.totalCgst + mockGst.totalSgst + mockGst.totalIgst).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Filing Deadline: 20th</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase text-muted-foreground font-semibold">
                  Outstanding Receivables
                </p>
                <p className="text-2xl font-bold mt-1">
                  ₹{mockReceivables.totalOverdue.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {mockReceivables.buckets.find((b: any) => b.label.includes("90+"))?.pct}% overdue 90+ days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase text-muted-foreground font-semibold">
                  Net Operating Margin
                </p>
                <p className="text-2xl font-bold mt-1">34.2%</p>
                <p className="text-xs text-emerald-600 mt-1">+3.1% pts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Revenue</CardTitle>
              <CardDescription>Invoiced amount vs cash realized, month by month.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
                  <Bar dataKey="invoiced" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Invoiced" />
                  <Line
                    type="monotone"
                    dataKey="collected"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Collected"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GST Summary</CardTitle>
              <CardDescription>
                Outward taxable supplies breakdown for the current filing period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-xs uppercase text-muted-foreground">
                      <th className="py-2 px-3">Tax Slab</th>
                      <th className="py-2 px-3 text-right">Taxable Value</th>
                      <th className="py-2 px-3 text-right">CGST</th>
                      <th className="py-2 px-3 text-right">SGST</th>
                      <th className="py-2 px-3 text-right">IGST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockGst.slabs.map((row: any) => (
                      <tr key={row.slab} className="border-t">
                        <td className="py-2 px-3">{row.slab}</td>
                        <td className="py-2 px-3 text-right">₹{row.taxable.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">
                          ₹{row.cgst.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground">
                          ₹{row.sgst.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">₹{row.igst.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-bold bg-muted/30">
                      <td className="py-2 px-3">Total Taxable</td>
                      <td className="py-2 px-3 text-right">₹{mockGst.totalTaxable.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right">₹{mockGst.totalCgst.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right">₹{mockGst.totalSgst.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right">₹{mockGst.totalIgst.toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aging Receivables</CardTitle>
              <CardDescription>Risk distribution of unpaid invoices based on due dates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total Overdue: ₹{mockReceivables.totalOverdue.toLocaleString("en-IN")}</span>
              </div>

              <div className="w-full h-3 rounded-full flex overflow-hidden bg-muted">
                {mockReceivables.buckets.map((b: any) => (
                  <div
                    key={b.label}
                    className={b.color}
                    style={{ width: `${b.pct}%` }}
                    title={`${b.label}: ${b.pct}%`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {mockReceivables.buckets.map((b: any) => (
                  <div key={b.label} className="rounded-lg border p-3">
                    <p className="text-xs uppercase text-muted-foreground font-semibold">{b.label}</p>
                    <p className="text-lg font-bold mt-1">
                      ₹{b.amount.toLocaleString("en-IN")}{" "}
                      <span className="text-xs font-normal text-muted-foreground">({b.pct}%)</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}