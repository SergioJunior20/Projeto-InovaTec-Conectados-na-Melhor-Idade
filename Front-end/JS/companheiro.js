let pwaInstallPrompt;
let journeyStepStarted = 0;
let tourStep = 0;
let syncingLocal = false;

function journeyEvents() {
  return Array.isArray(user.journey) ? user.journey : [];
}

function journeySnapshot() {
  return Jornada.evaluate({
    completed:[...completed],attempts,actions:journeyEvents(),level:user.level,
    earnedTopics:user.successfulTopics,longStreak:user.longStreak
  });
}

function trackJourney(type, topic, seconds) {
  const events = journeyEvents().slice(-359);
  events.push({tipo:type,tema:topic,dia:Jornada.day(),segundos:seconds});
  user.journey = events;
  if (journeySnapshot().streak >= 7) user.longStreak = true;
  saveUser();
  applyJourneyMode();
}

function applyJourneyMode() {
  const preference = settings['journey-mode'] || 'auto';
  const guided = preference === 'iniciante' || (preference === 'auto' && journeySnapshot().guided);
  document.documentElement.dataset.journeyMode = preference;
  document.documentElement.toggleAttribute('data-guided',guided);
  document.documentElement.toggleAttribute('data-ultra',Boolean(settings.ultra));
}

function journeySummary() {
  const model = journeySnapshot();
  return '<div class="grid journey-metrics">' +
    metric(model.xp + ' XP','Experiência') + metric(model.level,'Nível da jornada') +
    metric(model.streak + ' dia(s)','Sequência de estudo') + '</div>';
}

function companionCard() {
  const model = journeySnapshot();
  const next = recommendation();
  const full = completed.size === 4;
  let tip = 'Quando quiser, escolha uma aula curta. Posso acompanhar você em cada passo.';
  if (model.paused && next) tip = 'Faz alguns dias desde sua última prática. Podemos retomar por uma aula curta.';
  else if (completed.size === 3) tip = 'Falta apenas uma aula para seu certificado. Quer continuar de onde parou?';
  else if (full) tip = 'Você concluiu todas as aulas. Vamos praticar uma situação de segurança?';
  else if (model.today) tip = 'Você já praticou hoje. Parabéns por separar um tempo para aprender.';
  return '<section class="card companion-card"><div class="companion-mark decorative" aria-hidden="true">✧</div><div><h2>Companheiro Digital</h2><p>' + esc(tip) + '</p>' +
    '<div class="actions">' + link(next ? 'aula/'+next : 'praticar',next ? 'Continuar com uma aula' : 'Abrir prática',true) + link('aurora','Conversar com a Aurora') + '</div></div></section>';
}

function achievementPage() {
  const model = journeySnapshot();
  view('Minhas conquistas',journeySummary() +
    card('Missão de hoje', '<p>' + (model.today ? 'Você já praticou hoje. Missão concluída!' : 'Abra uma aula e avance um passo, ou responda a um exercício.') + '</p>' + link('praticar','Escolher exercício',true)) +
    card('Missão da semana','<p>Pratique em dois dias nesta semana.</p><progress max="2" value="' + Math.min(2,model.week) + '" aria-label="Meta semanal de dois dias"></progress><p>' + Math.min(2,model.week) + ' de 2 dias</p>') +
    card('Medalhas',model.achievements.length ? '<ul class="achievement-list">' + model.achievements.map(label => '<li><span aria-hidden="true">★</span> ' + esc(label) + '</li>').join('') + '</ul>' : '<p>Conclua uma aula para ganhar sua primeira medalha.</p>') +
    card('Compartilhar uma conquista','<p>Compartilhe apenas uma frase de incentivo. Seu nome e seus dados do perfil ficam de fora.</p><button data-action="share-achievement" ' + (model.achievements.length ? '' : 'disabled') + '>Compartilhar minha conquista</button>'));
}

