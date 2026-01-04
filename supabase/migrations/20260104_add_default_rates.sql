-- Add default_rates column to game_centers table
ALTER TABLE public.game_centers ADD COLUMN default_rates JSONB DEFAULT '{"pc": 50000, "playstation": 80000, "billiard": 120000}';
