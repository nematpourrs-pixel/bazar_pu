import React,{useEffect,useRef,useState} from 'react';
import {BackHandler,Pressable,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {API_BASE,apiPost} from './api';
import {AppIcon,Loader,Txt} from './components';
import {palette} from './theme';

export function AdminPanelScreen({onBack}: {onBack:()=>void}){
  const [source,setSource]=useState<any>(null);const [error,setError]=useState('');const [revision,setRevision]=useState(0);
  const web=useRef<WebView<{}>>(null);const canGoBack=useRef(false);
  const base=API_BASE.replace(/\/public\/mobile_api\.php$/,'/web/');
  useEffect(()=>{let alive=true;let currentLogin=0;
    setSource(null);setError('');canGoBack.current=false;
    apiPost('admin.web.login').then(r=>{currentLogin=Number(r.login_id);if(!alive){apiPost('admin.web.close',{login_id:currentLogin}).catch(()=>{});return;}
      setSource({uri:base+'mobile_login.php',method:'POST',body:'ticket='+encodeURIComponent(r.ticket)});
    }).catch(e=>{if(alive)setError(e.message);});
    const h=BackHandler.addEventListener('hardwareBackPress',()=>{if(canGoBack.current){web.current?.goBack();return true;}onBack();return true;});
    return()=>{alive=false;h.remove();if(currentLogin)apiPost('admin.web.close',{login_id:currentLogin}).catch(()=>{});};
  },[revision,base,onBack]);
  const back=()=>{if(canGoBack.current)web.current?.goBack();else onBack();};
  return <View style={{flex:1}}><View style={{paddingHorizontal:14,height:54,backgroundColor:'#fff',flexDirection:'row-reverse',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:palette.border}}>
    <Pressable accessibilityLabel="بازگشت از پنل مدیریت" onPress={back}><AppIcon name="arrow-right" size={24}/></Pressable><Txt style={{flex:1,fontWeight:'900'}}>پنل مدیریت سامانه</Txt>
    <Pressable accessibilityLabel="بارگذاری دوباره پنل مدیریت" onPress={()=>setRevision(x=>x+1)}><AppIcon name="refresh" size={23}/></Pressable></View>
    {error?<View style={{padding:20}}><Txt accessibilityRole="alert" style={{color:palette.danger}}>{error}</Txt><Pressable onPress={()=>setRevision(x=>x+1)} style={{padding:16}}><Txt style={{color:palette.primary}}>تلاش مجدد</Txt></Pressable></View>:!source?<Loader/>:
      <WebView<{}> key={revision} ref={web} source={source} incognito cacheEnabled={false} javaScriptEnabled domStorageEnabled thirdPartyCookiesEnabled={false}
        mixedContentMode="never" allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
        webviewDebuggingEnabled={false} javaScriptCanOpenWindowsAutomatically={false}
        setSupportMultipleWindows={false} startInLoadingState renderLoading={()=><Loader/>}
        originWhitelist={['https://picamo.ir']} onShouldStartLoadWithRequest={r=>r.url==='about:blank'||r.url.startsWith(base.replace(/web\/$/,''))}
        onNavigationStateChange={r=>{canGoBack.current=r.canGoBack;}}
        onError={()=>setError('پنل مدیریت بارگذاری نشد. اتصال اینترنت و به‌روزرسانی بستهٔ سرور را بررسی کنید.')}
        onHttpError={e=>{const url=e.nativeEvent.url.split(/[?#]/)[0];if(e.nativeEvent.statusCode>=400&&[base+'mobile_login.php',base+'index.php'].includes(url))setError(`خطای بارگذاری پنل (${e.nativeEvent.statusCode}). دوباره وارد پنل شوید.`);}}/>}
  </View>;
}
