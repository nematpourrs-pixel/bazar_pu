import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Linking, Text} from 'react-native';
import {PlansScreen} from '../src/PlansScreen';
import {canOpenStoreContact, StoreContactAction} from '../src/StoreContact';
import {apiGet} from '../src/api';

jest.mock('../src/api', () => ({apiGet: jest.fn()}));
jest.mock('../src/components', () => {
  const React = require('react'); const {Text, Pressable} = require('react-native');
  return {
    Txt: ({children, ...props}: any) => React.createElement(Text, props, children),
    AppIcon: () => null,
    SurfaceCard: ({children}: any) => React.createElement(React.Fragment, null, children),
    SecondaryButton: ({title, ...props}: any) => React.createElement(Pressable, props, React.createElement(Text, null, title)),
    PrimaryButton: ({title, ...props}: any) => React.createElement(Pressable, props, React.createElement(Text, null, title)),
    Loader: () => React.createElement(Text, null, 'loading'), EmptyState: () => null, ErrorState: () => null,
  };
});

it('shows existing subscription entitlements without an external purchase action', async () => {
  (apiGet as jest.Mock).mockResolvedValue({businesses: [{business: {id: 7, name: 'فروشگاه نمونه'}, quota: {plan_name: 'حرفه‌ای', storage_used_mb: 12, storage_limit_mb: 100}}]});
  const open = jest.spyOn(Linking, 'openURL');
  let tree: renderer.ReactTestRenderer;
  await act(async () => {tree = renderer.create(<PlansScreen />);});
  const text = tree!.root.findAllByType(Text).map(n => n.props.children).flat().join(' ');
  expect(text).toContain('حرفه‌ای');
  expect(text).toContain('فروشگاه نمونه');
  expect(tree!.root.findAll(n => typeof n.props?.onPress === 'function')).toHaveLength(0);
  expect(open).not.toHaveBeenCalled();
  await act(async () => tree!.unmount()); open.mockRestore();
});

it('uses the current server eligibility and never blocks a chat for pricing', async () => {
  expect(canOpenStoreContact({contact_chat_available: true, contact_payment_required: true, contact_price_toman: 5000})).toBe(true);
  expect(canOpenStoreContact({contact_chat_available: false, contact_unlocked: true})).toBe(false);
  expect(canOpenStoreContact({contact_chat_available: true, contact_chat_enabled: false})).toBe(false);
  expect(canOpenStoreContact({})).toBe(false);
  const onPress = jest.fn(); let tree: renderer.ReactTestRenderer;
  await act(async () => {tree = renderer.create(<StoreContactAction data={{contact_chat_available: false}} onPress={onPress} />);});
  expect(tree!.root.findAll(n => n.props?.title === 'بررسی امکان گفتگو')).toHaveLength(1);
  expect(onPress).not.toHaveBeenCalled();
  await act(async () => tree!.unmount());
});
