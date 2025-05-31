import { ChevronRight, Circle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({ items, showHeader = false, header }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarGroup>
      {showHeader && <SidebarGroupLabel>{header}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) =>
          item.items?.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.items.some((subItem) => subItem.url === location.pathname)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={item.items.some((subItem) => subItem.url === location.pathname) ? "bg-gray-200 dark:bg-gray-700" : ""}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a
                            onClick={() => navigate(subItem.url)}
                            className={location.pathname === subItem.url ? "bg-gray-300 dark:bg-gray-600" : ""}
                          >
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => navigate(item.url)}
                className={location.pathname === item.url ? "bg-gray-200 dark:bg-gray-700" : ""}
              >
                {item.icon ? <item.icon /> : <Circle className="w-4 h-4" />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
