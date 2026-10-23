import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {Pressable,Text} from 'react-native';
import {AdminEntry} from '../src/AdminEntry';
import {AdminPanelScreen} from '../src/AdminPanelScreen';
import {apiGet,apiPost,restoreAdminSession} from '../src/api';
jest.mock('../src/api',()=>({API_BASE:'https://picamo.ir/bale-bot/public/mobile_api.php',apiGet:jest.fn(),apiPost:jest.fn(),restoreAdminSession:jest.fn()}));
jest.mock('../src/components',()=>{const React=require('react');const {Text}=require('react-native');return {Txt:({children,...p}:any)=>React.createElement(Text,p,children),AppIcon:()=>null,Loader:()=>React.createElement(Text,{},'loading')};});
jest.mock('react-native-webview',()=>({WebView:'WebView'}));
let tree:renderer.ReactTestRenderer;const post=apiPost as jest.Mock,get=apiGet as jest.Mock;
const entry=()=>tree.root.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function')[0];
beforeEach(()=>{jest.clearAllMocks();});afterEach(async()=>{if(tree)await act(async()=>tree.unmount());});
it('shows a direct admin entry and does not require another login',async()=>{
  const navigate=jest.fn();await act(async()=>{tree=renderer.create(<AdminEntry user={{is_admin:true}} navigate={navigate}/>);});
  await act(async()=>entry().props.onPress());expect(navigate).toHaveBeenCalledWith('adminDashboard');expect(get).not.toHaveBeenCalled();
});
it('does not open management for a regular user after checking the server',async()=>{
  get.mockResolvedValue({user:{bale_user_id:202,is_admin:false}});const navigate=jest.fn();
  await act(async()=>{tree=renderer.create(<AdminEntry user={{is_admin:false}} navigate={navigate}/>);});
  await act(async()=>entry().props.onPress());expect(navigate).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(Text).map(n=>n.props.children).flat().join(' ')).toContain('به‌عنوان مدیر سامانه شناخته نشد');
});
it('restores the verified admin session when leaving the test persona',async()=>{
  (restoreAdminSession as jest.Mock).mockResolvedValue({user:{is_admin:true,bale_user_id:9001}});const navigate=jest.fn(),onBoot=jest.fn();
  await act(async()=>{tree=renderer.create(<AdminEntry user={{is_test_user:true}} navigate={navigate} onBoot={onBoot}/>);});
  await act(async()=>entry().props.onPress());expect(restoreAdminSession).toHaveBeenCalled();expect(onBoot.mock.calls[0][0].user.bale_user_id).toBe(9001);expect(navigate).toHaveBeenCalledWith('adminDashboard');
});
it('opens the full panel with a one-use POST ticket and closes the child session',async()=>{
  post.mockResolvedValue({ticket:'temporary-ticket',login_id:12});const onBack=jest.fn();
  await act(async()=>{tree=renderer.create(<AdminPanelScreen onBack={onBack}/>);});
  const web=tree.root.findAll(n=>n.type===('WebView' as any))[0];
  expect(web.props.source).toEqual({uri:'https://picamo.ir/bale-bot/web/mobile_login.php',method:'POST',body:'ticket=temporary-ticket'});
  expect(web.props.source.uri).not.toContain('ticket');expect(web.props.incognito).toBe(true);
  expect(web.props.onShouldStartLoadWithRequest({url:'https://other.example/'})).toBe(false);
  await act(async()=>tree.unmount());expect(post).toHaveBeenCalledWith('admin.web.close',{login_id:12});
});
it('revokes a newly issued panel session if the screen closed during login',async()=>{
  let finish:(v:any)=>void=()=>{};post.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;})).mockResolvedValue({ok:true});
  await act(async()=>{tree=renderer.create(<AdminPanelScreen onBack={()=>{}}/>);});await act(async()=>tree.unmount());
  await act(async()=>finish({ticket:'temporary-ticket',login_id:13}));expect(post).toHaveBeenCalledWith('admin.web.close',{login_id:13});
});
it('keeps the panel open for a missing asset and reports a failed main page',async()=>{
  post.mockResolvedValue({ticket:'temporary-ticket',login_id:14});await act(async()=>{tree=renderer.create(<AdminPanelScreen onBack={()=>{}}/>);});
  const web=tree.root.findAll(n=>n.type===('WebView' as any))[0];
  await act(async()=>web.props.onHttpError({nativeEvent:{url:'https://picamo.ir/bale-bot/web/assets/missing.png',statusCode:404}}));
  expect(tree.root.findAll(n=>n.type===('WebView' as any))).toHaveLength(1);
  await act(async()=>web.props.onHttpError({nativeEvent:{url:'https://picamo.ir/bale-bot/web/index.php',statusCode:503}}));
  expect(tree.root.findAllByType(Text).map(n=>n.props.children).flat().join(' ')).toContain('خطای بارگذاری پنل (503)');
});
