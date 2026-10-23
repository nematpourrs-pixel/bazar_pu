import React,{useMemo,useState} from 'react';
import {Modal,View,TextInput,FlatList,Pressable,StyleSheet} from 'react-native';
import {Txt} from './components';
import {palette} from './theme';

export function SelectSheet({visible,title,items,onClose,onSelect,selectedId,searchable=true}:any){
 const [q,setQ]=useState('');
 const data=useMemo(()=>{const x=q.trim();return !x?(items||[]):(items||[]).filter((i:any)=>String(i.title||i.name||i.label||'').includes(x));},[q,items]);
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <Pressable style={s.overlay} onPress={onClose}/>
  <View style={s.sheet}>
   <View style={s.handle}/>
   <View style={s.head}><Txt style={s.title}>{title}</Txt><Pressable onPress={onClose} style={s.close}><Txt style={s.closeText}>بستن</Txt></Pressable></View>
   {searchable?<TextInput value={q} onChangeText={setQ} placeholder="جست‌وجو…" placeholderTextColor="#8A9690" style={s.input}/>:null}
   <FlatList data={data} keyboardShouldPersistTaps="handled" keyExtractor={(x:any)=>String(x.id??x.value??x.slug??x.title??x.name)} renderItem={({item}:any)=>{const key=item.id??item.value??item.slug;const active=String(selectedId)===String(key);return <Pressable onPress={()=>{onSelect(item);setQ('');onClose();}} style={[s.row,active&&s.sel]}><Txt numberOfLines={2} style={s.rowText}>{item.title||item.name||item.label}</Txt>{active?<View style={s.check}><Txt style={{color:palette.primary,fontWeight:'900',textAlign:'center'}}>✓</Txt></View>:null}</Pressable>}}/>
  </View>
 </Modal>
}

const s=StyleSheet.create({
 overlay:{flex:1,backgroundColor:'rgba(0,0,0,.34)'},sheet:{maxHeight:'76%',backgroundColor:'#fff',borderTopLeftRadius:28,borderTopRightRadius:28,paddingHorizontal:16,paddingBottom:24,direction:'rtl'},handle:{alignSelf:'center',width:52,height:5,borderRadius:5,backgroundColor:'#D4DDD7',marginTop:9},
 head:{minHeight:66,justifyContent:'center',alignItems:'flex-end',position:'relative'},title:{fontSize:19,fontWeight:'900',textAlign:'right',width:'100%',paddingLeft:70},close:{position:'absolute',left:0,minWidth:54,minHeight:38,alignItems:'center',justifyContent:'center'},closeText:{color:palette.primary,fontWeight:'800',textAlign:'center'},
 input:{height:48,borderRadius:15,backgroundColor:'#F1F5F2',paddingHorizontal:14,textAlign:'right',writingDirection:'rtl',color:palette.text,fontSize:14,marginBottom:7},
 row:{minHeight:54,justifyContent:'center',alignItems:'flex-end',paddingRight:8,paddingLeft:42,borderBottomWidth:1,borderBottomColor:'#EEF2EF',position:'relative'},rowText:{fontWeight:'700',textAlign:'right',width:'100%',fontSize:14},check:{position:'absolute',left:8,width:28,height:28,borderRadius:14,backgroundColor:'#E3F4ED',alignItems:'center',justifyContent:'center'},sel:{backgroundColor:'#F5FBF8',borderRadius:13},
});