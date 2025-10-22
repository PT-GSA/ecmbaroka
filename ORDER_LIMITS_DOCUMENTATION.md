# 📊 Order Amount Limits - Updated Configuration

Dokumentasi perubahan limit order amount untuk mendukung bisnis susu yang lebih besar.

## 🔄 Perubahan yang Dilakukan

### 1. Database Schema Update
**File**: `migrate/increase-order-amount-precision-safe.sql`

**Perubahan**:
- `orders.total_amount`: `DECIMAL(10,2)` → `DECIMAL(12,2)`
- `order_items.price_at_purchase`: `DECIMAL(10,2)` → `DECIMAL(12,2)`
- `products.price`: `DECIMAL(10,2)` → `DECIMAL(12,2)`
- `payments.amount`: `DECIMAL(10,2)` → `DECIMAL(12,2)`

**Special Handling**:
- **Views**: `v_affiliate_orders` dan `v_affiliate_customers` di-drop dan di-recreate
- **Constraints**: CHECK constraints diupdate untuk precision baru
- **Permissions**: View permissions di-restore setelah migration

**Impact**:
- **Sebelum**: Maksimal Rp 99,999,999.99 (hampir 100 juta)
- **Sesudah**: Maksimal Rp 9,999,999,999.99 (hampir 10 miliar)

### 2. API Validation Update
**File**: `app/api/customer/orders/create/route.ts`

**Perubahan**:
```typescript
// SEBELUM
if (totalAmount > 99999999.99) {
  return NextResponse.json({ error: 'Total order terlalu besar' }, { status: 400 })
}

// SESUDAH
// Database limit (technical)
if (totalAmount > 9999999999.99) {
  return NextResponse.json({ error: 'Total order terlalu besar (maksimal Rp 9,999,999,999.99)' }, { status: 400 })
}

// Business limit (practical)
if (totalAmount > 1000000000) {
  return NextResponse.json({ 
    error: 'Total order terlalu besar untuk bisnis susu (maksimal Rp 1,000,000,000). Silakan hubungi admin untuk order khusus.' 
  }, { status: 400 })
}
```

## 📈 Limit Hierarchy

### 1. Database Technical Limit
- **Value**: Rp 9,999,999,999.99
- **Purpose**: Mencegah database overflow
- **Type**: Hard limit (cannot be exceeded)

### 2. Business Practical Limit
- **Value**: Rp 1,000,000,000.00 (1 miliar)
- **Purpose**: Reasonable business limit untuk bisnis susu
- **Type**: Soft limit (can be adjusted by admin)

### 3. Previous Limit (Deprecated)
- **Value**: Rp 99,999,999.99 (hampir 100 juta)
- **Status**: ❌ Too restrictive untuk bisnis susu
- **Reason**: Tidak cukup untuk order besar dari distributor/grosir

## 🏪 Business Context

### Susu Baroka Business Model:
- **Retail**: Individual customers (Rp 50,000 - Rp 500,000)
- **Wholesale**: Small businesses (Rp 500,000 - Rp 5,000,000)
- **Distributor**: Large orders (Rp 5,000,000 - Rp 100,000,000)
- **Corporate**: Bulk orders (Rp 100,000,000+)

### Order Scenarios:
1. **Individual**: 5-50 karton × Rp 15,000 = Rp 75,000 - Rp 750,000
2. **Small Business**: 100-500 karton × Rp 15,000 = Rp 1,500,000 - Rp 7,500,000
3. **Distributor**: 1,000-5,000 karton × Rp 15,000 = Rp 15,000,000 - Rp 75,000,000
4. **Corporate**: 10,000+ karton × Rp 15,000 = Rp 150,000,000+

## 🔧 Implementation Details

### Database Migration:
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.orders
  ALTER COLUMN total_amount TYPE NUMERIC(12,2)
  USING total_amount::numeric;

-- Update constraints
ALTER TABLE public.orders
  ADD CONSTRAINT orders_total_amount_check 
  CHECK (total_amount > 0 AND total_amount <= 9999999999.99);
```

### API Validation:
```typescript
// Technical validation
if (totalAmount > 9999999999.99) {
  return NextResponse.json({ 
    error: 'Total order terlalu besar (maksimal Rp 9,999,999,999.99)' 
  }, { status: 400 })
}

// Business validation
if (totalAmount > 1000000000) {
  return NextResponse.json({ 
    error: 'Total order terlalu besar untuk bisnis susu (maksimal Rp 1,000,000,000). Silakan hubungi admin untuk order khusus.' 
  }, { status: 400 })
}
```

## 🚀 Benefits

### 1. Business Scalability
- ✅ Support untuk distributor besar
- ✅ Support untuk corporate orders
- ✅ Tidak ada limit yang terlalu ketat
- ✅ Fleksibilitas untuk pertumbuhan bisnis

### 2. Technical Robustness
- ✅ Database precision yang memadai
- ✅ Validasi yang berlapis
- ✅ Error messages yang informatif
- ✅ Backward compatibility

### 3. User Experience
- ✅ Clear error messages
- ✅ Guidance untuk order besar
- ✅ Admin contact untuk order khusus
- ✅ No unexpected failures

## 🔧 Troubleshooting

### Error: View Dependency
```
ERROR: 0A000: cannot alter type of a column used by a view or rule 
DETAIL: rule _RETURN on view v_affiliate_orders depends on column "total_amount"
```

**Solution**: 
- Use `migrate/increase-order-amount-precision-safe.sql` instead
- This migration drops views first, alters columns, then recreates views
- Safe migration handles all dependencies automatically

### Error: Constraint Violation
```
ERROR: check constraint "orders_total_amount_check" is violated
```

**Solution**:
- Migration includes updated CHECK constraints
- New constraints allow values up to 9,999,999,999.99
- Old constraints are dropped before new ones are added

### Error: Permission Denied
```
ERROR: permission denied for view v_affiliate_orders
```

**Solution**:
- Migration includes GRANT statements
- Permissions are restored after views are recreated
- Both `authenticated` and `anon` roles are granted access

## 📋 Migration Steps

### 1. Database Migration
```bash
# Run the SAFE SQL migration in Supabase SQL Editor
cat migrate/increase-order-amount-precision-safe.sql
```

**Important**: Use the `-safe.sql` version to avoid view dependency errors.

### 2. API Deployment
```bash
# Deploy updated API
bun run build
bun run start
```

### 3. Testing
```bash
# Test with large order
curl -X POST http://localhost:3000/api/customer/orders/create \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":"test","quantity":1000}]}'
```

## 🔍 Monitoring

### Error Tracking:
- Monitor untuk "Total order terlalu besar" errors
- Track order amounts untuk business insights
- Alert jika ada order yang mendekati limit

### Business Metrics:
- Average order value
- Maximum order value per month
- Distribution of order sizes
- Customer segmentation by order size

## 📞 Support

### For Large Orders (> Rp 1 billion):
- Contact admin untuk approval khusus
- Custom pricing untuk bulk orders
- Special delivery arrangements
- Payment terms negotiation

### Admin Contact:
- Email: admin@susubaroka.com
- Phone: +62-xxx-xxx-xxxx
- WhatsApp: +62-xxx-xxx-xxxx

---

**Last Updated**: 2024-12-19  
**Version**: 2.0  
**Status**: ✅ Implemented
