export function loginTicketFromUrl(url: string): string {
  // Match only our registered callback and the exact 64-hex ticket issued by the server.
  return /^bazarbusiness:\/\/login\/?\?ticket=([a-f0-9]{64})$/i.exec(url)?.[1].toLowerCase() || '';
}
