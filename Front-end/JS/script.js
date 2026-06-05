const API_URL = 'http://localhost:3000';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
  id_usuario: null,
  name: '',
  confidence: 0,
  level: 'Iniciante Total',
  answers: [],
  completedLessons: []
};

const quizQuestions = [
  {question:'O quanto você se sente à vontade em mexer em um celular?',options:['Nunca usei - Sou iniciante total','Uso pouco - Só atendo chamadas','Uso bem - Consigo mandar mensagens','Uso bastante - Fotos, redes sociais e mais'],scores:[1,2,3,4]},
  {question:'Você sabe usar o WhatsApp?',options:['Não sei o que é','Só atendo ligações','Consigo mandar mensagens','Mando fotos, áudios e faço videochamadas'],scores:[1,2,3,4]},
  {question:'Como você lida com fotos no celular?',options:['Não tiro fotos','Consigo tirar, mas não sei enviar','Tiro e envio para contatos','Organizo álbuns e compartilho nas redes'],scores:[1,2,3,4]},
  {question:'Você já fez alguma transação pelo celular?',options:['Nunca - Tenho medo','Já visualizei extrato','Fiz transferência com ajuda','Faço PIX e pagamentos sozinho(a)'],scores:[1,2,3,4]},
  {question:'Como você se sente com tecnologia?',options:['Fico nervoso(a) e evito','Uso só o necessário','Gosto de aprender coisas novas','Adoro tecnologia e sempre quero mais'],scores:[1,2,3,4]}
];

const lessons = {
  whatsapp:{id:1,title:'WhatsApp',icon:'💬',difficulty:'Fácil',description:'Aprenda a mandar mensagens, áudios e fotos para sua família.',steps:[['Abra o WhatsApp no seu celular','💬','Procure o ícone verde com um telefone.'],['Escolha uma conversa','👨‍👩‍👧','Toque no nome da pessoa com quem quer falar.'],['Digite sua mensagem','⌨️','Escreva com calma no campo de texto.'],['Toque em enviar','➡️','O botão geralmente parece uma setinha.']]},
  fotos:{id:2,title:'Tirar e Enviar Fotos',icon:'📸',difficulty:'Fácil',description:'Guarde momentos importantes e compartilhe com quem você ama.',steps:[['Abra a câmera','📷','Procure o ícone de câmera no celular.'],['Aponte para o que quer fotografar','🎯','Segure o celular firme.'],['Toque no botão redondo','⚪','Esse botão tira a foto.'],['Compartilhe pelo WhatsApp','💬','Escolha a foto e toque em compartilhar.']]},
  videochamada:{id:3,title:'Videochamadas',icon:'📹',difficulty:'Médio',description:'Veja filhos, netos e amigos mesmo estando longe.',steps:[['Abra uma conversa','💬','Entre no WhatsApp e escolha a pessoa.'],['Toque na câmera','📹','O ícone fica na parte de cima da conversa.'],['Aguarde a pessoa atender','⏳','Pode demorar alguns segundos.'],['Para encerrar, toque no botão vermelho','🔴','Isso finaliza a chamada.']]}
};

const pixSteps = [
  ['Abra o aplicativo do seu banco','🏦','Nunca abra links recebidos por mensagem para entrar no banco.'],
  ['Toque em PIX','💰','Procure o botão PIX na tela inicial.'],
  ['Escolha Fazer PIX','📤','Essa opção inicia uma transferência.'],
  ['Digite a chave PIX','🔑','Confirme se a chave está correta.'],
  ['Confira nome e valor','✅','Leia tudo com atenção antes de confirmar.'],
  ['Digite sua senha apenas no app oficial','🔒','Nunca informe sua senha para outra pessoa.']
];

let currentQuestionIndex = 0;
let currentPixStep = 0;
let currentLessonKey = null;
let currentLessonStep = 0;

function persist(){localStorage.setItem('currentUser',JSON.stringify(currentUser));}

