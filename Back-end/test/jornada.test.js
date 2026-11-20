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
  const origin = 'https://conectados.example';
  const scope = origin + '/projeto/';
  const context = {
    URL,
    Request,
    self: {
      location: {href:scope+'sw.js'},
      skipWaiting() {},
      addEventListener(name,handler){routes[name]=handler;}
    },
    fetch: async () => { throw new Error('offline'); },
    caches: {
      open: async () => ({
        addAll: async requests => { for (const request of requests) cached.set(request.url,readFileSync(join(app,request.url.slice(scope.length)))); },
        match: async url => cached.get(url)
      })
    }
  };
  vm.runInNewContext(readFileSync(join(app,'sw.js'),'utf8'),context);
  let install;
  routes.install({waitUntil(value){install=value;}});
  await install;
  function response(path,mode='cors',method='GET') {
    let result;
    routes.fetch({
      request:{method,mode,url:scope+path.slice(1)},
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

const evolution = require('../../Front-end/JS/evolucao');

test('confidence uses distinct evidence and personal leagues progress by XP',() => {
  assert.deepEqual(evolution.confidence(['pix','pix'],['seguranca','seguranca'],4,4),{evidence:2,total:8,percent:25});
  assert.equal(evolution.league(120).current.xp,120);
  assert.equal(evolution.league(120).next.xp,200);
});

test('recovery uses recent unresolved mistakes and keeps canonical answers when reordered',() => {
  const attempts = [{tema:'pix',correta:false},{tema:'pix',correta:true},{tema:'senhas',correta:false}];
  assert.equal(evolution.recovery(attempts).tema,'senhas');
  const variant = evolution.challenge({theme:'senhas',scenario:'Padrao',choices:['A','B'],correct:1},['Primeiro','Segundo'],1);
  assert.equal(variant.scenario,'Segundo');
  assert.equal(variant.choices[0].canonical,variant.correct);
});