function tourPage() {
  const steps = [
    ['Comece por uma aula curta','Escolha um assunto conhecido. Cada aula tem instruções em etapas.', 'aulas','Ver aulas'],
    ['Deixe a tela confortável','No topo, abra Acessibilidade para mudar o tamanho do texto ou ativar a leitura em voz alta.', 'guia','Ver opções de navegação'],
    ['Pratique no seu ritmo','Use os exercícios para testar o que aprendeu com situações fictícias.', 'praticar','Experimentar um exercício'],
    ['Peça ajuda quando precisar','A Aurora orienta dentro do conteúdo do curso. A equipe responde na Central de ajuda.', 'ajuda','Abrir central de ajuda']
  ];
  const [title,body,target,label] = steps[tourStep];
  view('Primeiros passos',card(title,'<p role="status">Passo ' + (tourStep+1) + ' de ' + steps.length + '</p><p>' + esc(body) + '</p><div class="actions">' +
    (tourStep ? '<button data-action="tour-back">Passo anterior</button>' : '') +
    '<button class="primary" data-action="tour-next">' + (tourStep===steps.length-1 ? 'Concluir passeio' : 'Próximo passo') + '</button>' + link(target,label) + '</div>'));
}

function queueStudy(payload) {
  if (!user.id_usuario) return;
  user.pendingStudy = [...(user.pendingStudy || []).slice(-399),{...payload,id_usuario:user.id_usuario}];
  saveUser();
  syncWithConnection();
}

async function syncWithConnection() {
  if (syncingLocal || !user.id_usuario || !navigator.onLine) return;
  const account = user;
  syncingLocal = true;
  try {
    if (!account.progressPending && !account.pendingStudy?.length) return;
    const remote = await api('/sessao');
    if (user !== account || remote.id_usuario !== account.id_usuario) return;
    if (account.progressPending) {
      const marker = account.progressPending;
      await syncProgress();
      if (user === account && account.progressPending === marker) account.progressPending = 0;
    }
    for (const event of [...(account.pendingStudy || [])]) {
      if (user !== account) break;
      await api('/participante/estudo',{data:event});
      account.pendingStudy = account.pendingStudy.filter(item => item.evento !== event.evento);
      if (user === account) saveUser();
    }
    if (user === account) saveUser();
  } catch {
    // A próxima conexão ou visita repete a sincronização com os mesmos IDs.
  } finally { syncingLocal = false; }
}

function updateConnectionIndicator() {
  const element = document.querySelector('#connection-status');
  element.hidden = navigator.onLine;
  if (navigator.onLine) syncWithConnection();
}

async function shareProgress() {
  const achievement = journeySnapshot().achievements.at(-1);
  if (!achievement) return;
  const text = 'Minha conquista no Conectados na Melhor Idade: ' + achievement + '.';
  try {
    if (navigator.share) await navigator.share({text});
    else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      notify('Texto copiado para compartilhar.');
    } else notify(text);
  } catch (error) { if (error.name !== 'AbortError') notify(text); }
}

function setupPWA() {
  window.addEventListener('online', updateConnectionIndicator);
  window.addEventListener('offline', updateConnectionIndicator);
  window.addEventListener('focus',syncWithConnection);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pwaInstallPrompt = event;
    document.querySelector('#install-app').hidden = false;
  });
  document.querySelector('#install-app').addEventListener('click', async () => {
    if (!pwaInstallPrompt) return;
    const prompt = pwaInstallPrompt;
    pwaInstallPrompt = undefined;
    document.querySelector('#install-app').hidden = true;
    try { await prompt.prompt(); } catch { notify('A instalação está indisponível neste navegador.'); }
  });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {});
  updateConnectionIndicator();
}

async function loadEncouragement() {
  const target = document.querySelector('#encouragement');
  if (!target || !user.id_usuario || !navigator.onLine) return;
  try {
    const items = await api('/participante/incentivos');
    if (target.isConnected && items.length) target.innerHTML = card('Mensagens de incentivo', '<ul class="history">' +
      items.map(item => '<li><strong>' + esc(item.nome) + '</strong><p>' + esc(item.texto) + '</p></li>').join('') + '</ul>');
  } catch { /* O restante do painel continua disponível. */ }
}

