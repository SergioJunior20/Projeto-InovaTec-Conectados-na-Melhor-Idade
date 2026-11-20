let studyClock;
let recognition;
let familyConversation = 0;
let selectedMonth = new Date().toISOString().slice(0,7);

function studyMinute(seconds) {
  const value = Number(seconds);
  if (!value) return 'Sem tempo registrado';
  if (value < 60) return 'Menos de 1 minuto';
  const minutes = Math.floor(value / 60);
  return minutes >= 60 ? Math.floor(minutes / 60) + ' h ' + minutes % 60 + ' min' : minutes + ' min';
}

function stopStudy() {
  if (!studyClock) return;
  const previous = studyClock;
  studyClock = undefined;
  clearInterval(previous.interval);
  sendStudy(previous);
}

function sendStudy(clock) {
  const now = performance.now();
  const seconds = Math.min(60,Math.floor((now-clock.since)/1000));
  if (seconds < 1 || clock.userId !== user.id_usuario) return;
  clock.since = now;
  queueStudy({ evento:crypto.randomUUID(),id_licao:clock.lessonId,segundos:seconds });
}

function startStudy(lessonId) {
  if (!user.id_usuario || !crypto.randomUUID || document.hidden) return;
  studyClock = { lessonId,userId:user.id_usuario,since:performance.now() };
  studyClock.interval = setInterval(() => { if (studyClock) sendStudy(studyClock); },30000);
}

async function displayStudy(profilePage = false) {
  const target = document.querySelector('#study-details');
  if (!target || !user.id_usuario) return;
  try {
    const data = await api('/participante/estudo');
    if (!target.isConnected) return;
    let content = '<p>' + esc(studyMinute(data.segundos)) + ' nesta plataforma.</p><p>' + esc(data.dias_semana) + ' dia(s) de estudo nesta semana.</p>';
    if (profilePage) {
      content += data.historico.length ? '<ol class="history">' + data.historico.map(x => '<li><strong>' + esc(x.titulo) + '</strong> · ' + esc(dateBR(x.dia)) + ' · ' + esc(studyMinute(x.segundos)) + '</li>').join('') + '</ol>' : '<p>O histórico aparece depois que você estuda com seu cadastro ativo.</p>';
      content += data.avaliacoes.length ? '<h3>Exercícios recentes</h3><ul>' + data.avaliacoes.map(x => '<li>' + esc(x.tema) + ' · ' + (x.correta ? 'Acertou' : 'Para revisar') + ' · ' + esc(dateBR(x.registrada_em)) + '</li>').join('') + '</ul>' : '';
    }
    target.innerHTML = card(profilePage ? 'Histórico de estudos' : 'Meu tempo de estudo',content);
  } catch {
    if (target.isConnected) target.innerHTML = '<p>O histórico de estudos está indisponível agora.</p>';
  }
}

function conversationHTML(items) {
  return items.length ? '<ol class="history">' + items.map(message => '<li><strong>' + (message.autor === 'instrutor' ? 'Instrutor' : 'Familiar') + '</strong> · ' + esc(dateBR(message.enviada_em)) + '<p>' + esc(message.texto) + '</p></li>').join('') + '</ol>' : '<p>Ainda não há mensagens nesta conversa.</p>';
}

