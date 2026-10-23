import React from 'react';
import {View,Text,Pressable,StyleSheet,ActivityIndicator,Platform,TextStyle} from 'react-native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {palette} from './theme';

const FA='۰۱۲۳۴۵۶۷۸۹';
const AR='٠١٢٣٤٥٦٧٨٩';
const faDigits=(v:string)=>String(v).replace(/[0-9]/g,d=>FA[Number(d)]).replace(/[٠-٩]/g,d=>FA[AR.indexOf(d)]);
function div(a:number,b:number){return Math.trunc(a/b)}
function g2j(gy:number,gm:number,gd:number){
 const gdm=[0,31,59,90,120,151,181,212,243,273,304,334];
 let gy2=gm>2?gy+1:gy;let days=355666+365*gy+div(gy2+3,4)-div(gy2+99,100)+div(gy2+399,400)+gd+gdm[gm-1];
 let jy=-1595+33*div(days,12053);days%=12053;jy+=4*div(days,1461);days%=1461;
 if(days>365){jy+=div(days-1,365);days=(days-1)%365;}
 const jm=days<186?1+div(days,31):7+div(days-186,30);const jd=1+(days<186?days%31:(days-186)%30);
 return [jy,jm,jd];
}
function jalali(raw:string){
 const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
 if(!m)return raw;
 const [jy,jm,jd]=g2j(Number(m[1]),Number(m[2]),Number(m[3]));
 const d=`${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`;
 const t=m[4]?` - ${m[4]}:${m[5]}`:'';
 return faDigits(d+t);
}
const localizeString=(x:string)=>faDigits(String(x).replace(/\b\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\b/g,v=>jalali(v)));
const localize=(x:any):any=>typeof x==='string'?localizeString(x):typeof x==='number'?faDigits(String(x)):Array.isArray(x)?x.map(localize):x;

export const Txt=({children,style,numberOfLines,...rest}:any)=>{
 const flat=StyleSheet.flatten(style) as TextStyle|undefined;
 const center=flat?.textAlign==='center';
 return <Text {...rest} numberOfLines={numberOfLines} style={[styles.txt,center&&styles.centerText,style]}>{localize(children)}</Text>;
};
export const AppIcon=({name,size=22,color=palette.text}:any)=><MaterialCommunityIcons name={name} size={size} color={color}/>;
export const SurfaceCard=({children,style,onPress}:any)=>{const body=<View style={[styles.card,style]}>{children}</View>;return onPress?<Pressable onPress={onPress} android_ripple={{color:'#DCEFE7'}}>{body}</Pressable>:body};
export const Screen=({children,style}:any)=><SafeAreaView edges={['top','left','right']} style={[styles.screen,style]}>{children}</SafeAreaView>;

export const Header=({title,subtitle,back,onBack,right}:any)=><View style={styles.header}>
  <View style={[styles.headerText,{paddingRight:back?52:0,paddingLeft:right?52:0}]}><Txt style={styles.title}>{title}</Txt>{subtitle?<Txt style={styles.subtitle}>{subtitle}</Txt>:null}</View>
  {back?<Pressable onPress={onBack} hitSlop={12} style={[styles.roundBtn,{right:16}]}><AppIcon name="chevron-right" size={29} color={palette.primary}/></Pressable>:null}
  {right?<View style={{position:'absolute',left:16}}>{right}</View>:null}
</View>;

export const PrimaryButton=({title,onPress,disabled,icon}:any)=><Pressable disabled={disabled} onPress={onPress} style={({pressed})=>[styles.primaryBtn,disabled&&styles.disabled,pressed&&!disabled&&{opacity:.9}]}><View style={styles.btnBody}>{icon?<AppIcon name={icon} size={20} color="#fff"/>:null}<Txt style={styles.primaryText}>{title}</Txt></View></Pressable>;
export const SecondaryButton=({title,onPress,disabled,icon}:any)=><Pressable disabled={disabled} onPress={onPress} style={({pressed})=>[styles.secondaryBtn,disabled&&styles.disabled,pressed&&!disabled&&{opacity:.9}]}><View style={styles.btnBody}>{icon?<AppIcon name={icon} size={19} color={palette.primaryDark}/>:null}<Txt style={styles.secondaryText}>{title}</Txt></View></Pressable>;
export const Loader=({label='در حال دریافت اطلاعات…'}:{label?:string})=><View style={styles.center}><ActivityIndicator size="small" color={palette.primary}/><Txt style={styles.stateText}>{label}</Txt></View>;
export const ErrorState=({message,onRetry}:any)=><View style={styles.center}><View style={styles.errorIcon}><AppIcon name="alert-circle-outline" size={26} color="#A83A32"/></View><Txt style={styles.stateText}>{message}</Txt>{onRetry?<View style={{width:'100%',marginTop:8}}><PrimaryButton title="تلاش دوباره" icon="refresh" onPress={onRetry}/></View>:null}</View>;
export const EmptyState=({title='موردی پیدا نشد',detail}:any)=><View style={styles.center}><AppIcon name="magnify-close" size={34} color={palette.text2}/><Txt style={[styles.stateText,{fontSize:16,fontWeight:'800'}]}>{title}</Txt>{detail?<Txt style={styles.stateText}>{detail}</Txt>:null}</View>;

