const main = document.querySelector('main');
const statusBox = document.querySelector('#status');
const staticDemo = globalThis.ConectadosConfig.demo;
const storagePrefix = staticDemo ? 'demo:' + new URL('./',document.baseURI).pathname + ':' : '';

function stored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(storagePrefix+key)) ?? fallback; }
  catch { return fallback; }
}

function store(key, value) {
  try { localStorage.setItem(storagePrefix+key, JSON.stringify(value)); return true; }
  catch { notify('O navegador não conseguiu guardar esses dados neste dispositivo.'); return false; }
}

let user = stored('currentUser', {});
let settings = stored('preferencias', {});
let completed = new Set((user.completedLessons || []).filter(key => ['whatsapp', 'fotos', 'videochamada', 'pix'].includes(key)));
let attempts = stored('tentativas', []);
let chat = [];
let tutorContext = {};
let question = 0;
let answers = [];
let step = 0;
let iconRound = 0;
let instructorKey = '';
let generation = 0;
let noticeTimer;
let studentRequest;

lessons.pix = { id: 4, title: 'PIX com segurança', icon: '🏦', difficulty: 'Médio', description: 'Pratique as etapas de uma transferência em um tutorial.', steps: pixSteps };
const modules = {
  whatsapp: 'Comunicação',
  fotos: 'Fotos e mídia',
  videochamada: 'Comunicação',
  pix: 'Segurança e serviços'
};
const exercises = [
  { theme: 'Mensagens suspeitas', scenario: 'Uma mensagem diz que você ganhou um prêmio e pede seus dados. O que fazer?', choices: ['Informar os dados', 'Interromper a conversa e verificar pelo canal oficial'], correct: 1, explanation: 'Prêmios inesperados podem ser uma isca. Verifique a informação em um canal que você já conhece.' },
  { theme: 'Golpes bancários', scenario: 'Alguém liga dizendo ser do banco e pede seu código de verificação. O que fazer?', choices: ['Encerrar a ligação e abrir o aplicativo oficial', 'Passar o código para confirmar o atendimento'], correct: 0, explanation: 'Códigos de verificação protegem sua conta. Guarde-os com você e procure o banco pelo canal oficial.' },
  { theme: 'Pedidos de transferência', scenario: 'Uma pessoa diz que é seu neto e precisa de um PIX urgente. Como conferir?', choices: ['Fazer o PIX de imediato', 'Ligar para o número que você já tinha salvo'], correct: 1, explanation: 'Confirme a identidade da pessoa antes de transferir dinheiro. Use um contato que você já conhece.' },
  { theme: 'Páginas falsas', scenario: 'Uma página aberta por uma mensagem pede sua senha. Qual é a opção segura?', choices: ['Fechar a página e acessar o serviço pelo aplicativo oficial', 'Digitar a senha para ver o que acontece'], correct: 0, explanation: 'Uma página pode imitar um serviço. Acesse suas contas por um aplicativo ou endereço que você já conhece.' }
];

