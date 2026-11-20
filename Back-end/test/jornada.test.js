const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const journey = require('../../Front-end/JS/jornada');

test('XP is awarded once per exercise topic and guided mode reacts to mistakes',() => {
  const now = new Date(2026,10,20,12);
  const attempts = [true,true,false,false,false].map(correta => ({tema:'Seguranca',correta,date:+now}));
  const result = journey.evaluate({completed:['pix'],attempts,actions:[],level:'Avancado',now});
  assert.equal(result.xp,55);
  assert.equal(result.guided,true);
  assert.equal(result.streak,1);
  assert.ok(result.achievements.some(x=>x.includes('PIX')));
});

test('a pause suggests resumption while keeping earned medals',() => {
  const result = journey.evaluate({
    completed:[],attempts:[],actions:[{dia:'2026-11-14'}],level:'Avancado',
    longStreak:true,now:new Date(2026,10,20,12)
  });
  assert.equal(result.paused,true);
  assert.equal(result.streak,0);
  assert.equal(result.achievements.length,1);
});

test('the service worker only caches public course files and provides the offline shell',async () => {
  const routes = {};
  const app = join(__dirname,'../../Front-end');
  const cached = new Map();
  const context = {
    URL,
    self: {
      location: {origin:'https://conectados.example'},
      addEventListener(name,handler){routes[name]=handler;}
    },
    fetch: async () => { throw new Error('offline'); },
    caches: {
      open: async () => ({addAll: async paths => { for (const path of paths) cached.set(path,readFileSync(join(app,path.slice(1)))); }}),
      match: async path => cached.get(path)
    }
  };
  vm.runInNewContext(readFileSync(join(app,'sw.js'),'utf8'),context);
  let install;
  routes.install({waitUntil(value){install=value;}});
  await install;
  function response(path,mode='cors',method='GET') {
    let result;
    routes.fetch({
      request:{method,mode,url:'https://conectados.example'+path},
      respondWith(value){result=value;}
    });
    return result;
  }
  assert.match((await response('/','navigate')).toString(),/Conectados/);
  assert.ok((await response('/JS/jornada.js')).length);
  for (const path of ['/instrutor','/familia/painel','/participante/dados','/comunidade']) {
    assert.equal(response(path),undefined);
  }
  assert.equal(response('/progresso','cors','POST'),undefined);
});
