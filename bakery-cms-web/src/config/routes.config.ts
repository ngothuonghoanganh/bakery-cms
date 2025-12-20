// Route configuration type
export type RouteConfig = {
  path: string;
  title?: string;
  icon?: string; // Icon component name
  hideInMenu?: boolean;
  component: string; // Component import path
};

// Routes configuration - will be used to generate actual routes in App.tsx
export const routesConfig: RouteConfig[] = [
  {
    path: '/',
    title: 'Dashboard',
    icon: 'DashboardOutlined',
    component: '@/pages/Dashboard/DashboardPage',
  },
  {
    path: '/products',
    title: 'Products',
    icon: 'ShoppingOutlined',
    component: '@/pages/ProductsPage',
  },
  {
    path: '/products/:id',
    hideInMenu: true,
    component: '@/pages/Products/ProductDetailPage',
  },
  {
    path: '/orders',
    title: 'Orders',
    icon: 'FileTextOutlined',
    component: '@/pages/OrdersPage',
  },
  {
    path: '/orders/:id',
    hideInMenu: true,
    component: '@/pages/Orders/OrderDetailPage',
  },
  {
    path: '/payments',
    title: 'Payments',
    icon: 'CreditCardOutlined',
    component: '@/pages/Payments/PaymentsPage',
  },
  {
    path: '/payments/:id',
    hideInMenu: true,
    component: '@/pages/Payments/PaymentDetailPage',
  },
  {
    path: '/auth/oauth/callback',
    hideInMenu: true,
    component: '@/pages/OAuthCallback/OAuthCallback',
  },
];

// Export menu items (filtered to show only in menu)
export const getMenuItems = (): Array<{
  path: string;
  name: string;
  icon: string;
}> => {
  return routesConfig
    .filter((route) => !route.hideInMenu && route.title)
    .map((route) => ({
      path: route.path,
      name: route.title!,
      icon: route.icon!,
    }));
};