async function familyView() {
  view('Área da família', '<div id="family-panel">' + skeleton('Carregando área da família…') + '</div>' +
    (user.id_usuario ? '<div id="family-invites"></div>' : ''));
  const panel = document.querySelector('#family-panel');
  if (user.id_usuario) loadFamilyInvites();
  try {
    const data = await api('/familia/painel');
    if (!panel.isConnected) return;
    panel.innerHTML = card('Acompanhamento de ' + data.aluno.nome, '<p>Olá, ' + esc(data.familiar) + '.</p><p>' + esc(data.concluidas) + ' de 4 aulas concluídas · ' + esc(data.aluno.nivel || 'Nível a descobrir') + '</p><button type="button" data-action="family-exit">Fechar área familiar</button>') +
      card('Aprendizagem na última semana','<p>' + esc(data.estudo.dias) + ' dia(s) de estudo · ' + esc(studyMinute(data.estudo.segundos)) +
        '</p><p>' + (data.medalhas.map(id => id===3?'Tutorial de videochamada':'Treino de PIX seguro').join(' · ') || 'As conquistas aparecem após a conclusão das aulas.') + '</p>') +
      card('Evolução compartilhada',data.historico.length ? '<ol class="history">' + data.historico.map(item=>'<li><strong>' + esc(item.titulo) + '</strong>' +
        (item.dia?' · '+esc(dateBR(item.dia)):'') + '</li>').join('') + '</ol>' : '<p>Os marcos aparecem aqui quando houver aulas concluídas.</p>') +
      (data.mensagensAtivas ? card('Incentivar o participante','<form id="family-encouragement"><label>Mensagem de incentivo<textarea name="texto" required maxlength="300" placeholder="Parabéns por reservar um tempo para aprender!"></textarea></label><button class="primary">Enviar incentivo ao participante</button></form>') : '') +
      card('Mural de incentivos',data.incentivos.length ? '<ul class="history">' + data.incentivos.map(item=>'<li><p>' + esc(item.texto) + '</p><small>' +
        esc(dateBR(item.enviado_em)) + '</small></li>').join('') + '</ul>' : '<p>Envie uma mensagem para celebrar a próxima conquista.</p>') +
      card('Avisos da instituição', data.avisos.map(item => '<h3>' + esc(item.titulo) + '</h3><p>' + esc(item.texto) + '</p>').join('') || '<p>Ainda não há avisos publicados.</p>') +
      card('Conversa com a equipe', conversationHTML(data.mensagens) + (data.mensagensAtivas ? '<form id="family-message"><label>Mensagem<textarea name="texto" required maxlength="800"></textarea></label><button class="primary">Enviar mensagem</button></form>' : '<p>A central de mensagens ainda está em configuração.</p>'));
  } catch(error) {
    if (!panel.isConnected) return;
    panel.innerHTML = error.status === 401 ? card('Entrar com um convite', '<form id="family-activation"><label>Código de acesso<input name="codigo" required minlength="32" maxlength="32" autocomplete="off"></label><button class="primary">Ativar acesso familiar</button></form>') : card('Área indisponível','<p>Tente novamente em instantes.</p>');
  }
}

async function loadFamilyInvites() {
  const target = document.querySelector('#family-invites');
  if (!target) return;
  try {
    const items = await api('/participante/familia');
    if (!target.isConnected) return;
    target.innerHTML = card('Compartilhar meu progresso', '<p>Um familiar de sua escolha poderá ver seu nome, nível e total de aulas. Você pode encerrar o acesso quando quiser.</p>' +
      '<form id="family-invite"><label>Nome do familiar<input name="nome" required maxlength="100"></label><label class="option"><input type="checkbox" name="consentimento" required> Autorizo o compartilhamento dessas informações.</label><button class="primary">Gerar convite de uso único</button><p id="new-family-invite" role="status"></p></form>' +
      items.map(item => '<p>' + esc(item.nome) + ' · ' + (item.revogado_em ? 'Encerrado' : item.ativado ? 'Convite usado' : 'Convite gerado') + '</p>' +
        (!item.revogado_em ? '<button type="button" data-action="family-revoke" data-key="' + esc(item.id_acesso) + '">Encerrar acesso de ' + esc(item.nome) + '</button>' : '')).join(''));
  } catch {
    if (target.isConnected) target.textContent = 'Os convites familiares estão indisponíveis neste momento.';
  }
}

async function loadFamilyInbox() {
  const target = document.querySelector('#family-inbox');
  if (!target) return;
  try {
    const links = await api('/instrutor/familia',{ instructor:true });
    if (!target.isConnected) return;
    if (!links.length) {
      target.innerHTML = '<p>Nenhum vínculo familiar foi ativado.</p>';
      return;
    }
    target.innerHTML = '<form id="staff-family-open">' + select('id','Conversa',links.map(x => [x.id_acesso,x.nome + ' · ' + x.aluno + ' (' + x.mensagens + ' mensagens)'])) + '<button>Abrir conversa</button></form><div id="staff-family-thread"></div>';
    if (links.some(link => link.id_acesso === familyConversation)) await showFamilyThread(familyConversation);
  } catch {
    if (target.isConnected) target.textContent = 'Central familiar indisponível neste momento.';
  }
}

