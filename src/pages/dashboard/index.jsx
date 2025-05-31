import NavbarItem from "@/components/navbar/navbar_item";
import AnalyticsCards from "./components/AnalyticsCards";
import DashboardCharts from "./components/DashboardCharts";


const Dashboard = () => {
  return (
    <div className="flex flex-col gap-4">
      <NavbarItem title="Dashboard" />
      <AnalyticsCards />

<DashboardCharts />
    </div>
  );
};

export default Dashboard;
