import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  p_id: number;
  title: string;
  gram?: string;
  item_quantity: number;
  product_rate: number;
  item_bundle: number;
};

export type Restock = {
  restock_id: number;
  p_id: number;
  restock_qty: number;
  restock_date: string;
  product?: {
    title: string;
  };
};
