import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Input } from "./ui/input";
import { data } from "@/utils/sidebar/sidebarData";
import { filterItemsByRole } from "@/utils/sidebar/filterItemsByRole";
import { useEffect, useState } from "react";
import { getItem } from "@/utils/local_storage";
export function AppSidebar({ ...props }) {
  
  const userInfo = data.user;
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = getItem("userRole");
    console.log(" userRole:", storedRole);
    if (storedRole === "super_admin" || storedRole === "admin") {
      setRole(storedRole);
    }
  }, []);
  
  const filteredNavMain = filterItemsByRole(data.navMain, role);
  const filteredProjectMain = filterItemsByRole(data.projects, role);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams}  />
        <Input placeholder="Search" className="bg-white" />
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto [&::-webkit-scrollbar]:hidden">
      <NavMain items={filteredNavMain} showHeader={false} />
      <NavMain items={filteredProjectMain}  showHeader={true}
            header={"More"} />

      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userInfo} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
