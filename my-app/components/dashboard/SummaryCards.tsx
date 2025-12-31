import { Product } from '@/lib/supabase';

interface SummaryCardsProps {
  products: Product[];
}

export default function SummaryCards({ products }: SummaryCardsProps) {
  const totalWarehouseValue = products.reduce(
    (sum, product) => sum + (product.item_quantity * product.product_rate),
    0
  );

  const totalItems = products.reduce((sum, p) => sum + p.item_quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Products</p>
          <p className="text-3xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
          <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Warehouse Value</p>
          <p className="text-3xl font-bold text-blue-600">
            Rs. {totalWarehouseValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
