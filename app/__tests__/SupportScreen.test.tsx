import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {AppState, Pressable, TextInput,Text} from 'react-native';
import {SupportScreen} from '../src/SupportScreen';
import {apiGet, apiPost} from '../src/api';

jest.mock('../src/api', () => ({apiGet: jest.fn(), apiPost: jest.fn(), requestId: jest.fn(() => 'request-fixed')}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({bottom: 0})}));
jest.mock('../src/components', () => {
  const React = require('react'); const {Text} = require('react-native');
  return {Txt: ({children, ...props}: any) => React.createElement(Text, props, children), AppIcon: () => null, Loader: () => React.createElement(Text, {}, 'loading')};
});

const get = apiGet as jest.Mock, post = apiPost as jest.Mock;
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  Object.defineProperty(AppState, 'currentState', {value: 'active', configurable: true});
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({remove: jest.fn()});
  get.mockResolvedValue({ok: true, thread_id: 4, request: {thread_status: 'open', status: 'assigned'}, messages: []});
});
afterEach(async () => {if (tree) await act(async () => tree.unmount()); jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks();});
const mount = async () => {await act(async () => {tree = renderer.create(<SupportScreen />);});};

it('keeps the draft and uses the same idempotency key after a failed send', async () => {
  await mount();
  await act(async () => tree.root.findByType(TextInput).props.onChangeText('پیام آزمایشی'));
  post.mockRejectedValueOnce(new Error('temporary network failure'));
  await act(async () => {await tree.root.findAll(n => n.props.accessibilityLabel === 'ارسال پیام' && typeof n.props.onPress === 'function')[0].props.onPress();});
  expect(tree.root.findByType(TextInput).props.value).toBe('پیام آزمایشی');
  post.mockResolvedValueOnce({ok: true, thread_id: 4, bale_status: 'sent'});
  await act(async () => {await tree.root.findAll(n => n.props.accessibilityLabel === 'ارسال پیام' && typeof n.props.onPress === 'function')[0].props.onPress();});
  expect(post.mock.calls[0][1]).toEqual(post.mock.calls[1][1]);
  expect(tree.root.findByType(TextInput).props.value).toBe('');
});

it('does not overlap polling requests and aborts the request on unmount', async () => {
  let finish: (value: any) => void = () => {};
  get.mockImplementation(() => new Promise(resolve => {finish = resolve;}));
  await mount();
  await act(async () => jest.advanceTimersByTime(10000));
  expect(get).toHaveBeenCalledTimes(1);
  await act(async () => finish({thread_id: 4, messages: []}));
  await act(async () => jest.advanceTimersByTime(2500));
  expect(get).toHaveBeenCalledTimes(2);
  await act(async () => jest.advanceTimersByTime(10000));
  expect(get).toHaveBeenCalledTimes(2);
  const signal = get.mock.calls[1][3];
  await act(async () => tree.unmount());
  expect(signal.aborted).toBe(true);
});

it('opens a new thread instead of sending into a closed conversation', async () => {
  get.mockResolvedValue({thread_id: 4, request: {thread_status: 'closed'}, messages: []});
  post.mockResolvedValue({thread_id: 5, bale_status: 'sent'});
  await mount();
  await act(async () => tree.root.findByType(TextInput).props.onChangeText('درخواست جدید'));
  await act(async () => {await tree.root.findAll(n => n.props.accessibilityLabel === 'ارسال پیام' && typeof n.props.onPress === 'function')[0].props.onPress();});
  expect(post.mock.calls[0][1].thread_id).toBe(0);
});

it('does not let a pending request keep polling a previous admin conversation', async () => {
  let finish: (value: any) => void = () => {};
  get.mockImplementationOnce(() => new Promise(resolve => {finish = resolve;}));
  get.mockResolvedValue({thread_id: 5, request: {thread_status: 'open'}, messages: []});
  await act(async () => {tree = renderer.create(<SupportScreen adminThreadId={4} />);});
  await act(async () => tree.update(<SupportScreen adminThreadId={5} />));
  await act(async () => finish({thread_id: 4, messages: []}));
  await act(async () => jest.advanceTimersByTime(2500));
  await act(async () => jest.advanceTimersByTime(2500));
  expect(get.mock.calls.length).toBeGreaterThan(1);
  expect(get.mock.calls.slice(1).every(call => call[1].thread_id === 5)).toBe(true);
});

it('shows a failed Bale delivery for a stored user message',async()=>{
  post.mockResolvedValue({thread_id:4,bale_status:'failed',mobile_synced:true});await mount();
  await act(async()=>tree.root.findByType(TextInput).props.onChangeText('پیام ذخیره شده'));
  await act(async()=>tree.root.findAll(n=>n.props.accessibilityLabel==='ارسال پیام'&&typeof n.props.onPress==='function')[0].props.onPress());
  expect(tree.root.findAllByType(Text).map(n=>n.props.children).flat().join(' ')).toContain('ارسال آن به بله ناموفق بود');
});

it('updates delivery state without waiting for another transcript message',async()=>{
  get.mockResolvedValueOnce({thread_id:4,request:{thread_status:'open'},messages:[{id:1,sender_role:'user',body:'پیام'}],delivery_statuses:{1:'queued'}});
  get.mockResolvedValue({thread_id:4,request:{thread_status:'open'},messages:[],delivery_statuses:{1:'sent'}});await mount();
  await act(async()=>jest.advanceTimersByTime(2500));
  expect(tree.root.findAllByType(Text).map(n=>n.props.children).flat().join(' ')).toContain('تحویل به بله انجام شد');
});

it('renders both sender roles separately and retains earlier messages after an incremental poll', async () => {
  get.mockResolvedValueOnce({thread_id: 4, messages: [{id: 1, sender_role: 'user', body: 'سؤال'}]});
  get.mockResolvedValue({thread_id: 4, messages: [{id: 2, sender_role: 'support', body: 'پاسخ'}]});
  await mount();
  await act(async () => jest.advanceTimersByTime(2500));
  const {StyleSheet} = require('react-native');
  const rows = [1, 2].map(id => tree.root.findAll(n => n.props.testID === `support-message-${id}`)[0]);
  expect(rows.every(Boolean)).toBe(true);
  expect(StyleSheet.flatten(rows[0].props.style).justifyContent).toBe('flex-end');
  expect(StyleSheet.flatten(rows[1].props.style).justifyContent).toBe('flex-start');
});
