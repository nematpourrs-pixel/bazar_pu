import {loginTicketFromUrl} from '../src/authLinks';

const ticket = 'a'.repeat(64);
it('accepts only a valid ticket on the registered app callback', () => {
  expect(loginTicketFromUrl(`bazarbusiness://login?ticket=${ticket}`)).toBe(ticket);
  expect(loginTicketFromUrl(`bazarbusiness://login/?ticket=${ticket.toUpperCase()}`)).toBe(ticket);
  for (const url of [
    `https://example.org/login?ticket=${ticket}`,
    `bazarbusiness://login.evil.test?ticket=${ticket}`,
    `bazarbusiness://user@login?ticket=${ticket}`,
    `bazarbusiness://login/path?ticket=${ticket}`,
    `bazarbusiness://login?ticket=${ticket}&ticket=${'b'.repeat(64)}`,
    'bazarbusiness://login?ticket=invalid',
  ]) expect(loginTicketFromUrl(url)).toBe('');
});
