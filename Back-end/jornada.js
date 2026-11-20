function registerJourney(app,{query,learner,instructor,integer,field,problem,audit}) {
  app.get('/comunidade',async (req,res) => {
    const id = await learner(req);
    const [publications,own] = await Promise.all([
      query("SELECT id_publicacao,titulo,texto,criada_em FROM comunidade_publicacoes WHERE estado='publicada' ORDER BY id_publicacao DESC LIMIT 40"),
      query('SELECT id_publicacao,titulo,estado,criada_em FROM comunidade_publicacoes WHERE id_usuario=? ORDER BY id_publicacao DESC LIMIT 20',[id])
    ]);
    res.json({publicacoes:publications,minhas:own});
  });

  app.post('/comunidade',async (req,res) => {
    const id = await learner(req);
    const title = field(req.body.titulo,90);
    const message = field(req.body.texto,600);
    if (req.body.revisao !== true) problem(400,'Confirme que a equipe pode revisar sua publicação.');
    if (/https?:|www\.|\S+@\S+|(?:\d[\s().+-]*){8}/i.test(title + ' ' + message)) {
      problem(400,'Escreva sem links, telefones, e-mails ou números de documentos.');
    }
    const result = await query("INSERT INTO comunidade_publicacoes (id_usuario,titulo,texto) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM comunidade_publicacoes WHERE id_usuario=? AND criada_em>=CURRENT_DATE)<5",[id,title,message,id]);
    if (!result.affectedRows) problem(429,'Você já enviou cinco publicações hoje.');
    res.json({mensagem:'Publicação enviada para revisão.'});
  });

  app.get('/instrutor/comunidade',instructor,async (req,res) => {
    res.json(await query("SELECT id_publicacao,titulo,texto,estado,criada_em FROM comunidade_publicacoes WHERE estado IN ('pendente','publicada') ORDER BY estado,id_publicacao DESC LIMIT 70"));
  });

  app.post('/instrutor/comunidade',instructor,async (req,res) => {
    const id = integer(req.body.id_publicacao);
    const status = req.body.estado;
    if (!['publicada','oculta'].includes(status)) problem(400,'Escolha uma decisão de moderação.');
    const result = await query("UPDATE comunidade_publicacoes SET estado=?,moderada_em=NOW() WHERE id_publicacao=? AND (estado='pendente' OR (estado='publicada' AND ?='oculta'))",[status,id,status]);
    if (!result.affectedRows) problem(409,'A publicação mudou. Atualize a lista antes de decidir.');
    await audit(req,status==='publicada'?'publicar-comunidade':'ocultar-comunidade');
    res.json({mensagem:status==='publicada'?'Publicação aprovada.':'Publicação ocultada.'});
  });

  app.get('/instrutor/jornada',instructor,async (req,res) => {
    const [themes,groups,trend] = await Promise.all([
      query('SELECT tema,COUNT(*) AS tentativas,SUM(NOT correta) AS erros,COUNT(DISTINCT id_usuario) AS participantes FROM avaliacoes WHERE registrada_em>=CURRENT_DATE-INTERVAL 29 DAY GROUP BY tema ORDER BY erros DESC,tema'),
      query(`SELECT t.nome,COUNT(m.id_usuario) AS matriculados,COUNT(a.id_usuario) AS ativos,
        COALESCE(SUM(a.segundos),0) AS segundos
        FROM turmas t LEFT JOIN matriculas m USING(id_turma)
        LEFT JOIN (SELECT id_usuario,SUM(segundos) AS segundos FROM estudo_atividade WHERE registrado_em>=CURRENT_DATE-INTERVAL 6 DAY GROUP BY id_usuario) a USING(id_usuario)
        GROUP BY t.id_turma,t.nome ORDER BY t.nome LIMIT 100`),
      query('SELECT DATE(registrado_em) AS dia,COUNT(DISTINCT id_usuario) AS ativos,SUM(segundos) AS segundos FROM estudo_atividade WHERE registrado_em>=CURRENT_DATE-INTERVAL 13 DAY GROUP BY DATE(registrado_em) ORDER BY dia')
    ]);
    res.json({temas:themes,turmas:groups,tendencia:trend});
  });
}

module.exports = registerJourney;
