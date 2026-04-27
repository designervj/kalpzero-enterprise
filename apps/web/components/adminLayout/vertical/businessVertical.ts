export interface SidebarItem {
    label: string;
    key: string;
    icon?: string;
    route?: string;
    children?: SidebarItem[];
}

export interface VerticalConfig {
    name: string;
    sidebar: SidebarItem[];
}

export const commerce_vertical: VerticalConfig = {
  name: "commerce",
  sidebar: [
    {
      label: "Dashboard",
      key: "dashboard",
      icon: "bar-chart-3",
      children: [
        {
          label: "Overview",
          key: "overview",
          route: "/admin"
        },
        {
          label: "Orders",
          key: "orders",
          route: "/admin/orders"
        },
        {
          label: "Branding",
          key: "branding",
          route: "/admin/branding"
        }
      ]
    },
    {
      label: "Business Products",
      key: "catalog",
      icon: "package",
      children: [
        {
          label: "Products",
          key: "products",
          route: "/commerce/product"
        },
        {
          label: "Categories",
          key: "categories",
          route: "/commerce/categories"
        },
        {
          label: "Attributes",
          key: "attributes",
          route: "/commerce/attributes"
        },
        {
          label: "Brands",
          key: "brands",
          route: "/commerce/brand"
        },
        {
          label: "Vendors",
          key: "vendors",
          route: "/commerce/vendor"
        },
        {
          label: "Warehouses",
          key: "warehouses",
          route: "/commerce/warehouse"
        }
      ]
    },
    {
      label: "Website Content",
      key: "content",
      icon: "file-text",
      children: [
        {
          label: "Pages",
          key: "pages",
          route: "/admin/pages"
        },
        {
          label: "Media",
          key: "media",
          route: "/admin/media"
        },
        {
          label: "Sync Engine",
          key: "sync-engine",
          route: "/admin/sync"
        }
      ]
    },
     {
      label: "Engagement",
      key: "engagement",
      icon: "megaphone",
      children: [
        {
          label: "Bookings",
          key: "bookings",
          route: "/commerce/bookings"
        },
        {
          label: "Marketing",
          key: "marketing",
          route: "/commerce/marketing"
        },
        {
          label: "Branding",
          key: "branding",
          route: "/commerce/branding"
        }
      ]
    },
    {
      label: "Users",
      key: "users",
      icon: "users",
      children: [
        {
          label: "Customers",
          key: "customer-list",
          route: "/admin/customers"
        },
        {
          label: "Admin Users",
          key: "admin-users",
          route: "/admin/users"
        }
      ]
    },
    {
      label: "Forms",
      key: "forms",
      icon: "zap",
      children: [
        {
          label: "Form Builder",
          key: "form-builder",
          route: "/admin/forms"
        },
        {
          label: "Submissions",
          key: "submissions",
          route: "/admin/form-submissions"
        }
      ]
    },
     {
      label: "Platform",
      key: "platform",
      icon: "settings",
      children: [
        {
          label: "Settings",
          key: "settings",
          route: "/commerce/settings"
        }
      ]
    },
  ]
}

export const adminvertical: VerticalConfig = {
    name: "admin",
    sidebar: [
        {
            "label": "Dashboard",
            "key": "dashboard",
            "icon": "dashboard",
            "children": [
                {
                    "label": "Overview",
                    "key": "overview",
                    "route": "/dashboard/overview"
                },
                {
                    "label": "Analytics",
                    "key": "analytics",
                    "route": "/dashboard/analytics"
                }
               
            ]
        },
        {
            "label": "Settings",
            "key": "settings",
            "icon": "settings",
            "route": "/settings"
        },
        {
            "label": "Users",
            "key": "users",
            "icon": "users",
            "children": [
                {
                    "label": "Manage Users",
                    "key": "manage-users",
                    "route": "/users"
                }
            ]
        },
        {
            "label": "CMS",
            "key": "cms",
            "icon": "layout",
            "children": [
                {
                    "label": "Pages",
                    "key": "pages",
                    "route": "/cms/pages"
                },
                {
                    "label": "Blogs",
                    "key": "blogs",
                    "route": "/cms/blogs"
                },
                {
                    "label": "Media",
                    "key": "media",
                    "route": "/cms/media"
                },
                {
                    "label": "Header",
                    "key": "header",
                    "route": "/cms/header"
                },
                {
                    "label": "Footer",
                    "key": "footer",
                    "route": "/cms/footer"
                }
            ]
        },
        {
            "label": "Forms",
            "key": "forms",
            "icon": "file-text",
            "children": [
                {
                    "label": "Forms",
                    "key": "forms-list",
                    "route": "/forms"
                },
                {
                    "label": "Form Submissions",
                    "key": "form-submissions",
                    "route": "/forms/submissions"
                }
            ]
        }
    ]
}