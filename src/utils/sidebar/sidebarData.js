import {
  BellIcon,
  Briefcase,
  ContactIcon,
  Crown,
  FileText,
  FormInput,
  GalleryThumbnails,
  Layers,
  LayoutDashboard,
  Package,
  Settings2,
  ShieldUserIcon,
  User,
  Users,
  Users2,
  Image,
  Plus,
  Bell,
  ShoppingBag,
  Store,
  BadgeInfo,
  MessageSquarePlus,
  BadgePlus,
  CopyPlus
} from "lucide-react";
import { getItem } from "../local_storage";
const userName = getItem("userName") || "Admin";
const userEmail = getItem("userEmail") || "admin@admin.com";
export const data = {
  user: {
    name: userName,
    email: userEmail,
    avatar: "/user.jpg",
  },
  
  navMain: [
    
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Admin",
      url: "/dashboard/admins",
      icon: Users2,
      isActive: true,
      items: [],
      roles: [ "super_admin"], 
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: Plus,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],

      
    },
    {
      title: "Sub Categories",
      url: "/dashboard/subcategory",
      icon: CopyPlus,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],

      
    },
    {
      title: " Products",
      url: "/dashboard/products",
      icon: ShoppingBag,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],
    },
    {
      title: "Brands",
      url: "/dashboard/brands",
      icon: Store,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],

      
    },
    
    
    
  ],
  projects: [
    {
      title: "Blogs",
      name: "Blogs",
      url: "/dashboard/blogs",
      icon: FileText,
      roles: ["super_admin","admin"],
    },
    {
      title: "Contact us form",
      name: "Contact us form",
      url: "/dashboard/contact-us",
      icon: ContactIcon,
      roles: ["super_admin", "admin"],
    },
    // {
    //   title: "Info & Policy",
    //   name: "Info & Policy",
    //   url: "/dashboard/info-policy",
    //   icon: BadgeInfo,
    //   roles: ["super_admin", "admin"],
    //   items: [
    //     {
    //       title: "Terms & Conditions",
    //       name: "Terms & Conditions",
    //       url: "/dashboard/info-policy/terms-conditions",
    //     },
    //     {
    //       title: "Privacy Policy",
    //       name: "Privacy Policy",
    //       url: "/dashboard/info-policy/privacy-policy",
    //     },
    //     {
    //       title: "FAQ",
    //       name: "FAQ",
    //       url: "/dashboard/info-policy/faq",
    //     },
    //   ],
    // },
    // {
    //   title: "Testimonial",
    //   name: "Testimonial",
    //   url: "/dashboard/testimonials",
    //   icon: MessageSquarePlus,
    //   roles: ["super_admin", "admin",],
    // },
  ],
};
