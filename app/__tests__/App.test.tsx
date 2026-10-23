/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, Linking} from 'react-native';
import App from '../App';
import {getToken,apiGet,apiPost} from '../src/api';

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-video', () => 'Video');
jest.mock('react-native-webview', () => ({WebView:'WebView'}));
jest.mock('react-native-image-picker', () => ({launchImageLibrary: jest.fn()}));
jest.mock('../src/api', () => ({getToken: jest.fn(async () => ''), apiGet: jest.fn(), apiPost: jest.fn(), clearToken: jest.fn(), setToken: jest.fn(), requestId: jest.fn()}));
jest.mock('react-native-paper', () => ({MD3LightTheme: {colors: {}}, PaperProvider: ({children}: any) => children}));
jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: ({children}: any) => children, SafeAreaView: View, useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0})};
});

test('opens the login screen when no saved session exists', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  const texts = app!.root.findAllByType(Text).map(x => x.props.children).flat().join(' ');
  expect(texts).toContain('بازار کسب‌وکار');
  await ReactTestRenderer.act(async () => app!.unmount());
});

test('the signed-in admin can reach management directly from the active home screen',async()=>{
  (getToken as jest.Mock).mockResolvedValue('saved-admin-token');
  (apiGet as jest.Mock).mockImplementation(async(action:string)=>action==='bootstrap'?{user:{is_admin:true,bale_user_id:9001},stats:{}}:action==='admin.support.list'?{requests:[]}:{businesses:[],products:[],stats:{}});
  let app:ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async()=>{app=ReactTestRenderer.create(<App/>);});
  const entry=app!.root.findAll(n=>n.props.accessibilityLabel==='پنل مدیریت'&&typeof n.props.onPress==='function')[0];
  expect(entry).toBeDefined();await ReactTestRenderer.act(async()=>entry.props.onPress());
  expect(app!.root.findAllByType(Text).map(n=>n.props.children).flat().join(' ')).toContain('پنل کامل مدیریت');
  await ReactTestRenderer.act(async()=>app!.unmount());
});

test('waits for explicit privacy consent before exchanging a direct login ticket', async () => {
  jest.clearAllMocks();
  (getToken as jest.Mock).mockResolvedValue('');
  (apiPost as jest.Mock).mockResolvedValue({token: 'test-session'});
  const initial = jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`bazarbusiness://login?ticket=${'a'.repeat(64)}`);
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {app = ReactTestRenderer.create(<App />);});
  expect(apiPost).not.toHaveBeenCalled();
  let login = app!.root.findAll(n => n.props?.title === 'تکمیل ورود')[0];
  expect(login.props.disabled).toBe(true);
  const consent = app!.root.findAll(n => n.props?.accessibilityLabel === 'پذیرش حریم خصوصی' && typeof n.props?.onPress === 'function')[0];
  await ReactTestRenderer.act(async () => consent.props.onPress());
  login = app!.root.findAll(n => n.props?.title === 'تکمیل ورود')[0];
  expect(login.props.disabled).toBe(false);
  await ReactTestRenderer.act(async () => {await login.props.onPress();});
  expect(apiPost).toHaveBeenCalledWith('auth.ticket.exchange', expect.objectContaining({ticket: 'a'.repeat(64)}), false);
  await ReactTestRenderer.act(async () => app!.unmount()); initial.mockRestore();
});

test('offers a fresh Bale login after an expired direct ticket', async () => {
  jest.clearAllMocks();
  (getToken as jest.Mock).mockResolvedValue('');
  (apiPost as jest.Mock).mockRejectedValue(Object.assign(new Error('لینک منقضی شده است'), {code: 'ticket_expired_or_invalid'}));
  const initial = jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`bazarbusiness://login?ticket=${'b'.repeat(64)}`);
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {app = ReactTestRenderer.create(<App />);});
  await ReactTestRenderer.act(async () => app!.root.findAll(n => n.props?.accessibilityLabel === 'پذیرش حریم خصوصی' && typeof n.props?.onPress === 'function')[0].props.onPress());
  await ReactTestRenderer.act(async () => {await app!.root.findAll(n => n.props?.title === 'تکمیل ورود')[0].props.onPress();});
  expect(app!.root.findAll(n => n.props?.title === 'تکمیل ورود')).toHaveLength(0);
  expect(app!.root.findAll(n => n.props?.title === 'ورود با بله')[0].props.disabled).toBe(false);
  await ReactTestRenderer.act(async () => app!.unmount()); initial.mockRestore();
});
