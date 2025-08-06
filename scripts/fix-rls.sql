-- Fix RLS policies with correct column names

-- Drop existing policies that have errors
DROP POLICY IF EXISTS "Users can view their own search history" ON SEARCH_HISTORY;

DROP POLICY IF EXISTS "Users can insert their own search history" ON SEARCH_HISTORY;

DROP POLICY IF EXISTS "Users can delete their own search history" ON SEARCH_HISTORY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON FAVORITES;

DROP POLICY IF EXISTS "Users can insert their own favorites" ON FAVORITES;

DROP POLICY IF EXISTS "Users can update their own favorites" ON FAVORITES;

DROP POLICY IF EXISTS "Users can delete their own favorites" ON FAVORITES;

DROP POLICY IF EXISTS "Users can view their own affiliate clicks" ON AFFILIATE_CLICKS;

DROP POLICY IF EXISTS "Anyone can insert affiliate clicks" ON AFFILIATE_CLICKS;

DROP POLICY IF EXISTS "Admins can view all affiliate clicks" ON AFFILIATE_CLICKS;

DROP POLICY IF EXISTS "Users can view their own affiliate conversions" ON AFFILIATE_CONVERSIONS;

DROP POLICY IF EXISTS "Anyone can insert affiliate conversions" ON AFFILIATE_CONVERSIONS;

DROP POLICY IF EXISTS "Admins can view all affiliate conversions" ON AFFILIATE_CONVERSIONS;

DROP POLICY IF EXISTS "Business owners can view their business clicks" ON BUSINESS_CLICKS;

DROP POLICY IF EXISTS "Anyone can insert business clicks" ON BUSINESS_CLICKS;

DROP POLICY IF EXISTS "Admins can view all business clicks" ON BUSINESS_CLICKS;

DROP POLICY IF EXISTS "Business owners can view their business conversions" ON BUSINESS_CONVERSIONS;

DROP POLICY IF EXISTS "Anyone can insert business conversions" ON BUSINESS_CONVERSIONS;

DROP POLICY IF EXISTS "Admins can view all business conversions" ON BUSINESS_CONVERSIONS;

-- Create corrected policies with proper column names

-- Search History policies (using userId instead of user_id)
CREATE POLICY "Users can view their own search history" ON SEARCH_HISTORY
  FOR SELECT USING ("userId" = GET_CURRENT_USER_ID() OR IS_ADMIN());

CREATE POLICY "Users can insert their own search history" ON SEARCH_HISTORY
  FOR INSERT WITH CHECK ("userId" = GET_CURRENT_USER_ID());

CREATE POLICY "Users can delete their own search history" ON SEARCH_HISTORY
  FOR DELETE USING ("userId" = GET_CURRENT_USER_ID() OR IS_ADMIN());

-- Favorites policies (using userId instead of user_id)
CREATE POLICY "Users can view their own favorites" ON FAVORITES
  FOR SELECT USING ("userId" = GET_CURRENT_USER_ID() OR IS_ADMIN());

CREATE POLICY "Users can insert their own favorites" ON FAVORITES
  FOR INSERT WITH CHECK ("userId" = GET_CURRENT_USER_ID());

CREATE POLICY "Users can update their own favorites" ON FAVORITES
  FOR UPDATE USING ("userId" = GET_CURRENT_USER_ID());

CREATE POLICY "Users can delete their own favorites" ON FAVORITES
  FOR DELETE USING ("userId" = GET_CURRENT_USER_ID() OR IS_ADMIN());

-- Affiliate Clicks policies (using userId instead of user_id)
CREATE POLICY "Users can view their own affiliate clicks" ON AFFILIATE_CLICKS
  FOR SELECT USING ("userId" = GET_CURRENT_USER_ID() OR IS_ADMIN());

CREATE POLICY "Anyone can insert affiliate clicks" ON AFFILIATE_CLICKS
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all affiliate clicks" ON AFFILIATE_CLICKS
  FOR SELECT USING (IS_ADMIN());

