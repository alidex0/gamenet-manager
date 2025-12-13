-- Add customer_name column to device_sessions table
ALTER TABLE public.device_sessions 
ADD COLUMN customer_name text;