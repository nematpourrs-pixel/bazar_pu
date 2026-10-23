import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';
import {SupportMessageBubble, supportRole} from '../src/SupportMessage';
import {palette} from '../src/theme';

jest.mock('../src/components', () => {
  const React = require('react'); const {Text} = require('react-native');
  return {Txt: ({children, ...props}: any) => React.createElement(Text, props, children), AppIcon: 'AppIcon'};
});

it.each(['support', 'admin', 'agent', 'staff', ' SUPPORT '])('keeps %s replies opposite requester messages, including in admin view', async sender => {
  let tree: renderer.ReactTestRenderer;
  await act(async () => {tree = renderer.create(<>
    <SupportMessageBubble message={{id: 1, sender_role: 'user', body: 'سؤال کاربر'}} adminView />
    <SupportMessageBubble message={{id: 2, sender_role: sender, body: 'پاسخ پشتیبانی'}} adminView />
  </>);});
  const root = tree!.root;
  const row = (id: number) => StyleSheet.flatten(root.findAll(n => n.props?.testID === `support-message-${id}`)[0].props.style);
  const bubble = (id: number) => StyleSheet.flatten(root.findAll(n => n.props?.testID === `support-bubble-${id}`)[0].props.style);
  expect(row(1).direction).toBe('ltr');
  expect(row(2).direction).toBe('ltr');
  expect(row(1).justifyContent).toBe('flex-end');
  expect(row(2).justifyContent).toBe('flex-start');
  expect(bubble(1).backgroundColor).toBe(palette.userBubble);
  expect(bubble(2).backgroundColor).toBe(palette.supportBubble);
  expect(bubble(1).backgroundColor).not.toBe(bubble(2).backgroundColor);
  const icons = root.findAll(n => typeof n.props?.name === 'string' && n.props?.size === 20);
  expect(icons.map(n => n.props?.name)).toEqual(['account-outline', 'headset']);
  const text = root.findAllByType(Text).map(n => n.props.children).flat().join(' ');
  expect(text).toContain('کاربر درخواست‌دهنده');
  expect(text).toContain('پشتیبانی');
  await act(async () => tree!.unmount());
});

it('normalizes legacy requester roles and does not disguise unknown system messages as staff', () => {
  expect(supportRole({id: 1, sender_role: ' Customer ', body: ''})).toBe('user');
  expect(supportRole({id: 1, role: 'requester', body: ''})).toBe('user');
  expect(supportRole({id: 1, sender_role: 'system', body: ''})).toBe('system');
});

it('keeps a long mixed Persian/English message selectable, bounded and independent of bubble direction', async () => {
  const body = 'پیگیری سفارش ABC-123\n' + 'توضیح فارسی و English متن بلند '.repeat(30);
  let tree: renderer.ReactTestRenderer;
  await act(async () => {tree = renderer.create(<SupportMessageBubble message={{id: 3, sender_role: 'user', body, bale_status: 'queued'}} />);});
  const bodyText = tree!.root.findAllByType(Text).find(n => n.props.children === body)!;
  expect(bodyText.props.selectable).toBe(true);
  expect(StyleSheet.flatten(bodyText.props.style).writingDirection).toBe('rtl');
  expect(StyleSheet.flatten(bodyText.props.style).textAlign).toBe('right');
  expect(tree!.root.findAllByType(Text).some(n => n.props.children === 'ذخیره شده؛ تحویل به بله در صف است')).toBe(true);
  await act(async () => tree!.unmount());
});