function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');}
function showAppSection(id, btn){document.querySelectorAll('.app-section').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');}

function saveName(){const name=document.getElementById('userName').value.trim();if(!name){alert('Digite seu nome para continuar.');return;}currentUser.name=name;currentUser.answers=[];persist();startQuiz();}
function startQuiz(){currentQuestionIndex=0;currentUser.answers=[];showScreen('quizScreen');showQuestion();}
function showQuestion(){const q=quizQuestions[currentQuestionIndex];document.getElementById('questionText').textContent=q.question;document.getElementById('questionCounter').textContent=`${currentQuestionIndex+1} de ${quizQuestions.length}`;document.getElementById('progressFill').style.width=`${((currentQuestionIndex+1)/quizQuestions.length)*100}%`;const c=document.getElementById('optionsContainer');c.innerHTML='';q.options.forEach((op,i)=>{const div=document.createElement('div');div.className='option';div.textContent=op;if(currentUser.answers[currentQuestionIndex]===i)div.classList.add('selected');div.onclick=()=>selectOption(div,i);c.appendChild(div);});document.getElementById('prevBtn').style.visibility=currentQuestionIndex===0?'hidden':'visible';document.getElementById('nextBtn').textContent=currentQuestionIndex===quizQuestions.length-1?'Finalizar':'Próxima';}
function selectOption(el,i){document.querySelectorAll('.option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');currentUser.answers[currentQuestionIndex]=i;persist();}
function previousQuestion(){if(currentQuestionIndex>0){currentQuestionIndex--;showQuestion();}}
function nextQuestion(){if(currentUser.answers[currentQuestionIndex]===undefined){alert('Selecione uma opção.');return;}if(currentQuestionIndex<quizQuestions.length-1){currentQuestionIndex++;showQuestion();}else showQuizResult();}

async function showQuizResult(){let total=0;currentUser.answers.forEach((a,i)=>total+=quizQuestions[i].scores[a]);let level,msg;if(total<=8){level='Iniciante Total';msg='Vamos começar do básico, passo a passo.';}else if(total<=12){level='Iniciante';msg='Você já tem uma base. Vamos praticar mais.';}else if(total<=16){level='Intermediário';msg='Você já sabe bastante. Vamos avançar.';}else{level='Avançado';msg='Você domina bem o celular. Vamos explorar funções extras.';}currentUser.level=level;currentUser.confidence=Math.round(((total-5)/15)*100);persist();document.getElementById('userNameDisplay').textContent=currentUser.name;document.getElementById('userScore').textContent=`${total}/20`;document.getElementById('resultMessage').textContent=msg;showScreen('resultScreen');await saveUserToApi(total,level);}

async function saveUserToApi(total,level){const status=document.getElementById('apiStatus');try{const r=await fetch(`${API_URL}/usuarios`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:currentUser.name,nivel:level,pontuacao:total})});const data=await r.json();if(!r.ok)throw new Error(data.message||'Erro ao salvar');currentUser.id_usuario=data.id_usuario;persist();status.textContent='Dados salvos no banco com sucesso.';status.style.color='#067647';}catch(e){status.textContent='O app abriu, mas não conseguiu salvar no banco. Verifique se o back-end está ligado.';status.style.color='#b42318';}}

async function startApp(){await loadProgressFromApi();const first=currentUser.name.split(' ')[0]||'usuário';document.getElementById('userGreeting').textContent=`Olá, ${first}! Seu nível: ${currentUser.level}`;document.getElementById('metricLevel').textContent=currentUser.level;document.getElementById('metricScore').textContent=`${currentUser.confidence}%`;document.getElementById('metricDone').textContent=currentUser.completedLessons.length;document.getElementById('nextSuggestion').textContent=currentUser.level.includes('Iniciante')?'Comece pelo WhatsApp e depois pratique fotos.':'Experimente PIX e dicas de segurança digital.';renderLessons();startPractice();showScreen('appScreen');showAppSection('dashboard',document.querySelector('.nav-btn'));}
function restartQuiz(){if(confirm('Deseja refazer o questionário?')){showScreen('nameScreen');}}

function renderLessons(){const c=document.getElementById('lessonCards');c.innerHTML='';Object.entries(lessons).forEach(([key,l])=>{const done=currentUser.completedLessons.includes(key);const card=document.createElement('article');card.className='learning-card';card.onclick=()=>openLesson(key);card.innerHTML=`<span>${l.icon}</span><h3>${l.title} ${done?'✅':''}</h3><span class="difficulty">${l.difficulty}</span><p>${l.description}</p>`;c.appendChild(card);});}
function openLesson(key){currentLessonKey=key;currentLessonStep=0;showAppSection('lessonSection');updateLessonStep();}
function updateLessonStep(){const l=lessons[currentLessonKey];const s=l.steps[currentLessonStep];document.getElementById('lessonTitle').textContent=l.title;document.getElementById('lessonDescription').textContent=l.description;document.getElementById('lessonVisual').innerHTML=`<div class="big">${s[1]}</div><strong>${s[0]}</strong><p>${s[2]}</p>`;document.getElementById('lessonStepText').textContent=`Passo ${currentLessonStep+1} de ${l.steps.length}`;document.getElementById('lessonNextBtn').textContent=currentLessonStep===l.steps.length-1?'Concluir aula':'Próximo';}
function previousLessonStep(){if(currentLessonStep>0){currentLessonStep--;updateLessonStep();}}
async function nextLessonStep(){const l=lessons[currentLessonKey];if(currentLessonStep<l.steps.length-1){currentLessonStep++;updateLessonStep();return;}if(!currentUser.completedLessons.includes(currentLessonKey)){currentUser.completedLessons.push(currentLessonKey);persist();}await saveProgressToApi(l.id);alert('Parabéns! Aula concluída e progresso salvo.');startApp();}

