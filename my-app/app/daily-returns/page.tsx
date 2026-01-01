'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Product, DailyStockMovement } from '@/lib/supabase';

type ProductWithReturn = Product & {
  returned_qty?: number;
  d_id?: number;
};

export default function DailyReturnsPage() {
  const [products, setProducts] = useState<ProductWithReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnData, setReturnData] = useState<{ [key: number]: number }>({});

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

      // Fetch existing daily stock movements for the selected date
      const { data: movementData, error: movementError } = await supabase
        .from('daily_stock_movement')
        .select('*')
        .eq('movement_date', selectedDate);

      if (movementError && movementError.code !== 'PGRST116') {
        console.error('Error fetching movements:', movementError);
        throw new Error(`Failed to fetch movements: ${movementError.message}`);
      }

      // Combine product data with existing return data
      const combinedData = (productsData || []).map((product: Product) => {
        const movement = movementData?.find((m: DailyStockMovement) => m.p_id === product.p_id);
        return {
          ...product,
          returned_qty: movement?.returned_qty || 0,
          d_id: movement?.d_id,
        };
      });

      setProducts(combinedData);

      // Initialize return data state
      const initialReturnData: { [key: number]: number } = {};
      combinedData.forEach((product: ProductWithReturn) => {
        if (product.returned_qty) {
          initialReturnData[product.p_id] = product.returned_qty;
        }
      });
      setReturnData(initialReturnData);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error loading data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReturnQtyChange = (pId: number, qty: number) => {
    setReturnData((prev) => ({
      ...prev,
      [pId]: qty,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Process each product with return quantity
      for (const product of products) {
        const returnedQty = returnData[product.p_id] || 0;
        const previousReturnedQty = product.returned_qty || 0;

        // Skip if no change
        if (returnedQty === previousReturnedQty) continue;

        const qtyDifference = returnedQty - previousReturnedQty;

        // Check if record exists for this product and date
        if (product.d_id) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('daily_stock_movement')
            .update({
              returned_qty: returnedQty,
            })
            .eq('d_id', product.d_id);

          if (updateError) {
            console.error('Update error:', updateError);
            throw new Error(`Failed to update movement: ${updateError.message}`);
          }
        } else if (returnedQty > 0) {
          // Insert new record
          const { error: insertError } = await supabase
            .from('daily_stock_movement')
            .insert({
              p_id: product.p_id,
              movement_date: selectedDate,
              issued_qty: 0,
              returned_qty: returnedQty,
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Failed to insert movement: ${insertError.message}`);
          }
        }

        // Update product quantity (increase by the difference)
        if (qtyDifference !== 0) {
          const { error: productError } = await supabase
            .from('products')
            .update({
              item_quantity: product.item_quantity + qtyDifference,
            })
            .eq('p_id', product.p_id);

          if (productError) {
            console.error('Product update error:', productError);
            throw new Error(`Failed to update product: ${productError.message}`);
          }
        }
      }

      alert('Daily returns saved successfully!');
      fetchData(); // Refresh data
    } catch (error: unknown) {
      console.error('Error saving:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving data: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Daily Returns
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Record daily product returns to warehouse
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movement Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Add / Move to Stock'}
          </button>
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
                    Returned Quantity
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
                        value={returnData[product.p_id] || ''}
                        onChange={(e) =>
                          handleReturnQtyChange(product.p_id, parseInt(e.target.value) || 0)
                        }
                        placeholder="Enter quantity"
                        className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>Note:</strong> Returned quantities will be added back to the current stock. 
          You can update the quantities for the selected date at any time.
        </p>
      </div>
    </div>
  );
}
