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
    earnedTopics:user.successfulTopics,longStreak:user.longStreak,certified:user.certified
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
  const companion = currentCompanion();
  const review = Evolucao.recovery(attempts);
  const full = completed.size === 4;
  let tip = 'Quando quiser, escolha uma aula curta. Posso acompanhar você em cada passo.';
  if (model.paused && next) tip = 'Faz alguns dias desde sua última prática. Podemos retomar por uma aula curta.';
  else if (completed.size === 3) tip = 'Falta apenas uma aula para seu certificado. Quer continuar de onde parou?';
  else if (review) tip = 'Vamos praticar de novo: ' + review.tema.toLowerCase() + '. Posso orientar você por etapas.';
  else if (full) tip = 'Você concluiu todas as aulas. Vamos praticar uma situação de segurança?';
  else if (model.today) tip = 'Você já praticou hoje. Parabéns por separar um tempo para aprender.';
  return '<section class="card companion-card"><div class="companion-mark decorative" aria-hidden="true">' + companion.avatar +
    '</div><div><h2>Companheiro Digital</h2><p><strong>' + esc(companion.name) + '</strong> · ' + esc(tip) + '</p>' +
    '<div class="actions">' + link(next ? 'aula/'+next : 'praticar',next ? 'Continuar com uma aula' : 'Abrir prática',true) +
    link('aurora','Conversar com a Aurora') + link('perfil','Personalizar Companheiro') + '</div></div></section>';
}

