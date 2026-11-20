const answers = new Map([
  ['Mensagens suspeitas',1],['Golpes bancários',0],['Pedidos de transferência',1],['Páginas falsas',0]
]);
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

function registerAssessments(app,{db,query,learner,field,integer,problem}) {
  const insert = 'INSERT INTO avaliacoes (id_usuario,tema,correta) VALUES (?,?,?)';
  app.post('/avaliacoes',async (req,res) => {
    const id = await learner(req);
    if (req.body.id_usuario !== undefined && integer(req.body.id_usuario)!==id) problem(403,'A sessão mudou. Entre com o cadastro correto.');
    const theme = field(req.body.tema,50);
    if (!answers.has(theme)) problem(400,'Exercício indisponível.');
    const values = [id,theme,integer(req.body.choice,0,1)===answers.get(theme)];
    if (req.body.evento === undefined) {
      await query(insert,values);
      return res.json({mensagem:'Resposta registrada.'});
    }
    const event = field(req.body.evento,36);
    if (!uuid.test(event)) problem(400,'Identificador de avaliação inválido.');
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      let inserted = true;
      try {
        await connection.execute('INSERT INTO envios_avaliacao (id_usuario,evento) VALUES (?,?)',[id,event]);
      } catch(error) {
        if (error.code!=='ER_DUP_ENTRY') throw error;
        inserted = false;
      }
      if (inserted) await connection.execute(insert,values);
      await connection.commit();
    } catch(error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
    res.json({mensagem:'Resposta registrada.'});
  });
}

module.exports = registerAssessments;
