const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        redirect: "editor"
        //component: () => import("pages/Index.vue")
      },
      {
        path: "editor",
        components: {
          default: () => import("pages/Editor/Index.vue"),
          toolbar: () => import("pages/Editor/Toolbar.vue")
        }
      }
    ]
  },
  {
    path: "/paste",
    component: () => import("layouts/SimpleLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/Paste.vue")
      }
    ]
  },
  {
    path: "/mysql",
    redirect: { path: "/paste", query: { format: "mysql" } }
  },
  {
    path: "/postgresql",
    redirect: { path: "/paste", query: { format: "postgres" } }
  },
  {
    path: "/mssql",
    redirect: { path: "/paste", query: { format: "mssql" } }
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/Error404.vue")
  }
];

export default routes;
