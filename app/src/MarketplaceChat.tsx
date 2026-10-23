import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View} from 'react-native';
import {apiGet, apiPost} from './api';
import {AppIcon, EmptyState, ErrorState, Loader, Txt} from './components';
import {palette} from './theme';

const chatDate = (raw?: string) => raw ? String(raw).replace('T', ' ').slice(0, 16) : '';

export function MarketplaceInbox({navigate}: {navigate: (name:string, params?:any)=>void}) {
  const [threads, setThreads] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try { const res = await apiGet('chat.list', {_t:Date.now()}); setThreads(res.threads||[]); setError(''); }
    catch (e:any) {setError(e?.message||'دریافت گفتگوها انجام نشد.');}
    finally {busy.current=false; setReady(true);}
  },[]);
  useEffect(() => {
    load();
    const timer=setInterval(()=>{if(AppState.currentState==='active')load();},6500);
    const sub=AppState.addEventListener('change',s=>{if(s==='active')load();});
    return ()=>{clearInterval(timer);sub.remove();};
  },[load]);
  if(!ready)return <Loader/>;
  return <View style={{flex:1,paddingHorizontal:14,paddingTop:10}}>
    <View style={{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <View><Txt style={{fontSize:21,fontWeight:'900'}}>پیام‌ها</Txt><Txt style={{fontSize:12,color:palette.text2,marginTop:3}}>گفتگوی رایگان مشتریان و کسب‌وکارها</Txt></View>
      <Pressable onPress={load} accessibilityLabel="به‌روزرسانی پیام‌ها" style={{width:43,height:43,borderRadius:15,backgroundColor:palette.primarySoft,alignItems:'center',justifyContent:'center'}}><AppIcon name="refresh" color={palette.primary} size={23}/></Pressable>
    </View>
    {error?<Pressable onPress={load}><Txt style={{color:palette.danger,marginBottom:12}}>{error} • تلاش دوباره</Txt></Pressable>:null}
    <FlatList data={threads} keyExtractor={x=>String(x.id)} onRefresh={load} refreshing={false}
      ListEmptyComponent={<EmptyState title="هنوز گفتگویی ندارید" detail="از صفحه هر کسب‌وکار گفتگو را شروع کنید. اگر صاحب کسب‌وکار هستید، پیام مشتریان اینجا نمایش داده می‌شود."/>}
      renderItem={({item})=><Pressable accessibilityRole="button" onPress={()=>navigate('chatThread',{threadId:Number(item.id)})}
        style={{minHeight:88,marginBottom:9,backgroundColor:'#fff',borderRadius:19,borderWidth:1,borderColor:palette.border,paddingHorizontal:13,paddingVertical:10,flexDirection:'row-reverse',alignItems:'center'}}>
        <View style={{width:46,height:46,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:palette.primarySoft,marginLeft:10}}><AppIcon name={item.is_owner?'account-outline':'storefront-outline'} size={23} color={palette.primary}/></View>
        <View style={{flex:1,alignItems:'flex-end'}}><Txt numberOfLines={1} style={{fontSize:14.5,fontWeight:'900'}}>{item.other_name||item.business_name}</Txt>
          {item.is_owner?<Txt numberOfLines={1} style={{fontSize:11,color:palette.text2}}>برای {item.business_name}</Txt>:null}
          <Txt numberOfLines={1} style={{fontSize:12,color:palette.text2,marginTop:5}}>{item.last_body||'گفتگو را شروع کنید'}</Txt>
        </View>
        <View style={{alignItems:'center',marginRight:8,gap:7}}>{Number(item.unread_count)>0?<View style={{backgroundColor:palette.primary,borderRadius:20,minWidth:23,minHeight:23,paddingHorizontal:5,justifyContent:'center'}}><Txt style={{fontSize:11,color:'#fff',fontWeight:'900',textAlign:'center'}}>{item.unread_count}</Txt></View>:null}<AppIcon name="chevron-left" size={21} color={palette.text2}/></View>
      </Pressable>}/>
  </View>;
}

export function MarketplaceThread({businessId, threadId, onBack}: {businessId?:number;threadId?:number;onBack:()=>void}) {
  const [thread,setThread]=useState<any>(null);
  const [messages,setMessages]=useState<any[]>([]);
  const [text,setText]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const conversationId=useRef<number>(0);
  const messagesRef=useRef<any[]>([]);
  const busy=useRef(false);
  const alive=useRef(true);
  const listRef=useRef<FlatList>(null);
  const load=useCallback(async (incremental=true) => {
    if(busy.current || !conversationId.current) return;
    busy.current=true;
    try{
      const after=incremental&&messagesRef.current.length?Number(messagesRef.current[messagesRef.current.length-1].id):0;
      const res=await apiGet('chat.messages',{thread_id:conversationId.current,after_id:after,_t:Date.now()});
      if(!alive.current)return;
      setThread(res.thread);
      if(after){const existing=new Set(messagesRef.current.map(m=>String(m.id)));messagesRef.current=[...messagesRef.current,...(res.messages||[]).filter((m:any)=>!existing.has(String(m.id)))];}
      else messagesRef.current=res.messages||[];
      setMessages([...messagesRef.current]);setError('');
    }catch(e:any){if(alive.current)setError(e.message||'دریافت پیام‌ها انجام نشد.');}
    finally{busy.current=false;if(alive.current)setLoading(false);}
  },[]);
  useEffect(()=>{
    alive.current=true;conversationId.current=0;messagesRef.current=[];setMessages([]);setLoading(true);
    (async()=>{try{
      if(threadId){conversationId.current=threadId;}
      else if(businessId){const res=await apiPost('chat.open',{business_id:businessId});conversationId.current=Number(res.thread_id);setThread(res.thread);}
      else throw Error('گفتگو مشخص نیست.');
      await load(false);
    }catch(e:any){if(alive.current){setError(e.message||'امکان شروع گفتگو وجود ندارد.');setLoading(false);}}})();
    const timer=setInterval(()=>{if(AppState.currentState==='active')load();},3200);
    const sub=AppState.addEventListener('change',s=>{if(s==='active')load();});
    return ()=>{alive.current=false;clearInterval(timer);sub.remove();};
  },[businessId,threadId,load]);
  const send=async()=>{
    const body=text.trim();if(!body||sending||!conversationId.current)return;
    setSending(true);setError('');setText('');
    // The same ID may be retried safely after a request timeout.
    const requestId=`app_${Date.now()}_${Math.floor(Math.random()*1000000000)}`;
    try{await apiPost('chat.send',{thread_id:conversationId.current,body,request_id:requestId});await load(false);}
    catch(e:any){setText(body);setError(e.message||'ارسال پیام انجام نشد.');}
    finally{setSending(false);}
  };
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:palette.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <View style={{minHeight:66,flexDirection:'row-reverse',alignItems:'center',paddingHorizontal:14,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:palette.border}}>
      <Pressable accessibilityLabel="بازگشت" onPress={onBack} style={{width:42,height:42,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:palette.primarySoft,marginLeft:12}}><AppIcon name="chevron-right" size={25} color={palette.primary}/></Pressable>
      <View style={{flex:1,alignItems:'flex-end'}}><Txt numberOfLines={1} style={{fontSize:16,fontWeight:'900'}}>{thread?.other_name||thread?.business_name||'گفتگو با کسب‌وکار'}</Txt><Txt style={{fontSize:11,color:palette.text2}}>گفتگوی خصوصی و رایگان داخل اپلیکیشن</Txt></View>
      <AppIcon name="message-text-outline" size={25} color={palette.primary}/>
    </View>
    {loading?<Loader/>:<FlatList ref={listRef} data={messages} keyExtractor={m=>String(m.id)} contentContainerStyle={{padding:14,flexGrow:1,justifyContent:'flex-end'}}
      onContentSizeChange={()=>listRef.current?.scrollToEnd({animated:false})}
      ListEmptyComponent={<EmptyState title="هنوز پیامی ارسال نشده" detail="اولین پیام خود را بنویسید."/>}
      renderItem={({item})=><View style={{maxWidth:'85%',alignSelf:item.is_mine?'flex-end':'flex-start',paddingVertical:10,paddingHorizontal:13,borderRadius:18,backgroundColor:item.is_mine?palette.primarySoft:'#fff',borderWidth:item.is_mine?0:1,borderColor:palette.border,marginBottom:8}}>
        <Txt style={{fontSize:14,lineHeight:24}}>{item.body}</Txt><View style={{flexDirection:'row-reverse',alignItems:'center',gap:5,marginTop:4}}><Txt style={{fontSize:10,color:palette.text2}}>{chatDate(item.created_at)}</Txt>{item.is_mine?<AppIcon name={item.read_at?'check-all':'check'} size={13} color={item.read_at?palette.primary:palette.text2}/>:null}</View>
      </View>}/>}
    {error?<Pressable onPress={()=>load(false)}><Txt style={{textAlign:'center',color:palette.danger,fontSize:12,padding:7}}>{error} • تلاش مجدد</Txt></Pressable>:null}
    <View style={{backgroundColor:'#fff',borderTopWidth:1,borderTopColor:palette.border,paddingHorizontal:11,paddingTop:8,paddingBottom:9,flexDirection:'row',alignItems:'flex-end',gap:8}}>
      <Pressable disabled={!text.trim()||sending||loading} onPress={send} style={{height:48,width:48,borderRadius:15,backgroundColor:palette.primary,justifyContent:'center',alignItems:'center',opacity:!text.trim()||sending||loading?.5:1}}><AppIcon name="send" size={21} color="#fff"/></Pressable>
      <TextInput accessibilityLabel="متن پیام" placeholder="پیام شما…" placeholderTextColor={palette.text2} value={text} onChangeText={setText} maxLength={2000} multiline style={{flex:1,backgroundColor:palette.surface2,borderRadius:16,paddingHorizontal:14,paddingVertical:10,maxHeight:126,minHeight:48,color:palette.text,textAlign:'right',writingDirection:'rtl'}}/>
    </View>
  </KeyboardAvoidingView>;
}
