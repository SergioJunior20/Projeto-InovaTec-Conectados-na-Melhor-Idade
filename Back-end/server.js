const express = require('express');
const mysql = require('mysql2/promise');
const path = require('node:path');
const { randomBytes, randomUUID, createHash } = require('node:crypto');

const institutions = require('./instituicoes');
const { staffAuth, rateLimit } = require('./seguranca');
const registerServices = require('./servicos');
const registerDocuments = require('./documentos');
const registerJourney = require('./jornada');

function createApp(options = {}) {
  const app = express();
  const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: options.usuario || process.env.DB_USER || 'root',
    password: options.senha ?? process.env.DB_PASSWORD ?? '',
    database: options.banco || process.env.DB_NAME || 'conectado_melhor_idade',
    connectionLimit: 10,
    queueLimit: 30,
    dateStrings: true
  });
  app.locals.closeDatabases = () => db.end();

  const production = process.env.NODE_ENV === 'production';
  const auth = staffAuth({
    key: options.chave || process.env.INSTRUTOR_TOKEN,
    secretHex: options.totp || process.env.INSTRUTOR_TOTP_HEX,
    required: production || options.institucional,
    accounts: options.institucional ? options.instrutores : process.env.INSTRUTORES_JSON && JSON.parse(process.env.INSTRUTORES_JSON)
  });

  app.disable('x-powered-by');
  if (process.env.TRUST_LOCAL_PROXY === '1') app.set('trust proxy','loopback');
  app.use(rateLimit({ duration: 60000, maximum: 120, key: req => req.ip }));
  app.use(rateLimit({ duration: 60000, maximum: 12, key: req => req.method === 'POST' && ['/instrutor/entrar', '/familia/ativar', '/ativar', '/usuarios'].includes(req.path) ? req.ip : null }));
  app.use(express.json({ limit: '16kb' }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    res.set('X-Frame-Options', 'DENY');
    res.set('Content-Security-Policy', "object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    if (!['/', '/licoes', '/saude'].includes(req.path) && !/^\/(CSS|JS)\//.test(req.path)) {
      res.set('Cache-Control', 'no-store');
    }
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && ['cross-site','same-site'].includes(req.get('sec-fetch-site'))) {
      return res.status(403).json({ mensagem: 'Origem da solicitação inválida.' });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !req.is('application/json')) {
      return res.status(415).json({ mensagem: 'Use application/json.' });
    }
    if (req.is('application/json') && (!req.body || Array.isArray(req.body))) {
      return res.status(400).json({ mensagem: 'Envie um objeto JSON.' });
    }
    next();
  });

  const query = async (sql, params = []) => (await db.execute(sql, params))[0];
  const hash = value => createHash('sha256').update(value).digest('hex');
  const audit = (req, action, run = query) => run('INSERT INTO eventos_institucionais (instrutor,acao) VALUES (?,?)',[req.staffIdentity,action]);

  function problem(status, mensagem) {
    throw Object.assign(new Error(mensagem), { status });
  }

  function integer(value, minimum = 1, maximum = 2147483647) {
    const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    if (!Number.isInteger(number) || number < minimum || number > maximum) {
      problem(400, 'Informe um número válido.');
    }
    return number;
  }

  function field(value, maximum) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
      problem(400, 'Preencha os campos dentro do limite indicado.');
    }
    return value.trim();
  }

  function boolean(value) {
    if (typeof value !== 'boolean') problem(400, 'Selecione uma opção válida.');
    return value;
  }

  function cookie(req) {
    return req.headers.cookie?.match(/(?:^|;\s*)aprendiz=([a-f0-9]{64})(?:;|$)/)?.[1];
  }

  async function learner(req) {
    const token = cookie(req);
    if (!token) problem(401, 'Entre com um cadastro neste navegador.');
    const rows = await query('SELECT id_usuario FROM sessoes WHERE token_hash = ? AND expira_em > NOW()', [hash(token)]);
    if (!rows.length) problem(401, 'Sua sessão terminou. Faça um novo cadastro ou solicite apoio.');
    return rows[0].id_usuario;
  }

  function staffIdentity(req) {
    return auth.authorized(req.get('authorization'));
  }

  function instructor(req, res, next) {
    req.staffIdentity = staffIdentity(req);
    if (!req.staffIdentity) problem(401, 'Informe as credenciais do painel do instrutor.');
    res.set('Cache-Control', 'no-store');
    next();
  }

  async function owner(req, id) {
    const requested = integer(id);
    if (!staffIdentity(req) && requested !== await learner(req)) problem(403, 'Acesso restrito ao participante.');
    return requested;
  }

  app.get('/saude', (req, res) => res.json({ status: 'ok' }));
  app.get('/prontidao', async (req, res) => {
    await query('SELECT 1 FROM sessoes LIMIT 1');
    await query('SELECT 1 FROM estudo_atividade LIMIT 1');
    await query('SELECT 1 FROM eventos_institucionais LIMIT 1');
    await query('SELECT 1 FROM comunidade_publicacoes LIMIT 1');
    await query('SELECT 1 FROM incentivos_familiares LIMIT 1');
    res.json({ status: 'ok' });
  });

  function setLearnerCookie(res, token) {
    res.cookie('aprendiz', token, { httpOnly: true, sameSite: 'strict', secure: production, maxAge: 30 * 86400000 });
  }

  app.get('/sessao', async (req, res) => {
    const id = await learner(req);
    const [record] = await query('SELECT id_usuario,nome,nivel,pontuacao FROM usuarios WHERE id_usuario=?', [id]);
    res.set('Cache-Control', 'no-store').json(record);
  });

  app.post('/ativar', async (req, res) => {
    const code = field(req.body.codigo, 32).toLowerCase();
    const token = randomBytes(32).toString('hex');
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT id_usuario FROM convites WHERE codigo_hash=? AND expira_em>NOW() FOR UPDATE', [hash(code)]);
      if (!rows.length) problem(400, 'Código inválido ou vencido. Peça outro código ao instrutor.');
      const id = rows[0].id_usuario;
      await connection.execute('INSERT INTO sessoes VALUES (?,?,DATE_ADD(NOW(), INTERVAL 30 DAY))', [hash(token), id]);
      await connection.execute('DELETE FROM convites WHERE codigo_hash=?', [hash(code)]);
      await connection.commit();
      setLearnerCookie(res, token);
      res.json({ mensagem: 'Acesso ativado.' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  app.get('/usuarios', instructor, async (req, res) => {
    res.json(await query('SELECT * FROM usuarios ORDER BY nome, id_usuario LIMIT 500'));
  });

  function profile(body) {
    return [field(body.nome, 100), field(body.nivel, 50), integer(body.pontuacao, 0)];
  }

  app.post('/usuarios', async (req, res) => {
    const values = profile(req.body);
    const token = randomBytes(32).toString('hex');
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute('INSERT INTO usuarios (nome,nivel,pontuacao) VALUES (?,?,?)', values);
      await connection.execute('INSERT INTO sessoes VALUES (?,?,DATE_ADD(NOW(), INTERVAL 30 DAY))', [hash(token), result.insertId]);
      await connection.commit();
      setLearnerCookie(res, token);
      res.json({ mensagem: 'Cadastro salvo.', id_usuario: result.insertId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  app.put('/usuarios/:id', async (req, res) => {
    const id = await owner(req, req.params.id);
    await query('UPDATE usuarios SET nome=?,nivel=?,pontuacao=? WHERE id_usuario=?', [...profile(req.body), id]);
    res.json({ mensagem: 'Cadastro atualizado.' });
  });

  app.delete('/usuarios/:id', instructor, async (req, res) => {
    await query('DELETE FROM usuarios WHERE id_usuario=?', [integer(req.params.id)]);
    res.json({ mensagem: 'Cadastro excluído.' });
  });

  app.get('/licoes', async (req, res) => res.json(await query('SELECT * FROM licoes ORDER BY id_licao')));

  app.post('/progresso', async (req, res) => {
    const id = await owner(req, req.body.id_usuario);
    const lesson = integer(req.body.id_licao);
    const done = boolean(req.body.concluido);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('SELECT id_usuario FROM usuarios WHERE id_usuario=? FOR UPDATE', [id]);
      const [rows] = await connection.execute('SELECT id_progresso FROM progresso WHERE id_usuario=? AND id_licao=?', [id, lesson]);
      if (rows.length) {
        await connection.execute('UPDATE progresso SET data_conclusao=IF(?,COALESCE(data_conclusao,NOW()),NULL), concluido=? WHERE id_usuario=? AND id_licao=?', [done, done, id, lesson]);
      } else {
        await connection.execute('INSERT INTO progresso (id_usuario,id_licao,concluido,data_conclusao) VALUES (?,?,?,IF(?,NOW(),NULL))', [id, lesson, done, done]);
      }
      await connection.execute(
        'INSERT INTO certificados (codigo,id_usuario) SELECT ?,? FROM progresso WHERE id_usuario=? AND concluido=1 AND id_licao IN (1,2,3,4) HAVING COUNT(DISTINCT id_licao)=4 ON DUPLICATE KEY UPDATE codigo=certificados.codigo',
        [randomUUID(), id, id]
      );
      await connection.commit();
      res.json({ mensagem: 'Progresso salvo.' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  app.get('/progresso/:id_usuario', async (req, res) => {
    const id = await owner(req, req.params.id_usuario);
    res.json(await query('SELECT p.*,l.titulo,l.dificuldade FROM progresso p JOIN licoes l USING(id_licao) WHERE p.id_usuario=? ORDER BY p.data_conclusao DESC', [id]));
  });

  for (const [route, table, date] of [['sugestoes', 'sugestoes', 'data_envio'], ['ajuda', 'pedidos_ajuda', 'data_pedido']]) {
    app.post('/' + route, async (req, res) => {
      const id = await owner(req, req.body.id_usuario);
      await query(`INSERT INTO ${table} (id_usuario,mensagem) VALUES (?,?)`, [id, field(req.body.mensagem, 1000)]);
      res.json({ mensagem: 'Mensagem registrada.' });
    });
    app.get('/' + route, instructor, async (req, res) => {
      res.json(await query(`SELECT * FROM ${table} ORDER BY ${date} DESC LIMIT 100`));
    });
  }

  app.get('/aluno', async (req, res) => {
    const id = await learner(req);
    const [agenda, presencas, certificados, avisos, respostas] = await Promise.all([
      query('SELECT e.*,t.nome AS turma FROM encontros e JOIN turmas t USING(id_turma) JOIN matriculas m USING(id_turma) WHERE m.id_usuario=? AND e.dia>=CURRENT_DATE ORDER BY e.dia LIMIT 30', [id]),
      query('SELECT COUNT(*) AS total, COALESCE(SUM(presente),0) AS presentes FROM presencas WHERE id_usuario=?', [id]),
      query('SELECT codigo,emitido_em FROM certificados WHERE id_usuario=?', [id]),
      query('SELECT * FROM avisos ORDER BY id_aviso DESC LIMIT 20'),
      query('SELECT r.id_resposta,p.mensagem,r.texto,r.criada_em FROM respostas_ajuda r JOIN pedidos_ajuda p USING(id_pedido) WHERE p.id_usuario=? ORDER BY r.id_resposta DESC LIMIT 30', [id])
    ]);
    res.set('Cache-Control', 'no-store').json({ agenda, frequencia: presencas[0], certificados, avisos, respostas });
  });

  app.post('/aurora/uso', async (req, res) => {
    const id = await learner(req);
    await query('INSERT INTO uso_aurora VALUES (?,CURRENT_DATE,1) ON DUPLICATE KEY UPDATE consultas=consultas+1', [id]);
    res.json({ mensagem: 'Consulta contabilizada.' });
  });

  app.post('/avaliacoes', async (req, res) => {
    const id = await learner(req);
    const theme = field(req.body.tema, 50);
    const answers = new Map([['Mensagens suspeitas', 1], ['Golpes bancários', 0], ['Pedidos de transferência', 1], ['Páginas falsas', 0]]);
    if (!answers.has(theme)) problem(400, 'Exercício indisponível.');
    const correct = integer(req.body.choice, 0, 1) === answers.get(theme);
    await query('INSERT INTO avaliacoes (id_usuario,tema,correta) VALUES (?,?,?)', [id, theme, correct]);
    res.json({ mensagem: 'Resposta registrada.' });
  });

  app.post('/instrutor/entrar', async (req, res) => {
    const actor = auth.authenticate(req.body.usuario,req.body.chave);
    if (!actor) problem(401, 'Credenciais inválidas.');
    if (!auth.enabled) return res.json({ token: req.body.chave });
    const window = auth.secondFactor(actor,req.body.codigo);
    if (window === null) problem(401, 'Credenciais inválidas.');
    try {
      await query('INSERT INTO janelas_instrutor (instrutor,janela) VALUES (?,?)', [actor,window]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') problem(401, 'Aguarde o próximo código do autenticador.');
      throw error;
    }
    req.staffIdentity = actor;
    await audit(req,'entrada');
    const nonce = randomBytes(16).toString('hex');
    res.json({ token: auth.issue(actor,nonce) });
  });

  app.get('/acesso/configuracao', (req, res) => res.json({ segundoFatorInstrutor: auth.enabled, contasIndividuais:auth.individual }));

  registerServices(app, { query, learner, instructor, production, problem, field, integer, hash, audit, institutional: options.institucional, encryptionKey: options.criptografia || process.env.DADOS_CHAVE_HEX });

  const publicOrigin = options.dominio ? 'https://' + options.dominio : process.env.PUBLIC_ORIGIN;
  if (production && (!publicOrigin || !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(publicOrigin))) {
    throw new Error('Configure PUBLIC_ORIGIN com a origem HTTPS da plataforma.');
  }
  registerDocuments(app, { query, learner, instructor, problem, audit, publicOrigin });
  registerJourney(app, { query, learner, instructor, integer, field, problem, audit });

  app.use('/instrutor', instructor);
  app.get('/instrutor/auditoria', async (req,res) => {
    res.json(await query('SELECT instrutor,acao,ocorrido_em FROM eventos_institucionais ORDER BY id_evento DESC LIMIT 100'));
  });
  app.post('/instrutor/convites', async (req, res) => {
    const id = integer(req.body.id_usuario);
    const code = randomBytes(16).toString('hex');
    await query('INSERT INTO convites VALUES (?,?,DATE_ADD(NOW(), INTERVAL 24 HOUR)) ON DUPLICATE KEY UPDATE codigo_hash=?,expira_em=DATE_ADD(NOW(), INTERVAL 24 HOUR)', [id, hash(code), hash(code)]);
    await audit(req,'convite');
    res.json({ codigo: code });
  });
  app.get('/instrutor', async (req, res) => {
    const [alunos, turmas, encontros, matriculas, presencas, observacoes, dificuldades, certificados, aulas, aurora, engajamento] = await Promise.all([
      query('SELECT u.id_usuario,u.nome,u.nivel,u.pontuacao,COUNT(DISTINCT p.id_licao) AS concluidas,MAX(p.data_conclusao) AS ultima_aula FROM usuarios u LEFT JOIN progresso p ON p.id_usuario=u.id_usuario AND p.concluido=1 GROUP BY u.id_usuario ORDER BY u.nome LIMIT 500'),
      query('SELECT * FROM turmas ORDER BY nome'),
      query('SELECT * FROM encontros ORDER BY dia DESC LIMIT 300'),
      query('SELECT * FROM matriculas'),
      query('SELECT COUNT(*) AS total, COALESCE(SUM(presente),0) AS presentes FROM presencas'),
      query('SELECT o.*,u.nome FROM observacoes o JOIN usuarios u USING(id_usuario) ORDER BY id_observacao DESC LIMIT 30'),
      query('SELECT tema,COUNT(*) AS tentativas,SUM(NOT correta) AS erros FROM avaliacoes GROUP BY tema ORDER BY erros DESC'),
      query('SELECT COUNT(*) AS total FROM certificados'),
      query('SELECT COUNT(*) AS total FROM licoes'),
      query('SELECT COALESCE(SUM(consultas),0) AS total FROM uso_aurora WHERE dia>=CURRENT_DATE - INTERVAL 29 DAY'),
      query('SELECT COUNT(DISTINCT id_usuario) AS ativos,COALESCE(SUM(segundos),0) AS segundos FROM estudo_atividade WHERE registrado_em>=CURRENT_DATE - INTERVAL 13 DAY')
    ]);
    res.json({ alunos,turmas,encontros,matriculas,frequencia:presencas[0],observacoes,dificuldades,certificados:certificados[0].total,aulas:aulas[0].total,aurora:aurora[0].total,engajamento:engajamento[0] });
  });

  const actions = {
    alunos: (body, run) => run('INSERT INTO usuarios (nome,nivel,pontuacao) VALUES (?,?,?)', [field(body.nome, 100), 'Iniciante', 0]),
    turmas: (body, run) => run('INSERT INTO turmas (nome) VALUES (?)', [field(body.nome, 100)]),
    matriculas: (body, run) => run('INSERT INTO matriculas VALUES (?,?) ON DUPLICATE KEY UPDATE id_usuario=id_usuario', [integer(body.id_turma), integer(body.id_usuario)]),
    'encerrar-matricula': async (body, run) => {
      const ids = [integer(body.id_turma), integer(body.id_usuario)];
      const result = await run('DELETE FROM matriculas WHERE id_turma=? AND id_usuario=?', ids);
      if (!result.affectedRows) problem(404, 'Matrícula ativa não encontrada.');
      await run('INSERT INTO matriculas_encerradas (id_turma,id_usuario) VALUES (?,?)', ids);
    },
    certificados: async (body, run) => {
      const id = integer(body.id_usuario);
      const [completion] = await run('SELECT COUNT(DISTINCT id_licao) AS total FROM progresso WHERE id_usuario=? AND concluido=1 AND id_licao IN (1,2,3,4)',[id]);
      if (Number(completion.total) !== 4) problem(409,'O certificado exige a conclusão das quatro aulas.');
      await run('INSERT INTO certificados (codigo,id_usuario) VALUES (?,?) ON DUPLICATE KEY UPDATE codigo=certificados.codigo',[randomUUID(),id]);
    },
    encontros: (body, run) => {
      const day = field(body.dia, 10);
      const date = new Date(day);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== day) problem(400, 'Informe uma data válida.');
      return run('INSERT INTO encontros (id_turma,titulo,dia) VALUES (?,?,?)', [integer(body.id_turma), field(body.titulo, 120), day]);
    },
    presencas: async (body, run) => {
      const id = integer(body.id_usuario);
      const meeting = integer(body.id_encontro);
      const present = boolean(body.presente);
      const result = await run('INSERT INTO presencas SELECT e.id_encontro,m.id_usuario,? FROM encontros e JOIN matriculas m USING(id_turma) WHERE e.id_encontro=? AND m.id_usuario=? ON DUPLICATE KEY UPDATE presente=?', [present, meeting, id, present]);
      if (!result.affectedRows) problem(400, 'Confira a matrícula do participante nessa turma.');
    },
    observacoes: (body, run) => run('INSERT INTO observacoes (id_usuario,texto) VALUES (?,?)', [integer(body.id_usuario), field(body.texto, 1000)]),
    respostas: (body, run) => run('INSERT INTO respostas_ajuda (id_pedido,texto) VALUES (?,?)', [integer(body.id_pedido), field(body.texto, 1000)]),
    avisos: (body, run) => run('INSERT INTO avisos (titulo,texto) VALUES (?,?)', [field(body.titulo, 120), field(body.texto, 1000)])
  };

  app.post('/instrutor/:acao', async (req, res) => {
    if (!Object.hasOwn(actions, req.params.acao)) problem(404, 'Ação indisponível.');
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const run = async (sql, params) => (await connection.execute(sql, params))[0];
      await actions[req.params.acao](req.body, run);
      await run('INSERT INTO auditoria_instrutor (acao) VALUES (?)', [req.params.acao]);
      await audit(req,req.params.acao,run);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    res.json({ mensagem: 'Registro salvo.' });
  });

  app.use(express.static(path.join(__dirname, '../Front-end')));
  app.use((req, res) => res.status(404).json({ mensagem: 'Página ou recurso indisponível.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'].includes(error.code)) {
      return res.status(409).json({ mensagem: 'Confira se o registro já existe ou se ainda está vinculado a outros dados.' });
    }
    const status = error.status >= 400 && error.status < 500 ? error.status : 503;
    if (status === 503) console.error(JSON.stringify({
      evento:'servico_indisponivel',metodo:req.method,codigo:error.code || error.name,
      instituicao:options.dominio || 'local',instante:new Date().toISOString()
    }));
    res.status(status).json({ mensagem: status === 503 ? 'Serviço indisponível. Tente novamente em instantes.' : error.type ? 'Dados da solicitação inválidos.' : error.message });
  });

  return app;
}

const app = institutions(createApp);

if (require.main === module) {
  const server = app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => {
    console.log('Conectados na Melhor Idade está em execução.');
  });
  const shutdown = () => server.close(() => {
    app.locals.closeDatabases().catch(error => {
      console.error(error.code || error.name);
      process.exitCode = 1;
    });
  });
  process.once('SIGINT',shutdown);
  process.once('SIGTERM',shutdown);
}

module.exports = app;
