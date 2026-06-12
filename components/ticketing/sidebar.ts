export interface SidebarItem {
  title: string;
  url: string;
  badge?: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const sidebarConfig: SidebarSection[] = [
  {
    title: "IT Support",
    items: [
      { title: "Getting Started", url: "/docs" },
      { title: "Key Terms", url: "/docs/quick-start" }
    ],
  },
  {
    title: "Lab Overview",
    items: [
      { title: "Infrastructure", url: "/docs" },
      { title: "Network", url: "/docs/quick-start" },
      { title: "Services", url: "/docs/quick-start" },
      { title: "Security", url: "/docs/quick-start" },
    ],
  },
  {
    title: "Remote Access",
    items: [
      { title: "Tailscale", url: "/docs" }      
    ],
  },
  {
    title: "Automation Services",
    items: [
      { title: "Tailscale", url: "/docs" }      
    ],
  },
  
];
