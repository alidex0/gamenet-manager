-- Add customer_name column to sales table for sales without device association
ALTER TABLE public.sales ADD COLUMN customer_name TEXT;