function esc(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function notify(message) {
  clearTimeout(noticeTimer);
  statusBox.textContent = message;
  noticeTimer = setTimeout(() => { statusBox.textContent = ''; }, 7000);
}

function saveUser() {
  user.completedLessons = [...completed];
  return store('currentUser', user);
}

async function api(url, { data, method = data ? 'POST' : 'GET', instructor = false } = {}) {
  if (staticDemo) {
    throw Object.assign(new Error('Este recurso está disponível na versão com servidor institucional.'),{status:503});
  }
  const headers = {};
  if (data) headers['Content-Type'] = 'application/json';
  if (instructor) headers.Authorization = 'Bearer ' + instructorKey;
  const response = await fetch(url, { method, headers, body: data && JSON.stringify(data), signal: AbortSignal.timeout(8000) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.mensagem || 'Não foi possível acessar o serviço.'), { status: response.status });
  return result;
}

function studentData() {
  if (studentRequest?.account===user) return studentRequest.promise;
  const request = {account:user,promise:api('/aluno')};
  studentRequest = request;
  return request.promise.finally(()=>{
    if (studentRequest===request) studentRequest = undefined;
  });
}

function heading(title, intro = '') {
  return `<h1 id="page-title">${esc(title)}</h1>${intro ? `<p class="lead">${esc(intro)}</p>` : ''}`;
}

function view(title, content, intro) {
  main.innerHTML = heading(title, intro) + content;
}

function card(title, body) {
  return `<section class="card"><h2>${esc(title)}</h2>${body}</section>`;
}

function link(target, label, primary = false) {
  return `<a class="button${primary ? ' primary' : ''}" href="#${target}">${esc(label)}</a>`;
}

function progress() {
  return `<label for="progress-course">${completed.size} de 4 aulas concluídas</label><progress id="progress-course" max="4" value="${completed.size}"></progress>`;
}

function metric(value, label) {
  return `<div class="metric"><strong>${esc(value)}</strong>${esc(label)}</div>`;
}

function recommendation() {
  const order = ['Iniciante', 'Iniciante Total'].includes(user.level) || !user.level
    ? ['whatsapp', 'fotos', 'videochamada', 'pix'] : ['pix', 'videochamada', 'fotos', 'whatsapp'];
  return order.find(key => !completed.has(key));
}

function reviewTheme() {
  return Evolucao.recovery(attempts)?.tema;
}

function home() {
  const next = recommendation();
  main.innerHTML = `<section class="hero hero-journey"><div class="hero-copy">
    ${heading(user.name ? 'Olá, ' + user.name.split(/\s+/)[0] + '!' : 'Conectados na Melhor Idade')}
    <p>Use o celular com mais segurança, compartilhe bons momentos e pratique com tutoriais passo a passo.</p>
    <div class="actions">${user.name && next ? link('aula/' + next, 'Continuar aprendendo', true) : user.name ? link('praticar', 'Revisar com exercícios', true) : link('diagnostico', 'Começar meu diagnóstico', true)}
    ${link('aulas', 'Ver todas as aulas')}${!user.name ? link('ativar', 'Usar código do instrutor') : ''}</div>
    ${!user.tourDone ? '<p class="tour-link"><a href="#tour">Fazer passeio guiado</a></p>' : ''}</div>
    <img class="hero-people decorative" src="assets/aprender-juntos.jpg" alt="" width="560" height="560" decoding="async" fetchpriority="high"></section>
    ${journeySummary()}
    ${companionCard()}
    <div class="home-details">
    <div class="dashboard-columns">${weeklyPlan()}${confidencePanel()}</div>
    <div class="dashboard-columns">${dailySummary()}${progressTimeline()}</div>
    ${card('Missão de segurança', '<p>Experimente acertar um exercício em cada um dos quatro temas de segurança digital.</p><p>' + new Set(attempts.filter(item => item.correta).map(item => item.tema)).size + ' de 4 temas completados</p>' + link('praticar','Começar missão'))}
    <div id="study-details"></div><div id="encouragement"></div></div>`;
  loadEncouragement();
  if (user.id_usuario) displayStudy();
}

function diagnose() {
  answers = [];
  question = 0;
  view('Diagnóstico inicial', card('Como podemos chamar você?', `<form id="diagnostic-name">
    <label>Nome completo<input name="nome" required maxlength="100" autocomplete="name" value="${esc(user.name)}"></label>
    <button class="primary">Responder questionário</button></form>`), 'Responda cinco perguntas para receber uma sugestão de trilha.');
}

function showQuestion() {
  const item = quizQuestions[question];
  view('Diagnóstico inicial', card('Pergunta ' + (question + 1) + ' de ' + quizQuestions.length, `
    <progress max="${quizQuestions.length}" value="${question + 1}" aria-label="Etapa do diagnóstico"></progress>
    <form id="diagnostic-question"><fieldset><legend>${esc(item.question)}</legend>
    ${item.options.map((option, index) => `<label class="option"><input type="radio" name="answer" value="${index}" required ${answers[question] === index ? 'checked' : ''}>${esc(option)}</label>`).join('')}</fieldset>
    <div class="actions">${question ? '<button type="button" data-action="previous-question">Voltar</button>' : ''}
    <button class="primary">${question === quizQuestions.length - 1 ? 'Ver resultado' : 'Próxima pergunta'}</button></div></form>`));
  main.querySelector('legend').tabIndex = -1;
  main.querySelector('legend').focus();
}

async function syncProfile() {
  const data = { nome: user.name, nivel: user.level || 'Iniciante', pontuacao: user.score || 0 };
  if (user.id_usuario) {
    await api('/usuarios/' + user.id_usuario, { method: 'PUT', data });
    return;
  }
  const result = await api('/usuarios', { data });
  user.id_usuario = result.id_usuario;
  saveUser();
}

async function syncProgress() {
  const account = user;
  if (!account.id_usuario) return;
  const records = await api('/progresso/' + account.id_usuario);
  const remote = new Set(records.filter(p => p.concluido).map(p => Number(p.id_licao)));
  const confirmed = new Map(records.filter(record=>record.concluido && record.data_conclusao)
    .map(record=>[Number(record.id_licao),String(record.data_conclusao).slice(0,10)]));
  for (const [key, lesson] of Object.entries(lessons)) {
    if (user !== account) return;
    if (remote.has(lesson.id)) {
      completed.add(key);
      if (confirmed.has(lesson.id) && !journeyEvents().some(event=>event.tipo==='conclusao' && event.tema===key)) {
        user.journey = [...journeyEvents().slice(-359),{tipo:'conclusao',tema:key,dia:confirmed.get(lesson.id)}];
      }
    }
    else if (completed.has(key)) await api('/progresso', { data: { id_usuario: account.id_usuario, id_licao: lesson.id, concluido: true } });
  }
  if (user === account) saveUser();
}

function library() {
  view('Aulas e biblioteca', `<div class="library-filters"><label>Buscar aula <input id="search" type="search" placeholder="Ex.: WhatsApp"></label>
    <label>Assunto <select id="filter-module"><option value="">Todos</option>${[...new Set(Object.values(modules))].map(module => '<option>' + esc(module) + '</option>').join('')}</select></label>
    <label>Situação <select id="filter-completion"><option value="">Todas</option><option value="pending">Para fazer</option><option value="done">Concluídas</option></select></label></div>
    <p id="search-count" aria-live="polite"></p><div id="library-grid" class="grid"></div>`, 'Escolha um assunto ou baixe o material para consultar depois.');
  filterLibrary('');
}

function normalize(value) {
  return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function filterLibrary(value) {
  const subject = document.querySelector('#filter-module').value;
  const status = document.querySelector('#filter-completion').value;
  const matches = Object.entries(lessons).filter(([key, lesson]) =>
    (!subject || modules[key] === subject) && (!status || (status === 'done') === completed.has(key)) &&
    normalize([lesson.title, lesson.description, modules[key]].join(' ')).includes(normalize(value.trim())));
  document.querySelector('#search-count').textContent = matches.length ? matches.length + ' aula(s) encontrada(s)' : 'Nenhuma aula encontrada. Tente outro assunto.';
  document.querySelector('#library-grid').innerHTML = matches.map(([key, lesson]) => card(lesson.title, `
    <p class="badge">${esc(modules[key])}</p><p>${esc(lesson.description)}</p>
    <p>${completed.has(key) ? 'Concluída' : lesson.steps.length + ' passos · ' + esc(lesson.difficulty)}</p>
    <div class="actions">${link('aula/' + key, 'Abrir aula', true)}<button data-action="download" data-key="${key}">Baixar guia</button></div>`)).join('');
}

function lessonPage(key, focus = false) {
  journeyStepStarted = performance.now();
  const lesson = lessons[key];
  const [label, icon, description] = lesson.steps[step];
  view(lesson.title, `<p>${link('aulas', 'Voltar às aulas')}</p>` + card(label, `
    <p class="badge">Passo ${step + 1} de ${lesson.steps.length}</p>
    <progress aria-label="Etapas da aula" max="${lesson.steps.length}" value="${step + 1}"></progress>
    <p class="decorative" aria-hidden="true">${icon}</p><p>${esc(description)}</p>
    <p class="guided-lesson-tip">Leia este passo com calma. Quando estiver pronto, toque em Próximo passo.</p>
    <div class="actions">${step ? '<button data-action="prev-step">Passo anterior</button>' : ''}
    <button class="primary" data-action="next-step">${step + 1 === lesson.steps.length ? 'Concluir aula' : 'Próximo passo'}</button>
    <button data-action="lesson-help">Pedir ajuda à Aurora</button></div>`), lesson.description);
  if (focus) {
    const title = main.querySelector('h2');
    title.tabIndex = -1;
    title.focus();
    if (settings['auto-read']) speak(main.querySelector('.card').innerText);
  }
}

function practice() {
  const icons = [['💬','WhatsApp'], ['📷','Câmera'], ['☎️','Telefone'], ['⚙️','Configurações'], ['🖼️','Galeria'], ['🏦','Banco']];
  const ordered = icons.slice(iconRound).concat(icons.slice(0, iconRound));
  view('Praticar com segurança', card('Encontre o WhatsApp', `<p>Selecione o ícone do WhatsApp.</p><div class="actions">
    ${ordered.map(([icon, name]) => `<button data-action="icon" data-key="${name}" aria-label="${name}">${icon}</button>`).join('')}
    <button data-action="new-round">Novo treino</button></div><p id="icon-feedback" role="status"></p>`) +
    card('Avaliação de segurança digital', exercises.map((item, index) => `<form id="exercise-${index}" class="card"><fieldset>
    <legend>${esc(item.theme)}</legend><p>${esc(item.scenario)}</p>
    ${item.choices.map((choice, itemIndex) => `<label class="option"><input type="radio" name="choice" value="${itemIndex}" required>${esc(choice)}</label>`).join('')}</fieldset>
    <button class="primary">Conferir resposta</button><p class="feedback" role="status"></p></form>`).join('')),
    'Todos os exemplos fazem parte do exercício. Nenhuma mensagem ou transferência é enviada.');
}

const securityTips = [
  'Guarde suas senhas e códigos. Use uma senha diferente em cada serviço.',
  'Desconfie de urgência, prêmios e pedidos inesperados de transferência.',
  'Procure aplicativos na loja do seu dispositivo e confira o desenvolvedor.',
  'Antes de confirmar um PIX, leia o nome, o banco e o valor.'
];
function tutorEntry(entry) {
  return '<div class="tutor-entry"><strong>' + esc(entry.who) + '</strong><p class="tutor-text">' + esc(entry.text) + '</p>' +
    (entry.lesson && Object.hasOwn(lessons,entry.lesson) ? link('aula/'+entry.lesson,'Ver aula: '+lessons[entry.lesson].title) : '') + '</div>';
}

function refreshAuroraRecommendation() {
  const target = document.querySelector('#aurora-recommendation');
  if (!target) return;
  const pattern = AuroraPerfil.recurring(user.auroraLearning,Jornada.day());
  const name = pattern && AuroraGuia.name(pattern.topic);
  target.textContent = name ? 'Você voltou a perguntar sobre “' + name + '”. Vale revisar esse tema com calma.' : '';
}

function aurora() {
  const next = recommendation();
  const review = reviewTheme();
  const contextKey = route().split('/')[1];
  const contextual = Object.hasOwn(lessons,contextKey) ? lessons[contextKey] : null;
  view('Aurora IA', card('Sua trilha hoje', `<p>${next ? 'Aula sugerida: ' + esc(lessons[next].title) : 'Você concluiu a trilha. Continue praticando.'}</p>
    ${review ? '<p>Se quiser revisar um tema, comece por ' + esc(review.toLowerCase()) + '.</p>' : ''}
    ${user.level?.startsWith('Iniciante') ? '<p>Experimente letras grandes ou leitura em voz alta no menu Acessibilidade.</p>' : ''}
    ${next ? link('aula/' + next, 'Abrir aula recomendada') : link('praticar', 'Abrir exercícios')}`) +
    (contextual ? card('Vamos revisar ' + contextual.title, '<ol class="history">' + contextual.steps.map(item => '<li><strong>' + esc(item[0]) + '</strong><p>' + esc(item[2]) + '</p></li>').join('') + '</ol>' + link('aula/'+contextKey,'Voltar à aula')) : '') +
    card('Converse com a tutora', `<p>Conte o que você quer fazer. Se souber, diga se usa Android, iPhone, Windows ou Mac.</p>
    <div class="actions tutor-examples" aria-label="Perguntas de exemplo">${['Como ligar a lanterna?','Como aumentar as letras?','Como enviar uma foto no WhatsApp?'].map(question =>
      `<button type="button" data-action="tutor-example" data-key="${esc(question)}">${esc(question)}</button>`).join('')}</div>
    <div id="conversation" role="log" aria-label="Conversa com Aurora">${chat.map(tutorEntry).join('')}</div>
    <form id="tutor"><label>Sua pergunta<input required maxlength="300" name="message" placeholder="Exemplo: ligar a lanterna no Samsung"></label>
    <label id="aurora-local-choice" class="option" hidden><input type="checkbox" name="modelo"> Usar o modelo local da instituição. Evite informações pessoais.</label>
    <div class="actions"><button class="primary">Perguntar</button><button id="voice-start" type="button">Ditar pergunta</button></div><p id="aurora-pending" role="status"></p></form>
    <p><button type="button" data-action="aurora-summary">Resumir meu progresso</button> <button type="button" data-action="aurora-exercise">Sugerir exercício</button>
    <button type="button" data-action="aurora-read">Ouvir a última orientação</button></p><div id="aurora-response"></div>`) +
    card('Personalização opcional', `<label class="option"><input type="checkbox" id="aurora-learning" ${user.auroraLearning?.enabled?'checked':''}> Lembrar os assuntos que eu pergunto neste aparelho</label>
      <p class="muted">A Aurora guarda apenas os assuntos, a quantidade e a data. Desmarque para apagar esse histórico.</p><p id="aurora-recommendation" role="status"></p>`));
  refreshAuroraRecommendation();
  if (user.id_usuario && navigator.onLine) {
    const choice = document.querySelector('#aurora-local-choice');
    api('/acesso/configuracao').then(config=>{ if (choice.isConnected && config.auroraLocal) choice.hidden = false; }).catch(()=>{});
  }
}

function profile() {
  view('Meu perfil', card(user.name || 'Complete seu diagnóstico', `
    ${user.photo?.startsWith('data:image/jpeg;base64,') ? `<img class="avatar" src="${esc(user.photo)}" alt="Foto do participante" loading="lazy" decoding="async">` : ''}
    <p>Nível: ${esc(user.level || 'A descobrir')}</p>${progress()}
    ${user.name ? '<label>Foto do perfil neste dispositivo <input id="photo" type="file" accept="image/jpeg,image/png,image/webp"></label>' : ''}
    <p class="actions">${link('diagnostico', user.name ? 'Refazer diagnóstico' : 'Começar diagnóstico', true)} ${link('ativar', 'Usar código do instrutor')}</p>`) +
    card('Histórico e conquistas', `<ul>${[...completed].map(key => `<li>${esc(lessons[key].title)} concluída</li>`).join('') || '<li>Suas aulas concluídas aparecerão aqui.</li>'}
    ${completed.size ? '<li>Medalha Primeira Aula</li>' : ''}${completed.size === 4 ? '<li>Medalha Trilha Completa</li>' : ''}
    ${attempts.some(item => item.correta) ? '<li>Medalha Prática Digital</li>' : ''}</ul>`) +
    confidencePanel() + progressTimeline() + companionPreferences() + '<div id="student-details"></div><div id="study-details"></div>' +
    (user.id_usuario ? card('Meus dados', '<a href="/participante/dados" download>Baixar cópia dos meus dados de estudo</a>') : ''));
  displayStudy(true);
  return loadStudent('perfil');
}

function percentage(data) {
  return Number(data.total) ? Math.round(100 * Number(data.presentes) / Number(data.total)) + '%' : 'Sem registros';
}

function notificationTotals(data) {
  return { aviso: data.avisos[0]?.id_aviso || 0, resposta: data.respostas[0]?.id_resposta || 0 };
}

function updateNotificationLink(data) {
  if (data.certificados?.length && !user.certified) {
    user.certified = true;
    saveUser();
    if (['conquistas','perfil'].includes(route())) celebrate('Parabéns! Seu primeiro certificado foi emitido.');
  }
  const latest = notificationTotals(data);
  const seen = user.avisosVistos || {};
  const unread = latest.aviso > (seen.aviso || 0) || latest.resposta > (seen.resposta || 0);
  const link = document.querySelector('nav a[href="#agenda"]');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const deadline = [tomorrow.getFullYear(), String(tomorrow.getMonth()+1).padStart(2,'0'), String(tomorrow.getDate()).padStart(2,'0')].join('-');
  const soon = data.agenda.some(event => event.dia <= deadline);
  link.textContent = unread ? 'Agenda e avisos · Novidades' : soon ? 'Agenda e avisos · Aula próxima' : 'Agenda e avisos';
}

async function refreshNotifications() {
  if (!user.id_usuario) return;
  const id = user.id_usuario;
  try {
    const data = await studentData();
    if (user.id_usuario === id) updateNotificationLink(data);
  } catch { /* A agenda oferece o estado de indisponibilidade. */ }
}

function dateBR(value) {
  return String(value).slice(0, 10).split('-').reverse().join('/');
}

async function loadStudent(page) {
  const target = document.querySelector('#student-details');
  if (!user.id_usuario) {
    target.innerHTML = card('Agenda e informações da turma', '<p>Conclua seu cadastro para acessar os registros da turma.</p>');
    return;
  }
  target.innerHTML = skeleton('Carregando dados da turma…');
  try {
    const data = await studentData();
    if (!target.isConnected) return;
    if (page === 'agenda') {
      user.avisosVistos = notificationTotals(data);
      saveUser();
    }
    updateNotificationLink(data);
    target.innerHTML = page === 'perfil'
      ? card('Frequência e certificados', `<p>Frequência: ${percentage(data.frequencia)}</p>${data.certificados.map(cert => `<p>Emitido em ${esc(dateBR(cert.emitido_em))}.</p><a class="button primary" href="/participante/certificado/${encodeURIComponent(cert.codigo)}">Baixar certificado em PDF</a> <button data-action="certificate" data-key="${esc(cert.codigo)}" data-date="${esc(cert.emitido_em)}">Versão em texto</button>`).join('') || '<p>O certificado é emitido após a conclusão das quatro aulas com o progresso registrado.</p>'}`)
      : card('Próximas atividades', data.agenda.map(item => `<p><strong>${esc(dateBR(item.dia))}</strong> · ${esc(item.titulo)} · ${esc(item.turma)}</p>`).join('') || '<p>Nenhuma atividade futura na sua agenda.</p>') +
        card('Mural de avisos', data.avisos.map(item => `<h3>${esc(item.titulo)}</h3><p>${esc(item.texto)}</p>`).join('') || '<p>Nenhum aviso publicado.</p>') +
        card('Respostas da equipe', data.respostas.map(item => `<h3>${esc(dateBR(item.criada_em))}</h3><p>Seu pedido: ${esc(item.mensagem)}</p><p>Resposta: ${esc(item.texto)}</p>`).join('') || '<p>Nenhuma resposta disponível.</p>');
  } catch {
    if (target.isConnected) target.innerHTML = card('Registros da turma', '<p>Os dados estão indisponíveis. Tente novamente ou peça ajuda ao instrutor.</p>');
  }
}

function help() {
  view('Central de ajuda', card('Solicite apoio', `<form id="help-message">
    <label>Como podemos ajudar?<textarea name="mensagem" maxlength="1000" required></textarea></label>
    <button class="primary">Enviar pedido de ajuda</button></form><p>${link('agenda', 'Consultar respostas da equipe')}</p>`) +
    card('Dúvidas frequentes', `<details><summary>Como aumentar as letras?</summary><p>Abra Acessibilidade no topo e escolha o tamanho de letra que preferir.</p></details>
    <details><summary>Como recebo meu certificado?</summary><p>Conclua as quatro aulas e consulte Meu perfil.</p></details>
    <details><summary>Como posso praticar?</summary><p>Abra Praticar para testar o que aprendeu com exemplos fictícios.</p></details>`) +
    card('Envie uma sugestão', `<form id="suggestion"><label>O que você gostaria de aprender?<textarea name="mensagem" required maxlength="1000"></textarea></label>
    <button>Enviar sugestão</button></form>`));
}

function select(name, label, items) {
  return `<label>${label}<select name="${name}" required><option value="">Selecione</option>${items.map(([value, title]) => `<option value="${esc(value)}">${esc(title)}</option>`).join('')}</select></label>`;
}

function instructorForm(action, fields) {
  return `<form data-instructor="${action}">${fields}<button class="primary">Salvar</button></form>`;
}

function instructorView() {
  view('Área do instrutor', card('Acesso institucional', `<form id="instructor-login"><label id="staff-user" hidden>Usuário<input name="user" maxlength="32" autocomplete="username"></label><label>Chave de acesso<input type="password" name="key" required autocomplete="current-password"></label>
    <label id="staff-code" hidden>Código do autenticador<input name="code" inputmode="numeric" pattern="[0-9]{6}" autocomplete="one-time-code"></label>
    <button class="primary">Abrir painel</button></form>`) + '<div id="instructor-details"></div>');
  const field = document.querySelector('#staff-code');
  api('/acesso/configuracao').then(config => {
    if (field.isConnected && config.segundoFatorInstrutor) {
      field.hidden = false;
      field.querySelector('input').required = true;
    }
    const userField = document.querySelector('#staff-user');
    if (field.isConnected && userField && config.contasIndividuais) {
      userField.hidden = false;
      userField.querySelector('input').required = true;
    }
  }).catch(() => { if (field.isConnected) field.hidden = false; });
  if (instructorKey) return loadInstructor();
}

async function loadInstructor() {
  const target = document.querySelector('#instructor-details');
  target.innerHTML = skeleton('Carregando painel…');
  try {
    const requests = [
      api('/instrutor', { instructor: true }),
      api('/ajuda', { instructor: true }),
      api('/sugestoes', { instructor: true })
    ];
    const [data, helps, suggestions] = await Promise.all(requests);
    if (!target.isConnected) return;
    const { alunos, turmas, encontros } = data;
    const students = select('id_usuario', 'Participante', alunos.map(a => [a.id_usuario, a.nome]));
    const classes = select('id_turma', 'Turma', turmas.map(t => [t.id_turma, t.nome]));
    const meetings = select('id_encontro', 'Encontro', encontros.map(e => [e.id_encontro, e.titulo + ' · ' + dateBR(e.dia)]));
    const total = alunos.length;
    const completion = total && data.aulas ? Math.round(alunos.reduce((sum, a) => sum + Number(a.concluidas), 0) * 100 / (total * data.aulas)) + '%' : 'Sem registros';
    const inbox = (items, kind) => card(kind, items.map(item => `<p><strong>${esc(alunos.find(a => a.id_usuario === item.id_usuario)?.nome || 'Participante ' + item.id_usuario)}</strong> · ${esc(item.mensagem)}</p>`).join('') || '<p>Nenhum registro.</p>');
    target.innerHTML = `<div class="grid">${metric(total, 'Participantes cadastrados')}${metric(percentage(data.frequencia), 'Frequência registrada')}${metric(completion, 'Aulas concluídas')}${metric(data.certificados, 'Certificados emitidos')}${metric(data.aurora, 'Consultas à Aurora em 30 dias')}</div>` +
      card('Evolução dos participantes', '<form id="student-search" class="search-line"><label>Buscar por nome<input name="busca" type="search" maxlength="100"></label><button>Buscar</button></form><div id="student-page"></div>') +
      card('Pontos para acompanhar', `<p>${alunos.filter(a => !a.ultima_aula || new Date(a.ultima_aula.replace(' ', 'T')) < new Date(Date.now() - 14 * 86400000)).length} participante(s) sem conclusão registrada nos últimos 14 dias.</p>` +
      `<p>${esc(data.engajamento.ativos)} participante(s) estudaram na plataforma nos últimos 14 dias. ${esc(studyMinute(data.engajamento.segundos))} no total.</p>` +
      (data.dificuldades.map(d => `<p>${esc(d.tema)} · ${esc(d.erros)} erros em ${esc(d.tentativas)} tentativas</p>`).join('') || '<p>Ainda não há respostas registradas nas avaliações.</p>')) +
      card('Evolução por turma', turmas.map(t => {
        const ids = new Set(data.matriculas.filter(m => m.id_turma === t.id_turma).map(m => m.id_usuario));
        const members = alunos.filter(a => ids.has(a.id_usuario));
        const count = members.reduce((sum,a) => sum + Number(a.concluidas),0);
        return `<div class="chart-row"><strong>${esc(t.nome)}</strong><p>${ids.size} matrícula(s) · ${count} aula(s) concluída(s)</p>
        ${members.length && data.aulas ? `<progress aria-label="Aulas concluídas em ${esc(t.nome)}" max="${Math.max(count,members.length * data.aulas)}" value="${count}"></progress>` : ''}</div>`;
      }).join('') || '<p>Nenhuma turma cadastrada.</p>') +
      card('Relatórios pedagógicos', '<div class="actions"><button data-action="report" data-key="pdf">Baixar PDF</button><button data-action="report" data-key="xlsx">Baixar Excel</button></div>') +
      card('Engajamento e dificuldades', '<div id="executive-journey"><p role="status">Carregando indicadores…</p></div>') +
      card('Moderação da comunidade', '<details id="moderation-section"><summary>Ver publicações</summary><div id="moderation-list"></div></details>') +
      card('Auditoria administrativa', '<button data-action="audit">Consultar operações recentes</button><div id="audit-events"></div>') +
      card('Central de mensagens familiares', '<details id="family-inbox-section"><summary>Ver conversas</summary><div id="family-inbox"></div></details>') +
      card('Cadastrar aluno', instructorForm('alunos', '<label>Nome completo<input name="nome" maxlength="100" required></label>')) +
      card('Cadastrar turma', instructorForm('turmas', '<label>Nome da turma<input name="nome" maxlength="100" required></label>')) +
      card('Matricular aluno', instructorForm('matriculas', students + classes)) +
      card('Encerrar matrícula', instructorForm('encerrar-matricula', students + classes + '<p>As presenças anteriores permanecem no histórico.</p>')) +
      card('Emitir certificado', instructorForm('certificados', students + '<p>Disponível para participantes que concluíram as quatro aulas.</p>')) +
      card('Gerar código de acesso', '<p>Entregue o código pessoalmente ao participante. Ele vale por 24 horas e só pode ser usado uma vez.</p>' + instructorForm('convites', students) + '<p id="invite-code" role="status"></p>') +
      card('Agendar encontro', instructorForm('encontros', classes + '<label>Título<input name="titulo" maxlength="120" required></label><label>Data<input type="date" name="dia" required></label>')) +
      card('Registrar presença', instructorForm('presencas', students + meetings + select('presente', 'Registro', [['true', 'Presente'], ['false', 'Ausente']]))) +
      card('Observações pedagógicas', instructorForm('observacoes', students + '<label>Observação<textarea name="texto" required maxlength="1000"></textarea></label>') + data.observacoes.map(o => `<p><strong>${esc(o.nome)}</strong> · ${esc(o.texto)}</p>`).join('')) +
      card('Publicar aviso', instructorForm('avisos', '<label>Título<input name="titulo" required maxlength="120"></label><label>Aviso<textarea name="texto" required maxlength="1000"></textarea></label>')) +
      inbox(helps, 'Pedidos de ajuda') +
      (helps.length ? card('Responder a um pedido', instructorForm('respostas', select('id_pedido', 'Pedido', helps.map(item => [item.id_pedido, '#' + item.id_pedido + ' · ' + item.mensagem.slice(0, 65)])) + '<label>Resposta<textarea name="texto" required maxlength="1000"></textarea></label>')) : '') +
      inbox(suggestions, 'Sugestões') +
      '<p><button data-action="instructor-logout">Fechar painel</button></p>';
    deferPanel('#family-inbox-section','#family-inbox',loadFamilyInbox,'Carregando conversas…');
    loadStudentPage();
    loadExecutiveJourney();
    deferPanel('#moderation-section','#moderation-list',loadModeration,'Carregando publicações…');
  } catch (error) {
    if (error.status === 401) instructorKey = '';
    if (target.isConnected) target.innerHTML = card('Painel indisponível', `<p>${esc(error.message)}</p>`);
  }
}

function applySettings() {
  const root = document.documentElement;
  root.style.fontSize = (settings['font-size'] || '100') + '%';
  document.querySelector('#font-percent').textContent = (settings['font-size'] || '100') + '%';
  for (const id of ['contrast', 'simple', 'auto-read', 'sound', 'ultra', 'dyslexic']) {
    root.toggleAttribute('data-' + id, Boolean(settings[id]));
    document.getElementById(id).checked = Boolean(settings[id]);
  }
  document.getElementById('font-size').value = settings['font-size'] || '100';
  document.getElementById('journey-mode').value = settings['journey-mode'] || 'auto';
  applyJourneyMode();
}

function stopReading() {
  window.speechSynthesis?.cancel();
  document.querySelector('#read').textContent = 'Ouvir página';
}

function speak(text) {
  if (!('speechSynthesis' in window)) return notify('Este navegador não oferece leitura em voz alta.');
  stopReading();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  const portugueseVoice = window.speechSynthesis.getVoices().find(voice => /^pt[-_]BR$/i.test(voice.lang));
  if (portugueseVoice) utterance.voice = portugueseVoice;
  utterance.rate = .88;
  const button = document.querySelector('#read');
  button.textContent = 'Parar leitura';
  utterance.onend = utterance.onerror = () => { button.textContent = 'Ouvir página'; };
  speechSynthesis.speak(utterance);
}

let audio;
function chime() {
  if (!settings.sound || !window.AudioContext) return;
  try {
    audio ||= new AudioContext();
    audio.resume().catch(() => {});
    const tone = audio.createOscillator();
    const gain = audio.createGain();
    const time = audio.currentTime;
    tone.frequency.value = 620;
    gain.gain.setValueAtTime(.06, time);
    gain.gain.exponentialRampToValueAtTime(.001, time + .18);
    tone.connect(gain).connect(audio.destination);
    tone.start(time);
    tone.stop(time + .18);
  } catch { /* O som é opcional. */ }
}

function download(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function route() {
  return location.hash.slice(1) || 'inicio';
}

function render() {
  generation++;
  recognition?.abort();
  stopStudy();
  stopReading();
  const target = route();
  const [page, key] = target.split('/');
  for (const anchor of document.querySelectorAll('nav a')) {
    const current = anchor.hash === '#' + (page === 'aula' ? 'aulas' : page);
    if (current) anchor.setAttribute('aria-current', 'page');
    else anchor.removeAttribute('aria-current');
  }
  if (staticDemo && ['familia','instrutor','comunidade','agenda','ativar','certificado'].includes(page)) {
    view('Recurso institucional',card('Disponível na versão com servidor',
      '<p>Nesta demonstração você pode experimentar o diagnóstico, as aulas, os exercícios e a Aurora.</p>' + link('inicio','Voltar ao início',true)));
    main.focus();
    return;
  }
  switch (page) {
    case 'inicio': home(); break;
    case 'conquistas': achievementPage(); break;
    case 'tour': tourStep = 0; tourPage(); break;
    case 'comunidade': communityView(); break;
    case 'guia': voiceGuide(); break;
    case 'familia': familyView(); break;
    case 'certificado': validateCertificate(key); break;
    case 'diagnostico': diagnose(); break;
    case 'ativar': view('Ativar meu acesso', card('Código da instituição', '<form id="activate-account"><label>Código de acesso<input name="codigo" required minlength="32" maxlength="32" autocomplete="off"></label><button class="primary">Ativar acesso</button></form>'), 'Digite o código entregue pelo seu instrutor.'); break;
    case 'aulas': library(); break;
    case 'aula':
      if (!Object.hasOwn(lessons, key)) { library(); break; }
      step = 0;
      lessonPage(key);
      startStudy(lessons[key].id);
      break;
    case 'praticar': practice(); break;
    case 'seguranca': view('Segurança digital', card('Cuidados do dia a dia', '<ul>' + securityTips.map(tip => '<li>' + esc(tip) + '</li>').join('') + '</ul>' + link('praticar', 'Praticar segurança'))); break;
    case 'aurora': aurora(); break;
    case 'perfil': profile(); break;
    case 'agenda':
      view('Agenda e avisos', card('Calendário da turma', '<label>Mês <input id="calendar-month" type="month" value="' + esc(selectedMonth) + '"></label><div id="institution-calendar"></div>') + '<div id="student-details"></div>');
      loadCalendar();
      loadStudent('agenda');
      break;
    case 'ajuda': help(); break;
    case 'instrutor': instructorView(); break;
    default: home();
  }
  main.focus();
  document.title = main.querySelector('h1').textContent + ' | Conectados na Melhor Idade';
  if (settings['auto-read']) speak(main.innerText);
}

document.querySelector('#access').addEventListener('click', event => {
  const panel = document.querySelector('#settings');
  panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
  if (!panel.hidden) document.querySelector('#font-size').focus();
});

document.querySelector('#read').addEventListener('click', () => {
  if (speechSynthesisAvailable()) stopReading();
  else speak(main.innerText);
});

function speechSynthesisAvailable() {
  return window.speechSynthesis?.speaking || window.speechSynthesis?.pending;
}

document.querySelector('#settings').addEventListener('change', event => {
  const control = event.target;
  settings[control.id] = control.type === 'checkbox' ? control.checked : control.value;
  applySettings();
  store('preferencias', settings);
  if (control.id === 'auto-read' && !control.checked) stopReading();
  if (control.id === 'sound') chime();
});
document.querySelector('#font-size').addEventListener('input', event => {
  document.querySelector('#font-percent').textContent = event.target.value + '%';
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopStudy();
  else {
    const [page,key] = route().split('/');
    if (page === 'aula' && Object.hasOwn(lessons,key)) {
      journeyStepStarted = performance.now();
      if (!studyClock) startStudy(lessons[key].id);
    }
  }
});

main.addEventListener('input', event => {
  if (event.target.id === 'search') filterLibrary(event.target.value);
});

main.addEventListener('change', async event => {
  if (['filter-module','filter-completion'].includes(event.target.id)) {
    filterLibrary(document.querySelector('#search').value);
    return;
  }
  if (event.target.id === 'calendar-month' && event.target.value) {
    selectedMonth = event.target.value;
    loadCalendar();
    return;
  }
  if (event.target.id !== 'photo') return;
  const file = event.target.files[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    notify('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
    return;
  }
  try {
    const bitmap = await createImageBitmap(file, { resizeWidth: 240 });
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = Math.min(480, bitmap.height);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    user.photo = canvas.toDataURL('image/jpeg', .8);
    if (saveUser()) notify('Foto atualizada neste dispositivo.');
    if (route() === 'perfil') profile();
  } catch { notify('Não foi possível abrir essa imagem.'); }
});

main.addEventListener('click', async event => {
  if (event.target.closest('#voice-start')) return listen();
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, key } = button.dataset;
  switch (action) {
    case 'tutor-example': {
      const input = main.querySelector('#tutor [name="message"]');
      input.value = key;
      input.focus();
      break;
    }
    case 'access-check': runAccessibilityCheck(); break;
    case 'student-page': loadStudentPage(Number(key),true); break;
    case 'share-achievement': await shareProgress(); break;
    case 'tour-back': tourStep = Math.max(0,tourStep-1); tourPage(); main.focus(); break;
    case 'tour-next':
      if (tourStep < 3) { tourStep++; tourPage(); main.focus(); }
      else { user.tourDone = true; saveUser(); notify('Passeio concluído. Você pode voltar pelo Guia e voz.'); location.hash = 'inicio'; }
      break;
    case 'lesson-help': location.hash = 'aurora/' + route().split('/')[1]; break;
    case 'report':
      button.disabled = true;
      try { await saveReport(key); }
      catch (error) { notify(error.message); }
      finally { button.disabled = false; }
      break;
    case 'audit':
      button.disabled = true;
      try {
        const events = await api('/instrutor/auditoria',{instructor:true});
        if (button.isConnected) document.querySelector('#audit-events').innerHTML = events.length
          ? '<ul class="history">' + events.map(item => '<li>' + esc(item.instrutor) + ' · ' + esc(item.acao) + ' · ' + esc(dateBR(item.ocorrido_em)) + '</li>').join('') + '</ul>'
          : '<p>Nenhuma operação registrada.</p>';
      } catch(error) { notify(error.message); }
      finally { button.disabled = false; }
      break;
    case 'family-revoke':
      button.disabled = true;
      try {
        await api('/participante/familia/revogar',{data:{ id_acesso:Number(key) }});
        notify('Acesso familiar encerrado.');
        if (button.isConnected) await loadFamilyInvites();
      } catch (error) { notify(error.message); }
      finally { button.disabled = false; }
      break;
    case 'family-exit':
      try { await api('/familia/sair',{ data:{} }); if (button.isConnected) familyView(); }
      catch (error) { notify(error.message); }
      break;
    case 'aurora-summary': showAuroraSummary(); break;
    case 'aurora-exercise': showAuroraExercise(); break;
    case 'aurora-read': {
      const output = document.querySelector('#aurora-response').innerText.trim();
      const last = [...chat].reverse().find(entry=>entry.who==='Aurora');
      if (output || last) speak(output || last.text);
      else notify('Faça uma pergunta ou peça uma sugestão à Aurora.');
      break;
    }
    case 'previous-question': question--; showQuestion(); break;
    case 'prev-step': step--; lessonPage(route().split('/')[1], true); break;
    case 'next-step': {
      const lessonKey = route().split('/')[1];
      trackJourney('passo',lessonKey,Math.floor((performance.now()-journeyStepStarted)/1000));
      if (step + 1 < lessons[lessonKey].steps.length) {
        step++;
        lessonPage(lessonKey, true);
        return;
      }
      button.disabled = true;
      const newlyCompleted = !completed.has(lessonKey);
      completed.add(lessonKey);
      if (newlyCompleted) trackJourney('conclusao',lessonKey,0);
      if (user.id_usuario) user.progressPending = Date.now();
      const local = saveUser();
      chime();
      syncWithConnection();
      if (local && newlyCompleted) celebrate('Parabéns! Aula concluída. Você ganhou 40 XP.');
      else notify(local ? 'Aula revisada. Parabéns por praticar!' : 'Aula concluída nesta sessão.');
      if (button.isConnected) location.hash = 'inicio';
      break;
    }
    case 'icon': {
      const correct = key === 'WhatsApp';
      document.querySelector('#icon-feedback').textContent = correct ? 'Muito bem! Você encontrou o WhatsApp.' : 'Esse ícone representa ' + key + '. Tente outra vez.';
      if (correct) chime();
      break;
    }
    case 'new-round': iconRound = (iconRound + 1) % 6; practice(); main.querySelector('h2').setAttribute('tabindex', '-1'); main.querySelector('h2').focus(); break;
    case 'download': {
      const lesson = lessons[key];
      download(key + '.txt', lesson.title + '\n\n' + lesson.steps.map(([title, , details], index) => (index + 1) + '. ' + title + '\n' + details).join('\n\n'));
      break;
    }
    case 'certificate': download('certificado-' + key + '.txt', 'Conectados na Melhor Idade\n\nCertificamos que ' + user.name + ' concluiu as quatro aulas da trilha de inclusão digital.\n\nEmissão: ' + dateBR(button.dataset.date) + '\nCódigo: ' + key); break;
    case 'instructor-logout': instructorKey = ''; instructorView(); main.querySelector('input').focus(); break;
  }
});

async function submit(form, data) {
  const renderId = generation;
  if (form.id === 'companion-preferences') {
    const name = data.nome.trim();
    if (!name) return notify('Digite o nome do seu Companheiro.');
    user.companion = {nome:name,avatar:data.avatar};
    if (saveUser()) notify('Companheiro personalizado.');
    return;
  }
  if (form.id === 'student-search') {
    await loadStudentPage(1,true);
    return;
  }
  if (form.id === 'community-post') {
    await api('/comunidade',{data:{titulo:data.titulo,texto:data.texto,revisao:data.revisao==='on'}});
    notify('Publicação enviada para revisão.');
    if (form.isConnected) communityView();
    return;
  }
  if (form.dataset.publication) {
    const result = await api('/instrutor/comunidade',{data:{id_publicacao:Number(form.dataset.publication),estado:data.estado},instructor:true});
    notify(result.mensagem);
    if (form.isConnected) loadModeration();
    return;
  }
  if (form.id.startsWith('family-') || form.id.startsWith('staff-family-')) {
    await institutionalSubmit(form,data);
    return;
  }
  if (form.id === 'activate-account') {
    await api('/ativar', { data });
    const person = await api('/sessao');
    if (user.id_usuario !== person.id_usuario) {
      completed = new Set();
      attempts = [];
      chat = [];
      tutorContext = {};
      store('tentativas', attempts);
      user = {};
    }
    Object.assign(user, { id_usuario: person.id_usuario, name: person.nome, level: person.nivel, score: person.pontuacao });
    saveUser();
    await syncProgress().catch(() => {});
    refreshNotifications();
    notify('Acesso ativado.');
    if (form.isConnected) location.hash = 'inicio';
    return;
  }
  if (form.id === 'diagnostic-name') {
    if (!data.nome.trim()) return notify('Digite seu nome para continuar.');
    user.name = data.nome.trim();
    showQuestion();
    return;
  }
  if (form.id === 'diagnostic-question') {
    answers[question] = Number(data.answer);
    if (question < quizQuestions.length - 1) {
      question++;
      showQuestion();
      return;
    }
    const score = answers.reduce((sum, answer, index) => sum + quizQuestions[index].scores[answer], 0);
    user.score = score;
    user.level = score <= 12 ? 'Iniciante' : score <= 16 ? 'Intermediário' : 'Avançado';
    const local = saveUser();
    view('Seu diagnóstico', card('Seu nível é ' + user.level, `<p>Você marcou ${score} de 20 pontos.</p>
      <p id="profile-status" role="status">Sincronizando cadastro…</p>${link('inicio', 'Abrir minha trilha', true)}`));
    main.focus();
    const feedback = document.querySelector('#profile-status');
    if (staticDemo) {
      feedback.textContent = local ? 'Diagnóstico salvo neste aparelho.' : 'Diagnóstico disponível nesta sessão.';
      return;
    }
    try {
      await syncProfile();
      await syncProgress();
      refreshNotifications();
      if (feedback.isConnected) feedback.textContent = 'Cadastro e progresso sincronizados.';
    } catch (error) {
      if (!feedback.isConnected) return;
      feedback.textContent = [401, 403].includes(error.status)
        ? 'Peça um código ao instrutor para recuperar seu cadastro e sincronizar o diagnóstico.'
        : local ? 'Diagnóstico salvo neste dispositivo. A sincronização com a instituição está pendente.' : 'Diagnóstico disponível nesta sessão. O cadastro não pôde ser salvo.';
    }
    return;
  }
  if (form.id.startsWith('exercise-') || form.id === 'aurora-revision') {
    const item = exercises[form.id === 'aurora-revision' ? Number(form.dataset.exercise) : Number(form.id.split('-')[1])];
    const correta = Number(data.choice) === item.correct;
    user.successfulTopics = [...new Set([...(user.successfulTopics || []),...attempts.filter(a=>a.correta).map(a=>a.tema),...(correta?[item.theme]:[])])];
    attempts = [...attempts.slice(-199), { tema: item.theme, correta, date: Date.now() }];
    store('tentativas', attempts);
    trackJourney('exercicio',item.theme,0);
    form.querySelector('.feedback').textContent = (correta ? 'Você acertou! ' : 'Vamos revisar. ') + item.explanation;
    if (correta) chime();
    queueAssessment(item.theme,Number(data.choice));
    return;
  }
  if (form.id === 'tutor') {
    const message = data.message.trim();
    if (!message) return;
    const reply = AuroraGuia.choose({question:message,context:tutorContext,level:user.level});
    if (reply.explicitTopic && user.auroraLearning?.enabled) {
      user.auroraLearning = AuroraPerfil.record(user.auroraLearning,reply.explicitTopic,Jornada.day());
      saveUser();
      refreshAuroraRecommendation();
    }
    tutorContext = reply.context;
    let answer = reply.text;
    const account = user;
    const pending = form.querySelector('#aurora-pending');
    let generated = false;
    if (reply.topic && data.modelo==='on' && account.id_usuario) {
      pending.textContent = 'Consultando o modelo local…';
      try {
        const result = await api('/aurora/consulta',{data:{tema:reply.topic,pergunta:message,modeloLocal:true}});
        answer = result.orientacao;
        generated = true;
      } catch {
        pending.textContent = 'A Aurora usou o guia do curso nesta resposta.';
      }
      if (generated) pending.textContent = 'Resposta elaborada pelo modelo local da instituição.';
    } else pending.textContent = '';
    if (user !== account || !form.isConnected) return;
    const turn = [{ who: 'Você', text: message }, { who: 'Aurora', text: answer,lesson:reply.lesson }];
    chat = [...chat.slice(-10), ...turn];
    const conversation = document.querySelector('#conversation');
    conversation.insertAdjacentHTML('beforeend', turn.map(tutorEntry).join(''));
    while (conversation.children.length > 12) conversation.firstElementChild.remove();
    form.reset();
    form.elements.message.focus();
    if (settings['auto-read']) speak(answer);
    if (user.id_usuario && !generated) api('/aurora/uso', { data: {} }).catch(() => {});
    return;
  }
  if (form.id === 'instructor-login') {
    const result = await api('/instrutor/entrar',{data:{usuario:data.user.trim(),chave:data.key.trim(),codigo:data.code}});
    if (!form.isConnected) return;
    instructorKey = result.token;
    form.reset();
    await loadInstructor();
    return;
  }
  if (form.dataset.instructor) {
    if (Object.hasOwn(data, 'presente')) data.presente = data.presente === 'true';
    const result = await api('/instrutor/' + form.dataset.instructor, { data, instructor: true });
    if (result.codigo) {
      if (form.isConnected) document.querySelector('#invite-code').textContent = 'Código: ' + result.codigo;
      return;
    }
    notify('Registro salvo.');
    if (renderId === generation) {
      await loadInstructor();
      [...main.querySelectorAll('form[data-instructor]')].find(item => item.dataset.instructor === form.dataset.instructor)?.querySelector('input,select,textarea')?.focus();
    }
    return;
  }
  if (['help-message', 'suggestion'].includes(form.id)) {
    if (!user.name) return notify('Abra Meu perfil e conclua seu cadastro para enviar uma mensagem.');
    if (!user.id_usuario) await syncProfile();
    await api(form.id === 'help-message' ? '/ajuda' : '/sugestoes', { data: { id_usuario: user.id_usuario, mensagem: data.mensagem } });
    form.reset();
    chime();
    notify('Mensagem enviada à equipe do projeto.');
  }
}

main.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('button:not([type=button])');
  button.disabled = true;
  try { await submit(form, Object.fromEntries(new FormData(form))); }
  catch (error) { notify(error.name === 'TypeError' || error.name === 'TimeoutError' ? 'O serviço está indisponível. Tente novamente.' : error.message); }
  finally { button.disabled = false; }
});

window.addEventListener('hashchange', render);
main.addEventListener('change',event=>{
  if (event.target.id!=='aurora-learning') return;
  if (event.target.checked) user.auroraLearning = {enabled:true,items:[]};
  else delete user.auroraLearning;
  saveUser();
  refreshAuroraRecommendation();
});
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); main.focus(); });
applySettings();
document.querySelector('#demo-notice').hidden = !staticDemo;
render();
setupMobileMenu();
setupPWA();
refreshNotifications();
const initialGeneration = generation;
if (user.id_usuario) syncProgress().then(() => {
  if (initialGeneration === generation && route() === 'inicio') home();
}).catch(() => {});
