import * as Keychain from 'react-native-keychain';

export const API_BASE = 'https://picamo.ir/bale-bot/public/mobile_api.php';
const SERVICE = 'ir.picamo.bazar.session';
const ADMIN_SERVICE = 'ir.picamo.bazar.admin-return';

export type ApiResult = Record<string, any>;

export async function getToken(): Promise<string> {
  const c = await Keychain.getGenericPassword({service: SERVICE});
  return c ? c.password : '';
}
export async function setToken(token: string) {
  await Keychain.setGenericPassword('session', token, {service: SERVICE});
}
export async function clearToken() {
  await Keychain.resetGenericPassword({service: SERVICE});
  await Keychain.resetGenericPassword({service: ADMIN_SERVICE});
}
export async function saveAdminSession() {const token=await getToken();if(token)await Keychain.setGenericPassword('admin',token,{service:ADMIN_SERVICE});}
export async function restoreAdminSession() {
  const saved=await Keychain.getGenericPassword({service:ADMIN_SERVICE});
  if(!saved)throw new Error('نشست مدیر ذخیره نشده است؛ از حساب آزمایشی خارج شوید و با حساب مدیر وارد شوید.');
  const previous=await getToken();await setToken(saved.password);
  try{const boot=await apiGet('bootstrap');if(!boot.user?.is_admin)throw new Error('این حساب دسترسی مدیریت ندارد.');return boot;}
  catch(e){await setToken(previous);throw e;}
}

function qs(params: Record<string, any> = {}) {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return s ? `&${s}` : '';
}

export const requestId = () => `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
async function fetchTimed(url: string, options: any, signal?: AbortSignal) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel);
  const timer = setTimeout(cancel, 25000);
  try { return await fetch(url, {...options, signal: controller.signal}); }
  catch (e: any) { if (!signal?.aborted && controller.signal.aborted) throw new Error('پاسخ سرور دیر رسید. برای تلاش مجدد، دوباره ارسال را بزنید.'); throw e; }
  finally {clearTimeout(timer); signal?.removeEventListener('abort', cancel);}
}

export async function apiGet(action: string, params: Record<string, any> = {}, authenticated = true, signal?: AbortSignal): Promise<ApiResult> {
  const token = authenticated ? await getToken() : '';
  const res = await fetchTimed(`${API_BASE}?action=${encodeURIComponent(action)}${qs(params)}`, {
    headers: token ? {Authorization: `Bearer ${token}`, Accept: 'application/json'} : {Accept: 'application/json'},
  }, signal);
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`پاسخ نامعتبر سرور (${res.status})`); }
  if (!res.ok || data?.ok === false) throw Object.assign(new Error(errorMessage(data?.error, res.status, data)), {status: res.status, code: data?.error});
  return data;
}

export async function apiPost(action: string, body: Record<string, any> = {}, authenticated = true): Promise<ApiResult> {
  const token = authenticated ? await getToken() : '';
  const res = await fetchTimed(`${API_BASE}?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Accept: 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`پاسخ نامعتبر سرور (${res.status})`); }
  if (!res.ok || data?.ok === false) throw Object.assign(new Error(errorMessage(data?.error, res.status, data)), {status: res.status, code: data?.error});
  return data;
}

export async function uploadMedia(productId: number, asset: any): Promise<ApiResult> {
  const token = await getToken();
  const fd = new FormData();
  fd.append('product_id', String(productId));
  fd.append('file', {uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `media-${Date.now()}`} as any);
  const res = await fetch(`${API_BASE}?action=product.media.upload`, {
    method: 'POST', headers: {Authorization: `Bearer ${token}`, Accept: 'application/json'}, body: fd,
  });
  const data = await res.json();
  if (!res.ok || data?.ok === false) throw Object.assign(new Error(errorMessage(data?.error, res.status, data)), {status: res.status, code: data?.error});
  return data;
}

export async function uploadBusinessMedia(businessId: number, asset: any): Promise<ApiResult> {
  const token = await getToken();
  const fd = new FormData();
  fd.append('business_id', String(businessId));
  fd.append('file', {uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `business-${Date.now()}.jpg`} as any);
  const res = await fetch(`${API_BASE}?action=business.media.upload`, {method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},body:fd});
  const text=await res.text();let data:any;try{data=JSON.parse(text)}catch{throw new Error(`پاسخ نامعتبر سرور (${res.status})`)}
  if(!res.ok||data?.ok===false) throw new Error(errorMessage(data?.error,res.status,data));
  return data;
}

