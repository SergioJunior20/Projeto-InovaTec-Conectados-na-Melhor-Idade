const {test} = require('node:test');
const assert = require('node:assert/strict');
const {choose,grounding} = require('../../Front-end/JS/aurora-guia');

test('the text from the screenshot gets directions for both phone families',() => {
  const reply = choose({question:'ligar a lanterna'});
  assert.equal(reply.topic,'lanterna');
  assert.match(reply.text,/No Android/);
  assert.match(reply.text,/No iPhone/);
  assert.match(reply.text,/Toque.+lanterna/i);
});

test('the guide recognizes follow-ups and remembers the phone without assuming unrelated topics',() => {
  const initial = choose({question:'como mexo na lanterna?'});
  const iphone = choose({question:'E no iPhone 13 Pro?',context:initial.context});
  assert.equal(iphone.context.device,'iphone');
  assert.match(iphone.text,/Central de Controle/);
  assert.doesNotMatch(iphone.text,/No Android/);
  const retry = choose({question:'Não achei o ícone',context:iphone.context});
  assert.equal(retry.topic,'lanterna');
  const off = choose({question:'Como apago?',context:iphone.context});
  assert.match(off.text,/mesmo bot[aã]o da lanterna/);
  const unrelated = choose({question:'Como regar samambaias?',context:retry.context});
  assert.equal(unrelated.topic,undefined);
});

test('specific tasks take priority over generic keywords and explicit scam cues take priority',() => {
  assert.equal(choose({question:'como fazer chamada de vídeo no WhatsApp'}).topic,'video');
  assert.equal(choose({question:'como enviar foto no WhatsApp'}).topic,'enviar-foto');
  assert.equal(choose({question:'Wi-Fi pede a senha'}).topic,'wifi');
  assert.equal(choose({question:'recebi uma mensagem suspeita no WhatsApp'}).topic,'seguranca');
  assert.match(grounding('lanterna'),/Central de Controle/);
  assert.equal(grounding('outro-assunto'),undefined);
});

test('the expanded guide answers questions about public services, email, banking and computers',()=>{
  assert.match(choose({question:'Esqueci a senha da conta gov.br'}).text,/Esqueci minha senha/);
  assert.equal(choose({question:'Quero anexar um PDF no meu e-mail'}).topic,'email-anexo');
  assert.match(choose({question:'Como faço um PIX?',level:'Iniciante'}).text,/Exemplo:/);
  assert.equal(choose({question:'Onde consultar o extrato do banco digital?'}).topic,'banco');
  assert.match(choose({question:'Como tirar print no Mac?'}).text,/Command \+ 3/);
  assert.match(choose({question:'Como tirar print no Windows?'}).text,/Windows \+ Shift \+ S/);
});

test('learning history is optional, excludes question text, and expires recurring evidence',()=>{
  const {record,recurring} = require('../../Front-end/JS/aurora-perfil');
  assert.equal(record(undefined,'wifi','2026-11-20'),undefined);
  const first = record({enabled:true},'wifi','2026-11-19');
  assert.equal(recurring(first,'2026-11-20'),undefined);
  const repeated = record(first,'wifi','2026-11-20');
  assert.deepEqual(recurring(repeated,'2026-11-20'),{topic:'wifi',count:2,day:'2026-11-20'});
  assert.equal(recurring(repeated,'2026-12-21'),undefined);
  assert.equal(record(repeated,'wifi','2026-12-21').items[0].count,1);
});
