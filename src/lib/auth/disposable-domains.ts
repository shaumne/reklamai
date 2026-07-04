// Known disposable / temp-mail domains. Matched by suffix so subdomains
// (e.g. abc.mailinator.com) are covered too. Not exhaustive — the IP guard
// catches what slips through.

const DOMAINS = [
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "33mail.com",
  "anonaddy.me",
  "burnermail.io",
  "byom.de",
  "cs.email",
  "dispostable.com",
  "discard.email",
  "dropmail.me",
  "emailondeck.com",
  "fakeinbox.com",
  "fivejm.com",
  "getairmail.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "harakirimail.com",
  "inboxkitten.com",
  "incognitomail.org",
  "jetable.org",
  "linshiyouxiang.net",
  "mail-temp.com",
  "mail7.io",
  "mailcatch.com",
  "maildrop.cc",
  "mailexpire.com",
  "mailinator.com",
  "mailnesia.com",
  "mailpoof.com",
  "mailsac.com",
  "mailtemp.info",
  "minuteinbox.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "nada.email",
  "onetimemail.org",
  "owlymail.com",
  "sharklasers.com",
  "spam4.me",
  "spamgourmet.com",
  "tempail.com",
  "temp-mail.io",
  "temp-mail.org",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.dev",
  "tempmail.plus",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "tmail.io",
  "tmpmail.net",
  "tmpmail.org",
  "trash-mail.com",
  "trashmail.com",
  "trashmail.de",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "zohomail.wtf",
];

const DISPOSABLE = new Set(DOMAINS);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return true;
  if (DISPOSABLE.has(domain)) return true;
  // subdomain match: a.b.mailinator.com → mailinator.com
  const parts = domain.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    if (DISPOSABLE.has(parts.slice(i).join("."))) return true;
  }
  return false;
}
