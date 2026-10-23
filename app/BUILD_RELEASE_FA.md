# ساخت اندروید ۳.۸.۲

شناسهٔ برنامه `ir.picamo.bazar`، کد نسخه `382`، حداقل API 24 و target/compile API 36 است. پایهٔ برنامه React Native 0.82.0 و React 19.1.1 است.

ابزارهای لازم: Node 20.19.4 یا بالاتر، JDK کامل 17 دارای javac، Android SDK و Build Tools 36، NDK 27.1.12297006 و CMake 3.22.1. کتابخانهٔ ویدئو ممکن است SDK و Build Tools 35 را نیز بخواهد.

```sh
npm ci
npx tsc --noEmit
npx jest --runInBand
cd android
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a --max-workers=2
```

SDK را در متغیر ANDROID_HOME یا android/local.properties مشخص کنید. تنظیمات خصوصی محیط ساخت در این ZIP نیست.

اسکریپت postinstall، resolver اختیاری دانلود خودکار JDK را حذف می‌کند و ابزار ساخت safe-area را با AGP 8.12.0 برنامه هماهنگ می‌کند. نسخهٔ runtime کتابخانه تغییر نکرده است. نسخه‌های وابستگی‌ها در package-lock.json تثبیت شده‌اند. npm ci باید اجازهٔ اجرای postinstall را داشته باشد.

خروجی unsigned در android/app/build/outputs/apk/release ایجاد می‌شود. با zipalign دارای گزینهٔ -P 16 هم‌ترازی را بررسی کنید و با apksigner و همان کلید خصوصی انتشار قبلی امضا کنید. نسخهٔ release قابل دیباگ نیست و R8 و حذف منابع بلااستفاده فعال هستند.

کلید خصوصی انتشار و گذرواژه‌ها در سورس نیستند. فایل debug.keystore فقط کلید استاندارد توسعه است و در انتشار استفاده نمی‌شود.

این انتشار مخصوص اندروید و مسیر انتشار بازار است. فروش پلن یا دسترسی ارتباطی درون اپ ارائه نمی‌شود؛ سهمیه‌ها و دسترسی‌های قبلی سرور حفظ می‌شوند. برای اضافه شدن فروش، پیاده‌سازی Billing رسمی بازار همراه با تأیید امن رسید در سرور و محصولات واقعی پیشخان لازم است؛ تنها روشن کردن billing.config کافی نیست.

فایل‌های مهم: src/SupportScreen.tsx، src/SupportMessage.tsx، src/theme.ts، src/PrivacyScreen.tsx، src/PlansScreen.tsx، src/StoreContact.tsx، src/authLinks.ts و منابع launcher اندروید. فایل‌های iOS قبلی حفظ شده‌اند، اما برای این انتشار ساخته یا آزمایش نشده‌اند.
