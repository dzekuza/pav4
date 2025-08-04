-- Drop existing policies that have errors
DROP POLICY IF EXISTS "Users can view their own search history" ON search_history;
DROP POLICY IF EXISTS "Users can insert their own search history" ON search_history;
DROP POLICY IF EXISTS "Users can delete their own search history" ON search_history;

DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

DROP POLICY IF EXISTS "Users can view their own affiliate clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "Users can view their own affiliate conversions" ON affiliate_conversions;

DROP POLICY IF EXISTS "Business owners can view their business clicks" ON business_clicks;
DROP POLICY IF EXISTS "Business owners can view their business conversions" ON business_conversions;

-- Fix Search History policies with correct column name
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING ("userId" = get_current_user_id() OR is_admin());

CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK ("userId" = get_current_user_id());

CREATE POLICY "Users can delete their own search history" ON search_history
  FOR DELETE USING ("userId" = get_current_user_id() OR is_admin());

-- Fix Favorites policies with correct column name
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING ("userId" = get_current_user_id() OR is_admin());

CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK ("userId" = get_current_user_id());

CREATE POLICY "Users can update their own favorites" ON favorites
  FOR UPDATE USING ("userId" = get_current_user_id());

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING ("userId" = get_current_user_id() OR is_admin());

-- Fix Affiliate Clicks policies with correct column name
CREATE POLICY "Users can view their own affiliate clicks" ON affiliate_clicks
  FOR SELECT USING ("userId" = get_current_user_id() OR is_admin());

-- Fix Affiliate Conversions policies with correct column name
CREATE POLICY "Users can view their own affiliate conversions" ON affiliate_conversions
  FOR SELECT USING ("userId" = get_current_user_id() OR is_admin());

-- Fix Business Clicks policies with correct column name
CREATE POLICY "Business owners can view their business clicks" ON business_clicks
  FOR SELECT USING (
    "businessId" IN (
      SELECT id FROM businesses 
      WHERE email = current_setting('app.current_user_email', TRUE)
    ) OR is_admin()
  );

-- Fix Business Conversions policies with correct column name
CREATE POLICY "Business owners can view their business conversions" ON business_conversions
  FOR SELECT USING (
    "businessId" IN (
      SELECT id FROM businesses 
      WHERE email = current_setting('app.current_user_email', TRUE)
    ) OR is_admin()
  );

-- Enable RLS on tables that failed before
ALTER TABLE "ClickLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;

-- Create policies for ClickLog (legacy)
CREATE POLICY "Admins can view all click logs" ON "ClickLog"
  FOR SELECT USING (is_admin());

CREATE POLICY "Anyone can insert click logs" ON "ClickLog"
  FOR INSERT WITH CHECK (TRUE);

-- Create policies for Conversion (legacy)
CREATE POLICY "Admins can view all conversions" ON "Conversion"
  FOR SELECT USING (is_admin());

CREATE POLICY "Anyone can insert conversions" ON "Conversion"
  FOR INSERT WITH CHECK (TRUE);

-- Create policies for Settings
CREATE POLICY "Admins can manage settings" ON "Settings"
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view public settings" ON "Settings"
  FOR SELECT USING (key LIKE 'public.%'); 