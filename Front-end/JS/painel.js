const avatarOptions = [
  ['estrela','✦','Estrela'],['flor','✿','Flor'],['sol','☀','Sol'],['folha','❧','Folha']
];

const revisionPrompts = {
  'Mensagens suspeitas': [
    'Uma mensagem oferece um benefício inesperado e pede dados pessoais. Qual é o primeiro passo?',
    'Um aviso de entrega que você não esperava pede seus dados por mensagem. Como verificar?'
  ],
  'Golpes bancários': [
    'Uma pessoa se apresenta como atendente do banco e pede um código do celular. O que você faz?',
    'Uma ligação sobre uma compra desconhecida pede seu código de verificação. Como agir?'
  ],
  'Pedidos de transferência': [
    'Uma mensagem de número novo diz ser de um familiar e pede um PIX. Qual é a forma mais segura de verificar?',
    'Um pedido urgente de transferência chega em nome de alguém da família. O que você faz primeiro?'
  ],
  'Páginas falsas': [
    'Um aviso leva a uma página que pede sua senha. Qual é a opção segura?',
    'Uma página que você abriu por mensagem aparece com a aparência do seu serviço habitual e pede a senha. Como agir?'
  ]
};

function currentCompanion() {
  const name = user.companion?.nome || 'Meu Companheiro';
  const avatar = avatarOptions.find(([key])=>key===user.companion?.avatar) || avatarOptions[0];
  return {name,avatar:avatar[1]};
}

function companionPreferences() {
  const value = user.companion || {};
  return card('Personalizar meu Companheiro','<form id="companion-preferences"><label>Nome do Companheiro<input name="nome" required maxlength="30" value="' +
    esc(value.nome || 'Meu Companheiro') + '"></label><label>Avatar<select name="avatar">' +
    avatarOptions.map(([key,icon,label])=>'<option value="' + key + '"' + (key===(value.avatar||'estrela')?' selected':'') + '>' + icon + ' ' + label + '</option>').join('') +
    '</select></label><button class="primary">Salvar personalização</button></form>');
}

function confidencePanel() {
  const topics = [...new Set([...(user.successfulTopics || []),...attempts.filter(item=>item.correta).map(item=>item.tema)])];
  const score = Evolucao.confidence([...completed],topics,Object.keys(lessons).length,exercises.length);
  return card('Confiança digital','<div class="confidence-head"><strong>' + score.percent + '%</strong><p>' + score.evidence + ' de ' + score.total + ' marcos da trilha</p></div>' +
    '<progress max="' + score.total + '" value="' + score.evidence + '" aria-label="Marcos da confiança digital"></progress>' +
    '<p class="muted">Cada aula concluída e cada tema com um acerto vale um marco. O indicador mostra sua prática registrada.</p>');
}

function weeklyPlan() {
  const next = recommendation();
  const review = Evolucao.recovery(attempts);
  const remaining = Object.keys(lessons).length-completed.size;
  const journey = journeySnapshot();
  const week = journey.week;
  const nextBadge = !completed.size ? 'Primeira aula concluída'
    : !completed.has('videochamada') ? 'Tutorial de videochamada'
    : !completed.has('pix') ? 'Treino de PIX seguro'
    : remaining ? 'Trilha inicial completa'
    : !user.certified ? 'Primeiro certificado emitido'
    : !journey.achievements.includes('Uma semana de estudos') ? 'Uma semana de estudos'
    : !journey.achievements.includes('Guardião da segurança digital') ? 'Guardião da segurança digital' : '';
  const items = [
    ['Estudar agora',next ? lessons[next].title : 'Revisar um exercício de segurança',next ? 'aula/'+next : 'praticar','Abrir atividade'],
    ['Revisar',review ? review.tema : 'Reforçar hábitos de segurança','aurora','Pedir uma revisão'],
    ['Próxima meta',week>=2 ? 'Meta semanal cumprida. Experimente a meta mensal.' : 'Estudar em dois dias da semana. Você já praticou em '+week+'.','conquistas','Ver minhas metas']
  ];
  return card('Plano da semana','<ul class="weekly-plan">' + items.map(([label,body,route,labelButton])=>
    '<li><div><strong>' + label + '</strong><p>' + esc(body) + '</p></div>' + link(route,labelButton) + '</li>').join('') + '</ul>' +
    '<p class="certificate-reminder">' + (remaining ? 'Para o certificado, faltam ' + remaining + (remaining===1?' aula.':' aulas.') : 'Você concluiu as quatro aulas. Veja a emissão no seu perfil.') + '</p>' +
    (nextBadge ? '<p>Meta de conquista sugerida: <strong>' + esc(nextBadge) + '</strong>.</p>' : '<p>Você já conquistou todas as medalhas da trilha.</p>'));
}

