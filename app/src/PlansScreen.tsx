import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {apiGet} from './api';
import {AppIcon, EmptyState, ErrorState, Loader, SurfaceCard, Txt} from './components';
import {palette} from './theme';

// The Bazaar release does not offer digital purchases until verified Bazaar billing exists.
// Existing server-side entitlements and quotas remain available to their owners.
export function PlansScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {setData(await apiGet('subscriptions.mine'));}
    catch (e: any) {setError(e.message);}
    finally {setLoading(false);}
  };
  useEffect(() => {load();}, []);
  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  return <ScrollView contentContainerStyle={{padding: 14, paddingBottom: 28}}>
    <SurfaceCard style={{backgroundColor: palette.secondarySoft}}>
      <AppIcon name="folder-check-outline" size={30} color={palette.secondary} />
      <Txt style={{fontSize: 18, lineHeight: 28, fontWeight: '900', marginTop: 8}}>اشتراک و ظرفیت شما</Txt>
      <Txt style={{color: palette.supportText, marginTop: 6}}>وضعیت اشتراک و فضای مصرف‌شدهٔ کسب‌وکارهای شما در این بخش نمایش داده می‌شود.</Txt>
    </SurfaceCard>
    {(data?.businesses || []).map((item: any) => {
      const quota = item.quota || {};
      const used = Number(quota.storage_used_mb || 0);
      const limit = Number(quota.storage_limit_mb || 0);
      return <SurfaceCard key={item.business.id}>
        <Txt style={{fontSize: 16, fontWeight: '800'}}>{item.business.name}</Txt>
        <Txt style={{color: palette.text2, marginTop: 6}}>پلن فعلی: {quota.plan_name || item.subscription?.plan_name || 'رایگان'}</Txt>
        <View style={{height: 7, borderRadius: 4, backgroundColor: palette.surface2, marginVertical: 12, overflow: 'hidden', direction: 'rtl'}}>
          <View style={{height: 7, borderRadius: 4, backgroundColor: palette.secondary, width: `${Math.max(0, Math.min(100, used / Math.max(1, limit) * 100))}%`}} />
        </View>
        <Txt style={{color: palette.text2}}>{used} از {limit} مگابایت مصرف شده</Txt>
      </SurfaceCard>;
    })}
    {!data?.businesses?.length && <EmptyState title="کسب‌وکاری برای نمایش ظرفیت ثبت نشده است" />}
    <Txt style={{color: palette.text2, fontSize: 12, marginTop: 12}}>در نسخهٔ فعلی، خرید یا تمدید اشتراک داخل اپلیکیشن ارائه نمی‌شود. امکانات و ظرفیت فعال حساب شما قابل استفاده‌اند.</Txt>
  </ScrollView>;
}
