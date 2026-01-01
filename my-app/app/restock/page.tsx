'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Restock } from '@/lib/supabase';

export default function RestockPage() {
  const router = useRouter();
  const [restocks, setRestocks] = useState<Restock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestocks();
  }, []);

  const fetchRestocks = async () => {
    try {
      setLoading(true);
      
      // Fetch restock data
      const { data: restockData, error: restockError } = await supabase
        .from('restock')
        .select('*')
        .order('restock_date', { ascending: false });

      if (restockError) {
        console.error('Error fetching restocks:', restockError);
        throw new Error(`Failed to fetch restocks: ${restockError.message}`);
      }

      // Fetch product data to get titles
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('p_id, title');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      // Combine the data
      const formattedData = (restockData || []).map((restock) => {
        const product = productsData?.find((p) => p.p_id === restock.p_id);
        return {
          ...restock,
          product: product ? { title: product.title } : null,
        };
      });

      setRestocks(formattedData);
    } catch (error: unknown) {
      console.error('Error fetching restocks:', error);
      alert(`Error loading restock data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Warehouse Restock
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage warehouse restocking operations
          </p>
        </div>
        <button
          onClick={() => router.push('/restock/new')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md"
        >
          + New Stock
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading restock data...</p>
          </div>
        ) : restocks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No restock records found</p>
            <p className="text-sm text-gray-400 mt-2">Click &quot;New Stock&quot; to add your first restock entry</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restock Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restock Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {restocks.map((restock) => (
                  <tr key={restock.restock_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restock.p_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restock.product?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restock.restock_qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(restock.restock_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
