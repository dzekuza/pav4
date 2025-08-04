-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ClickLog ENABLE ROW LEVEL SECURITY;
ALTER TABLE Conversion ENABLE ROW LEVEL SECURITY;
ALTER TABLE Settings ENABLE ROW LEVEL SECURITY;

-- Create a function to get current user ID from JWT or session
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INTEGER AS $$
BEGIN
  -- Try to get user ID from JWT token (if using JWT)
  -- This would need to be adjusted based on your auth implementation
  RETURN NULL; -- Default to NULL for now, will be set by application
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_id INTEGER;
BEGIN
  user_id := get_current_user_id();
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND "isAdmin" = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = get_current_user_id() OR is_admin());

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (is_admin());

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (id = get_current_user_id() OR is_admin());

-- Businesses table policies
CREATE POLICY "Anyone can view active businesses" ON businesses
  FOR SELECT USING ("isActive" = TRUE);

CREATE POLICY "Business owners can manage their own business" ON businesses
  FOR ALL USING (email = current_setting('app.current_user_email', TRUE) OR is_admin());

CREATE POLICY "Admins can manage all businesses" ON businesses
  FOR ALL USING (is_admin());

-- Search History policies
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own search history" ON search_history
  FOR DELETE USING (user_id = get_current_user_id() OR is_admin());

-- Legacy Search History policies
CREATE POLICY "Anyone can view legacy search history" ON legacy_search_history
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage legacy search history" ON legacy_search_history
  FOR ALL USING (is_admin());

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own favorites" ON favorites
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (user_id = get_current_user_id() OR is_admin());

-- Admins table policies
CREATE POLICY "Only admins can view admin data" ON admins
  FOR SELECT USING (is_admin());

CREATE POLICY "Only super admins can manage admin data" ON admins
  FOR ALL USING (is_admin());

-- Affiliate URLs policies
CREATE POLICY "Anyone can view active affiliate URLs" ON affiliate_urls
  FOR SELECT USING ("isActive" = TRUE);

CREATE POLICY "Admins can manage affiliate URLs" ON affiliate_urls
  FOR ALL USING (is_admin());

-- Affiliate Clicks policies
CREATE POLICY "Users can view their own affiliate clicks" ON affiliate_clicks
  FOR SELECT USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "Anyone can insert affiliate clicks" ON affiliate_clicks
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all affiliate clicks" ON affiliate_clicks
  FOR SELECT USING (is_admin());

-- Affiliate Conversions policies
CREATE POLICY "Users can view their own affiliate conversions" ON affiliate_conversions
  FOR SELECT USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "Anyone can insert affiliate conversions" ON affiliate_conversions
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all affiliate conversions" ON affiliate_conversions
  FOR SELECT USING (is_admin());

-- Business Clicks policies
CREATE POLICY "Business owners can view their business clicks" ON business_clicks
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE email = current_setting('app.current_user_email', TRUE)
    ) OR is_admin()
  );

CREATE POLICY "Anyone can insert business clicks" ON business_clicks
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all business clicks" ON business_clicks
  FOR SELECT USING (is_admin());

-- Business Conversions policies
CREATE POLICY "Business owners can view their business conversions" ON business_conversions
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE email = current_setting('app.current_user_email', TRUE)
    ) OR is_admin()
  );

CREATE POLICY "Anyone can insert business conversions" ON business_conversions
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all business conversions" ON business_conversions
  FOR SELECT USING (is_admin());

-- ClickLog policies (legacy)
CREATE POLICY "Admins can view all click logs" ON "ClickLog"
  FOR SELECT USING (is_admin());

CREATE POLICY "Anyone can insert click logs" ON "ClickLog"
  FOR INSERT WITH CHECK (TRUE);

-- Conversion policies (legacy)
CREATE POLICY "Admins can view all conversions" ON "Conversion"
  FOR SELECT USING (is_admin());

CREATE POLICY "Anyone can insert conversions" ON "Conversion"
  FOR INSERT WITH CHECK (TRUE);

-- Settings policies
CREATE POLICY "Admins can manage settings" ON Settings
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view public settings" ON Settings
  FOR SELECT USING (key LIKE 'public.%');

-- Create function to set current user context
CREATE OR REPLACE FUNCTION set_user_context(user_email TEXT, user_id INTEGER DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_email', user_email, FALSE);
  IF user_id IS NOT NULL THEN
    PERFORM set_config('app.current_user_id', user_id::TEXT, FALSE);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_current_user_id function to use session context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN current_setting('app.current_user_id', TRUE)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 