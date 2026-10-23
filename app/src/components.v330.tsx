import React from 'react';
import {View,Text,Pressable,StyleSheet,ActivityIndicator,Platform} from 'react-native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {palette} from './theme';

const faDigits=(v:string)=>v.replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]).replace(/[٠-٩]/g,d=>'۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
const jalali=(raw:string)=>{
  try{
    const normalized=raw.includes('T')?raw:raw.replace(' ','T');
    const hasTime=/[ T]\d{2}:\d{2}/.test(raw);
    const d=new Date(normalized.match(/(?:Z|[+-]\d{2}:?\d{2})$/)?normalized:normalized+(hasTime?'':'T12:00:00'));
    if(Number.isNaN(d.getTime()))return raw;
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian',hasTime?{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}:{year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  }catch{return raw}
};
const localizeString=(x:string)=>faDigits(x.replace(/\b\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?\b/g,(v)=>jalali(v)));
const localize=(x:any):any=>typeof x==='string'?localizeString(x):typeof x==='number'?faDigits(String(x)):Array.isArray(x)?x.map(localize):x;

export const Txt=({children,style,numberOfLines}:any)=><Text numberOfLines={numberOfLines} style={[styles.txt,style]}>{localize(children)}</Text>;
export const AppIcon=({name,size=22,color=palette.text}:any)=><MaterialCommunityIcons name={name} size={size} color={color}/>;
export const SurfaceCard=({children,style,onPress}:any)=>{const body=<View style={[styles.card,style]}>{children}</View>;return onPress?<Pressable onPress={onPress} android_ripple={{color:'#DCEFE7'}}>{body}</Pressable>:body};
export const Screen=({children,style}:any)=><SafeAreaView edges={['top','left','right']} style={[styles.screen,style]}>{children}</SafeAreaView>;

export const Header=({title,subtitle,back,onBack,right}:any)=><View style={styles.header}>
  <View style={[styles.headerText,{paddingRight:back?52:0,paddingLeft:right?52:0}]}><Txt style={styles.title}>{title}</Txt>{subtitle?<Txt style={styles.subtitle}>{subtitle}</Txt>:null}</View>
  {back?<Pressable onPress={onBack} hitSlop={12} style={[styles.roundBtn,{right:16}]}><AppIcon name="chevron-right" size={29} color={palette.primary}/></Pressable>:null}
  {right?<View style={{position:'absolute',left:16}}>{right}</View>:null}
</View>;

export const PrimaryButton=({title,onPress,disabled,icon,align='center'}:any)=><Pressable disabled={disabled} onPress={onPress} style={({pressed})=>[styles.primaryBtn,disabled&&styles.disabled,pressed&&!disabled&&{opacity:.9}]}>{align==='right'?<View style={styles.btnRightBody}>{icon?<View style={styles.btnRightIcon}><AppIcon name={icon} size={20} color="#fff"/></View>:null}<Txt style={[styles.primaryText,{width:'100%',textAlign:'right',paddingRight:icon?30:0}]}>{title}</Txt></View>:<View style={styles.btnBody}>{icon?<AppIcon name={icon} size={20} color="#fff"/>:null}<Txt style={styles.primaryText}>{title}</Txt></View>}</Pressable>;
export const SecondaryButton=({title,onPress,disabled,icon,align='center'}:any)=><Pressable disabled={disabled} onPress={onPress} style={[styles.secondaryBtn,disabled&&styles.disabled]}>{align==='right'?<View style={styles.btnRightBody}>{icon?<View style={styles.btnRightIcon}><AppIcon name={icon} size={19} color={palette.primaryDark}/></View>:null}<Txt style={[styles.secondaryText,{width:'100%',textAlign:'right',paddingRight:icon?29:0}]}>{title}</Txt></View>:<View style={styles.btnBody}>{icon?<AppIcon name={icon} size={19} color={palette.primaryDark}/>:null}<Txt style={styles.secondaryText}>{title}</Txt></View>}</Pressable>;
export const Loader=({label='در حال دریافت اطلاعات…'}:{label?:string})=><View style={styles.center}><ActivityIndicator size="small" color={palette.primary}/><Txt style={{marginTop:9,color:palette.text2,textAlign:'center'}}>{label}</Txt></View>;
export const ErrorState=({message,onRetry}:any)=><View style={styles.center}><View style={styles.errorIcon}><AppIcon name="alert-circle-outline" size={26} color="#A83A32"/></View><Txt style={{fontSize:14,marginVertical:12,textAlign:'center'}}>{message}</Txt>{onRetry?<PrimaryButton title="تلاش دوباره" icon="refresh" onPress={onRetry}/>:null}</View>;
export const EmptyState=({title='موردی پیدا نشد',detail}:any)=><View style={styles.center}><AppIcon name="magnify-close" size={34} color={palette.text2}/><Txt style={{fontSize:16,fontWeight:'800',marginTop:8,textAlign:'center'}}>{title}</Txt>{detail?<Txt style={{color:palette.text2,marginTop:6,textAlign:'center'}}>{detail}</Txt>:null}</View>;

export type TabKey='home'|'search'|'business'|'support'|'account';
const tabs:[TabKey,string,string][]=[['home','خانه','home-outline'],['search','جست‌وجو','magnify'],['business','کسب‌وکار','storefront-outline'],['support','پشتیبانی','headset'],['account','حساب','account-circle-outline']];
export const BottomNav=({active,onChange}:{active:TabKey,onChange:(k:TabKey)=>void})=>{const ins=useSafeAreaInsets();return <View style={[styles.navWrap,{paddingBottom:Math.max(ins.bottom,8)}]}><View style={styles.nav}>{tabs.map(([k,label,icon])=><Pressable key={k} onPress={()=>onChange(k)} style={[styles.tab,active===k&&styles.tabActive]}><AppIcon name={icon} size={22} color={active===k?palette.primary:'#56645C'}/><Txt style={[styles.tabLabel,active===k&&{color:palette.primary,fontWeight:'800'}]}>{label}</Txt></Pressable>)}</View></View>};

const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:palette.background,direction:'rtl'},txt:{color:palette.text,textAlign:'right',writingDirection:'rtl',fontSize:13.5,lineHeight:21},
 card:{backgroundColor:'#fff',borderRadius:19,padding:13,borderWidth:1,borderColor:'#E7ECE9',marginBottom:9,shadowColor:'#000',shadowOpacity:Platform.OS==='ios'?.045:.025,shadowRadius:9,shadowOffset:{width:0,height:2},elevation:1},
 header:{minHeight:64,paddingHorizontal:16,paddingVertical:8,justifyContent:'center',backgroundColor:palette.background,position:'relative'},headerText:{width:'100%',alignItems:'flex-end'},title:{fontSize:19,fontWeight:'900',lineHeight:27,textAlign:'right',width:'100%'},subtitle:{fontSize:12,color:palette.text2,marginTop:1,textAlign:'right',width:'100%'},roundBtn:{position:'absolute',width:40,height:40,borderRadius:20,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:palette.border},
 primaryBtn:{minHeight:48,borderRadius:15,backgroundColor:palette.primary,alignItems:'center',justifyContent:'center',paddingHorizontal:16},secondaryBtn:{minHeight:46,borderRadius:15,backgroundColor:palette.primarySoft,borderWidth:1,borderColor:'#B7DECF',alignItems:'center',justifyContent:'center',paddingHorizontal:15},btnBody:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},btnRightBody:{width:'100%',minHeight:24,justifyContent:'center',position:'relative'},btnRightIcon:{position:'absolute',right:0,top:2},primaryText:{color:'#fff',fontWeight:'800',fontSize:14,textAlign:'center',writingDirection:'rtl'},secondaryText:{color:palette.primaryDark,fontWeight:'800',fontSize:13.5,textAlign:'center'},disabled:{opacity:.45},
 center:{flex:1,minHeight:220,alignItems:'center',justifyContent:'center',padding:22},errorIcon:{width:52,height:52,borderRadius:18,backgroundColor:'#FCE8E6',alignItems:'center',justifyContent:'center'},
 navWrap:{backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#E6ECE8',paddingTop:5},nav:{height:62,flexDirection:'row',paddingHorizontal:8,alignItems:'center',justifyContent:'space-between'},tab:{flex:1,minHeight:51,borderRadius:16,alignItems:'center',justifyContent:'center',gap:1},tabActive:{backgroundColor:palette.primarySoft},tabLabel:{fontSize:10.5,lineHeight:15,color:'#59665F',textAlign:'center'},
});