async function communityView() {
  view('Comunidade','<div id="community-body"><p role="status">Carregando publicações…</p></div>',
    'Compartilhe experiências com os participantes da sua instituição.');
  const target = document.querySelector('#community-body');
  try {
    const data = await api('/comunidade');
    if (!target.isConnected) return;
    target.innerHTML = card('Compartilhar uma experiência','<p>A equipe revisa as publicações antes de mostrar. Evite nomes completos, links, telefones e outros dados pessoais.</p>' +
      '<form id="community-post"><label>Título<input name="titulo" required maxlength="90"></label><label>Sua experiência<textarea name="texto" required maxlength="600"></textarea></label>' +
      '<label class="option"><input name="revisao" type="checkbox" required> Autorizo a revisão e publicação para a comunidade da instituição.</label><button class="primary">Enviar para revisão</button></form>') +
      card('Minhas publicações', data.minhas.length ? '<ul class="history">' + data.minhas.map(item => '<li>' + esc(item.titulo) +
        ' · ' + ({pendente:'Em revisão',publicada:'Publicada',oculta:'Oculta'}[item.estado] || 'Em revisão') + '</li>').join('') + '</ul>' : '<p>Você pode participar quando quiser.</p>') +
      card('Experiências da comunidade',data.publicacoes.length ? data.publicacoes.map(item => '<article class="community-post"><h3>' + esc(item.titulo) +
        '</h3><p>' + esc(item.texto) + '</p><small>' + esc(dateBR(item.criada_em)) + '</small></article>').join('') : '<p>Ainda não há publicações aprovadas.</p>');
  } catch(error) {
    if (!target.isConnected) return;
    target.innerHTML = error.status===401 ? card('Acesso dos participantes','<p>Entre com seu cadastro para visitar a comunidade da instituição.</p>' + link('ativar','Usar código do instrutor'))
      : card('Comunidade indisponível','<p>Tente novamente quando houver conexão.</p>');
  }
}

async function loadModeration() {
  const target = document.querySelector('#moderation-list');
  if (!target) return;
  try {
    const items = await api('/instrutor/comunidade',{instructor:true});
    if (!target.isConnected) return;
    target.innerHTML = items.length ? items.map(item => '<article class="community-post"><h3>' + esc(item.titulo) +
      '</h3><p>' + esc(item.texto) + '</p><p>' + (item.estado==='publicada'?'Publicada':'Aguardando revisão') +
      '</p><form class="actions moderation-form" data-publication="' + esc(item.id_publicacao) + '"><label>Decisão<select name="estado" required>' +
      '<option value="">Selecione</option>' + (item.estado==='pendente' ? '<option value="publicada">Aprovar publicação</option>' : '') +
      '<option value="oculta">Ocultar publicação</option></select></label><button>Registrar decisão</button></form></article>').join('') : '<p>Nenhuma publicação na fila.</p>';
  } catch(error) { if (target.isConnected) target.textContent = error.message; }
}

async function loadExecutiveJourney() {
  const target = document.querySelector('#executive-journey');
  if (!target) return;
  try {
    const result = await api('/instrutor/jornada',{instructor:true});
    if (!target.isConnected) return;
    const ranked = [...result.temas].sort((a,b) => Number(b.erros)/Number(b.tentativas)-Number(a.erros)/Number(a.tentativas));
    const hardest = ranked.find(item => Number(item.erros)>0 && Number(item.tentativas)>=3);
    const insight = hardest ? '<p><strong>Revisão sugerida:</strong> ' + esc(hardest.tema) + '. Houve ' + esc(hardest.erros) + ' erros em ' + esc(hardest.tentativas) + ' tentativas nos últimos 30 dias.</p>' : '<p>É preciso registrar mais tentativas para sugerir um tema de revisão.</p>';
    const table = (heading,labels,items,columns) => '<h3>' + heading + '</h3>' + (items.length ?
      '<div class="table-scroll"><table><thead><tr>' + labels.map(label => '<th scope="col">' + label + '</th>').join('') +
      '</tr></thead><tbody>' + items.map(item => '<tr>' + columns(item).map((value,index) => index ? '<td>' + esc(value) + '</td>' : '<th scope="row">' + esc(value) + '</th>').join('') + '</tr>').join('') + '</tbody></table></div>' : '<p>Sem registros no período.</p>');
    target.innerHTML = insight +
      table('Dificuldades nos últimos 30 dias',['Tema','Tentativas','Erros','Participantes'],ranked,item=>[item.tema,item.tentativas,item.erros,item.participantes]) +
      table('Comparativo de turmas em 7 dias',['Turma','Matriculados','Estudaram','Tempo'],result.turmas,item=>[item.nome,item.matriculados,item.ativos,studyMinute(item.segundos)]) +
      table('Evolução diária em 14 dias',['Dia','Estudaram','Tempo'],result.tendencia,item=>[dateBR(item.dia),item.ativos,studyMinute(item.segundos)]);
  } catch(error) { if (target.isConnected) target.textContent = error.message; }
}