export function errorMessage(code?: string, status?: number, data?: any) {
  const map: Record<string,string> = {
    thread_closed: 'گفتگو بسته شده است. گفتگوی جدیدی آغاز کنید.',
    chat_with_self: 'برای پیام‌های مشتریان از بخش پیام‌ها استفاده کنید.',
    too_many_messages: 'برای جلوگیری از ارسال انبوه پیام، کمی بعد تلاش کنید.',
    invalid_business: 'شناسه کسب‌وکار معتبر نیست.',
    invalid_thread: 'گفتگوی انتخاب‌شده معتبر نیست.',
    chat_schema_missing: 'بسته سرور گفتگو نصب نشده است؛ ابتدا سرور را به‌روزرسانی کنید.',
    support_disabled: 'پشتیبانی موقتاً غیرفعال است.',
    invalid_message: 'پیام خالی است یا بیش از ۲۰۰۰ حرف دارد.',
    request_id_conflict: 'این درخواست قبلاً با محتوای دیگری ثبت شده است.',
    terms_required: 'قوانین فعلی را مطالعه و تأیید کنید.',
    invalid_phone: 'شماره تماس معتبر وارد کنید (مانند ۰۹۱۲۱۲۳۴۵۶۷).',
    invalid_location: 'شهر باید متعلق به استان انتخاب‌شده باشد.',
    invalid_business_type: 'نوع فعالیت معتبر انتخاب کنید.',
    invalid_category: 'دسته‌بندی معتبر انتخاب کنید.',
    invalid_subcategory: 'زیرگروه باید متعلق به دسته انتخاب‌شده باشد.',
    business_not_approved: 'ابتدا کسب‌وکار باید تأیید شود.',
    product_limit: 'ظرفیت محصول پلن شما تکمیل شده است.',
    required_manager_name: 'نام مدیر کسب‌وکار را وارد کنید.',
    required_province: 'استان را انتخاب کنید.',
    required_city: 'شهر را انتخاب کنید.',
    unauthorized: 'نشست شما منقضی شده است. دوباره وارد شوید.',
    forbidden: 'دسترسی لازم برای این عملیات را ندارید.',
    not_found: 'مورد درخواستی پیدا نشد.',
    invalid_request: 'درخواست ورود نامعتبر است.',
    invalid_ticket: 'لینک ورود نامعتبر است. دوباره از بله وارد شوید.',
    ticket_expired_or_invalid: 'لینک ورود منقضی شده یا قبلاً استفاده شده است. دوباره از بله وارد شوید.',
    request_expired_or_invalid: 'درخواست ورود منقضی شده است. دوباره تلاش کنید.',
    too_many_requests: 'تعداد درخواست‌ها زیاد است. چند دقیقه دیگر دوباره تلاش کنید.',
    file_too_large: `حجم فایل بیشتر از حد مجاز است${data?.max_mb ? ` (حداکثر ${data.max_mb} مگابایت)` : ''}.`,
    unsupported_media_type: 'فرمت این فایل پشتیبانی نمی‌شود.',
    storage_limit: 'فضای رسانه پلن شما تکمیل شده است. پلن یا فضای ذخیره‌سازی را ارتقا دهید.',
    media_count_limit: 'تعداد رسانه مجاز برای این محصول تکمیل شده است.',
    business_owner_required: 'این قابلیت فقط برای مالک کسب‌وکار فعال است.',
    mobile_auth_secret_unavailable: 'ورود امن موقتاً در دسترس نیست. دوباره تلاش کنید.',
    mobile_auth_schema_unavailable: 'ورود امن موقتاً در دسترس نیست. دوباره تلاش کنید.',
    mobile_auth_tables_missing: 'ورود امن موقتاً در دسترس نیست. دوباره تلاش کنید.',
    server_error: 'در سرور خطایی رخ داد. دوباره تلاش کنید.',
    unknown_action: 'نسخه سرور این قابلیت را نمی‌شناسد. از مدیر بخواهید بسته ۶.۹.۶۴ یا جدیدتر را در مسیر صحیح نصب کند و Migration را اجرا کند.',
    unknown_commercial_action: 'نسخه API تجاری با این نسخه اپ سازگار نیست. به‌روزرسانی سرور ضروری است.',
    commercial_schema_missing: 'جدول‌های فرصت‌های تجاری هنوز نصب نشده‌اند. مدیر باید Migration را اجرا کند.',
  };
  return map[code || ''] || `خطای سرویس${status ? ` (${status})` : ''}${code ? `: ${code}` : ''}`;
}
