const { randomBytes, createCipheriv, createDecipheriv } = require('node:crypto');

function registerServices(app, { query, learner, instructor, production, problem, field, integer, hash, audit, encryptionKey, institutional }) {
  if ((production || institutional) && !/^[a-f0-9]{64}$/i.test(encryptionKey || '')) {
    throw new Error('Configure uma chave hexadecimal de 32 bytes para as mensagens.');
  }
  const key = /^[a-f0-9]{64}$/i.test(encryptionKey || '') ? Buffer.from(encryptionKey, 'hex') : null;
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: production, path: '/familia' };

  function encrypted(text, id, author) {
    if (!key) problem(503, 'A instituição ainda não configurou a central de mensagens.');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(id + ':' + author));
    const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]);
  }

  function decrypted(row) {
    if (!key) problem(503, 'A instituição ainda não configurou a central de mensagens.');
    const { criptograma, id_acesso, autor, ...message } = row;
    const decipher = createDecipheriv('aes-256-gcm', key, criptograma.subarray(0, 12));
    decipher.setAAD(Buffer.from(id_acesso + ':' + autor));
    decipher.setAuthTag(criptograma.subarray(12, 28));
    return { ...message, autor, texto: Buffer.concat([decipher.update(criptograma.subarray(28)), decipher.final()]).toString('utf8') };
  }

  async function family(req) {
    const session = req.headers.cookie?.match(/(?:^|;\s*)responsavel=([a-f0-9]{64})(?:;|$)/)?.[1];
    if (!session) problem(401, 'Use um convite para abrir a área da família.');
    const [record] = await query('SELECT id_acesso,id_usuario,nome FROM acesso_familiar WHERE sessao_hash=? AND sessao_expira>NOW() AND revogado_em IS NULL', [hash(session)]);
    if (!record) problem(401, 'O acesso da família venceu ou foi encerrado.');
    return record;
  }

  const messages = async id => (await query('SELECT * FROM conversa_familiar WHERE id_acesso=? ORDER BY id_mensagem DESC LIMIT 50', [id])).reverse().map(decrypted);

  async function send(id, author, text) {
    const result = await query('INSERT INTO conversa_familiar (id_acesso,autor,criptograma) SELECT id_acesso,?,? FROM acesso_familiar WHERE id_acesso=? AND sessao_hash IS NOT NULL AND revogado_em IS NULL', [author, encrypted(text, id, author), id]);
    if (!result.affectedRows) problem(409, 'O vínculo familiar ainda não está ativo.');
  }

  app.get('/participante/estudo', async (req, res) => {
    const id = await learner(req);
    const [totals, history, assessments] = await Promise.all([
      query('SELECT COALESCE(SUM(segundos),0) AS segundos,COUNT(DISTINCT CASE WHEN registrado_em>=CURRENT_DATE - INTERVAL WEEKDAY(CURRENT_DATE) DAY THEN DATE(registrado_em) END) AS dias_semana FROM estudo_atividade WHERE id_usuario=?', [id]),
      query('SELECT l.titulo,SUM(a.segundos) AS segundos,DATE(a.registrado_em) AS dia FROM estudo_atividade a JOIN licoes l USING(id_licao) WHERE a.id_usuario=? GROUP BY DATE(a.registrado_em),a.id_licao,l.titulo ORDER BY dia DESC,a.id_licao LIMIT 100', [id]),
      query('SELECT tema,correta,registrada_em FROM avaliacoes WHERE id_usuario=? ORDER BY id_avaliacao DESC LIMIT 40', [id])
    ]);
    res.json({ ...totals[0], historico:history, avaliacoes:assessments });
  });

  app.get('/participante/calendario', async (req,res) => {
    const id = await learner(req);
    const month = field(req.query.mes,7);
    if (!/^(20\d{2}|21\d{2})-(0[1-9]|1[0-2])$/.test(month)) problem(400,'Mês inválido.');
    const start = month + '-01';
    res.json(await query('SELECT e.id_encontro,e.titulo,e.dia,t.nome AS turma FROM encontros e JOIN turmas t USING(id_turma) JOIN matriculas m USING(id_turma) WHERE m.id_usuario=? AND e.dia>=? AND e.dia<DATE_ADD(?,INTERVAL 1 MONTH) ORDER BY e.dia,e.id_encontro LIMIT 100',[id,start,start]));
  });

  app.post('/participante/estudo', async (req, res) => {
    const id = await learner(req);
    if (req.body.id_usuario !== undefined && integer(req.body.id_usuario) !== id) problem(403,'A sessão mudou. Entre com o cadastro correto.');
    const event = field(req.body.evento, 36);
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(event)) problem(400, 'Identificador da sessão de estudo inválido.');
    await query('INSERT INTO estudo_atividade (evento,id_usuario,id_licao,segundos) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE evento=evento',
      [event, id, integer(req.body.id_licao), integer(req.body.segundos, 1, 60)]);
    res.json({ mensagem:'Estudo registrado.' });
  });

  app.get('/participante/familia', async (req, res) => {
    const id = await learner(req);
    res.json(await query('SELECT id_acesso,nome,criado_em,sessao_hash IS NOT NULL AS ativado,revogado_em FROM acesso_familiar WHERE id_usuario=? ORDER BY id_acesso DESC LIMIT 30', [id]));
  });

  app.post('/participante/familia', async (req, res) => {
    const id = await learner(req);
    const name = field(req.body.nome, 100);
    if (req.body.consentimento !== true) problem(400, 'Confirme o compartilhamento com seu familiar.');
    const code = randomBytes(16).toString('hex');
    await query('INSERT INTO acesso_familiar (id_usuario,nome,convite_hash,convite_expira) VALUES (?,?,?,DATE_ADD(NOW(),INTERVAL 24 HOUR))', [id, name, hash(code)]);
    res.json({ codigo: code });
  });

  app.post('/participante/familia/revogar', async (req, res) => {
    const id = await learner(req);
    const result = await query('UPDATE acesso_familiar SET revogado_em=NOW(),convite_hash=NULL,sessao_hash=NULL WHERE id_acesso=? AND id_usuario=? AND revogado_em IS NULL', [integer(req.body.id_acesso), id]);
    if (!result.affectedRows) problem(404, 'Vínculo familiar indisponível.');
    res.json({ mensagem:'Acesso familiar encerrado.' });
  });

  app.post('/familia/ativar', async (req, res) => {
    const invite = field(req.body.codigo, 32).toLowerCase();
    const token = randomBytes(32).toString('hex');
    const result = await query('UPDATE acesso_familiar SET convite_hash=NULL,sessao_hash=?,sessao_expira=DATE_ADD(NOW(),INTERVAL 30 DAY) WHERE convite_hash=? AND convite_expira>NOW() AND revogado_em IS NULL', [hash(token),hash(invite)]);
    if (!result.affectedRows) problem(400, 'O convite está inválido, vencido ou já foi usado.');
    res.cookie('responsavel',token,{ ...cookieOptions,maxAge:30*86400000 }).json({ mensagem:'Acesso familiar ativado.' });
  });

  app.get('/familia/painel', async (req, res) => {
    const { id_acesso:id, id_usuario:student, nome } = await family(req);
    const [profile, completion, news, conversation, study, medals, history, sent] = await Promise.all([
      query('SELECT nome,nivel FROM usuarios WHERE id_usuario=?', [student]),
      query('SELECT COUNT(DISTINCT id_licao) AS total FROM progresso WHERE id_usuario=? AND concluido=1 AND id_licao IN (1,2,3,4)', [student]),
      query('SELECT id_aviso,titulo,texto,criado_em FROM avisos ORDER BY id_aviso DESC LIMIT 15'),
      messages(id),
      query('SELECT COUNT(DISTINCT DATE(registrado_em)) AS dias,COALESCE(SUM(segundos),0) AS segundos FROM estudo_atividade WHERE id_usuario=? AND registrado_em>=CURRENT_DATE-INTERVAL 6 DAY',[student]),
      query('SELECT DISTINCT id_licao FROM progresso WHERE id_usuario=? AND concluido=1 AND id_licao IN (3,4)',[student]),
      query('SELECT l.titulo,DATE(MAX(p.data_conclusao)) AS dia FROM progresso p JOIN licoes l USING(id_licao) WHERE p.id_usuario=? AND p.concluido=1 AND p.id_licao IN (1,2,3,4) GROUP BY p.id_licao,l.titulo ORDER BY dia DESC,p.id_licao',[student]),
      query("SELECT id_acesso,criptograma,enviado_em,'incentivo' AS autor FROM incentivos_familiares WHERE id_acesso=? ORDER BY id_incentivo DESC LIMIT 10",[id])
    ]);
    res.json({ familiar:nome, aluno:profile[0], concluidas:completion[0].total, avisos:news, mensagens:conversation, mensagensAtivas:Boolean(key), estudo:study[0], medalhas:medals.map(row => row.id_licao), historico:history, incentivos:sent.map(decrypted) });
  });

  app.post('/familia/incentivo',async (req,res) => {
    const {id_acesso:id} = await family(req);
    const message = field(req.body.texto,300);
    const result = await query('INSERT INTO incentivos_familiares (id_acesso,criptograma) SELECT id_acesso,? FROM acesso_familiar WHERE id_acesso=? AND revogado_em IS NULL AND sessao_hash IS NOT NULL',[encrypted(message,id,'incentivo'),id]);
    if (!result.affectedRows) problem(409,'O vínculo familiar foi encerrado.');
    res.json({mensagem:'Incentivo enviado.'});
  });

  app.get('/participante/incentivos',async (req,res) => {
    const id = await learner(req);
    const rows = await query("SELECT i.id_acesso,i.criptograma,i.enviado_em,f.nome,'incentivo' AS autor FROM incentivos_familiares i JOIN acesso_familiar f USING(id_acesso) WHERE f.id_usuario=? AND f.revogado_em IS NULL ORDER BY i.id_incentivo DESC LIMIT 15",[id]);
    res.json(rows.map(decrypted));
  });

  app.post('/familia/mensagens', async (req, res) => {
    const { id_acesso:id } = await family(req);
    await send(id, 'familiar', field(req.body.texto, 800));
    res.json({ mensagem:'Mensagem enviada.' });
  });

  app.post('/familia/sair', async (req, res) => {
    res.clearCookie('responsavel',cookieOptions).json({ mensagem:'Área familiar fechada neste navegador.' });
  });

  app.get('/instrutor/familia', instructor, async (req, res) => {
    res.json(await query('SELECT f.id_acesso,f.nome,u.nome AS aluno,(SELECT COUNT(*) FROM conversa_familiar m WHERE m.id_acesso=f.id_acesso) AS mensagens FROM acesso_familiar f JOIN usuarios u USING(id_usuario) WHERE f.revogado_em IS NULL AND f.sessao_hash IS NOT NULL ORDER BY f.id_acesso DESC LIMIT 100'));
  });

  app.get('/instrutor/familia/:id', instructor, async (req, res) => {
    const id = integer(req.params.id);
    const [record] = await query('SELECT id_acesso FROM acesso_familiar WHERE id_acesso=? AND revogado_em IS NULL', [id]);
    if (!record) problem(404, 'Vínculo familiar indisponível.');
    res.json(await messages(id));
  });

  app.post('/instrutor/familia/:id', instructor, async (req, res) => {
    await send(integer(req.params.id), 'instrutor', field(req.body.texto, 800));
    await audit(req,'mensagem-familiar');
    res.json({ mensagem:'Resposta enviada.' });
  });

  app.get('/certificados/:codigo', async (req, res) => {
    const code = field(req.params.codigo, 36);
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(code)) problem(404, 'Certificado não encontrado.');
    const [certificate] = await query('SELECT codigo,emitido_em FROM certificados WHERE codigo=?', [code]);
    if (!certificate) problem(404, 'Certificado não encontrado.');
    res.json({ ...certificate,valido:true,curso:'Inclusão digital — Conectados na Melhor Idade' });
  });

  app.get('/participante/dados', async (req, res) => {
    const id = await learner(req);
    const [profile, progress, presence, assessments, certificates, study] = await Promise.all([
      query('SELECT * FROM usuarios WHERE id_usuario=?',[id]),
      query('SELECT * FROM progresso WHERE id_usuario=?',[id]),
      query('SELECT * FROM presencas WHERE id_usuario=?',[id]),
      query('SELECT * FROM avaliacoes WHERE id_usuario=?',[id]),
      query('SELECT * FROM certificados WHERE id_usuario=?',[id]),
      query('SELECT * FROM estudo_atividade WHERE id_usuario=?',[id])
    ]);
    res.attachment('meus-dados-conectados.json').json({ perfil:profile[0],progresso:progress,presencas:presence,avaliacoes:assessments,certificados:certificates,estudo:study });
  });
}

module.exports = registerServices;
