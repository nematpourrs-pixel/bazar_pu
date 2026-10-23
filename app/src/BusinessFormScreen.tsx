import React, {useEffect, useRef, useState} from 'react';
import {Image, Modal, Pressable, ScrollView, TextInput, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {apiGet, apiPost, requestId, uploadBusinessMedia} from './api';
import {AppIcon, PrimaryButton, SecondaryButton, SurfaceCard, Txt} from './components';
import {SelectSheet} from './SelectSheet';
import {palette} from './theme';

const title = (x: any) => typeof x === 'string' ? x : x?.title || x?.name || '';
export function BusinessFormScreen({initial, onDone}: any) {
  const current = initial?.business || {};
  const [form, setForm] = useState<any>({name: current.name || '', manager_name: current.manager_name || '', phone: current.phone || '', public_phone: current.public_phone || '', public_phone_hidden: !!Number(current.public_phone_hidden), address: current.address || '', description: current.description || '', province: current.province || null, city: current.city || null, types: initial?.types || [], categories: initial?.categories || [], subcategories: initial?.subcategories || []});
  const [catalog, setCatalog] = useState<any>({provinces: [], cities: [], types: [], categories: [], subcategories: []});
  const [picker, setPicker] = useState('');
  const [terms, setTerms] = useState<any>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [asset, setAsset] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const savedId = useRef(Number(current.id || 0));
  const savedBody = useRef('');
  const submission = useRef<any>(null);
  const sending = useRef(false);
  const edit = !!current.id;

  const loadCatalog = async (params = {}) => {
    const x = await apiGet('search.filters', params);
    setCatalog((c: any) => ({...c, ...x})); return x;
  };
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [x, rules] = await Promise.all([apiGet('search.filters'), apiGet('business.terms')]);
        if (!active) return;
        setCatalog(x); setTerms(rules);
        const province = (x.provinces || []).find((p: any) => title(p) === current.province);
        if (province) {
          const y = await apiGet('search.filters', {province_id: province.id});
          if (!active) return;
          setCatalog((c: any) => ({...c, ...y}));
          setForm((f: any) => ({...f, province, city: (y.cities || []).find((c: any) => title(c) === current.city) || current.city}));
        }
      } catch (e: any) {if (active) setError(e.message);}
    })();
    return () => {active = false;};
  }, []);

  const select = async (x: any) => {
    const selected = picker; setPicker(''); setError('');
    if (selected === 'province') {
      setForm((f: any) => ({...f, province: x, city: null}));
      try {await loadCatalog({province_id: x.id});} catch (e: any) {setError(e.message);}
    } else if (selected === 'city') setForm((f: any) => ({...f, city: x}));
    else {
      const key = selected === 'type' ? 'types' : selected === 'category' ? 'categories' : 'subcategories';
      setForm((f: any) => ({...f, [key]: f[key].some((i: any) => i.id === x.id) ? f[key] : [...f[key], x]}));
    }
  };
  const remove = (key: string, id: number) => setForm((f: any) => ({...f, [key]: f[key].filter((x: any) => x.id !== id), ...(key === 'categories' ? {subcategories: f.subcategories.filter((x: any) => Number(x.category_id) !== id)} : {})}));
  const pickPhoto = async () => {
    try {const r = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1}); if (!r.didCancel && r.assets?.[0]) setAsset(r.assets[0]); else if (r.errorMessage) setError(r.errorMessage);} catch {setError('انتخاب تصویر انجام نشد. دوباره تلاش کنید.');}
  };
  const save = async () => {
    if (sending.current) return;
    if (!form.name.trim() || !form.manager_name.trim() || !form.phone.trim()) {setError('نام کسب‌وکار، نام مدیر و شماره تماس را کامل کنید.'); return;}
    if (!form.province || !form.city || !form.types.length || !form.categories.length) {setError('استان، شهر، نوع فعالیت و دسته‌بندی را انتخاب کنید.'); return;}
    if (!terms || !accepted) {setError('قوانین را مطالعه و تأیید کنید.'); return;}
    sending.current = true; setBusy(true); setError('');
    const body = {name: form.name, manager_name: form.manager_name, phone: form.phone, public_phone: form.public_phone, public_phone_hidden: form.public_phone_hidden, province: title(form.province), city: title(form.city), address: form.address, description: form.description, type_slugs: form.types.map((x: any) => x.slug), category_ids: form.categories.map((x: any) => x.id), subcategory_ids: form.subcategories.map((x: any) => x.id), terms_version: terms.version, terms_accepted: true};
    const signature = JSON.stringify(body);
    try {
      if (savedBody.current !== signature) {
        if (!submission.current || submission.current.signature !== signature) submission.current = {signature, request_id: requestId()};
        const result = await apiPost(savedId.current ? 'business.update' : 'business.create', {...body, ...(savedId.current ? {business_id: savedId.current} : {}), request_id: submission.current.request_id});
        savedId.current = Number(result.business_id); savedBody.current = signature; submission.current = null;
      }
      if (asset) await uploadBusinessMedia(savedId.current, asset);
      onDone();
    } catch (e: any) {setError((savedBody.current === signature && asset ? 'اطلاعات ثبت شد؛ بارگذاری تصویر انجام نشد. با تلاش مجدد کسب‌وکار تکراری ساخته نمی‌شود.\n' : '') + e.message);} finally {sending.current = false; setBusy(false);}
  };

  const field = (key: string, label: string, multiline = false, phone = false) => <View key={key} style={{marginBottom: 12}}><Txt style={{fontWeight: '700', marginBottom: 5}}>{label}</Txt><TextInput accessibilityLabel={label} value={form[key]} onChangeText={v => setForm((f: any) => ({...f, [key]: v}))} keyboardType={phone ? 'phone-pad' : 'default'} multiline={multiline} style={{minHeight: multiline ? 100 : 50, borderWidth: 1, borderColor: palette.border, borderRadius: 15, padding: 12, backgroundColor: '#fff', color: palette.text, textAlign: 'right', writingDirection: 'rtl', textAlignVertical: multiline ? 'top' : 'center'}} /></View>;
  const row = (label: string, value: string, action: () => void) => <Pressable onPress={action} style={{padding: 14, backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: palette.border, marginBottom: 10}}><Txt style={{fontWeight: '700'}}>{label}</Txt><Txt style={{color: palette.text2}}>{value}</Txt></Pressable>;
  const chips = (key: string) => <View style={{flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 12}}>{form[key].map((x: any) => <Pressable key={x.id} accessibilityLabel={'حذف ' + title(x)} onPress={() => remove(key, x.id)} style={{padding: 8, borderRadius: 12, backgroundColor: palette.primarySoft}}><Txt>{title(x)} ×</Txt></Pressable>)}</View>;
  const items = picker === 'province' ? catalog.provinces : picker === 'city' ? catalog.cities : picker === 'type' ? catalog.types : picker === 'category' ? catalog.categories : (catalog.subcategories || []).filter((x: any) => form.categories.some((c: any) => Number(c.id) === Number(x.category_id)));
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding: 16, paddingBottom: 30}}>
    <Pressable accessibilityLabel="انتخاب تصویر کسب‌وکار" onPress={pickPhoto} style={{alignSelf: 'center', width: 110, height: 110, borderRadius: 28, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 16}}>{asset?.uri || current.cover?.url ? <Image source={{uri: asset?.uri || current.cover.url}} style={{width: 110, height: 110}} /> : <AppIcon name="camera-plus-outline" size={34} color={palette.primary} />}</Pressable>
    {field('name','نام کسب‌وکار')}{field('manager_name','نام مدیر')}{field('phone','شماره تماس',false,true)}
    {row('استان',title(form.province)||'انتخاب استان',()=>setPicker('province'))}
    {row('شهر',title(form.city)||'انتخاب شهر',()=>{if(form.province)setPicker('city');else setError('ابتدا استان را انتخاب کنید.');})}
    {row('نوع فعالیت','افزودن نوع فعالیت',()=>setPicker('type'))}{chips('types')}
    {row('دسته‌بندی','افزودن دسته',()=>setPicker('category'))}{chips('categories')}
    {row('زیرگروه','افزودن زیرگروه',()=>{if(form.categories.length)setPicker('subcategory');else setError('ابتدا دسته‌بندی را انتخاب کنید.');})}{chips('subcategories')}
    {field('public_phone','شماره تماس عمومی (اختیاری)',false,true)}
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked:form.public_phone_hidden}} onPress={()=>setForm((f:any)=>({...f,public_phone_hidden:!f.public_phone_hidden}))} style={{paddingVertical:12}}><Txt>{form.public_phone_hidden?'☑':'☐'} شماره عمومی نمایش داده نشود</Txt></Pressable>
    {field('address','نشانی')}{field('description','معرفی کسب‌وکار',true)}
    <SurfaceCard><SecondaryButton title="مطالعه قوانین" onPress={()=>setTermsOpen(true)} /><Pressable accessibilityRole="checkbox" accessibilityState={{checked:accepted}} onPress={()=>setAccepted(v=>!v)} style={{paddingVertical:14}}><Txt>{accepted?'☑':'☐'} قوانین را مطالعه کرده‌ام و می‌پذیرم.</Txt></Pressable><Txt style={{fontSize:12,color:palette.text2}}>نام، مدیر، نشانی، توضیحات و سایر مشخصات پروفایل پس از تأیید عمومی‌اند. شماره تماس فقط در صورت ثبت به‌عنوان شماره عمومی و غیرفعال‌بودن گزینهٔ مخفی‌سازی نمایش داده می‌شود.</Txt></SurfaceCard>
    {!!error&&<Txt accessibilityRole="alert" style={{color:palette.danger,marginVertical:12}}>{error}</Txt>}
    <PrimaryButton title={busy?'در حال ذخیره…':edit?'ذخیره و ارسال برای بررسی':'ثبت و ارسال برای بررسی'} onPress={save} disabled={busy||!terms}/>
    <SelectSheet visible={!!picker} title="انتخاب" items={items||[]} onSelect={select} onClose={()=>setPicker('')} />
    <Modal visible={termsOpen} animationType="slide" onRequestClose={()=>setTermsOpen(false)}><View style={{flex:1,padding:20,backgroundColor:palette.background}}><ScrollView contentContainerStyle={{paddingVertical:25}}>{!terms?<Txt>در حال دریافت قوانین…</Txt>:(terms.sections||[terms.notice]).map((text:string,i:number)=><Txt key={i} style={{marginBottom:20}}>{text}</Txt>)}</ScrollView><PrimaryButton title="بستن قوانین" onPress={()=>setTermsOpen(false)}/></View></Modal>
  </ScrollView>;
}
