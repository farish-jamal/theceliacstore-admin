import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchSalesOverview } from "../helpers/fetchSalesOverview";
import { fetchMonthlyGrowth } from "../helpers/fetchMonthlyGrowth";
import { fetchRevenueTrend } from "../helpers/fetchRevenueTrend";
// import { fetchCategoryDistribution } from "../helpers/fetchCategoryDistribution";

const DashboardCharts = () => {
  const [salesData, setSalesData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [revenueTrendData, setRevenueTrendData] = useState([]);
  // const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel for optimal performance
        const [salesResult, growthResult, revenueTrendResult] = await Promise.all([
          fetchSalesOverview(),
          fetchMonthlyGrowth(),
          fetchRevenueTrend(),
          // fetchCategoryDistribution()
        ]);
        
        if (salesResult.success) {
          setSalesData(salesResult.data);
        }
        
        if (growthResult.success) {
          setGrowthData(growthResult.data);
        }
        
        if (revenueTrendResult.success) {
          setRevenueTrendData(revenueTrendResult.data);
        }
        
        // if (categoryResult.success) {
        //   setCategoryData(categoryResult.data);
        // }
        
        if (!salesResult.success && !growthResult.success && !revenueTrendResult.success) {
          setError("Failed to load dashboard data");
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Use dummy data for category distribution (category API commented out)
  const pieData = [
    { name: "Electronics", value: 400 },
    { name: "Clothing", value: 300 },
    { name: "Home Appliances", value: 300 },
    { name: "Home", value: 330 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658"];

  // Format currency for tooltips
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip for sales charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{`Month: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'sales' || entry.dataKey === 'revenue'
                ? `${entry.dataKey === 'sales' ? 'Sales' : 'Revenue'}: ${formatCurrency(entry.value)}`
                : entry.dataKey === 'growth'
                ? `Growth: ${entry.value}%`
                : `${entry.dataKey.charAt(0).toUpperCase() + entry.dataKey.slice(1)}: ${entry.value}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mt-4 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mt-4 mb-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-red-600">Error loading chart data: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mt-4 mb-4">
      {/* Sales Overview Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="sales" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Growth</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growthData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="growth" name="Growth %">
                {growthData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.growth >= 0 ? "#22c55e" : "#ef4444"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Trend</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrendData.length > 0 ? revenueTrendData : (growthData.length > 0 ? growthData : salesData)}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <CartesianGrid strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrendData.length > 0 ? revenueTrendData : (growthData.length > 0 ? growthData : salesData)}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <CartesianGrid strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#ff7300"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
