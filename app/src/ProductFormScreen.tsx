import React, {useRef, useState} from 'react';
import {ScrollView, TextInput} from 'react-native';
import {apiPost, requestId} from './api';
import {PrimaryButton, SecondaryButton, Txt} from './components';
import {SelectSheet} from './SelectSheet';
import {palette} from './theme';

const digits = (value: string) => value.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
export function ProductFormScreen({businesses, onDone}: any) {
  const eligible = (businesses || []).filter((b: any) => b.status === 'approved');
  const [form, setForm] = useState({business_id: eligible[0]?.id || 0, name: '', description: '', price: '', unit: 'عدد'});
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false), pending = useRef<any>(null);
  const business = eligible.find((b: any) => Number(b.id) === Number(form.business_id));
  const submit = async () => {
    if (locked.current) return;
    if (!form.name.trim() || !business) {setError('نام محصول و یک کسب‌وکار تأییدشده را انتخاب کنید.'); return;}
    const payload = {...form, name: form.name.trim(), price: Number(form.price || 0)};
    const signature = JSON.stringify(payload);
    if (pending.current?.signature !== signature) pending.current = {signature, payload: {...payload, request_id: requestId()}};
    locked.current = true; setBusy(true); setError('');
    try {await apiPost('product.create', pending.current.payload); onDone();}
    catch (e: any) {setError(e.message);}
    finally {locked.current = false; setBusy(false);}
  };
  const field = (key: 'name' | 'price' | 'unit' | 'description', label: string) => <React.Fragment key={key}>
    <Txt style={{marginBottom: 6, marginTop: 14, fontWeight: '700'}}>{label}</Txt>
    <TextInput accessibilityLabel={label} value={form[key]} maxLength={key === 'description' ? 1000 : key === 'name' ? 120 : 40} multiline={key === 'description'} keyboardType={key === 'price' ? 'number-pad' : 'default'}
      onChangeText={value => setForm({...form, [key]: key === 'price' ? digits(value).replace(/\D/g, '') : value})}
      style={{minHeight: 48, padding: 12, borderWidth: 1, borderColor: palette.border, borderRadius: 14, textAlign: 'right', color: palette.text, backgroundColor: '#fff'}} />
  </React.Fragment>;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding: 16, paddingBottom: 30}}>
    <Txt style={{marginBottom: 10}}>محصول پس از بررسی مدیریت منتشر می‌شود و از ظرفیت پلن کسب‌وکار استفاده می‌کند.</Txt>
    {eligible.length ? <SecondaryButton title={business?.name || 'انتخاب کسب‌وکار'} onPress={() => setPicker(true)} /> : <Txt>ابتدا کسب‌وکار شما باید تأیید شود.</Txt>}
    {field('name', 'نام محصول')}{field('price', 'قیمت به تومان')}{field('unit', 'واحد')}{field('description', 'توضیحات')}
    {!!error && <Txt accessibilityRole="alert" style={{color: palette.danger, marginVertical: 12}}>{error}</Txt>}
    <PrimaryButton title={busy ? 'در حال ثبت…' : 'ثبت محصول'} disabled={busy || !business || !form.name.trim()} onPress={submit} />
    <SelectSheet visible={picker} title="انتخاب کسب‌وکار" items={eligible} selectedId={form.business_id} onClose={() => setPicker(false)} onSelect={(b: any) => setForm({...form, business_id: b.id})} />
  </ScrollView>;
}