-- Affiliate Conversions policies (using userId instead of user_id)
CREATE POLICY "Users can view their own affiliate conversions" ON AFFILIATE_CONVERSIONS
  FOR SELECT USING ("userId" = GET_CURRENT_USER_ID() OR IS_ADMIN());

CREATE POLICY "Anyone can insert affiliate conversions" ON AFFILIATE_CONVERSIONS
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all affiliate conversions" ON AFFILIATE_CONVERSIONS
  FOR SELECT USING (IS_ADMIN());

-- Business Clicks policies (using businessId instead of business_id)
CREATE POLICY "Business owners can view their business clicks" ON BUSINESS_CLICKS
  FOR SELECT USING (
    "businessId" IN (
  SELECT
     ID
  FROM
     BUSINESSES
  WHERE
     EMAIL = CURRENT_SETTING('app.current_user_email', TRUE)
) OR IS_ADMIN()
  );

CREATE POLICY "Anyone can insert business clicks" ON BUSINESS_CLICKS
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all business clicks" ON BUSINESS_CLICKS
  FOR SELECT USING (IS_ADMIN());

-- Business Conversions policies (using businessId instead of business_id)
CREATE POLICY "Business owners can view their business conversions" ON BUSINESS_CONVERSIONS
  FOR SELECT USING (
    "businessId" IN (
  SELECT
     ID
  FROM
     BUSINESSES
  WHERE
     EMAIL = CURRENT_SETTING('app.current_user_email', TRUE)
) OR IS_ADMIN()
  );

CREATE POLICY "Anyone can insert business conversions" ON BUSINESS_CONVERSIONS
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all business conversions" ON BUSINESS_CONVERSIONS
  FOR SELECT USING (IS_ADMIN());

-- Add policies for other tables that might exist
-- Sales table policies
CREATE POLICY "Business owners can view their sales" ON SALES
  FOR SELECT USING (
    "businessId" IN (
  SELECT
     ID
  FROM
     BUSINESSES
  WHERE
     EMAIL = CURRENT_SETTING('app.current_user_email', TRUE)
) OR IS_ADMIN()
  );

CREATE POLICY "Anyone can insert sales" ON SALES
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all sales" ON SALES
  FOR SELECT USING (IS_ADMIN());

-- Commission table policies
CREATE POLICY "Users can view their own commissions" ON COMMISSIONS
  FOR SELECT USING ("userId" = GET_CURRENT_USER_ID() OR IS_ADMIN());

CREATE POLICY "Anyone can insert commissions" ON COMMISSIONS
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all commissions" ON COMMISSIONS
  FOR SELECT USING (IS_ADMIN());

-- Tracking Events policies
CREATE POLICY "Business owners can view their tracking events" ON TRACKING_EVENTS
  FOR SELECT USING (
    "businessId" IN (
  SELECT
     ID
  FROM
     BUSINESSES
  WHERE
     EMAIL = CURRENT_SETTING('app.current_user_email', TRUE)
) OR IS_ADMIN()
  );

CREATE POLICY "Anyone can insert tracking events" ON TRACKING_EVENTS
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all tracking events" ON TRACKING_EVENTS
  FOR SELECT USING (IS_ADMIN());

-- Webhook table policies
CREATE POLICY "Business owners can view their webhooks" ON WEBHOOKS
  FOR SELECT USING (
    "businessId" IN (
  SELECT
     ID
  FROM
     BUSINESSES
  WHERE
     EMAIL = CURRENT_SETTING('app.current_user_email', TRUE)
) OR IS_ADMIN()
  );

CREATE POLICY "Business owners can manage their webhooks" ON WEBHOOKS
  FOR ALL USING (
    "businessId" IN (
  SELECT
     ID
  FROM
     BUSINESSES
  WHERE
     EMAIL = CURRENT_SETTING('app.current_user_email', TRUE)
) OR IS_ADMIN()
  );

-- Webhook Events policies
CREATE POLICY "Admins can view all webhook events" ON WEBHOOK_EVENTS
  FOR SELECT USING (IS_ADMIN());

CREATE POLICY "Anyone can insert webhook events" ON WEBHOOK_EVENTS
  FOR INSERT WITH CHECK (TRUE);