async function showFamilyThread(id, focus = false) {
  const target = document.querySelector('#staff-family-thread');
  if (!target) return;
  const items = await api('/instrutor/familia/' + id,{ instructor:true });
  if (!target.isConnected) return;
  familyConversation = Number(id);
  target.innerHTML = conversationHTML(items) + '<form id="staff-family-send"><label>Resposta<textarea name="texto" required maxlength="800"></textarea></label><button class="primary">Enviar resposta</button></form>';
  if (focus) target.querySelector('textarea').focus();
}

async function institutionalSubmit(form, data) {
  switch(form.id) {
    case 'family-activation':
      await api('/familia/ativar',{data});
      notify('Acesso familiar ativado.');
      if (form.isConnected) await familyView();
      return true;
    case 'family-invite': {
      const result = await api('/participante/familia',{data:{nome:data.nome,consentimento:data.consentimento === 'on'}});
      if (form.isConnected) {
        await loadFamilyInvites();
        const code = document.querySelector('#new-family-invite');
        if (code) code.textContent = 'Código válido por 24 horas: ' + result.codigo;
      }
      return true;
    }
    case 'family-message':
      await api('/familia/mensagens',{data});
      notify('Mensagem enviada.');
      if (form.isConnected) await familyView();
      return true;
    case 'family-encouragement':
      await api('/familia/incentivo',{data});
      form.reset();
      notify('Incentivo enviado ao participante.');
      if (form.isConnected) await familyView();
      return true;
    case 'staff-family-open': await showFamilyThread(data.id,true); return true;
    case 'staff-family-send':
      await api('/instrutor/familia/' + familyConversation,{data,instructor:true});
      notify('Resposta enviada.');
      if (form.isConnected) await showFamilyThread(familyConversation,true);
      return true;
    default: return false;
  }
}

async function saveReport(format) {
  const response = await fetch('/instrutor/relatorios/' + format,{headers:{ Authorization:'Bearer ' + instructorKey }});
  if (!response.ok) throw new Error('Não foi possível baixar o relatório.');
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'acompanhamento.' + format;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}

async function validateCertificate(code) {
  view('Validação de certificado','<div id="certificate-status"><p role="status">Consultando certificado…</p></div>');
  const target = document.querySelector('#certificate-status');
  try {
    const record = await api('/certificados/' + encodeURIComponent(code || ''));
    if (target.isConnected) target.innerHTML = card('Certificado registrado','<p>' + esc(record.curso) + '</p><p>Emissão em ' + esc(dateBR(record.emitido_em)) + '.</p><p>Código ' + esc(record.codigo) + '</p>');
  } catch(error) {
    if (target.isConnected) target.innerHTML = card('Validação indisponível','<p>' + esc(error.message) + '</p>');
  }
}

function voiceGuide() {
  view('Guia de navegação', card('Por onde você quer começar?', '<ol class="history"><li>' + link('diagnostico','Descobrir meu nível') + '</li><li>' + link('aulas','Escolher uma aula') + '</li><li>' + link('praticar','Praticar com segurança') + '</li><li>' + link('agenda','Consultar minha agenda') + '</li></ol>') +
    card('Usar a voz','<p>Ative o microfone e diga “início”, “aulas”, “praticar”, “perfil”, “agenda”, “família”, “Aurora” ou “ouvir página”. Neste navegador, o reconhecimento pode envolver o serviço de voz do fabricante.</p><button id="voice-start" type="button">Ativar microfone</button>') +
    card('Passeio guiado','<p>Conheça quatro ações para começar.</p>' + link('tour','Começar passeio')) +
    card('Verificador desta tela','<button data-action="access-check">Verificar recursos de acesso</button><div id="access-results" aria-live="polite"></div>'));
}

function listen() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return notify('O navegador não oferece reconhecimento de voz. Você pode usar os botões do guia.');
  if (recognition) return recognition.abort();
  const engine = new SpeechRecognition();
  recognition = engine;
  engine.lang = 'pt-BR';
  engine.onend = () => { recognition = undefined; };
  const target = main.querySelector('#tutor input');
  engine.onresult = event => {
    const words = event.results[0][0].transcript.trim();
    if (target?.isConnected) {
      target.value = words;
      target.focus();
      notify('Ditado preenchido. Confira a pergunta antes de enviar.');
      return;
    }
    const command = normalize(words).replace(/[^a-z\s]/g,'').trim().replace(/^(?:ir para|abra|abrir)\s+(?:a |o )?/,'');
    const routes = { inicio:'inicio',aulas:'aulas',praticar:'praticar',perfil:'perfil',agenda:'agenda',familia:'familia',aurora:'aurora',ajuda:'ajuda',conquistas:'conquistas',guia:'guia',passeio:'tour' };
    if (command === 'ouvir pagina') speak(main.innerText);
    else if (Object.hasOwn(routes,command)) location.hash = routes[command];
    else notify('Comando não reconhecido. Veja os exemplos no guia.');
  };
  engine.onerror = event => { if (event.error !== 'aborted') notify('Não foi possível usar o microfone. Confira a permissão do navegador.'); };
  try { engine.start(); notify('Microfone ativado. Pode falar.'); }
  catch { recognition = undefined; notify('O microfone está indisponível.'); }
}

