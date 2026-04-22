export const commerce_vertical={
    name:"commerce",
    sidebar: [
    {
      "label": "Strategic Overview",
      "key": "strategic-overview",
      "icon": "bar-chart-3",
      "children": [
        {
          "label": "Dashboard",
          "key": "dashboard",
          "route": "/admin"
        },
        {
          "label": "Orders",
          "key": "orders",
          "route": "/admin/orders"
        },
        {
          "label": "Branding",
          "key": "branding",
          "route": "/admin/branding"
        }
      ]
    },
    {
      "label": "Logistics Control",
      "key": "logistics-control",
      "icon": "package",
      "children": [
        {
          "label": "Products",
          "key": "products",
          "route": "/admin/products"
        },
        {
          "label": "Categories",
          "key": "categories",
          "route": "/admin/categories"
        },
        {
          "label": "Attributes",
          "key": "attributes",
          "route": "/admin/attributes"
        }
      ]
    },
    {
      "label": "Communications Hub",
      "key": "communications-hub",
      "icon": "file-text",
      "children": [
        {
          "label": "Pages",
          "key": "pages",
          "route": "/admin/pages"
        },
        {
          "label": "Media",
          "key": "media",
          "route": "/admin/media"
        },
        {
          "label": "Engine",
          "key": "engine",
          "route": "/admin/sync"
        }
      ]
    },
    {
      "label": "Personnel Intelligence",
      "key": "personnel-intelligence",
      "icon": "users",
      "children": [
        {
          "label": "Personnel",
          "key": "personnel",
          "route": "/admin/customers"
        },
        {
          "label": "Command Staff",
          "key": "command-staff",
          "route": "/admin/users"
        }
      ]
    },
    {
      "label": "Field Intelligence",
      "key": "field-intelligence",
      "icon": "zap",
      "children": [
        {
          "label": "Form Matrix",
          "key": "form-matrix",
          "route": "/admin/forms"
        },
        {
          "label": "Captured Data",
          "key": "captured-data",
          "route": "/admin/form-submissions"
        }
      ]
    }
  ]
}
 

export const adminvertical={
    name:"admin",
    sidebar:[
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
                    "route": "/users/manage"
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