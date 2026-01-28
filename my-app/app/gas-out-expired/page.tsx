'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Product } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

type ProductWithGasExpired = Product & {
  gas_out_qty?: number;
  expired_qty?: number;
  record_id?: number;
};

export default function GasOutExpiredPage() {
  const [products, setProducts] = useState<ProductWithGasExpired[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [gasOutData, setGasOutData] = useState<{ [key: number]: number }>({});
  const [expiredData, setExpiredData] = useState<{ [key: number]: number }>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('p_id, title, gram, item_quantity, product_rate, item_bundle')
        .order('p_id', { ascending: true });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      setProducts(productsData || []);
      setGasOutData({});
      setExpiredData({});
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error loading data: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGasOutChange = (pId: number, qty: number) => {
    setGasOutData((prev) => ({
      ...prev,
      [pId]: qty,
    }));
  };

  const handleExpiredChange = (pId: number, qty: number) => {
    setExpiredData((prev) => ({
      ...prev,
      [pId]: qty,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      for (const product of products) {
        const gasOutQty = gasOutData[product.p_id] || 0;
        const expiredQty = expiredData[product.p_id] || 0;
        const totalDeduction = gasOutQty + expiredQty;

        if (totalDeduction <= 0) continue;

        // Validate quantity
        if (totalDeduction > product.item_quantity) {
          alert(`Cannot remove more than available quantity for ${product.title}`);
          setSaving(false);
          return;
        }

        // Update product quantity
        const { error: updateError } = await supabase
          .from('products')
          .update({
            item_quantity: product.item_quantity - totalDeduction,
          })
          .eq('p_id', product.p_id);

        if (updateError) {
          throw new Error(`Failed to update ${product.title}: ${updateError.message}`);
        }
      }

      alert('Gas out & expired quantities saved successfully!');
      fetchData();
    } catch (error: unknown) {
      console.error('Error saving:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving data: ${message}`);
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Gas Out & Expired
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Record products lost due to gas leakage or expiration
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <label className="block text-sm font-medium text-orange-800 mb-2">
            Record Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-orange-300 rounded px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Available
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Gas Out
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Expired
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.p_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.title}
                    {product.gram && <span className="text-gray-500 ml-1">({product.gram})</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {product.item_quantity}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max={product.item_quantity}
                      value={gasOutData[product.p_id] || ''}
                      onChange={(e) => handleGasOutChange(product.p_id, parseInt(e.target.value) || 0)}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max={product.item_quantity}
                      value={expiredData[product.p_id] || ''}
                      onChange={(e) => handleExpiredChange(product.p_id, parseInt(e.target.value) || 0)}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
