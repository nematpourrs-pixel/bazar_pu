import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, RefreshControl, ScrollView, View} from 'react-native';
import {apiGet} from './api';
import {AppIcon, EmptyState, ErrorState, Loader, SecondaryButton, Txt} from './components';
import {CachedImage} from './CachedImage';
import {palette} from './theme';

export function BusinessNetworkScreen({businessId, navigate}: {businessId?: number; navigate: (name: string, params?: any) => void}) {
  const followers = businessId !== undefined;
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState('');
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async (offset = 0) => {
    if (pending.current) return;
    const current = generation.current;
    pending.current = true;
    setBusy(true);
    try {
      const d = await apiGet(followers ? 'business.followers' : 'following.mine', {business_id: businessId, offset});
      if (!alive.current || generation.current !== current) return;
      const page = followers ? d.followers : d.businesses;
      setRows(old => offset === 0 ? page || [] : followers ? [...old, ...(page || [])] : Array.from(new Map([...old, ...(page || [])].map(x => [x.id, x])).values()));
      setTotal(Number(d.total) || 0);
      setName(d.business?.name || '');
      setNext(d.next_offset ?? null);
      setError('');
    } catch (e: any) {if (alive.current && generation.current === current) setError(e.message);}
    finally {if (generation.current === current) pending.current = false; if (alive.current && generation.current === current) {setLoading(false); setBusy(false);}}
  }, [businessId, followers]);
  useEffect(() => {alive.current = true; generation.current++; pending.current = false; load(); return () => {alive.current = false; generation.current++;};}, [load]);
  if (loading) return <Loader />;
  if (error && !rows.length) return <ErrorState message={error} onRetry={() => load()} />;
  return <ScrollView refreshControl={<RefreshControl refreshing={busy && !loading} onRefresh={() => load()} colors={[palette.primary]} />} contentContainerStyle={{padding: 14, paddingBottom: 30}}>
    <Txt style={{fontSize: 18, fontWeight: '900'}}>{followers ? name : 'کسب‌وکارهای دنبال‌شده'}</Txt>
    <Txt style={{color: palette.text2, marginTop: 4, marginBottom: 16}}>{total} {followers ? 'دنبال‌کننده' : 'کسب‌وکار'}</Txt>
    {error ? <Txt accessibilityRole="alert" style={{color: palette.danger, marginBottom: 12}}>{error}</Txt> : null}
    {!rows.length ? <EmptyState title={followers ? 'هنوز دنبال‌کننده‌ای ندارید' : 'هنوز کسب‌وکاری را دنبال نکرده‌اید'} detail={followers ? 'افرادی که این کسب‌وکار را دنبال کنند، اینجا نمایش داده می‌شوند.' : 'در صفحهٔ کسب‌وکار دلخواه، «دنبال کردن» را بزنید.'} /> : rows.map((x, i) => followers ?
      <View key={`${x.followed_at}-${i}`} style={{backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 9, flexDirection: 'row-reverse', gap: 12, alignItems: 'center'}}>
        <AppIcon name="account-circle-outline" color={palette.primary} size={30} /><View style={{flex: 1}}><Txt style={{fontWeight: '800'}}>{x.display_name || 'کاربر'}</Txt><Txt style={{color: palette.text2, fontSize: 12, marginTop: 4}}>از {x.followed_at}</Txt></View>
      </View> :
      <Pressable accessibilityRole="button" accessibilityLabel={`مشاهده ${x.name}`} key={x.id} onPress={() => navigate('businessDetail', {id: x.id})} style={{backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 9, flexDirection: 'row-reverse', gap: 12, alignItems: 'center'}}>
        {x.cover?.url ? <CachedImage source={{uri: x.cover.url}} style={{width: 52, height: 52, borderRadius: 16}} /> : <AppIcon name="storefront-outline" color={palette.primary} size={30} />}
        <View style={{flex: 1}}><Txt numberOfLines={1} style={{fontWeight: '900'}}>{x.name}</Txt><Txt style={{color: palette.text2, fontSize: 12, marginTop: 4}}>{[x.province, x.city].filter(Boolean).join('، ')}</Txt></View><AppIcon name="chevron-left" color={palette.text2} />
      </Pressable>)}
    {next !== null ? <SecondaryButton title={busy ? 'در حال دریافت…' : 'نمایش بیشتر'} icon="chevron-down" disabled={busy} onPress={() => load(next)} /> : null}
  </ScrollView>;
}
