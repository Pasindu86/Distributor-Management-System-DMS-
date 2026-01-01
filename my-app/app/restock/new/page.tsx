'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Product } from '@/lib/supabase';

export default function NewRestockPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restockData, setRestockData] = useState<{ [key: number]: number }>({});
  const [restockDate, setRestockDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('p_id, title, gram, item_quantity, product_rate, item_bundle')
        .order('p_id', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error loading product data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestockQtyChange = (pId: number, qty: number) => {
    setRestockData((prev) => ({
      ...prev,
      [pId]: qty,
    }));
  };

  const handleSave = async () => {
    try {
      // Validate that at least one product has restock quantity
      const hasRestockData = Object.values(restockData).some((qty) => qty > 0);
      if (!hasRestockData) {
        alert('Please enter restock quantity for at least one product');
        return;
      }

      setSaving(true);

      // Process each product with restock quantity
      for (const [pIdStr, qty] of Object.entries(restockData)) {
        if (qty <= 0) continue;

        const pId = parseInt(pIdStr);

        // Step 1: Insert restock record
        const { error: restockError } = await supabase
          .from('restock')
          .insert({
            p_id: pId,
            restock_qty: qty,
            restock_date: restockDate,
          })
          .select();

        if (restockError) {
          console.error('Restock insert error:', restockError);
          throw new Error(`Failed to insert restock: ${restockError.message}`);
        }

        // Step 2: Update product quantity
        const product = products.find((p) => p.p_id === pId);
        if (!product) {
          throw new Error(`Product with ID ${pId} not found`);
        }

        const { error: productError } = await supabase
          .from('products')
          .update({
            item_quantity: product.item_quantity + qty,
          })
          .eq('p_id', pId);

        if (productError) {
          console.error('Product update error:', productError);
          throw new Error(`Failed to update product: ${productError.message}`);
        }
      }

      alert('Restock saved successfully!');
      
      // Step 3: Redirect to restock dashboard
      router.push('/restock');
    } catch (error: unknown) {
      console.error('Error saving restock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving restock data: ${errorMessage}`);
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/restock')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Restock
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          New Restock Entry
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Add incoming stock for warehouse products
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Restock Date
          </label>
          <input
            type="date"
            value={restockDate}
            onChange={(e) => setRestockDate(e.target.value)}
            className="border border-blue-300 rounded px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-blue-600 mt-2">
            Date is set to today by default, but you can change it if needed
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No products found</p>
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
                    Gram
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restock Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.p_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {product.p_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {product.gram || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {product.item_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="number"
                        min="0"
                        value={restockData[product.p_id] || ''}
                        onChange={(e) =>
                          handleRestockQtyChange(product.p_id, parseInt(e.target.value) || 0)
                        }
                        placeholder="Enter quantity"
                        className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => router.push('/restock')}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Restock'}
        </button>
      </div>
    </div>
  );
}