function progressTimeline() {
  const records = journeyEvents();
  const completions = records.filter(event => event.tipo==='conclusao' && Object.hasOwn(lessons,event.tema));
  const history = [...new Map(completions.map(event=>[event.tema,event])).values()].sort((a,b)=>b.dia.localeCompare(a.dia));
  const dated = new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'});
  const recent = Array.from({length:7},(_,index)=>{
    const date = new Date();
    date.setDate(date.getDate()+index-6);
    const key = Jornada.day(date);
    return [dated.format(date),records.filter(event=>event.dia===key && ['passo','exercicio'].includes(event.tipo)).length];
  });
  const maximum = Math.max(1,...recent.map(([,count])=>count));
  return card('Evolução nos últimos sete dias','<ul class="evolution-bars">' +
    recent.map(([label,value])=>'<li><span>' + esc(label) + '</span><meter aria-label="' + esc(label) + '" min="0" max="' + maximum + '" value="' + value + '">' + value + '</meter><strong>' + value + '</strong></li>').join('') +
    '</ul><p class="muted">Atividades registradas neste aparelho por dia.</p>' +
    (history.length ? '<h3>Linha do tempo</h3><ol class="history">' + history.map(event=>'<li><strong>' + esc(lessons[event.tema].title) + '</strong> · ' + esc(dateBR(event.dia)) + '</li>').join('') + '</ol>' : '<p>As próximas conclusões vão aparecer na sua linha do tempo.</p>'));
}

function dailySummary() {
  const today = Jornada.day();
  const items = journeyEvents().filter(item=>item.dia===today);
  const doneToday = items.filter(item=>item.tipo==='conclusao').length;
  const practiced = attempts.filter(item=>Number.isFinite(item.date) && Jornada.day(new Date(item.date))===today);
  const passed = practiced.filter(item=>item.correta).length;
  return card('Hoje na sua jornada', items.length || practiced.length
    ? '<p>' + doneToday + ' aula(s) concluída(s) · ' + passed + ' acerto(s) em ' + practiced.length + ' tentativa(s).</p>'
    : '<p>Seu resumo aparece depois da primeira atividade de hoje.</p>');
}

function skeleton(label) {
  return '<div class="inline-loading" role="status"><span>' + esc(label) + '</span><div aria-hidden="true"><i></i><i></i><i></i></div></div>';
}

function runAccessibilityCheck() {
  const style = getComputedStyle(document.documentElement);
  const colors = ['--ink','--bg'].map(name=>style.getPropertyValue(name).trim());
  const luminance = color => {
    if (!/^#[a-f0-9]{6}$/i.test(color)) return undefined;
    const channels = color.slice(1).match(/../g).map(value=>parseInt(value,16)/255)
      .map(value=>value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
    return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  };
  const values = colors.map(luminance);
  const ratio = values.every(Number.isFinite) ? (Math.max(...values)+.05)/(Math.min(...values)+.05) : 0;
  const tests = [
    [document.documentElement.lang==='pt-BR','Idioma português do Brasil definido'],
    [document.querySelectorAll('main h1').length===1,'Um título principal nesta tela'],
    [[...document.images].every(image=>image.hasAttribute('alt')),'Atributo de alternativa nas imagens desta tela'],
    [ratio>=4.5,'Contraste das cores-base de texto e fundo' + (ratio?' · '+ratio.toFixed(2).replace('.',',')+' para 1':'')]
  ];
  document.querySelector('#access-results').innerHTML = '<ul>' +
    tests.map(([ok,label])=>'<li><strong>' + (ok?'Verificado':'Revisar') + '</strong> · ' + esc(label) + '</li>').join('') +
    '</ul><p class="muted">A verificação abrange esta tela e as cores-base. O percurso por teclado e leitores de tela requer teste manual.</p>';
}

function celebrate(message) {
  statusBox.classList.remove('celebration');
  notify(message);
  statusBox.classList.add('celebration');
}

async function loadStudentPage(page=1,focus=false) {
  const target = document.querySelector('#student-page');
  if (!target) return;
  const search = document.querySelector('#student-search input').value.trim();
  const request = Symbol();
  target.pageRequest = request;
  target.innerHTML = skeleton('Buscando participantes…');
  try {
    const data = await api('/instrutor/participantes?pagina=' + page + '&busca=' + encodeURIComponent(search),{instructor:true});
    if (!target.isConnected || target.pageRequest !== request) return;
    target.innerHTML = '<p tabindex="-1" id="student-page-label">Página ' + data.pagina + ' · ' + data.participantes.length + ' participante(s)</p>' +
      (data.participantes.length ? '<div class="table-scroll"><table><thead><tr><th scope="col">Nome</th><th scope="col">Nível</th><th scope="col">Aulas</th><th scope="col">Última aula</th></tr></thead><tbody>' +
      data.participantes.map(item=>'<tr><th scope="row">' + esc(item.nome) + '</th><td>' + esc(item.nivel) +
        '</td><td>' + esc(item.concluidas) + '</td><td>' + (item.ultima_aula ? esc(dateBR(item.ultima_aula)) : 'Sem registro') + '</td></tr>').join('') + '</tbody></table></div>' :
      '<p>Nenhum participante encontrado. Experimente buscar outro nome.</p>') +
      '<div class="actions">' + (page>1?'<button data-action="student-page" data-key="' + (page-1) + '">Página anterior</button>':'') +
      (data.proxima?'<button data-action="student-page" data-key="' + (page+1) + '">Próxima página</button>':'') + '</div>';
    if (focus) target.querySelector('#student-page-label').focus();
  } catch(error) {
    if (target.isConnected && target.pageRequest===request) target.textContent = error.message;
  }
}

function deferPanel(selector,content,load,label) {
  const panel = document.querySelector(selector);
  if (!panel) return;
  const onToggle = () => {
    if (!panel.open) return;
    panel.removeEventListener('toggle',onToggle);
    panel.querySelector(content).innerHTML = skeleton(label);
    load();
  };
  panel.addEventListener('toggle',onToggle);
}
