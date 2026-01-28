'use client';

import { useEffect, useState } from 'react';
import { supabase, Product } from '@/lib/supabase';
import SummaryCards from '@/components/dashboard/SummaryCards';
import ProductTable from '@/components/dashboard/ProductTable';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('Fetching products...');
        
        // Check auth status
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session ? 'Authenticated' : 'Not authenticated');
        
        const { data, error, status } = await supabase
          .from('products')
          .select('*')
          .order('p_id', { ascending: true });

        console.log('Fetch result - Status:', status, 'Data:', data, 'Error:', error);

        if (error) {
          console.error('Error fetching products:', error);
          setError(error.message);
        } else {
          console.log('Products loaded:', data?.length || 0, 'items');
          setProducts(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading products: {error}</p>
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
        <SummaryCards products={products} />

        {/* Products Table */}
        <ProductTable products={products} />
      </div>
    </div>
  );
}
