import React, {useEffect, useRef, useState} from 'react';
import {Modal, ScrollView, View} from 'react-native';
import {PrimaryButton, SecondaryButton, Txt} from './components';
import {apiGet} from './api';
import {palette} from './theme';

const enabled = (value: unknown) => value === true || value === 1 || value === '1';
const disabled = (value: unknown) => value === false || value === 0 || value === '0';

export function canOpenStoreContact(data: any): boolean {
  // Only server-approved, enabled, non-owner chats can be opened.
  return enabled(data?.contact_chat_available) && !disabled(data?.contact_chat_enabled);
}

export function StoreContactAction({data, businessId, onPress, onSupport}: {data: any; businessId?: number; onPress: () => void; onSupport?: () => void}) {
  const available = canOpenStoreContact(data);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => {alive.current = true; return () => {alive.current = false;};}, []);
  const check = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const id = Number(businessId || data?.business?.id || data?.product?.business_id);
      if (!id) {setStatus(data); setOpen(true); return;}
      const current = await apiGet('business.contact', {id});
      if (!alive.current) return;
      setStatus(current);
      if (canOpenStoreContact(current)) {setOpen(false); onPress();}
      else setOpen(true);
    } catch (e: any) {if (alive.current) {setError(e.message || 'بررسی دسترسی انجام نشد. دوباره تلاش کنید.'); setOpen(true);}}
    finally {lock.current = false; if (alive.current) setBusy(false);}
  };
  const reason = (status || data)?.contact_chat_reason;
  const message = reason === 'disabled'
    ? 'گفتگو با کسب‌وکارها در تنظیمات سامانه غیرفعال است. برای پیگیری با پشتیبانی تماس بگیرید.'
    : reason === 'unapproved'
    ? 'گفتگو پس از تأیید کسب‌وکار فعال می‌شود.'
    : reason === 'owner'
    ? 'این کسب‌وکار متعلق به شماست. پیام مشتریان را در ربات بله دریافت می‌کنید.'
    : 'در حال حاضر امکان گفتگو با این کسب‌وکار وجود ندارد. وضعیت را دوباره بررسی کنید.';
  return <>
    <PrimaryButton title={busy ? 'در حال بررسی دسترسی…' : available ? 'گفتگوی رایگان با کسب‌وکار' : 'بررسی امکان گفتگو'}
      icon={available ? 'message-text-outline' : 'message-question-outline'} disabled={busy} onPress={check} />
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 22}}>
        <View accessibilityViewIsModal style={{backgroundColor: palette.surface, borderRadius: 24, padding: 20, maxHeight: '85%'}}>
          <ScrollView><Txt style={{fontSize: 18, fontWeight: '900', marginBottom: 12}}>وضعیت گفتگو</Txt>
            <Txt style={{color: palette.text2, lineHeight: 25, marginBottom: 18}}>{message}</Txt>
            {error ? <Txt accessibilityRole="alert" style={{color: palette.danger, marginBottom: 12}}>{error}</Txt> : null}
            <PrimaryButton title={busy ? 'در حال بررسی…' : 'بررسی دوباره دسترسی'} icon="refresh" disabled={busy} onPress={check} />
            {onSupport ? <SecondaryButton title="پیگیری از پشتیبانی" icon="headset" onPress={() => {setOpen(false); onSupport();}} /> : null}
            <SecondaryButton title="بستن" onPress={() => setOpen(false)} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

export function StoreContactNote({data}: {data: any}) {
  if (canOpenStoreContact(data)) return null;
  return <View style={{backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.border, borderRadius: 17, padding: 12, marginVertical: 9}}>
    <Txt style={{fontSize: 12, color: palette.text2, lineHeight: 21}}>برای بررسی امکان گفتگوی رایگان، دکمهٔ گفتگو را انتخاب کنید.</Txt>
  </View>;
}
