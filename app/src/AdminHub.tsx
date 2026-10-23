import React,{useEffect,useState} from 'react';
import {Pressable,RefreshControl,ScrollView,View} from 'react-native';
import {apiGet,apiPost,requestId} from './api';
import {AppIcon,Loader,Txt} from './components';
import {palette} from './theme';

const actionStyle={padding:17,borderRadius:18,backgroundColor:palette.primary,marginBottom:12};
export function AdminHub({navigate}:any){
  const [data,setData]=useState<any>({});const [tickets,setTickets]=useState<any[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState(true);
  const load=async()=>{setBusy(true);setError('');const results=await Promise.allSettled([apiGet('admin.dashboard'),apiGet('admin.support.list')]);
    if(results[0].status==='fulfilled')setData(results[0].value);else setError(results[0].reason.message);
    if(results[1].status==='fulfilled')setTickets(results[1].value.requests||[]);else setError(results[1].reason.message);setBusy(false);};
  useEffect(()=>{load();},[]);
  return <ScrollView contentContainerStyle={{padding:14,paddingBottom:28}} refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>}>
    <Pressable accessibilityLabel="باز کردن پنل کامل مدیریت" accessibilityRole="button" onPress={()=>navigate('adminPanel')} style={actionStyle}>
      <Txt style={{fontSize:18,fontWeight:'900',color:'#fff'}}>پنل کامل مدیریت</Txt><Txt style={{fontSize:12,color:palette.secondarySoft,marginTop:5}}>کسب‌وکارها، محصولات، کاربران، پلن‌ها، پشتیبان‌ها و تنظیمات</Txt>
    </Pressable>
    <Pressable accessibilityLabel="وضعیت ارسال پیام‌ها به بله" onPress={()=>navigate('adminDelivery')} style={{...actionStyle,backgroundColor:'#fff',borderWidth:1,borderColor:palette.border}}>
      <Txt style={{fontWeight:'900'}}>وضعیت ارسال پیام‌ها به بله</Txt><Txt style={{fontSize:12,color:palette.text2,marginTop:4}}>خطاهای تحویل، ارسال آزمایشی و تلاش مجدد</Txt>
    </Pressable>
    {!!error&&<Txt accessibilityRole="alert" style={{color:palette.danger,marginBottom:12}}>{error}</Txt>}
    <View style={{flexDirection:'row-reverse',gap:8,marginBottom:14}}>{[['users','کاربر'],['business_pending','کسب‌وکار منتظر بررسی'],['product_pending','محصول منتظر بررسی']].map(([key,title])=><View key={key} style={{flex:1,backgroundColor:'#fff',padding:12,borderRadius:16}}><Txt style={{fontWeight:'900',fontSize:20}}>{data.stats?.[key]??'—'}</Txt><Txt style={{fontSize:11,color:palette.text2}}>{title}</Txt></View>)}</View>
    <Txt style={{fontSize:17,fontWeight:'900',marginBottom:10}}>گفتگوهای باز پشتیبانی</Txt>
    {tickets.map(t=><Pressable key={t.thread_id} onPress={()=>navigate('adminSupportThread',{threadId:Number(t.thread_id)})} style={{padding:15,backgroundColor:'#fff',borderRadius:17,marginBottom:9}}>
      <Txt style={{fontWeight:'800'}}>{`${t.first_name||''} ${t.last_name||''}`.trim()||`گفتگو ${t.thread_id}`}</Txt><Txt style={{fontSize:12,color:palette.text2}}>شناسه بله: {t.requester_bale_id} • {t.status==='assigned'?'اختصاص داده شده':'در صف'}</Txt>
    </Pressable>)}
    {!busy&&!tickets.length&&<Txt style={{color:palette.text2}}>گفتگوی بازی وجود ندارد.</Txt>}
  </ScrollView>;
}

const statusLabels:Record<string,string>={sent:'ارسال شده',queued:'در صف',retry:'در تلاش مجدد',processing:'در حال ارسال',failed:'ناموفق',cancelled:'لغو شده'};
export function AdminDeliveryScreen(){
  const [data,setData]=useState<any>();const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
  const load=async()=>{try{setData(await apiGet('admin.notifications'));setError('');}catch(e:any){setError(e.message);}};useEffect(()=>{load();},[]);
  const act=async(action:string,body:any)=>{if(busy)return;setBusy(true);setError('');setNotice('');try{const r=await apiPost(action,body);setNotice(r.delivery?.status==='sent'?'پیام آزمایشی به بله ارسال شد.':r.delivery?.last_error||'وضعیت ارسال بررسی و به‌روزرسانی شد.');await load();}catch(e:any){setError(e.message);}finally{setBusy(false);}};
  if(!data&&!error)return <Loader/>;
  return <ScrollView contentContainerStyle={{padding:14,paddingBottom:28}} refreshControl={<RefreshControl refreshing={false} onRefresh={load}/>}>
    <Txt style={{fontWeight:'900',fontSize:17,marginBottom:4}}>کنترل تحویل پیام به بله</Txt><Txt style={{color:palette.text2,marginBottom:12}}>شناسه بلهٔ حساب مدیر: {data?.your_bale_id||'—'}</Txt>
    <Pressable disabled={busy} onPress={()=>act('admin.notifications.test',{request_id:requestId()})} style={actionStyle}><Txt style={{color:'#fff',fontWeight:'800'}}>ارسال پیام آزمایشی به بلهٔ خودم</Txt></Pressable>
    <Pressable disabled={busy} onPress={()=>act('admin.notifications.retry',{})} style={{padding:15,backgroundColor:'#fff',borderRadius:16,marginBottom:12}}><Txt>پیگیری پیام‌های ارسال‌نشده</Txt></Pressable>
    {!!error&&<Txt accessibilityRole="alert" style={{color:palette.danger,marginBottom:10}}>{error}</Txt>}{!!notice&&<Txt accessibilityRole="alert" style={{color:palette.primary,marginBottom:10}}>{notice}</Txt>}
    <Txt style={{color:palette.text2,marginBottom:12}}>در صف: {data?.counts?.queued||0} • تلاش مجدد: {data?.counts?.retry||0} • ناموفق: {data?.counts?.failed||0}</Txt>
    {(data?.notifications||[]).map((n:any)=><View key={n.id} style={{padding:15,backgroundColor:'#fff',borderWidth:1,borderColor:palette.border,borderRadius:17,marginBottom:9}}>
      <Txt style={{fontWeight:'800'}}>اعلان {n.id} • {statusLabels[n.status]||n.status}</Txt><Txt style={{fontSize:12,color:palette.text2}}>گیرندهٔ بله: {n.recipient_bale_id} • تعداد تلاش: {n.attempts}</Txt>
      {!!n.last_error&&<Txt style={{color:palette.danger,marginTop:5}}>{n.last_error}</Txt>}
      {['failed','retry'].includes(n.status)&&<Pressable disabled={busy} onPress={()=>act('admin.notifications.retry',{id:n.id})} style={{paddingVertical:12}}><Txt style={{color:palette.primary,fontWeight:'800'}}>تلاش مجدد برای این اعلان</Txt></Pressable>}
    </View>)}
  </ScrollView>;
}
