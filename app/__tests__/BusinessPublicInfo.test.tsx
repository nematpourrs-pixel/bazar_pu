import {publicBusinessLabels} from '../src/BusinessPublicInfo';

test('shows all business-published information but not the private registration number', () => {
  const info = publicBusinessLabels({business: {manager_name: 'مدیر', phone: '09121112233', public_phone: '02144332211', public_phone_hidden: 0, address: 'تهران، خیابان نمونه', province: 'تهران', city: 'تهران'}, types: [{name: 'فروشنده'}], categories: [{name: 'آموزش'}], subcategories: [{name: 'زبان'}]});
  const txt = info.map(item => item.value).join(' ');
  expect(txt).toContain('مدیر'); expect(txt).toContain('02144332211'); expect(txt).toContain('آموزش'); expect(txt).toContain('زبان'); expect(txt).toContain('خیابان نمونه');
  expect(txt).not.toContain('09121112233');
});
test('never displays an explicitly hidden public phone', () => {
  const info = publicBusinessLabels({business: {public_phone: '02144332211', public_phone_hidden: 1, address: 'بابل'}});
  expect(info.some(i => i.label === 'شماره تماس عمومی')).toBe(false);
});
