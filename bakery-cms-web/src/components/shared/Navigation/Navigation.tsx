/**
 * Navigation component
 */

import { Link } from 'react-router-dom';

export const Navigation = (): React.JSX.Element => (
  <nav className="bg-blue-600 text-white p-4">
    <div className="container mx-auto flex gap-6">
      <Link to="/" className="font-bold text-xl">
        Bakery CMS
      </Link>
      <Link to="/products" className="hover:underline">
        Products
      </Link>
      <Link to="/orders" className="hover:underline">
        Orders
      </Link>
      <Link to="/payments" className="hover:underline">
        Payments
      </Link>
    </div>
  </nav>
);
