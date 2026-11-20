const { createHmac, timingSafeEqual } = require('node:crypto');

function equal(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function codeFor(secret, window) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(window));
  const digest = createHmac('sha1', secret).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}

function verifyTotp(secret, code, now = Date.now()) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null;
  const window = Math.floor(now / 30000);
  return [window, window - 1, window + 1].find(candidate => candidate >= 0 && equal(code, codeFor(secret, candidate))) ?? null;
}

function staffAuth({ key, secretHex, required, accounts }) {
  const individual = accounts !== undefined;
  const entries = individual ? accounts : [{ id:'institucional', chave:key, totp:secretHex }];
  if (!Array.isArray(entries) || !entries.length || entries.length > 100) throw new Error('Configure de 1 a 100 instrutores.');
  const staff = new Map();
  const passwords = new Set();
  const secrets = new Set();
  for (const { id,chave,totp } of entries) {
    const secure = required || individual || Boolean(totp);
    if (typeof id !== 'string' || !/^[a-z0-9_-]{1,32}$/.test(id) || staff.has(id) ||
      (secure && (typeof chave !== 'string' || chave.length < 32 || !/^[a-f0-9]{40,128}$/i.test(totp || '') || totp.length % 2))) {
      throw new Error('Configuração de autenticação do instrutor inválida.');
    }
    const secret = totp?.toLowerCase();
    if (secure && (passwords.has(chave) || secrets.has(secret))) throw new Error('Use chaves e TOTP exclusivos por instrutor.');
    passwords.add(chave);
    secrets.add(secret);
    staff.set(id, { key:chave, secret:secret && Buffer.from(secret,'hex') });
  }
  const sign = (key,payload) => createHmac('sha256',key).update(payload).digest('hex');
  return {
    individual,
    enabled: individual || Boolean(secretHex),
    authenticate: (username,password) => {
      const id = individual ? username : 'institucional';
      const account = staff.get(id);
      return account?.key && typeof password === 'string' && equal(sign(account.key,password),sign(account.key,account.key)) ? id : null;
    },
    secondFactor: (id,code) => verifyTotp(staff.get(id).secret,code),
    issue: (id,nonce) => {
      const payload = String(Date.now() + 8 * 3600000) + '.' + id + '.' + nonce;
      return payload + '.' + sign(staff.get(id).key,payload);
    },
    authorized: header => {
      if (!header?.startsWith('Bearer ')) return null;
      const value = header.slice(7);
      const demo = staff.get('institucional');
      if (!individual && !demo.secret) return demo.key && equal(sign(demo.key,value),sign(demo.key,demo.key)) ? 'institucional' : null;
      const parts = /^(\d{13})\.([a-z0-9_-]{1,32})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(value);
      if (!parts || Number(parts[1]) <= Date.now()) return null;
      const account = staff.get(parts[2]);
      if (!account) return null;
      return equal(parts[4],sign(account.key,parts.slice(1,4).join('.'))) ? parts[2] : null;
    }
  };
}

function rateLimit({ duration, maximum, key }) {
  const windows = new Map();
  let nextSweep = 0;
  return (req, res, next) => {
    const now = Date.now();
    if (now >= nextSweep) {
      for (const [id, record] of windows) if (record.expires <= now) windows.delete(id);
      nextSweep = now + duration;
    }
    const id = key(req);
    if (!id) return next();
    let record = windows.get(id);
    if (!record || record.expires <= now) {
      if (windows.size >= 10000 && !record) {
        return res.set('Retry-After', String(Math.ceil(duration / 1000))).status(429).json({ mensagem: 'Serviço ocupado. Tente novamente em instantes.' });
      }
      record = { count: 0, expires: now + duration };
      windows.set(id, record);
    }
    if (++record.count > maximum) {
      return res.set('Retry-After', String(Math.ceil((record.expires - now) / 1000))).status(429).json({ mensagem: 'Muitas solicitações. Aguarde e tente de novo.' });
    }
    next();
  };
}

module.exports = { staffAuth, rateLimit };
