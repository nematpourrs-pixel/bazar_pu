import React from 'react';
import {Linking, Pressable, ScrollView, View} from 'react-native';
import {CachedImage as Image} from './CachedImage';
import {AppIcon, Txt} from './components';
import {palette} from './theme';

export function publicBusinessLabels(data: any): {label: string; value: string}[] {
  const b = data?.business || {};
  const names = (key: string) => (Array.isArray(data?.[key]) ? data[key] : [])
    .map((item: any) => String(item?.name || item?.title || '').trim())
    .filter(Boolean).join('، ');
  const fields: {label: string; value: string}[] = [
    {label: 'مدیر کسب‌وکار', value: String(b.manager_name || '')},
    {label: 'استان', value: String(b.province || '')},
    {label: 'شهر', value: String(b.city || '')},
    {label: 'نوع فعالیت', value: names('types')},
    {label: 'دسته‌بندی', value: names('categories')},
    {label: 'زیرگروه', value: names('subcategories')},
    {label: 'نشانی کسب‌وکار', value: String(b.address || '')},
  ];
  if (b.public_phone && !Number(b.public_phone_hidden)) {
    fields.push({label: 'شماره تماس عمومی', value: String(b.public_phone)});
  }
  return fields.filter(x => x.value.trim() !== '');
}

export function BusinessPublicInfo({data}: {data: any}) {
  const items = publicBusinessLabels(data);
  const b = data?.business || {};
  const gallery = (Array.isArray(data?.media) ? data.media : [])
    .filter((x: any) => x?.url && (x?.media_type === 'photo' || x?.type === 'photo' || x?.media_type === 'image'));
  return <>
    <View style={{backgroundColor: '#fff', borderWidth: 1, borderColor: palette.border, borderRadius: 18, padding: 14, marginBottom: 10}}>
      <Txt style={{fontSize: 15, fontWeight: '900', textAlign: 'right', marginBottom: 8}}>مشخصات کسب‌وکار</Txt>
      {items.map(item => <View key={item.label} style={{paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: palette.border}}>
        <Txt style={{fontSize: 11, color: palette.text2, textAlign: 'right'}}>{item.label}</Txt>
        <Txt style={{fontSize: 13.5, lineHeight: 24, textAlign: 'right', fontWeight: '600'}}>{item.value}</Txt>
      </View>)}
      {b.public_phone && !Number(b.public_phone_hidden) ? <Pressable accessibilityLabel="تماس با کسب‌وکار" onPress={() => Linking.openURL(`tel:${String(b.public_phone).replace(/[^+0-9]/g, '')}`)} style={{flexDirection: 'row-reverse', alignItems: 'center', marginTop: 12, gap: 6}}>
        <AppIcon name="phone-outline" color={palette.primary} size={18}/><Txt style={{color: palette.primary, fontWeight: '800'}}>تماس با کسب‌وکار</Txt>
      </Pressable> : null}
      {!items.length ? <Txt style={{textAlign: 'right', color: palette.text2}}>اطلاعات تکمیلی ثبت نشده است.</Txt> : null}
    </View>
    {gallery.length > 1 ? <View style={{marginBottom: 12}}><Txt style={{fontWeight: '900', fontSize: 15, textAlign: 'right', marginBottom: 8}}>تصاویر کسب‌وکار</Txt><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, flexDirection: 'row-reverse'}}>{gallery.map((m: any, i: number) => <Image key={String(m.id || i)} source={{uri: m.url}} resizeMode="cover" style={{width: 120, height: 102, borderRadius: 12}}/>)}</ScrollView></View> : null}
  </>;
}
