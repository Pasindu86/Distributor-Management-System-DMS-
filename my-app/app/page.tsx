import { supabase } from '@/lib/supabase';
import SummaryCards from '@/components/dashboard/SummaryCards';
import ProductTable from '@/components/dashboard/ProductTable';

export default async function DashboardPage() {
  // Fetch products from Supabase
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('p_id', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading products. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Warehouse Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Overview of warehouse inventory</p>
        </div>

        {/* Summary Cards */}
        <SummaryCards products={products || []} />

        {/* Products Table */}
        <ProductTable products={products || []} />
      </div>
    </div>
  );
}
