import React, {useEffect, useRef, useState} from 'react';
import {AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {apiGet, apiPost, requestId} from './api';
import {AppIcon, Loader, Txt} from './components';
import {palette} from './theme';
import {SupportMessageBubble} from './SupportMessage';

export function SupportScreen({adminThreadId}: {adminThreadId?: number}) {
  const [data, setData] = useState<any>({messages: []});
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const scroll = useRef<ScrollView>(null);
  const nearBottom = useRef(true);
  const state = useRef<any>({messages: []});
  const thread = useRef(adminThreadId || 0);
  const alive = useRef(false);
  const foreground = useRef(AppState.currentState === 'active');
  const pending = useRef<any>(null);
  const pollBusy = useRef(false);
  const sendBusy = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const screenEpoch = useRef(0);
  const insets = useSafeAreaInsets();
  const reload = useRef<(full?: boolean, target?: number) => Promise<void>>(async () => {});

  useEffect(() => {
    alive.current = true;
    generation.current++;
    screenEpoch.current++;
    let disposed = false;
    setData({messages: []}); setLoading(true); setBody(''); setError(''); setNotice('');
    pending.current = null; sendBusy.current = false; setSending(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    thread.current = adminThreadId || 0;
    state.current = {messages: []};
    const load = async (full = false, target?: number) => {
      if (disposed || pollBusy.current || !alive.current || !foreground.current) return;
      pollBusy.current = true;
      const controller = new AbortController(); abort.current = controller;
      const currentGeneration = generation.current;
      try {
        const selected = target ?? thread.current;
        const last = full ? 0 : (state.current.messages || []).reduce((max: number, m: any) => Math.max(max, Number(m.id)), 0);
        const response = await apiGet(adminThreadId ? 'admin.support.messages' : 'support.mine',
          {thread_id: selected || undefined, after_id: last || undefined}, true, controller.signal);
        if (disposed || !alive.current || currentGeneration !== generation.current) return;
        const nextThread = Number(response.thread_id || adminThreadId || 0);
        const replace = full || nextThread !== thread.current;
        const existing = replace ? [] : state.current.messages || [];
        const ids = new Set(existing.map((m: any) => String(m.id)));
        const messages = [...existing, ...(response.messages || []).filter((m: any) => !ids.has(String(m.id)))];
        const next = {...response, thread_id: nextThread, messages: messages.map((m:any)=>({...m,bale_status:response.delivery_statuses?.[m.id]??m.bale_status}))};
        thread.current = nextThread; state.current = next; setData(next); setError('');
      } catch (e: any) {
        if (!disposed && alive.current && !controller.signal.aborted) setError(e.message);
      } finally {
        pollBusy.current = false;
        if (!disposed && alive.current) setLoading(false);
      }
    };
    reload.current = load;
    const poll = async () => {
      await load(false);
      if (!disposed && alive.current) timer = setTimeout(poll, foreground.current ? 2500 : 10000);
    };
    load(true).finally(() => {if (!disposed && alive.current) timer = setTimeout(poll, 2500);});
    const sub = AppState.addEventListener('change', status => {
      foreground.current = status === 'active';
      if (foreground.current) load(true);
      else abort.current?.abort();
    });
    return () => {disposed = true; alive.current = false; generation.current++; screenEpoch.current++; if(timer!==undefined)clearTimeout(timer); abort.current?.abort(); sub.remove();};
  }, [adminThreadId]);

  const send = async () => {
    const text = body.trim();
    if (!text || sendBusy.current) return;
    if (text.length > 2000) {setError('پیام باید حداکثر ۲۰۰۰ حرف باشد.'); return;}
    sendBusy.current = true; setSending(true); setError(''); setNotice('');
    const epoch = screenEpoch.current;
    const selected = data.request?.thread_status === 'closed' ? 0 : thread.current;
    if (!pending.current || pending.current.body !== text) pending.current = {body: text, thread_id: selected, request_id: requestId()};
    try {
      const result = await apiPost(adminThreadId ? 'admin.support.reply' : 'support.send', pending.current);
      if (!alive.current || epoch !== screenEpoch.current) return;
      pending.current = null; setBody('');
      nearBottom.current = true;
      if(result.bale_status==='unrouted')setNotice('پیام ذخیره شد؛ گیرندهٔ پشتیبانی در سامانه تعیین نشده است. مدیر باید تنظیمات پشتیبانی را بررسی کند.');
      else if(result.bale_status==='failed')setNotice('پیام ذخیره شد؛ ارسال آن به بله ناموفق بود.');
      else if(result.bale_status!=='sent')setNotice('پیام ذخیره شد؛ تحویل به بله در صف تلاش مجدد است.');
      // An older poll must not overwrite the newly opened thread.
      generation.current++;
      abort.current?.abort();
      thread.current = Number(result.thread_id || thread.current);
      state.current = {messages: []};
      setTimeout(() => reload.current(true, thread.current), 0);
    } catch (e: any) {if (alive.current && epoch === screenEpoch.current) setError(e.message);} finally {if(epoch === screenEpoch.current){sendBusy.current = false; if (alive.current) setSending(false);}}
  };

  if (loading) return <Loader />;
  const closed = data.request?.thread_status === 'closed';
  const label = closed ? 'گفتگو بسته است؛ پیام بعدی گفتگوی تازه می‌سازد.' : data.request?.status === 'assigned' ? 'پشتیبان به گفتگوی شما اختصاص یافته است.' : 'پیام شما در صف رسیدگی پشتیبانی قرار می‌گیرد.';
  return <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView ref={scroll} style={{direction: 'ltr'}} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding: 14, paddingBottom: 18, alignItems: 'stretch', direction: 'ltr'}}
      onScroll={e => {const x=e.nativeEvent;nearBottom.current=x.contentSize.height-x.layoutMeasurement.height-x.contentOffset.y<80;}}
      scrollEventThrottle={100} onContentSizeChange={() => {if(nearBottom.current)scroll.current?.scrollToEnd({animated: true});}}>
      <Txt style={{fontWeight: '800', fontSize: 17, marginBottom: 4}}>گفتگو با پشتیبانی</Txt>
      {!adminThreadId && <Txt style={{color: palette.text2, marginBottom: 14}}>{label}</Txt>}
      {!!error && <Txt accessibilityRole="alert" style={{color: palette.danger, marginBottom: 10}}>{error}</Txt>}
      {!!notice && <Txt style={{color: palette.text2, marginBottom: 10}}>{notice}</Txt>}
      {(data.messages || []).map((m: any) => <SupportMessageBubble key={String(m.id)} message={m} adminView={!!adminThreadId} />)}
    </ScrollView>
    <View style={{direction: 'ltr', flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, paddingBottom: Math.max(10,insets.bottom), backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border}}>
      <Pressable accessibilityLabel="ارسال پیام" accessibilityRole="button" disabled={sending || !body.trim()} onPress={send} style={{width: 48, height: 48, borderRadius: 16, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', opacity: sending || !body.trim() ? .45 : 1}}><AppIcon name="send" size={21} color="#fff" /></Pressable>
      <TextInput accessibilityLabel={adminThreadId ? 'پاسخ پشتیبانی' : 'پیام به پشتیبانی'} value={body} onChangeText={setBody} placeholder="پیام شما…" placeholderTextColor={palette.text2} multiline maxLength={2000} style={{flex: 1, maxHeight: 110, minHeight: 48, borderRadius: 17, backgroundColor: palette.surface2, padding: 13, textAlign: 'right', writingDirection: 'rtl', color: palette.text}} />
    </View>
  </KeyboardAvoidingView>;
}