function updatePixStep(){const s=pixSteps[currentPixStep];document.getElementById('pixDisplay').innerHTML=`<div class="big">${s[1]}</div><strong>${s[0]}</strong><p>${s[2]}</p>`;document.getElementById('pixStep').textContent=`Passo ${currentPixStep+1} de ${pixSteps.length}`;}
async function nextPixStep(){if(currentPixStep<pixSteps.length-1){currentPixStep++;updatePixStep();}else{await saveProgressToApi(4);alert('Parabéns! Você concluiu o tutorial de PIX seguro e o progresso foi salvo.');}}
function previousPixStep(){if(currentPixStep>0){currentPixStep--;updatePixStep();}}

function startPractice(){const icons=[['💬','WhatsApp',true],['📷','Câmera',false],['☎️','Telefone',false],['⚙️','Configurações',false],['🖼️','Galeria',false],['🏦','Banco',false]];icons.sort(()=>Math.random()-.5);const c=document.getElementById('practiceIcons');c.innerHTML='';document.getElementById('practiceFeedback').textContent='';icons.forEach(([emoji,name,ok])=>{const b=document.createElement('button');b.className='practice-icon';b.title=name;b.textContent=emoji;b.onclick=()=>{const f=document.getElementById('practiceFeedback');if(ok){f.textContent='Muito bem! Você encontrou o WhatsApp.';f.className='feedback ok';}else{f.textContent=`Esse é ${name}. Tente encontrar o WhatsApp.`;f.className='feedback err';}};c.appendChild(b);});}


async function saveProgressToApi(id_licao){
  if(!currentUser.id_usuario) return;
  try{
    await fetch(`${API_URL}/progresso`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id_usuario:currentUser.id_usuario,id_licao,concluido:true})
    });
  }catch(e){
    console.log('Não foi possível salvar o progresso no banco.', e);
  }
}

async function loadProgressFromApi(){
  if(!currentUser.id_usuario) return;
  try{
    const r=await fetch(`${API_URL}/progresso/${currentUser.id_usuario}`);
    if(!r.ok) return;
    const data=await r.json();
    const lessonMap={1:'whatsapp',2:'fotos',3:'videochamada'};
    data.forEach(item=>{
      const key=lessonMap[item.id_licao];
      if(key && item.concluido && !currentUser.completedLessons.includes(key)){
        currentUser.completedLessons.push(key);
      }
    });
    persist();
  }catch(e){
    console.log('Não foi possível carregar o progresso do banco.', e);
  }
}

async function submitSuggestion(){const txt=document.getElementById('suggestionText').value.trim();const st=document.getElementById('suggestionStatus');if(!txt){alert('Escreva uma sugestão antes de enviar.');return;}try{const r=await fetch(`${API_URL}/sugestoes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_usuario:currentUser.id_usuario||1,mensagem:txt})});if(!r.ok)throw new Error();st.textContent='Sugestão enviada e salva no banco.';st.style.color='#067647';document.getElementById('suggestionText').value='';}catch(e){st.textContent='Sugestão registrada na tela, mas o back-end não respondeu.';st.style.color='#b42318';}}
async function activateHelp(){try{await fetch(`${API_URL}/ajuda`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_usuario:currentUser.id_usuario||1,mensagem:'Usuário solicitou ajuda pelo botão de emergência.'})});alert('Pedido de ajuda registrado no sistema.');}catch(e){alert('Botão de ajuda acionado. Verifique se o back-end está ligado para salvar no banco.');}}

document.addEventListener('DOMContentLoaded',()=>{updatePixStep();renderLessons();if(currentUser.name){document.getElementById('userName').value=currentUser.name;}});
