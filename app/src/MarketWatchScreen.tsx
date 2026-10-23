import React, {useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Pressable,RefreshControl,ScrollView,View} from 'react-native';
import {apiGet} from './api';
import {AppIcon,Txt} from './components';
import {palette} from './theme';

const ASSETS=[
  {symbol:'USD',label:'دلار آزاد',icon:'cash-multiple',unit:'تومان'},
  {symbol:'GOLD',label:'طلای ۱۸ عیار (گرم)',icon:'gold',unit:'تومان'},
  {symbol:'COIN',label:'سکه امامی',icon:'circle-multiple-outline',unit:'تومان'},
  {symbol:'EUR',label:'یورو',icon:'currency-eur',unit:'تومان'},
  {symbol:'USDT',label:'تتر',icon:'currency-usd',unit:'تومان'},
  {symbol:'BTC',label:'بیت‌کوین',icon:'bitcoin',unit:'تومان'},
  {symbol:'XAU',label:'اونس جهانی طلا',icon:'earth',unit:'دلار'},
];
const SOURCES:Record<string,string>={alanchand:'الان‌چند',nerkh:'نرخ',nerkh_crypto:'نرخ',nobitex:'نوبیتکس',navasan:'نوسان',bale_channel:'کانال بله'};
function atTime(raw:any):number|null {
  if(!raw)return null;
  let value=String(raw);
  if(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(value))value=value.replace(' ','T')+'+03:30';
  const time=Date.parse(value);return Number.isFinite(time)?time:null;
}
function formatPrice(n:number):string{
  return n.toLocaleString('fa-IR',{maximumFractionDigits:n>=1?(Number.isInteger(n)?0:2):4});
}
export function MarketWatchScreen(){
 const [data,setData]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [err,setErr]=useState('');
 const load=useCallback(async (refresh=false)=>{
   if(refresh)setRefreshing(true);else setLoading(true);
   setErr('');
   try{const r=await apiGet('market.latest');setData(Array.isArray(r.rates)?r.rates:[]);setLoaded(true);}
   catch(e:any){setErr(e?.message||'دریافت نرخ‌ها ناموفق بود.');}
   finally{setLoading(false);setRefreshing(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 const now=Date.now();
 const availableCount=data.filter(x=>Number(x?.price_toman)>0).length;
 return <ScrollView contentContainerStyle={{padding:14,paddingBottom:30}}
   refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} colors={[palette.primary]}/>}>
   <View style={{backgroundColor:palette.primarySoft,borderRadius:18,padding:14,marginBottom:12}}>
     <View style={{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'}}>
       <View style={{flex:1}}>
         <Txt style={{fontSize:18,fontWeight:'900',textAlign:'right',color:palette.primaryDark}}>آخرین نرخ‌های بازار</Txt>
         <Txt style={{fontSize:12,color:palette.text2,textAlign:'right',marginTop:4}}>{availableCount?'نرخ‌های دریافت‌شده از منابع بازار':'هنوز نرخ معتبری از سرور دریافت نشده است.'}</Txt>
       </View>
       <Pressable accessibilityRole="button" accessibilityLabel="به‌روزرسانی نرخ‌ها" onPress={()=>load(true)} disabled={loading||refreshing}
         style={{padding:10,borderRadius:12,backgroundColor:'#fff',marginLeft:8}}>
         <AppIcon name="refresh" size={23} color={palette.primary}/>
       </Pressable>
     </View>
   </View>
   {loading&&!loaded?<ActivityIndicator size="large" color={palette.primary} style={{margin:30}}/>:null}
   {err?<View style={{backgroundColor:'#FFF0EE',borderRadius:15,padding:13,marginBottom:10}}>
       <Txt style={{color:palette.danger,textAlign:'right'}}>{err}</Txt>
       <Pressable onPress={()=>load(true)}><Txt style={{color:palette.primary,textAlign:'right',fontWeight:'900',marginTop:6}}>تلاش مجدد</Txt></Pressable>
     </View>:null}
   {(!loading||loaded)?ASSETS.map(asset=>{
     const row=data.find(x=>String(x?.symbol||'').toUpperCase()===asset.symbol)||{};
     const raw=row.price_toman??row.price;
     const price=raw===null||raw===undefined||String(raw).trim()===''?NaN:Number(String(raw).replace(/,/g,''));
     const available=Number.isFinite(price)&&price>0&&row.available!==false;
     const updatedAt=row.as_of||row.source_updated_at||row.fetched_at||null;
     const time=atTime(updatedAt);
     const ttl=['BTC','USDT'].includes(asset.symbol)?45:360;
     const stale=available&&(row.stale===true||time===null||time>now+300000||now-time>ttl*60000);
     const date=time===null?'زمان نامشخص':new Date(time).toLocaleString('fa-IR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
     const source=SOURCES[String(row.provider||'')]||String(row.provider||'منبع نامشخص');
     return <View key={asset.symbol} style={{backgroundColor:'#fff',borderColor:palette.border,borderWidth:1,borderRadius:18,padding:14,marginBottom:9}}>
       <View style={{flexDirection:'row-reverse',alignItems:'center',gap:12}}>
         <View style={{height:45,width:45,borderRadius:14,backgroundColor:palette.primarySoft,alignItems:'center',justifyContent:'center'}}>
           <AppIcon name={asset.icon} size={22} color={palette.primary}/>
         </View>
         <View style={{flex:1}}>
           <Txt style={{fontSize:15,fontWeight:'900',textAlign:'right'}}>{asset.label}</Txt>
           <Txt style={{fontSize:17,fontWeight:'900',textAlign:'right',color:available?palette.primaryDark:palette.text2,marginTop:4}}>{available?formatPrice(price)+' '+String(row.unit||asset.unit):'نرخ در دسترس نیست'}</Txt>
         </View>
       </View>
       <View style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',marginTop:10,gap:8}}>
         <Txt style={{flex:1,fontSize:11,textAlign:'right',color:palette.text2}}>منبع: {available?source:'—'} • {available?date:'زمان نامشخص'}</Txt>
         <View style={{borderRadius:9,paddingHorizontal:8,paddingVertical:4,backgroundColor:!available?'#F2F1F0':stale?'#FFF2D9':'#E4F5EB'}}>
           <Txt style={{fontSize:11,color:!available?palette.text2:stale?palette.warning:palette.success,fontWeight:'800'}}>{!available?'ناموجود':stale?'قدیمی':'به‌روز'}</Txt>
         </View>
       </View>
     </View>;
   }):null}
   <Txt style={{fontSize:11.5,lineHeight:21,color:palette.text2,textAlign:'right',marginTop:8}}>نرخ قدیمی ممکن است با قیمت بازار تفاوت داشته باشد؛ در نبود داده، قیمت تخمینی نمایش داده نمی‌شود.</Txt>
 </ScrollView>;
}
