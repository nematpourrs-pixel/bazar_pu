import React, {useRef,useState} from 'react';
import {Pressable,View} from 'react-native';
import {apiGet,restoreAdminSession} from './api';
import {AppIcon,Txt} from './components';
import {palette} from './theme';

export function AdminEntry({user,navigate,onBoot}:any){
  const [error,setError]=useState('');const busy=useRef(false);
  const open=async()=>{if(busy.current)return;busy.current=true;setError('');
    try{if(user?.is_admin){navigate('adminDashboard');return;}
      const b=user?.is_test_user?await restoreAdminSession():await apiGet('bootstrap');onBoot?.(b);
      if(b.user?.is_admin)navigate('adminDashboard');else setError(`حساب بلهٔ ${b.user?.bale_user_id||user?.bale_user_id||''} به‌عنوان مدیر سامانه شناخته نشد. با حساب مدیر وارد شوید.`);
    }catch(e:any){setError(e.message);}finally{busy.current=false;}};
  return <View style={{marginBottom:11}}><Pressable accessibilityRole="button" accessibilityLabel={user?.is_test_user?'بازگشت به حساب مدیر':'پنل مدیریت'} onPress={open}
    style={{backgroundColor:user?.is_admin?palette.primary:'#fff',borderWidth:1,borderColor:palette.border,borderRadius:18,padding:16,flexDirection:'row-reverse',alignItems:'center',gap:12}}>
    <AppIcon name="shield-account-outline" size={25} color={user?.is_admin?'#fff':palette.primary}/><View style={{flex:1}}>
      <Txt style={{fontWeight:'900',color:user?.is_admin?'#fff':palette.text}}>{user?.is_test_user?'بازگشت به حساب مدیر':user?.is_admin?'پنل مدیریت':'بررسی دسترسی مدیریت'}</Txt>
      <Txt style={{fontSize:11,color:user?.is_admin?palette.secondarySoft:palette.text2,marginTop:3}}>{user?.is_admin?'کسب‌وکارها، محصولات، پشتیبانی و تنظیمات سامانه':user?.is_test_user?'خروج از حالت آزمایش و ادامهٔ مدیریت':'بررسی نقش حساب فعلی'}</Txt></View>
    <AppIcon name="chevron-left" size={21} color={user?.is_admin?'#fff':palette.primary}/></Pressable>
    {!!error&&<Txt accessibilityRole="alert" style={{color:palette.danger,marginTop:8}}>{error}</Txt>}
  </View>;
}
