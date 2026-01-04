# پیکربندی تعرفه‌های پیشفرض

برای فعال کردن سیستم تعرفه‌های پیشفرض، یکی از مراحل زیر را انجام دهید:

## گزینه ۱: از طریق Supabase Dashboard (توصیه شده)

۱. به [Supabase Dashboard](https://app.supabase.com) بروید
۲. پروژه خود را انتخاب کنید (ughdxjenzzxqajmxhftm)
۳. به بخش "SQL Editor" بروید
۴. کوئری زیر را اجرا کنید:

```sql
ALTER TABLE public.game_centers ADD COLUMN default_rates JSONB DEFAULT '{"pc": 50000, "playstation": 80000, "billiard": 120000}';
```

۵. بیانیه را اجرا کنید (Execute)

## گزینه ۲: از طریق Supabase CLI

اگر Supabase CLI را نصب کردید:

```bash
supabase db push
```

## نتیجه

پس از اجرای migration:
- ستون `default_rates` به جدول `game_centers` اضافه خواهد شد
- مقادیر پیشفرض برای تعرفه‌ها تنظیم خواهند شد
- تمام دستگاه‌های جدید از این تعرفه‌ها استفاده خواهند کرد
- میتوانید تعرفه‌ها را در صفحه Settings تغییر دهید

## چگونه کار میکند

1. **Settings Page**: میتوانید تعرفه‌های پیشفرض برای هر نوع دستگاه را در صفحه تنظیمات تغییر دهید
2. **Add Device**: هنگام اضافه کردن دستگاه جدید، تعرفه‌های پیشفرض خودکار انتخاب خواهند شد
3. **Edit Device**: میتوانید تعرفه هر دستگاه را بعداً تغییر دهید
