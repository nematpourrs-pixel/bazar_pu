# بازار کسب‌وکار — Bazar Business (Android)

اپلیکیشن بازار کسب‌وکار، بستری برای اتصال **تولیدکننده، عمده‌فروش، فروشنده و مشتری**.

- **شناسه:** `ir.picamo.bazar`
- **نسخه سورس:** 3.8.5 (`versionCode=385`)
- **محیط:** React Native 0.82، Android API 36، حداقل Android API 24
- **خروجی:** APK آزمایشی در [GitHub Actions](../../actions/workflows/build-android-v385.yml) و بخش [Releases](../../releases)

## دریافت و بازسازی سورس

فایل ZIP اصلی سورس برای انتقال مطمئن به GitHub به **۱۱ بخش Base64** تقسیم شده و در مسیر `source-archive/v3.8.5` قرار دارد. ساخت خودکار بخش‌ها را به ترتیب ترکیب می‌کند و **SHA-256** را کنترل می‌کند.

```bash
cat source-archive/v3.8.5/part-*.b64 | base64 -d > BazarBusiness-v3.8.5-source.zip
sha256sum BazarBusiness-v3.8.5-source.zip
# Expected: f3c042335a93c046e18d72d69a8ae6395c7e533c90d3214bf38501dac58088b1
unzip BazarBusiness-v3.8.5-source.zip -d app
cd app
npm ci --legacy-peer-deps
npx tsc --noEmit
npx jest --runInBand
```

## انتشار در کافه‌بازار

فایل `*-TEST-SIGNED.apk` صرفاً آزمایشی است و **برای انتشار یا نصب روی نسخه امضاشده قبلی مناسب نیست**. فایل `*-UNSIGNED.apk` هم قابل نصب نیست. نسخه قابل انتشار باید با **همان کلید خصوصی امضای اصلی** در محیطی جداگانه، با ابزار رسمی `zipalign` و `apksigner`، امضا و راستی‌آزمایی شود.

**امنیت:** هیچ توکن ربات بله، رمز عبور، کلید امضای اصلی یا `.jks` در این مخزن عمومی قرار ندهید. موفقیت ساخت، به‌تنهایی تضمین تأیید کافه‌بازار یا Google Play Protect نیست.
