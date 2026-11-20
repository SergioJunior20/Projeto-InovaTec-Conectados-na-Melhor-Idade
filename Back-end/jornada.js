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
    const [themes,groups,trend,heatmap,followup] = await Promise.all([
      query('SELECT tema,COUNT(*) AS tentativas,SUM(NOT correta) AS erros,COUNT(DISTINCT id_usuario) AS participantes FROM avaliacoes WHERE registrada_em>=CURRENT_DATE-INTERVAL 29 DAY GROUP BY tema ORDER BY erros DESC,tema'),
      query(`SELECT t.nome,COUNT(m.id_usuario) AS matriculados,COUNT(a.id_usuario) AS ativos,
        COALESCE(SUM(a.segundos),0) AS segundos
        FROM turmas t LEFT JOIN matriculas m USING(id_turma)
        LEFT JOIN (SELECT id_usuario,SUM(segundos) AS segundos FROM estudo_atividade WHERE registrado_em>=CURRENT_DATE-INTERVAL 6 DAY GROUP BY id_usuario) a USING(id_usuario)
        GROUP BY t.id_turma,t.nome ORDER BY t.nome LIMIT 100`),
      query('SELECT DATE(registrado_em) AS dia,COUNT(DISTINCT id_usuario) AS ativos,SUM(segundos) AS segundos FROM estudo_atividade WHERE registrado_em>=CURRENT_DATE-INTERVAL 13 DAY GROUP BY DATE(registrado_em) ORDER BY dia'),
      query(`WITH recentes AS (
        SELECT id_usuario,tema,correta,ROW_NUMBER() OVER (PARTITION BY id_usuario,tema ORDER BY id_avaliacao DESC) AS ordem
        FROM avaliacoes WHERE registrada_em>=CURRENT_DATE-INTERVAL 29 DAY
      ) SELECT t.nome AS turma,r.tema,COUNT(*) AS participantes,SUM(NOT r.correta) AS precisam_revisar
        FROM recentes r JOIN matriculas m USING(id_usuario) JOIN turmas t USING(id_turma)
        WHERE r.ordem=1 GROUP BY t.id_turma,t.nome,r.tema ORDER BY t.nome,r.tema LIMIT 400`),
      query(`SELECT u.nome,DATE(a.ultimo_dia) AS ultima_atividade,DATEDIFF(CURRENT_DATE,a.ultimo_dia) AS dias
        FROM usuarios u JOIN (
          SELECT id_usuario,MAX(data_evento) AS ultimo_dia FROM (
            SELECT id_usuario,registrado_em AS data_evento FROM estudo_atividade
            UNION ALL SELECT id_usuario,registrada_em FROM avaliacoes
            UNION ALL SELECT id_usuario,data_conclusao FROM progresso WHERE concluido=1
          ) atividades GROUP BY id_usuario
        ) a USING(id_usuario)
        WHERE a.ultimo_dia<CURRENT_DATE-INTERVAL 6 DAY
          AND EXISTS (SELECT 1 FROM matriculas m WHERE m.id_usuario=u.id_usuario)
          AND NOT EXISTS (SELECT 1 FROM certificados c WHERE c.id_usuario=u.id_usuario)
        ORDER BY a.ultimo_dia,u.id_usuario LIMIT 30`)
    ]);
    res.json({temas:themes,turmas:groups,tendencia:trend,mapa:heatmap,acompanhamento:followup});
  });

  app.get('/instrutor/participantes',instructor,async (req,res) => {
    const page = req.query.pagina === undefined ? 1 : integer(req.query.pagina,1,100000);
    const search = typeof req.query.busca==='string' ? req.query.busca.trim() : '';
    if (search.length>100) problem(400,'Use até 100 caracteres na busca.');
    const pageSize = 15;
    const offset = (page-1)*pageSize;
    const rows = await query(`
      SELECT u.id_usuario,u.nome,u.nivel,
        (SELECT COUNT(DISTINCT p.id_licao) FROM progresso p WHERE p.id_usuario=u.id_usuario AND p.concluido=1) AS concluidas,
        (SELECT MAX(p.data_conclusao) FROM progresso p WHERE p.id_usuario=u.id_usuario AND p.concluido=1) AS ultima_aula
      FROM usuarios u WHERE (?='' OR LOCATE(?,u.nome)>0)
      ORDER BY u.nome,u.id_usuario LIMIT ${pageSize+1} OFFSET ${offset}`,[search,search]);
    res.json({pagina:page,proxima:rows.length>pageSize,participantes:rows.slice(0,pageSize)});
  });
}

module.exports = registerJourney;
