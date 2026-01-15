-- ============================================
-- FIX ORDER STATUSES
-- Run this to reset all order statuses to 'pending'
-- Status is now calculated dynamically based on production blocks
-- ============================================

-- Reset all orders to pending status
UPDATE orders SET status = 'pending' WHERE status != 'cancelled';

-- Verify the update
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status 
ORDER BY status;
