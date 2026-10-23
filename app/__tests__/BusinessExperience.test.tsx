import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Image, Text} from 'react-native';
import {BusinessNetworkScreen} from '../src/BusinessNetworkScreen';
import {CachedImage} from '../src/CachedImage';
import {StoreContactAction, canOpenStoreContact} from '../src/StoreContact';
import {apiGet} from '../src/api';

jest.mock('../src/api', () => ({apiGet: jest.fn()}));
jest.mock('../src/components', () => {
 const R = require('react'); const {Text: T, Pressable: P} = require('react-native');
 return {Txt: ({children, ...p}: any) => R.createElement(T,p,children), AppIcon: () => null,
 PrimaryButton: ({title,...p}: any) => R.createElement(P,p,R.createElement(T,null,title)),
 SecondaryButton: ({title,...p}: any) => R.createElement(P,p,R.createElement(T,null,title)),
 Loader: () => R.createElement(T,null,'loading'), EmptyState: ({title}: any) => R.createElement(T,null,title), ErrorState: ({message}: any) => R.createElement(T,null,message)};
});
const text = (t: renderer.ReactTestRenderer) => t.root.findAllByType(Text).map(n=>n.props.children).flat().join(' ');
beforeEach(() => jest.clearAllMocks());

test('following list opens a business and fetches additional pages', async () => {
 (apiGet as jest.Mock).mockResolvedValueOnce({businesses:[{id:7,name:'کسب‌وکار هفت'}],total:2,next_offset:30}).mockResolvedValueOnce({businesses:[{id:8,name:'کسب‌وکار هشت'}],total:2,next_offset:null});
 const navigate=jest.fn(); let t: renderer.ReactTestRenderer;
 await act(async()=>{t=renderer.create(<BusinessNetworkScreen navigate={navigate}/>);});
 expect(apiGet).toHaveBeenCalledWith('following.mine',expect.objectContaining({offset:0}));
 await act(async()=>t!.root.findAll(n=>n.props.accessibilityLabel==='مشاهده کسب‌وکار هفت'&&typeof n.props.onPress==='function')[0].props.onPress());
 expect(navigate).toHaveBeenCalledWith('businessDetail',{id:7});
 await act(async()=>{await t!.root.findAll(n=>n.props.title==='نمایش بیشتر')[0].props.onPress();});
 expect(apiGet).toHaveBeenLastCalledWith('following.mine',expect.objectContaining({offset:30}));
 expect(text(t!)).toContain('کسب‌وکار هشت');
 await act(async()=>t!.unmount());
});

test('owner followers use the owner-only endpoint and display names and dates', async () => {
 (apiGet as jest.Mock).mockResolvedValue({business:{id:7,name:'فروشگاه من'},followers:[{display_name:'مشتری نمونه',followed_at:'2026-10-18 09:00:00'}],total:1,next_offset:null});
 let t: renderer.ReactTestRenderer;await act(async()=>{t=renderer.create(<BusinessNetworkScreen businessId={7} navigate={jest.fn()}/>);});
 expect(apiGet).toHaveBeenCalledWith('business.followers',expect.objectContaining({business_id:7}));
 expect(text(t!)).toContain('مشتری نمونه');
 expect(text(t!)).toContain('2026-10-18');
 await act(async()=>t!.unmount());
});

test('cached images retain the same source on a remount and request the phone cache', async () => {
 let t: renderer.ReactTestRenderer;await act(async()=>{t=renderer.create(<CachedImage source={{uri:'https://picamo.ir/image.jpg',cache:'reload'}}/>);});
 expect(t!.root.findByType(Image).props.source).toEqual({uri:'https://picamo.ir/image.jpg',cache:'force-cache'});
 expect(t!.root.findByType(Image).props.fadeDuration).toBe(0);
 await act(async()=>t!.unmount());
});

test('contact rechecks server rights and opens Bale for a previously granted account', async () => {
 (apiGet as jest.Mock).mockResolvedValue({contact_unlocked:true,contact_chat_available:true,contact_access_reason:'granted'});
 const open=jest.fn();let t: renderer.ReactTestRenderer;await act(async()=>{t=renderer.create(<StoreContactAction data={{contact_payment_required:true}} businessId={7} onPress={open}/>);});
 const button=t!.root.findAll(n=>n.props.title==='بررسی امکان گفتگو')[0];expect(button.props.disabled).toBe(false);
 await act(async()=>{await button.props.onPress();});
 expect(apiGet).toHaveBeenCalledWith('business.contact',{id:7});expect(open).toHaveBeenCalledTimes(1);
 await act(async()=>t!.unmount());
});

test('unavailable chat shows a neutral notice without an external checkout', async () => {
 (apiGet as jest.Mock).mockResolvedValue({contact_unlocked:false,contact_payment_required:true,contact_chat_available:false,contact_chat_reason:'locked'});
 const open=jest.fn();let t: renderer.ReactTestRenderer;await act(async()=>{t=renderer.create(<StoreContactAction data={{}} businessId={7} onPress={open}/>);});
 await act(async()=>{await t!.root.findAll(n=>n.props.title==='بررسی امکان گفتگو')[0].props.onPress();});
 expect(open).not.toHaveBeenCalled();expect(text(t!)).toContain('در حال حاضر امکان گفتگو');
 await act(async()=>t!.unmount());
});

test('global chat suspension overrides a previously unlocked contact',()=>{
 expect(canOpenStoreContact({contact_unlocked:true,contact_chat_enabled:false})).toBe(false);
 expect(canOpenStoreContact({contact_unlocked:true,contact_chat_available:false})).toBe(false);
 expect(canOpenStoreContact({contact_unlocked:true,contact_chat_available:true})).toBe(true);
});


test('leaving contact details before the recheck finishes never opens Bale', async () => {
 let finish: (v: any) => void = () => {};
 (apiGet as jest.Mock).mockImplementation(() => new Promise(resolve => {finish=resolve;}));
 const open=jest.fn();let t: renderer.ReactTestRenderer;await act(async()=>{t=renderer.create(<StoreContactAction data={{}} businessId={7} onPress={open}/>);});
 let pending: Promise<void>;
 await act(async()=>{pending=t!.root.findAll(n=>n.props.title==='بررسی امکان گفتگو')[0].props.onPress();});
 await act(async()=>t!.unmount());
 await act(async()=>{finish({contact_unlocked:true,contact_chat_available:true});await pending;});
 expect(open).not.toHaveBeenCalled();
});