function achievementPage() {
  const model = journeySnapshot();
  const league = Evolucao.league(model.xp);
  view('Minhas conquistas',journeySummary() +
    card('Sua liga pessoal','<p class="league-name"><strong>' + esc(league.current.name) + '</strong></p><p>' +
      (league.next ? 'Próxima liga em ' + (league.next.xp-model.xp) + ' XP.' : 'Você chegou à liga mais alta.') +
      ' Seu progresso é acompanhado individualmente.</p>') +
    card('Missão de hoje', '<p>' + (model.today ? 'Você já praticou hoje. Missão concluída!' : 'Abra uma aula e avance um passo, ou responda a um exercício.') + '</p>' + link('praticar','Escolher exercício',true)) +
    card('Missão da semana','<p>Pratique em dois dias nesta semana.</p><progress max="2" value="' + Math.min(2,model.week) + '" aria-label="Meta semanal de dois dias"></progress><p>' + Math.min(2,model.week) + ' de 2 dias</p>') +
    card('Missão do mês','<p>Pratique em seis dias neste mês.</p><progress max="6" value="' + Math.min(6,model.month) +
      '" aria-label="Meta mensal de seis dias"></progress><p>' + Math.min(6,model.month) + ' de 6 dias · ' + (model.month>=6?'Missão concluída':'Em andamento') + '</p>') +
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

function queueAssessment(theme,choice) {
  if (!user.id_usuario) return;
  const payload = {tema:theme,choice,id_usuario:user.id_usuario};
  if (!crypto.randomUUID) {
    api('/avaliacoes',{data:payload}).catch(()=>notify('A resposta ficou salva neste aparelho.'));
    return;
  }
  user.pendingAssessments = [...(user.pendingAssessments || []).slice(-199),{...payload,evento:crypto.randomUUID()}];
  saveUser();
  syncWithConnection();
}

async function syncWithConnection() {
  if (syncingLocal || !user.id_usuario || !navigator.onLine) return;
  const account = user;
  syncingLocal = true;
  try {
    if (!account.progressPending && !account.pendingStudy?.length && !account.pendingAssessments?.length) return;
    const remote = await api('/sessao');
    if (user !== account || remote.id_usuario !== account.id_usuario) return;
    if (account.progressPending) {
      const marker = account.progressPending;
      await syncProgress();
      if (user === account && account.progressPending === marker) account.progressPending = 0;
      if (user === account) refreshNotifications();
    }
    for (const [kind,path] of [['pendingAssessments','/avaliacoes'],['pendingStudy','/participante/estudo']]) {
      for (const event of (account[kind] || []).slice(0,12)) {
        if (user !== account) return;
        await api(path,{data:event});
        account[kind] = account[kind].filter(item => item.evento !== event.evento);
        if (user === account) saveUser();
      }
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
  window.setInterval(syncWithConnection,45000);
  const installButton = document.querySelector('#install-app');
  const instructions = document.querySelector('#install-help');
  const installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  installButton.hidden = Boolean(installed);
  window.addEventListener('appinstalled',()=>{
    installButton.hidden = true;
    instructions.hidden = true;
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pwaInstallPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener('click', async () => {
    if (!pwaInstallPrompt) {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
      instructions.textContent = ios
        ? 'No Safari, use Compartilhar e escolha Adicionar à Tela de Início.'
        : 'Procure “Instalar aplicativo” ou “Adicionar à tela inicial” no menu do navegador. A opção depende do navegador e do aparelho.';
      instructions.hidden = false;
      return;
    }
    const prompt = pwaInstallPrompt;
    pwaInstallPrompt = undefined;
    try { await prompt.prompt(); } catch { notify('A instalação está indisponível neste navegador.'); }
  });
  updateConnectionIndicator();
}

function setupMobileMenu() {
  const trigger = document.querySelector('#mobile-menu');
  const nav = document.querySelector('#main-menu');
  function setOpen(open) {
    trigger.setAttribute('aria-expanded',String(open));
    nav.toggleAttribute('data-menu-open',open);
  }
  trigger.addEventListener('click',()=>setOpen(trigger.getAttribute('aria-expanded')!=='true'));
  nav.addEventListener('click',event=>{
    if (!event.target.closest('a')) return;
    setOpen(false);
    if (window.matchMedia('(max-width: 53rem)').matches) main.focus();
  });
  nav.addEventListener('keydown',event=>{
    if (event.key!=='Escape' || !nav.hasAttribute('data-menu-open')) return;
    setOpen(false);
    trigger.focus();
  });
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
    const focus = [...result.mapa].filter(item=>Number(item.precisam_revisar)>0)
      .sort((a,b)=>Number(b.precisam_revisar)-Number(a.precisam_revisar))[0];
    const suggestion = focus ? '<p><strong>Sugestão para ' + esc(focus.turma) + ':</strong> revise ' + esc(focus.tema.toLowerCase()) +
      ' com ' + esc(focus.precisam_revisar) + ' de ' + esc(focus.participantes) + ' participante(s), considerando a última resposta de cada pessoa no tema.</p>' : '';
    const heatmap = result.mapa.length ? '<ul class="heatmap">' + result.mapa.map(item => {
      const count = Number(item.precisam_revisar);
      const total = Number(item.participantes);
      const intensity = count===0 ? 'low' : count/total>=.5 ? 'high' : 'medium';
      return '<li data-intensity="' + intensity + '"><strong>' + esc(item.turma) + '</strong><span>' + esc(item.tema) +
        '</span><b>' + count + ' de ' + total + ' para revisar</b></li>';
    }).join('') + '</ul>' : '<p>O mapa aparece após as primeiras avaliações das turmas.</p>';
    target.innerHTML = insight + suggestion + '<h3>Mapa de dificuldades por turma</h3>' + heatmap +
      table('Dificuldades nos últimos 30 dias',['Tema','Tentativas','Erros','Participantes'],ranked,item=>[item.tema,item.tentativas,item.erros,item.participantes]) +
      table('Comparativo de turmas em 7 dias',['Turma','Matriculados','Estudaram','Tempo'],result.turmas,item=>[item.nome,item.matriculados,item.ativos,studyMinute(item.segundos)]) +
      table('Evolução diária em 14 dias',['Dia','Estudaram','Tempo'],result.tendencia,item=>[dateBR(item.dia),item.ativos,studyMinute(item.segundos)]) +
      '<p class="muted">O acompanhamento lista participantes matriculados que já registraram atividade, ainda não têm certificado e estão há pelo menos sete dias sem novo registro. Verifique o contexto antes de entrar em contato.</p>' +
      table('Acompanhamento de pausas',['Participante','Último registro','Dias'],result.acompanhamento,item=>[item.nome,dateBR(item.ultima_atividade),item.dias]);
  } catch(error) { if (target.isConnected) target.textContent = error.message; }
}