export type TabKey='home'|'search'|'business'|'support'|'account';
const tabs:[TabKey,string,string][]=[['home','خانه','home-outline'],['search','جست‌وجو','magnify'],['business','کسب‌وکار','storefront-outline'],['support','پشتیبانی','headset'],['account','حساب','account-circle-outline']];
export const BottomNav=({active,onChange}:{active:TabKey,onChange:(k:TabKey)=>void})=>{const ins=useSafeAreaInsets();return <View style={[styles.navWrap,{paddingBottom:Math.max(ins.bottom,8)}]}><View style={styles.nav}>{tabs.map(([k,label,icon])=><Pressable key={k} onPress={()=>onChange(k)} style={[styles.tab,active===k&&styles.tabActive]}><AppIcon name={icon} size={22} color={active===k?palette.primary:'#56645C'}/><Txt style={[styles.tabLabel,active===k&&{color:palette.primary,fontWeight:'800'}]}>{label}</Txt></Pressable>)}</View></View>};

const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:palette.background},
 txt:{color:palette.text,textAlign:'right',writingDirection:'rtl',fontSize:13.5,lineHeight:21,includeFontPadding:false},centerText:{textAlign:'center'},
 card:{backgroundColor:'#fff',borderRadius:19,padding:13,borderWidth:1,borderColor:'#E7ECE9',marginBottom:9,shadowColor:'#000',shadowOpacity:Platform.OS==='ios'?.045:.025,shadowRadius:9,shadowOffset:{width:0,height:2},elevation:1},
 header:{minHeight:64,paddingHorizontal:16,paddingVertical:8,justifyContent:'center',backgroundColor:palette.background,position:'relative'},headerText:{width:'100%',alignItems:'stretch'},title:{fontSize:19,fontWeight:'900',lineHeight:27,textAlign:'right',width:'100%'},subtitle:{fontSize:12,color:palette.text2,marginTop:1,textAlign:'right',width:'100%'},roundBtn:{position:'absolute',width:40,height:40,borderRadius:20,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:palette.border},
 primaryBtn:{minHeight:48,borderRadius:15,backgroundColor:palette.primary,alignItems:'center',justifyContent:'center',paddingHorizontal:16},secondaryBtn:{minHeight:46,borderRadius:15,backgroundColor:palette.primarySoft,borderWidth:1,borderColor:'#B7DECF',alignItems:'center',justifyContent:'center',paddingHorizontal:15},btnBody:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:7},primaryText:{color:'#fff',fontWeight:'800',fontSize:14,textAlign:'center',writingDirection:'rtl'},secondaryText:{color:palette.primaryDark,fontWeight:'800',fontSize:13.5,textAlign:'center',writingDirection:'rtl'},disabled:{opacity:.45},
 center:{flex:1,minHeight:220,alignItems:'center',justifyContent:'center',padding:22},stateText:{width:'100%',fontSize:13.5,color:palette.text2,textAlign:'right',marginTop:8},errorIcon:{width:52,height:52,borderRadius:18,backgroundColor:'#FCE8E6',alignItems:'center',justifyContent:'center'},
 navWrap:{backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#E6ECE8',paddingTop:5},nav:{height:62,flexDirection:'row-reverse',paddingHorizontal:8,alignItems:'center',justifyContent:'space-between'},tab:{flex:1,minHeight:51,borderRadius:16,alignItems:'center',justifyContent:'center',gap:1},tabActive:{backgroundColor:palette.primarySoft},tabLabel:{fontSize:10.5,lineHeight:15,color:'#59665F',textAlign:'center'},
});
