declare const __dirname: string;
const fs=require('fs');
const path=require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf8');
const tabs = fs.readFileSync(path.resolve(__dirname, '../src/components.tsx'), 'utf8');
const chat = fs.readFileSync(path.resolve(__dirname, '../src/MarketplaceChat.tsx'), 'utf8');

test('business and product contact buttons open internal conversation instead of Bale', () => {
  expect(src).toContain("navigate('chatThread',{businessId:b.id})");
  expect(src).toContain("navigate('chatThread',{businessId:p.business_id})");
  expect(chat).toContain("apiPost('chat.open'");
  expect(chat).toContain("apiPost('chat.send'");
});

test('bottom navigation persists for business details and includes messages', () => {
  expect(src).toContain("<BottomNav active={route?.name==='chatThread'?'messages':tab}");
  expect(tabs).toContain("['messages','پیام‌ها','message-text-outline']");
});

test('all home shortcuts are interactive', () => {
  expect(src).toContain("navigate('myBusiness')");
  expect(src).toContain("navigate('myProducts')");
  expect(src).toContain("navigate('following')");
});
