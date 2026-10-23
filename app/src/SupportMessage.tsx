import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppIcon, Txt} from './components';
import {palette} from './theme';

export type SupportRole = 'user' | 'support' | 'system';
export type SupportMessageData = {
  id: number | string;
  sender_role?: string;
  role?: string;
  body: string;
  created_at?: string;
  bale_status?: string;
};

export function supportRole(message: SupportMessageData): SupportRole {
  const role = String(message.sender_role || message.role || '').trim().toLowerCase();
  if (['user', 'requester', 'customer'].includes(role)) return 'user';
  if (['support', 'admin', 'agent', 'staff', 'manager'].includes(role)) return 'support';
  return 'system';
}

const deliveryLabels: Record<string, string> = {
  sent: 'تحویل به بله انجام شد',
  queued: 'ذخیره شده؛ تحویل به بله در صف است',
  failed: 'ذخیره شده؛ تحویل به بله ناموفق بود',
  unrouted: 'ذخیره شده؛ گیرندهٔ بله تعیین نشده است',
  stored: 'ذخیره شده در گفتگو',
};

export function SupportMessageBubble({message, adminView = false}: {
  message: SupportMessageData;
  adminView?: boolean;
}) {
  const role = supportRole(message);
  const user = role === 'user';
  const system = role === 'system';
  const label = user ? (adminView ? 'کاربر درخواست‌دهنده' : 'شما') : system ? 'پیام سامانه' : 'پشتیبانی';
  const color = user ? palette.userText : system ? palette.text2 : palette.supportText;
  const delivery = user && message.bale_status ? deliveryLabels[message.bale_status] : '';

  // Physical left/right placement stays the same in Persian and English device locales.
  // Role placement is also consistent in the administrator's transcript.
  return <View testID={`support-message-${message.id}`} style={[
    styles.row,
    {justifyContent: system ? 'center' : user ? 'flex-end' : 'flex-start'},
  ]}>
    <View style={[styles.group, {flexDirection: user ? 'row-reverse' : 'row'}]}>
      {!system && <View testID={`support-avatar-${message.id}`} accessible={false} style={[
        styles.avatar, {backgroundColor: user ? palette.primary : palette.secondary},
      ]}>
        <AppIcon name={user ? 'account-outline' : 'headset'} size={20} color="#FFFFFF" />
      </View>}
      <View testID={`support-bubble-${message.id}`} style={[
        styles.bubble,
        user ? styles.userBubble : system ? styles.systemBubble : styles.supportBubble,
      ]}>
        <Txt style={[styles.label, {color}]}>{label}</Txt>
        <Txt selectable style={[styles.body, {color}]}>{message.body}</Txt>
        {!!message.created_at && <Txt style={[styles.time, {color}]}>{message.created_at}</Txt>}
        {!!delivery && <Txt accessibilityLiveRegion="polite" style={[styles.delivery, {color}]}>{delivery}</Txt>}
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: {width: '100%', direction: 'ltr', flexDirection: 'row', marginBottom: 12},
  group: {maxWidth: '92%', flexShrink: 1, alignItems: 'flex-end', gap: 7, direction: 'ltr'},
  avatar: {width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 1},
  bubble: {flexShrink: 1, minWidth: 0, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10},
  userBubble: {backgroundColor: palette.userBubble, borderColor: palette.userBorder, borderBottomRightRadius: 5},
  supportBubble: {backgroundColor: palette.supportBubble, borderColor: palette.supportBorder, borderBottomLeftRadius: 5},
  systemBubble: {backgroundColor: palette.surface2, borderColor: palette.border},
  label: {fontWeight: '800', fontSize: 11.5, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl', marginBottom: 3},
  body: {fontSize: 14, lineHeight: 23, textAlign: 'right', writingDirection: 'rtl'},
  time: {fontSize: 10, lineHeight: 17, marginTop: 5, textAlign: 'right', writingDirection: 'rtl'},
  delivery: {fontSize: 10.5, lineHeight: 18, marginTop: 3, textAlign: 'right', writingDirection: 'rtl'},
});
