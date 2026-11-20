const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const QRCode = require('qrcode');

function registerDocuments(app, { query, learner, instructor, problem, audit, publicOrigin }) {
  const rowsForReport = () => query(`
    SELECT u.nome,COALESCE(u.nivel,'A descobrir') AS nivel,
      COALESCE(p.total,0) AS aulas,COALESCE(s.minutos,0) AS minutos,
      COALESCE(f.total,0) AS presencas,COALESCE(f.encontros,0) AS encontros
    FROM usuarios u
    LEFT JOIN (SELECT id_usuario,COUNT(DISTINCT id_licao) AS total FROM progresso WHERE concluido=1 GROUP BY id_usuario) p USING(id_usuario)
    LEFT JOIN (SELECT id_usuario,FLOOR(SUM(segundos)/60) AS minutos FROM estudo_atividade GROUP BY id_usuario) s USING(id_usuario)
    LEFT JOIN (SELECT id_usuario,SUM(presente) AS total,COUNT(*) AS encontros FROM presencas GROUP BY id_usuario) f USING(id_usuario)
    ORDER BY u.nome,u.id_usuario LIMIT 1000
  `);

  app.get('/instrutor/relatorios/:formato', instructor, async (req,res) => {
    const format = req.params.formato;
    if (!['pdf','xlsx'].includes(format)) problem(404,'Formato de relatório desconhecido.');
    const rows = await rowsForReport();
    await audit(req,'relatorio-' + format);
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Acompanhamento');
      sheet.columns = [
        { header:'Participante',key:'nome',width:34 }, { header:'Nível',key:'nivel',width:22 },
        { header:'Aulas',key:'aulas',width:12 }, { header:'Minutos',key:'minutos',width:12 },
        { header:'Presenças',key:'presencas',width:14 }, { header:'Encontros registrados',key:'encontros',width:24 }
      ];
      sheet.addRows(rows.map(row => ({ ...row, aulas:Number(row.aulas),minutos:Number(row.minutos),presencas:Number(row.presencas),encontros:Number(row.encontros) })));
      sheet.getRow(1).font = { bold:true };
      sheet.views = [{ state:'frozen',ySplit:1 }];
      const content = await workbook.xlsx.writeBuffer();
      return res.attachment('acompanhamento.xlsx').send(Buffer.from(content));
    }
    const pdf = new PDFDocument({ size:'A4', margin:50, info:{Title:'Acompanhamento institucional'} });
    res.attachment('acompanhamento.pdf');
    pdf.pipe(res);
    pdf.fontSize(24).text('Acompanhamento institucional');
    pdf.fontSize(12).fillColor('#48536b').text('Conectados na Melhor Idade');
    pdf.moveDown();
    if (!rows.length) pdf.text('Nenhum participante registrado.');
    for (const row of rows) {
      if (pdf.y > 725) pdf.addPage();
      pdf.fillColor('#18233e').font('Helvetica-Bold').text(row.nome);
      pdf.font('Helvetica').text(`${row.nivel} | ${row.aulas} aula(s) | ${row.minutos} min | ${row.presencas}/${row.encontros} presenças`);
      pdf.moveDown(.55);
    }
    pdf.end();
  });

  app.get('/participante/certificado/:codigo', async (req,res) => {
    const id = await learner(req);
    const code = req.params.codigo;
    if (!/^[a-f0-9-]{36}$/i.test(code)) problem(404,'Certificado não encontrado.');
    const [certificate] = await query('SELECT c.codigo,c.emitido_em,u.nome FROM certificados c JOIN usuarios u USING(id_usuario) WHERE c.codigo=? AND c.id_usuario=?',[code,id]);
    if (!certificate) problem(404,'Certificado não encontrado.');
    const origin = publicOrigin || req.protocol + '://' + req.get('host');
    const validation = new URL('/#certificado/' + certificate.codigo,origin).href;
    const qr = await QRCode.toBuffer(validation,{ errorCorrectionLevel:'M',margin:3,width:300 });
    const pdf = new PDFDocument({ size:'A4',layout:'landscape',margin:70,info:{Title:'Certificado de conclusão'} });
    res.attachment('certificado-conectados.pdf');
    pdf.pipe(res);
    pdf.fillColor('#34439a').fontSize(15).text('CONECTADOS NA MELHOR IDADE',{align:'center'});
    pdf.moveDown();
    pdf.fillColor('#18233e').fontSize(34).text('Certificado de conclusão',{align:'center'});
    pdf.moveDown();
    pdf.fontSize(16).text('Certificamos que',{align:'center'});
    pdf.font('Helvetica-Bold').fontSize(27).text(certificate.nome,{align:'center'});
    pdf.moveDown(.75);
    pdf.font('Helvetica').fontSize(15).text('concluiu as quatro aulas da trilha de inclusão digital.',{align:'center'});
    pdf.text('Emissão em ' + String(certificate.emitido_em).slice(0,10).split('-').reverse().join('/'),{align:'center'});
    pdf.moveDown();
    pdf.image(qr,(pdf.page.width-100)/2,pdf.y,{width:100});
    pdf.fontSize(11).text(certificate.codigo,70,pdf.y+104,{align:'center',link:validation,underline:true});
    pdf.end();
  });
}
module.exports = registerDocuments;