function calendarPage(month, data) {
  const [year,number] = month.split('-').map(Number);
  const date = new Date(year,number-1,1);
  const offset = (date.getDay()+6)%7;
  const days = new Date(year,number,0).getDate();
  const names = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const dates = Array.from({length:days},(_,index) => {
    const day = index+1;
    const key = month + '-' + String(day).padStart(2,'0');
    const events = data.filter(item => item.dia === key);
    return '<div class="calendar-day"><strong>' + day + '</strong>' + events.map(event => '<p>' + esc(event.titulo) + '</p>').join('') + '</div>';
  });
  const title = new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(date);
  return '<h3>' + esc(title) + '</h3><div class="calendar" aria-hidden="true">' + names.map(name => '<div>' + name + '</div>').join('') + '<div></div>'.repeat(offset) + dates.join('') + '</div>' +
    '<h3>Eventos do mês</h3>' + (data.length ? '<ul>' + data.map(item => '<li><strong>' + esc(dateBR(item.dia)) + '</strong> · ' + esc(item.titulo) + ' · ' + esc(item.turma) + '</li>').join('') + '</ul>' : '<p>Nenhum evento neste mês.</p>');
}

async function loadCalendar() {
  const target = document.querySelector('#institution-calendar');
  if (!target) return;
  const month = selectedMonth;
  target.innerHTML = skeleton('Carregando calendário…');
  try {
    const result = await api('/participante/calendario?mes=' + encodeURIComponent(month));
    if (!target.isConnected || month !== selectedMonth) return;
    target.innerHTML = calendarPage(month,result);
  } catch {
    if (target.isConnected && month === selectedMonth) target.textContent = 'Entre com seu cadastro para ver o calendário da turma.';
  }
}

function showAuroraSummary() {
  const next = recommendation();
  const theme = reviewTheme();
  const text = 'Você concluiu ' + completed.size + ' de 4 aulas. ' +
    (next ? 'A próxima sugestão é ' + lessons[next].title + '. ' : 'Sua trilha inicial está completa. ') +
    (theme ? 'Reserve um tempo para revisar ' + theme.toLowerCase() + '.' : 'Continue praticando no seu ritmo.');
  const output = document.querySelector('#aurora-response');
  output.innerHTML = '<p role="status">' + esc(text) + '</p>';
  if (settings['auto-read']) speak(text);
}

function showAuroraExercise() {
  const review = Evolucao.recovery(attempts);
  const count = theme => attempts.filter(item=>item.tema===theme).length;
  const theme = review?.tema || [...exercises].sort((a,b)=>count(a.theme)-count(b.theme))[0].theme;
  const index = exercises.findIndex(item=>item.theme===theme);
  const exercise = Evolucao.challenge(exercises[index],revisionPrompts[theme] || [],count(theme));
  const introductory = !user.level || user.level.startsWith('Iniciante');
  const output = document.querySelector('#aurora-response');
  output.innerHTML = '<form id="aurora-revision" data-exercise="' + index + '"><fieldset><legend>' +
    esc(review?'Revisão de '+theme:'Prática de '+theme) + '</legend><p>' + esc(exercise.scenario) + '</p>' +
    (introductory ? '<p class="muted">Pense em um contato ou aplicativo oficial que você já usou.</p>' : '') +
    exercise.choices.map(({text,canonical})=>'<label class="option"><input type="radio" name="choice" value="' + canonical + '" required>' + esc(text) + '</label>').join('') +
    '</fieldset><button class="primary">Conferir minha resposta</button><p class="feedback" role="status"></p></form>';
  const legend = output.querySelector('legend');
  legend.tabIndex = -1;
  legend.focus();
}
