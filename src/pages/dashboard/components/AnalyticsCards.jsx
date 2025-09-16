import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart,
  IndianRupee
} from "lucide-react";
import { fetchDashboardOverview } from "../helpers/fetchDashboardOverview";

const AnalyticsCards = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const result = await fetchDashboardOverview();
        
        if (result.success) {
          setDashboardData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatGrowth = (growth, isPositive) => {
    const sign = isPositive ? '+' : '-';
    return `${sign}${Math.abs(growth)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="py-4 shadow-md border gap-2 bg-gradient-to-t from-[#57b45b]/10 to-transparent h-[200px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
        <Card className="py-4 shadow-md border gap-2 bg-red-50 h-[200px] col-span-full">
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-red-600">Error loading dashboard data: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analyticsData = dashboardData ? [
    {
      title: "Total Sales",
      value: formatCurrency(dashboardData.totalSales.value),
      change: formatGrowth(dashboardData.totalSales.growth, dashboardData.totalSales.isPositive),
      isPositive: dashboardData.totalSales.isPositive,
      icon: IndianRupee,
    },
    {
      title: "New Users",
      value: dashboardData.newUsers.value.toString(),
      change: formatGrowth(dashboardData.newUsers.growth, dashboardData.newUsers.isPositive),
      isPositive: dashboardData.newUsers.isPositive,
      icon: Users,
    },
    {
      title: "Orders",
      value: dashboardData.orders.value.toString(),
      change: formatGrowth(dashboardData.orders.growth, dashboardData.orders.isPositive),
      isPositive: dashboardData.orders.isPositive,
      icon: ShoppingCart,
    },
  ] : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
      {analyticsData.map((data, index) => (
        <CardStats key={index} {...data} />
      ))}
    </div>
  );
};

export default AnalyticsCards;

function CardStats({ title, value, change, isPositive, icon: Icon }) {

  return (
<Card className="py-4 shadow-md border gap-2 bg-gradient-to-t from-[#57b45b]/10 to-transparent h-[200px]">
<CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <Button variant="outline">
          <Icon className="w-5 h-5 text-gray-500" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{value}</div>
        <div
          className={`text-sm flex items-center ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-1" />
          )}
          {change} from last month
        </div>
      </CardContent>
    </Card>
  );
}
