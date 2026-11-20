const express = require('express');

function institutions(createApp) {
  const config = process.env.INSTITUICOES_JSON;
  if (!config) return createApp();
  const entries = JSON.parse(config);
  if (!Array.isArray(entries) || !entries.length || entries.length > 30) throw new Error('Configure de 1 a 30 instituições.');
  const apps = new Map();
  const databases = new Set();
  const tokens = new Set();
  const totps = new Set();
  const encryptionKeys = new Set();
  for (const institution of entries) {
    const { dominio, banco, usuario, senha, chave, totp, criptografia, instrutores } = institution;
    if (typeof dominio !== 'string' || !/^[a-z0-9.-]+$/.test(dominio) || apps.has(dominio)
      || typeof banco !== 'string' || !/^[a-zA-Z0-9_]+$/.test(banco) || databases.has(banco)
      || typeof usuario !== 'string' || !usuario || typeof senha !== 'string'
      || !/^[a-f0-9]{64}$/i.test(criptografia || '') || encryptionKeys.has(criptografia.toLowerCase())) throw new Error('Configuração institucional inválida ou repetida.');
    const accounts = instrutores === undefined ? [{chave,totp}] : instrutores;
    if (!Array.isArray(accounts) || !accounts.length) throw new Error('Adicione pelo menos um instrutor por instituição.');
    for (const account of accounts) {
      if (typeof account.chave !== 'string' || tokens.has(account.chave) ||
        typeof account.totp !== 'string' || totps.has(account.totp.toLowerCase())) throw new Error('Use credenciais exclusivas para cada instituição.');
      tokens.add(account.chave);
      totps.add(account.totp.toLowerCase());
    }
    databases.add(banco);
    encryptionKeys.add(criptografia.toLowerCase());
    apps.set(dominio, createApp({ dominio, banco, usuario, senha, chave, totp, criptografia, instrutores, institucional: true }));
  }
  const gateway = express();
  gateway.locals.closeDatabases = () => Promise.all([...apps.values()].map(app => app.locals.closeDatabases()));
  gateway.disable('x-powered-by');
  gateway.use((req, res, next) => {
    const app = apps.get(req.hostname?.toLowerCase());
    if (!app) return res.status(421).json({ mensagem: 'Endereço institucional desconhecido.' });
    app(req, res, next);
  });
  return gateway;
}

module.exports = institutions;
