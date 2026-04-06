import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BookOpen, FileText, Globe } from "lucide-react";

interface AnalyticsData {
  papers_by_status: { status: string; count: number }[];
  publications_per_month: { month: string; count: number }[];
  journals_count: number;
  total_publications: number;
  total_papers: number;
}

export default function Analytics() {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${url}/publisher/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Platform-wide statistics and publication trends
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !data ? (
          <p className="text-muted-foreground">Failed to load analytics.</p>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Journals
                    </p>
                    <p className="text-2xl font-bold">{data.journals_count}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Papers
                    </p>
                    <p className="text-2xl font-bold">{data.total_papers}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Publications
                    </p>
                    <p className="text-2xl font-bold">
                      {data.total_publications}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Publications per Month */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Publications per Month (Last 12 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.publications_per_month.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">
                    No publication data yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={data.publications_per_month}
                      margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Publications"
                        radius={[4, 4, 0, 0]}
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Papers by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Papers by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {data.papers_by_status.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">
                    No paper data yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {data.papers_by_status.map((item) => (
                      <div
                        key={item.status}
                        className="flex items-center gap-2 glass-card px-4 py-2"
                      >
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="font-semibold text-foreground">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
