const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { randomBytes, createHmac, randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');
const Excel = require('exceljs');

const hex = size => randomBytes(size).toString('hex');
const credentials = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.TEST_MYSQL_USER || 'root',
  password: process.env.TEST_MYSQL_PASSWORD
};

function otp(secret) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
  const mac = createHmac('sha1',Buffer.from(secret,'hex')).update(counter).digest();
  return String((mac.readUInt32BE(mac.at(-1)&15)&0x7fffffff)%1000000).padStart(6,'0');
}

test('institutions isolate authenticated flows and preserve teaching records', {
  skip: credentials.password === undefined ? 'Set TEST_MYSQL_PASSWORD for a disposable MySQL instance.' : false,
  timeout: 30000
}, async () => {
  const databases = [];
  const tenants = ['a','b'].map(letter => ({
    dominio:letter + '.localhost', banco:'conectados_teste_' + hex(6),
    usuario:credentials.user, senha:credentials.password, criptografia:hex(32),
    instrutores:[{ id:'tutora',chave:hex(24),totp:hex(20) }]
  }));
  const db = await mysql.createConnection({ ...credentials,multipleStatements:true });
  let server, app, inference;
  let prompt;
  const env = { ...process.env };
  try {
    for (const tenant of tenants) {
      for (const file of ['Database','dados_iniciais','evolucao','institucional','jornada','percurso','percurso']) {
        const source = fs.readFileSync(path.join(__dirname,'../../Database',file + '.sql'),'utf8');
        await db.query(source.replace(/^\uFEFF/,'').replaceAll('conectado_melhor_idade',tenant.banco));
        if (file === 'Database') databases.push(tenant.banco);
      }
    }
    process.env.INSTITUICOES_JSON = JSON.stringify(tenants);
    process.env.NODE_ENV = 'test';
    inference = http.createServer(async (req,res) => {
      const body = [];
      for await (const chunk of req) body.push(chunk);
      prompt = JSON.parse(Buffer.concat(body));
      if (req.url!=='/api/chat') return res.writeHead(404).end();
      res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({message:{content:'Abra a conversa e toque no ícone de câmera.'}}));
    }).listen(0,'127.0.0.1');
    await new Promise(resolve=>inference.once('listening',resolve));
    process.env.AURORA_MODELO_LOCAL = 'teste-local';
    process.env.AURORA_PORTA_LOCAL = String(inference.address().port);
    app = require('../server');
    server = app.listen(0,'127.0.0.1');
    await new Promise((resolve,reject) => { server.once('listening',resolve); server.once('error',reject); });

    async function request(endpoint, body, { tenant=0,cookie,staff,status=200,binary=false } = {}) {
      const headers = { Host:tenants[tenant]?.dominio || 'desconhecido.localhost' };
      if (cookie) headers.Cookie = cookie;
      if (staff) headers.Authorization = 'Bearer ' + staff;
      if (body) headers['Content-Type'] = 'application/json';
      const response = await new Promise((resolve,reject) => {
        const req = http.request({hostname:'127.0.0.1',port:server.address().port,path:endpoint,method:body?'POST':'GET',headers},resolve);
        req.on('error',reject);
        req.end(body && JSON.stringify(body));
      });
      const parts = [];
      for await (const chunk of response) parts.push(chunk);
      const bytes = Buffer.concat(parts);
      assert.equal(response.statusCode,status,endpoint + ' ' + bytes.toString().slice(0,240));
      return { data:binary?bytes:JSON.parse(bytes),cookie:response.headers['set-cookie']?.[0]?.split(';')[0] };
    }

    await request('/prontidao');
    await request('/prontidao',null,{tenant:1});
    await request('/prontidao',null,{tenant:2,status:421});
    const account = tenants[0].instrutores[0];
    const login = { usuario:account.id,chave:account.chave,codigo:otp(account.totp) };
    await request('/instrutor/entrar',{...login,codigo:'invalid'},{status:401});
    const {data:{token:staff}} = await request('/instrutor/entrar',login);
    await request('/instrutor/entrar',login,{status:401});
    await request('/instrutor',null,{staff,tenant:1,status:401});
    const profile = { nome:'Participante A',nivel:'Iniciante',pontuacao:9 };
    const {data:student,cookie} = await request('/usuarios',profile);
    const {data:other} = await request('/usuarios',{...profile,nome:'Participante B'},{tenant:1});
    assert.equal(student.id_usuario,other.id_usuario);
    await request('/sessao',null,{cookie,tenant:1,status:401});
    const question = {tema:'video',pergunta:'Como começo uma videochamada?',modeloLocal:true};
    await request('/aurora/consulta',question,{status:401});
    await request('/aurora/consulta',{...question,modeloLocal:false},{cookie,status:400});
    await request('/aurora/consulta',{...question,pergunta:'Meu código é 123456.'},{cookie,status:422});
    const answer = (await request('/aurora/consulta',question,{cookie})).data;
    assert.match(answer.orientacao,/ícone de câmera/);
    assert.equal(prompt.stream,false);
    assert.equal(prompt.messages[1].content,question.pergunta);
    assert.ok(!JSON.stringify(prompt).includes(profile.nome));
    await request('/instrutor/turmas',{nome:'Turma digital'},{staff});
    await request('/instrutor/matriculas',{id_usuario:student.id_usuario,id_turma:1},{staff});
    await request('/instrutor/encontros',{id_turma:1,titulo:'Aula de teste',dia:'2026-11-25'},{staff});
    assert.equal((await request('/participante/calendario?mes=2026-11',null,{cookie})).data.length,1);
    await request('/instrutor/presencas',{id_encontro:1,id_usuario:student.id_usuario,presente:true},{staff});
    const assessment = {tema:'Mensagens suspeitas',choice:0,id_usuario:student.id_usuario,evento:randomUUID()};
    await Promise.all([request('/avaliacoes',assessment,{cookie}),request('/avaliacoes',assessment,{cookie})]);
    await request('/avaliacoes',{...assessment,id_usuario:student.id_usuario+100},{cookie,status:403});
    const studyReport = (await request('/participante/estudo',null,{cookie})).data;
    assert.equal(studyReport.avaliacoes.length,1);
    let teacherData = (await request('/instrutor/jornada',null,{staff})).data;
    assert.equal(Number(teacherData.mapa[0].precisam_revisar),1);
    assert.equal(Number(teacherData.mapa[0].participantes),1);
    await request('/avaliacoes',{...assessment,choice:1,evento:randomUUID()},{cookie});
    teacherData = (await request('/instrutor/jornada',null,{staff})).data;
    assert.equal(Number(teacherData.mapa[0].precisam_revisar),0);
    await request('/instrutor/participantes?pagina=0',null,{staff,status:400});
    const directory = (await request('/instrutor/participantes?busca=Participante',null,{staff})).data;
    assert.deepEqual(directory.participantes.map(item=>item.nome),[profile.nome]);
    await request('/instrutor/encerrar-matricula',{id_usuario:student.id_usuario,id_turma:1},{staff});
    assert.equal((await request('/participante/calendario?mes=2026-11',null,{cookie})).data.length,0);
    for (const id_licao of [1,2,3,4]) await request('/progresso',{id_usuario:student.id_usuario,id_licao,concluido:true},{cookie});
    const {data:dashboard} = await request('/aluno',null,{cookie});
    assert.equal(Number(dashboard.frequencia.presentes),1);
    const certificate = dashboard.certificados[0].codigo;
    await request('/certificados/'+certificate,null,{tenant:1,status:404});
    assert.equal((await request('/certificados/'+certificate)).data.valido,true);
    const pdf = (await request('/participante/certificado/'+certificate,null,{cookie,binary:true})).data;
    assert.equal(pdf.subarray(0,4).toString(),'%PDF');
    assert.equal((pdf.toString('latin1').match(/\/Type \/Page\b/g)||[]).length,1);

    const activity = { evento:randomUUID(),id_licao:1,segundos:30 };
    await request('/participante/estudo',activity,{cookie});
    await request('/participante/estudo',activity,{cookie});
    assert.equal(Number((await request('/participante/estudo',null,{cookie})).data.segundos),30);

    const {data:invite} = await request('/participante/familia',{nome:'Familiar',consentimento:true},{cookie});
    const {cookie:family} = await request('/familia/ativar',invite);
    await request('/familia/ativar',invite,{status:400});
    await request('/familia/painel',null,{cookie:family,tenant:1,status:401});
    await request('/familia/mensagens',{texto:'Mensagem de teste'},{cookie:family});
    await request('/familia/incentivo',{texto:'Muito bem!'},{cookie:family});
    assert.equal((await request('/participante/incentivos',null,{cookie})).data[0].texto,'Muito bem!');
    const familyDashboard = (await request('/familia/painel',null,{cookie:family})).data;
    assert.equal(familyDashboard.historico.length,4);
    assert.equal(familyDashboard.incentivos[0].texto,'Muito bem!');
    await request('/instrutor/familia/1',{texto:'Resposta de teste'},{staff});
    const thread = (await request('/familia/painel',null,{cookie:family})).data.mensagens;
    assert.equal(thread[1].texto,'Resposta de teste');
    const [stored] = await db.query('SELECT criptograma FROM ' + tenants[0].banco + '.conversa_familiar');
    assert.ok(!stored[0].criptograma.includes(Buffer.from('Mensagem de teste')));
    await request('/participante/familia/revogar',{id_acesso:1},{cookie});
    await request('/familia/painel',null,{cookie:family,status:401});
    assert.deepEqual((await request('/participante/incentivos',null,{cookie})).data,[]);

    const publication = {titulo:'Minha experiência',texto:'Aprendi a fazer uma videochamada.',revisao:true};
    await request('/comunidade',{...publication,texto:'Veja https://example.com'},{cookie,status:400});
    await request('/comunidade',publication,{cookie});
    assert.equal((await request('/comunidade',null,{cookie})).data.publicacoes.length,0);
    const pending = (await request('/instrutor/comunidade',null,{staff})).data[0];
    await request('/instrutor/comunidade',{id_publicacao:pending.id_publicacao,estado:'publicada'},{staff});
    assert.equal((await request('/comunidade',null,{cookie})).data.publicacoes.length,1);
    await request('/instrutor/comunidade',{id_publicacao:pending.id_publicacao,estado:'oculta'},{staff});
    assert.equal((await request('/comunidade',null,{cookie})).data.publicacoes.length,0);
    assert.equal((await request('/instrutor/jornada',null,{staff})).data.tendencia.length,1);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load((await request('/instrutor/relatorios/xlsx',null,{staff,binary:true})).data);
    assert.equal(workbook.getWorksheet(1).getCell('A2').value,profile.nome);
    assert.equal((await request('/instrutor/relatorios/pdf',null,{staff,binary:true})).data.subarray(0,4).toString(),'%PDF');
    const audit = (await request('/instrutor/auditoria',null,{staff})).data;
    assert.ok(audit.some(event => event.instrutor === account.id && event.acao === 'mensagem-familiar'));
  } finally {
    if (inference) await new Promise(resolve=>inference.close(resolve));
    if (server) await new Promise(resolve => server.close(resolve));
    if (app) await app.locals.closeDatabases();
    for (const name of databases) await db.query('DROP DATABASE ' + name);
    await db.end();
    for (const key of ['INSTITUICOES_JSON','NODE_ENV','AURORA_MODELO_LOCAL','AURORA_PORTA_LOCAL']) {
      if (env[key] === undefined) delete process.env[key];
      else process.env[key] = env[key];
    }
  }
});
