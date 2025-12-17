/**
 * Main App Component
 * Configures routing for the application
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from '@/components/shared/Navigation/Navigation';
import { HomePage } from '@/pages/HomePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { OrdersPage } from '@/pages/OrdersPage';

export const App = (): React.JSX.Element => (
  <Router>
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<div className="p-8"><h1 className="text-2xl">404 - Not Found</h1></div>} />
        </Routes>
      </main>
    </div>
  </Router>
);
