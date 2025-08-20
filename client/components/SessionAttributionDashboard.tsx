import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ShoppingCart,
  Globe,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SessionAttribution {
  id: number;
  sessionId: string;
  orderId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  businessDomain: string;
  shopDomain: string;
  totalAmount: number;
  currency: string;
  customerEmail: string;
  customerId: string;
  timestamp: string;
}

interface AttributionStats {
  totalSessions: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  affiliateId: string;
}

interface SessionAttributionDashboardProps {
  business: BusinessStats;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function SessionAttributionDashboard({ business }: SessionAttributionDashboardProps) {
  const { toast } = useToast();
  const [attributions, setAttributions] = useState<SessionAttribution[]>([]);
  const [stats, setStats] = useState<AttributionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState("7d");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedMedium, setSelectedMedium] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");

  useEffect(() => {
    fetchAttributionData();
  }, [business.id, dateRange]);

  const fetchAttributionData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/business/session-attributions?business_id=${business.id}&date_range=${dateRange}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAttributions(data.attributions || []);
        setStats(data.stats || null);
      } else {
        throw new Error("Failed to fetch attribution data");
      }
    } catch (error) {
      console.error("Error fetching attribution data:", error);
      toast({
        title: "Error",
        description: "Failed to load session attribution data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAttributions = attributions.filter(attribution => {
    if (selectedSource !== "all" && attribution.utmSource !== selectedSource) return false;
    if (selectedMedium !== "all" && attribution.utmMedium !== selectedMedium) return false;
    if (selectedCampaign !== "all" && attribution.utmCampaign !== selectedCampaign) return false;
    return true;
  });

  const getUniqueValues = (field: keyof SessionAttribution) => {
    const values = new Set(attributions.map(a => a[field]).filter(Boolean));
    return Array.from(values);
  };

  const getSourceStats = () => {
    const sourceStats = attributions.reduce((acc, attribution) => {
      const source = attribution.utmSource || "Direct";
      if (!acc[source]) {
        acc[source] = { count: 0, revenue: 0 };
      }
      acc[source].count++;
      acc[source].revenue += attribution.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    return Object.entries(sourceStats).map(([source, data]) => ({
      name: source,
      orders: data.count,
      revenue: data.revenue,
    }));
  };

  const getMediumStats = () => {
    const mediumStats = attributions.reduce((acc, attribution) => {
      const medium = attribution.utmMedium || "Direct";
      if (!acc[medium]) {
        acc[medium] = { count: 0, revenue: 0 };
      }
      acc[medium].count++;
      acc[medium].revenue += attribution.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    return Object.entries(mediumStats).map(([medium, data]) => ({
      name: medium,
      orders: data.count,
      revenue: data.revenue,
    }));
  };

  const getRevenueOverTime = () => {
    const dailyRevenue = attributions.reduce((acc, attribution) => {
      const date = new Date(attribution.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += attribution.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportData = () => {
    const csvContent = [
      ['Session ID', 'Order ID', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Business Domain', 'Shop Domain', 'Amount', 'Customer Email', 'Date'],
      ...filteredAttributions.map(a => [
        a.sessionId,
        a.orderId,
        a.utmSource || '',
        a.utmMedium || '',
        a.utmCampaign || '',
        a.businessDomain || '',
        a.shopDomain || '',
        a.totalAmount.toString(),
        a.customerEmail || '',
        formatDate(a.timestamp),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-attributions-${business.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Session Attribution</h2>
          <p className="text-white/70">
            Track which URLs and campaigns led to successful purchases
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchAttributionData}
            disabled={isLoading}
            className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportData}
            disabled={filteredAttributions.length === 0}
            variant="outline"
            className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange" className="text-white">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source" className="text-white">UTM Source</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {getUniqueValues('utmSource').map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="medium" className="text-white">UTM Medium</Label>
              <Select value={selectedMedium} onValueChange={setSelectedMedium}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mediums</SelectItem>
                  {getUniqueValues('utmMedium').map(medium => (
                    <SelectItem key={medium} value={medium}>{medium}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="campaign" className="text-white">UTM Campaign</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {getUniqueValues('utmCampaign').map(campaign => (
                    <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Total Sessions</p>
                  <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white/10">
          <TabsTrigger value="sources" className="text-white">Sources</TabsTrigger>
          <TabsTrigger value="mediums" className="text-white">Mediums</TabsTrigger>
          <TabsTrigger value="revenue" className="text-white">Revenue</TabsTrigger>
          <TabsTrigger value="table" className="text-white">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Revenue by UTM Source</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSourceStats()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="name" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      color: '#ffffff'
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mediums" className="space-y-4">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Revenue by UTM Medium</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getMediumStats()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, revenue }) => `${name}: ${formatCurrency(revenue)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {getMediumStats().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      color: '#ffffff'
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getRevenueOverTime()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      color: '#ffffff'
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Session Attribution Details</CardTitle>
              <CardDescription className="text-white/70">
                {filteredAttributions.length} attribution records found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Session ID</TableHead>
                      <TableHead className="text-white">Order ID</TableHead>
                      <TableHead className="text-white">UTM Source</TableHead>
                      <TableHead className="text-white">UTM Medium</TableHead>
                      <TableHead className="text-white">UTM Campaign</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Customer</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttributions.map((attribution) => (
                      <TableRow key={attribution.id}>
                        <TableCell className="text-white font-mono text-sm">
                          {attribution.sessionId.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-white font-mono text-sm">
                          {attribution.orderId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-white border-white/20">
                            {attribution.utmSource || 'Direct'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-white border-white/20">
                            {attribution.utmMedium || 'Direct'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-white border-white/20">
                            {attribution.utmCampaign || 'Direct'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {formatCurrency(attribution.totalAmount)}
                        </TableCell>
                        <TableCell className="text-white">
                          {attribution.customerEmail ? (
                            <span className="text-sm">{attribution.customerEmail}</span>
                          ) : (
                            <span className="text-white/50 text-sm">Anonymous</span>
                          )}
                        </TableCell>
                        <TableCell className="text-white text-sm">
                          {formatDate(attribution.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
