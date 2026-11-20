(function expose(root) {
  'use strict';

  const controlCenter = 'Abra a Central de Controle. No iPhone sem botão de Início, deslize para baixo do canto superior direito. Se tiver botão de Início, deslize para cima a partir da borda inferior.';
  const quickSettings = 'Deslize o dedo de cima para baixo a partir da borda superior da tela. Se aparecerem poucos botões, deslize para baixo de novo.';
  const guides = {
    governo: {
      name:'Conta e aplicativo gov.br', match:/\bgov[ .-]?br\b|\bmeu inss\b|carteira de trabalho digital|aplicativo do governo|conta do governo/,
      steps:['Digite gov.br diretamente no navegador e use a busca do portal para localizar o serviço, como Meu INSS ou Carteira de Trabalho Digital.','Se o portal pedir acesso, siga o fluxo da conta gov.br. Use o aplicativo oficial indicado no portal ou na loja do aparelho.'],
      help:'Para recuperar o acesso, entre pelo portal oficial, informe o CPF ali e procure “Esqueci minha senha”. Evite enviar CPF, senha ou código por mensagem.',
      example:'Se quiser consultar um serviço do INSS, procure “Meu INSS” na busca do portal oficial antes de entrar na conta.'
    },
    'email-anexo': {
      name:'Enviar um anexo por e-mail', match:/(?:anex|envi)\w*.*(?:e[ -]?mail|gmail).*(?:arquivo|foto|pdf)|(?:anex|arquivo|pdf)\w*.*(?:e[ -]?mail|gmail)|anexo|anexar arquivo/,
      steps:['Abra seu e-mail e toque em Escrever. Preencha o endereço da pessoa e o assunto.','Toque no desenho de um clipe, escolha o arquivo e espere aparecer o nome do anexo. Confira o destinatário antes de enviar.'],
      example:'Para enviar um convite em PDF, escreva a mensagem e procure “convite.pdf” depois de tocar no clipe.'
    },
    email: {
      name:'Enviar um e-mail', match:/\be[ -]?mail\b|\bgmail\b|\boutlook\b|correio eletronico/,
      steps:['Abra o aplicativo ou site oficial do seu e-mail. Toque ou clique em Escrever ou Nova mensagem.','Preencha o endereço da pessoa, escreva um assunto curto e depois a mensagem. Confira e escolha Enviar.'],
      help:'Se uma mensagem esperada não apareceu, confira a pasta Spam. Se houver pedido inesperado de dinheiro ou senha, verifique com a pessoa por outro canal.',
      example:'Use um assunto como “Encontro de sábado” e escreva o horário no corpo do e-mail.'
    },
    pix: {
      name:'Conferir um PIX antes de enviar', match:/\bpix\b|chave aleatoria|transferencia instantanea/,
      steps:['Abra o aplicativo oficial do seu banco e procure a área Pix. Escolha pagar ou transferir e siga os campos que aparecem.','Antes de confirmar, confira nome do destinatário, instituição e valor. Se algum dado estiver diferente, interrompa e confirme com a pessoa por um contato conhecido.'],
      help:'Se o pedido chegou com urgência por mensagem, ligue para o número que você já tinha salvo antes de fazer a transferência.',
      example:'Em uma prática fictícia de R$ 10, confira quem receberia e qual valor aparece na tela final. Pare antes de confirmar.'
    },
    banco: {
      name:'Usar o aplicativo do banco', match:/banco digital|app (?:do )?banco|\bsaldo\b|\bextrato\b|consultar.*\bbanco\b/,
      steps:['Abra o app do banco a partir da tela inicial e use o acesso habitual.','Dentro do app procure Saldo ou Extrato. Se a opção tiver outro nome, use a busca ou o atendimento oficial dentro do app.'],
      help:'Se houver uma cobrança que você não reconhece, entre em contato pelo canal oficial que já conhece. Guarde senhas e códigos para você.'
    },
    'captura-computador': {
      name:'Captura de tela no computador', match:/(?:print|captura|capturar).*\b(?:windows|mac|macbook|computador|notebook)\b|\b(?:windows|mac|macbook|computador|notebook)\b.*(?:print|captura|capturar)/,
      windows:['Pressione Windows + Shift + S.','Escolha a área da tela. Abra a notificação da Ferramenta de Captura para conferir e guardar a imagem.'],
      mac:['Pressione Shift + Command + 3 para capturar a tela inteira.','Para escolher uma área, pressione Shift + Command + 4 e arraste o ponteiro sobre o que quer capturar.']
    },
    arquivos: {
      name:'Encontrar arquivos baixados', match:/arquivos? baixad|\bdownloads?\b|encontrar (?:um |o )?arquivo|pasta de arquivos|onde (?:esta|fica).*(?:pdf|arquivo)/,
      android:['Abra o aplicativo Arquivos ou Meus Arquivos.','Procure a seção Downloads e localize o nome do arquivo.'],
      iphone:['Abra Arquivos e toque em Explorar.','Procure Downloads em iCloud Drive ou no dispositivo, conforme o local escolhido para salvar.'],
      windows:['Abra o Explorador de Arquivos pela barra de tarefas ou pressione Windows + E.','Selecione Downloads e procure o nome do arquivo.'],
      mac:['Abra o Finder.','Selecione Downloads na barra lateral e procure o nome do arquivo.'],
      help:'Se o arquivo não aparecer, confira o histórico de downloads do navegador que você usou.'
    },
    copiar: {
      name:'Copiar e colar', match:/\bcopiar\b|\bcolar\b|\bctrl [cv]\b|\bcommand [cv]\b/,
      android:['Toque e segure sobre o texto, selecione o trecho e toque em Copiar.','No local de destino, toque e segure o campo de texto e escolha Colar.'],
      iphone:['Toque e segure sobre o texto e ajuste a seleção. Escolha Copiar.','No campo de destino, toque para posicionar o cursor e procure Colar no menu.'],
      windows:['Selecione o texto que quer copiar. Pressione Ctrl + C.','Clique no local de destino e pressione Ctrl + V.'],
      mac:['Selecione o texto e pressione Command + C.','Clique no local de destino e pressione Command + V.']
    },
    'encontrar-app': {
      name:'Encontrar um aplicativo no computador', match:/\bfinder\b|menu iniciar|spotlight|(?:abrir|encontrar|achar).*\b(?:app|aplicativo)\b.*\b(?:windows|mac|macbook|computador)\b/,
      windows:['Abra o menu Iniciar ou pressione a tecla Windows.','Digite o nome do aplicativo e escolha o resultado que você reconhece.'],
      mac:['Pressione Command + Espaço para abrir a busca Spotlight.','Digite o nome do aplicativo e pressione Return quando ele aparecer.']
    },
    reuniao: {
      name:'Entrar em uma reunião por vídeo', match:/google meet|microsoft teams|\bzoom\b|entrar (?:na |em uma )?reuniao|link da reuniao/,
      steps:['Confirme com a pessoa que organizou a reunião se o convite é esperado. Abra o convite pelo navegador ou pelo aplicativo oficial.','Escolha Participar ou Entrar. Confira os controles de câmera e microfone antes de entrar.'],
      help:'Se a reunião pedir um código, confirme com quem enviou o convite. Para falar, use o botão do microfone dentro da reunião.'
    },
    acessibilidade: {
      name:'Aprender no seu ritmo', match:/tenho medo|tenho dificuldade|sou iniciante|quero aprender|inclusao digital|ler (?:a )?tela|ajuda para comecar/,
      steps:['Escolha uma tarefa pequena, como abrir o WhatsApp ou ajustar as letras. Faça um passo e confira o que mudou na tela.','No Conectados, abra Guia e voz para um passeio ou Acessibilidade para escolher leitura em voz alta, letras maiores e alto contraste.'],
      example:'Hoje você pode treinar abrir uma conversa. Amanhã, tente enviar uma mensagem a alguém de confiança.'
    },
    lanterna: {
      name:'Lanterna do celular', match:/\blantern\w*\b|\b(?:acender|apagar|ligar|desligar) (?:a )?luz\b/,
      android:[quickSettings,'Toque no botão Lanterna. Toque novamente para apagar.'],
      iphone:[controlCenter,'Toque no desenho da lanterna. Toque novamente para apagar.'],
      help:'No Android, veja se o painel tem outra página deslizando para o lado. No iPhone, procure o desenho da lanterna na Central de Controle ou na tela bloqueada, se aparecer.',
      example:'Com a tela ligada, abra o painel de controles e procure um desenho parecido com uma pequena lanterna.'
    },
    captura: {
      name:'Captura de tela', match:/\bprint\b|printar|captur\w* (?:de |a )?(?:tela|ecra)|foto (?:da|de) tela|screenshot/,
      android:['Abra a tela que você quer registrar.','Pressione ao mesmo tempo o botão de ligar e o de diminuir o volume. Solte os dois.'],
      iphone:['Abra a tela que você quer registrar.','No iPhone com Face ID, pressione e solte o botão lateral e o de aumentar o volume ao mesmo tempo. Em modelos com botão de Início, use esse botão junto com o lateral ou o superior.'],
      help:'Se aparecer uma miniatura da imagem, a captura funcionou. As capturas ficam no aplicativo de fotos ou na galeria.'
    },
    letras: {
      name:'Letras maiores', match:/\b(?:fonte|letras|texto)\b.*(?:maior|pequen|tamanho|aument)|(?:aument|diminu|tamanho).*\b(?:fonte|letras|texto)\b/,
      android:['Abra Configurações e use a busca para procurar “Tamanho da fonte”.','Abra a opção e mova o controle até as letras ficarem confortáveis.'],
      iphone:['Abra Ajustes e entre em Tela e Brilho.','Toque em Tamanho do Texto e ajuste o controle.'],
      help:'Se o problema for só neste site, abra Acessibilidade no topo da página e mude o tamanho das letras ali.'
    },
    brilho: {
      name:'Brilho da tela', match:/\bbrilho\b|tela (?:muito )?(?:clara|escura)|clarear a tela|escurecer a tela/,
      android:[quickSettings,'Procure a barra de brilho com o desenho de um sol e deslize o controle.'],
      iphone:[controlCenter,'Deslize a barra com o desenho de um sol.'],
      help:'Você também pode procurar a palavra “brilho” na busca de Configurações ou Ajustes.'
    },
    wifi: {
      name:'Wi-Fi', match:/\bwi[ -]?fi\b|rede sem fio|senha (?:da )?(?:rede|internet)|(?:celular|telefone) sem internet|nao (?:conecta|entra).*internet/,
      android:['Abra Configurações e procure Wi-Fi ou Internet.','Ative o Wi-Fi, toque no nome da rede que você conhece e, se for preciso, digite a senha nas configurações do próprio aparelho.'],
      iphone:['Abra Ajustes e toque em Wi-Fi.','Ative o Wi-Fi, toque no nome da sua rede e digite a senha quando o aparelho solicitar.'],
      help:'Se a rede não aparecer, aproxime-se do roteador e confira se outros aparelhos conseguem se conectar. Guarde a senha para você.'
    },
    bluetooth: {
      name:'Bluetooth e fones', match:/\bbluetooth\b|(?:parear|conectar|emparelhar).*\b(?:fone|caixa de som)|fone sem fio/,
      android:['Coloque o fone ou a caixa de som no modo de pareamento.','Abra Configurações, procure Bluetooth e toque no nome do seu acessório.'],
      iphone:['Coloque o acessório no modo de pareamento.','Abra Ajustes, toque em Bluetooth e selecione o nome do acessório.'],
      help:'Se o nome não aparecer, confira a carga do acessório e se ele está conectado a outro aparelho.'
    },
    som: {
      name:'Volume e som', match:/\bvolume\b|sem som|som (?:baixo|alto)|nao (?:consigo )?ouvir|celular nao toca/,
      steps:['Abra um vídeo e pressione o botão de aumentar o volume na lateral do celular.','Se for o toque de chamadas, procure a opção de som em Configurações ou Ajustes e verifique se o aparelho está no silencioso.'],
      help:'Se o som continuar saindo baixo, veja se o celular está enviando o áudio para um fone conectado.'
    },
    lojas: {
      name:'Instalar um aplicativo', match:/app store|play store|(?:baixar|instalar|atualizar) (?:um |o |a )?(?:app|aplicativo|whatsapp)|como baixa/,
      android:['Abra a Play Store.','Busque o aplicativo, confirme quem o publicou e toque em Instalar ou Atualizar.'],
      iphone:['Abra a App Store.','Use a busca, confirme quem publicou o aplicativo e toque em Obter ou Atualizar.'],
      help:'Se pedirem confirmação, confira se você continua na loja oficial. Evite instalar arquivos que chegaram por mensagem.'
    },
    audio: {
      name:'Mensagem de voz', match:/\baudio\b|mensagem de voz|microfone do whats/,
      steps:['Abra a conversa no WhatsApp.','Segure o botão de microfone ao lado do campo de mensagem, fale e solte para enviar.'],
      help:'Se o microfone não funcionar, procure WhatsApp nas configurações do celular e veja se a permissão de microfone está ativa.'
    },
    video: {
      name:'Videochamada', match:/video[ -]?chamada|chamada (?:de|com) video|ligacao (?:de|com|por) video|chamada com camera/,
      steps:['Abra uma conversa no WhatsApp com a pessoa que você quer chamar.','Toque no ícone de câmera perto do nome. Quando quiser encerrar, toque no botão vermelho.'],
      help:'Se a pessoa não escutar ou não enxergar você, confira os botões de microfone e câmera da chamada.'
    },
    'enviar-foto': {
      name:'Enviar foto pelo WhatsApp', match:/(?:envi|mand|compartilh)\w*.*\b(?:foto|imagem)\w*\b|\bfoto\w*\b.*(?:whats|envi|mand)/,
      steps:['Abra uma conversa no WhatsApp e toque no clipe ou no botão de adicionar ao lado da mensagem.','Escolha Fotos ou Galeria, selecione a imagem, confira o destinatário e toque em enviar.'],
      help:'Você também pode abrir a imagem em Fotos ou Galeria e usar Compartilhar para encontrar o WhatsApp.'
    },
    fotos: {
      name:'Tirar uma foto', match:/\bcamera\b|tirar (?:uma )?foto|fotograf\w*|\bfoto\w*\b/,
      steps:['Abra o aplicativo Câmera.','Aponte para o que quer fotografar e toque no botão redondo. Procure a foto em Fotos ou Galeria.'],
      help:'Limpe a lente com um pano macio se a imagem estiver embaçada. Toque na parte da tela que você quer deixar em foco.'
    },
    contato: {
      name:'Salvar um contato', match:/(?:salvar|adicionar|cadastrar|criar)\w*.*\b(?:contato|numero)\b|novo contato|agenda de contatos/,
      steps:['Abra o aplicativo Contatos e toque no botão de adicionar, normalmente marcado com um +.','Digite o nome e o número com DDD. Confira e toque em Salvar.']
    },
    whatsapp: {
      name:'Mensagem no WhatsApp', match:/whats\w*|\bzap\b|(?:mandar|enviar) (?:uma )?mensagem|mensagem de texto/,
      steps:['Abra o WhatsApp e toque na conversa da pessoa.','Toque no campo de texto, escreva a mensagem e toque no botão de enviar.'],
      help:'Se não encontrar a pessoa, procure pelo nome na busca de conversas ou confira se o número está salvo nos Contatos.'
    },
    bateria: {
      name:'Bateria e carregamento', match:/\bbateria\b|\bcarregador\b|carreg\w* (?:o )?(?:celular|telefone)|celular nao carreg/,
      steps:['Confira o encaixe do carregador e teste uma tomada que você sabe que funciona.','Se a bateria estiver acabando rápido, diminua o brilho e procure “Bateria” nas configurações para ver quais apps mais consomem.'],
      help:'Se o aparelho ou o carregador estiver muito quente ou apresentar dano visível, pare de usar e procure assistência.'
    },
    computador: {
      name:'Teclado e computador', match:/\b(?:computador|teclado|mouse)\b|\bcopiar e colar\b/,
      steps:['No computador, mova a seta com o mouse e clique uma vez para selecionar.','Para navegar pelo teclado, use Tab para avançar entre controles e Shift + Tab para voltar. Pressione Enter para acionar um botão em foco.']
    },
    redes: {
      name:'Redes sociais', match:/facebook|instagram|rede social|redes sociais|privacidade (?:do |no )?(?:perfil|instagram)/,
      steps:['Use a busca para encontrar perfis de pessoas que você conhece.','Abra as configurações de privacidade e confira quem pode ver suas publicações antes de postar.']
    },
    seguranca: {
      name:'Segurança contra golpes', match:/golpe|fraude|phishing|\bpix\b|\bbanco\b|clonaram|pedido urgente|mensagem suspeita|link suspeito|falsa central/,
      steps:['Se a mensagem ou ligação pedir dinheiro, códigos ou dados, pare a conversa.','Confirme usando um telefone que você já conhece ou abrindo por conta própria o aplicativo oficial.'],
      help:'Se você já fez uma transferência ou informou um código, fale com a instituição pelo canal oficial o quanto antes. Não compartilhe senhas ou códigos pelo chat.'
    },
    senha: {
      name:'Recuperar uma senha', match:/\bsenha\b|esqueci (?:meu |o )?codigo|nao consigo entrar na (?:minha )?conta/,
      steps:['Abra por conta própria o aplicativo ou o site oficial da conta.','Procure por “Esqueci minha senha” e siga os passos que aparecem nesse canal.'],
      help:'Se o código de recuperação não chegar, confira o e-mail ou telefone cadastrado. Digite o código somente no canal oficial que você abriu.'
    },
    internet: {
      name:'Busca na internet', match:/\b(?:internet|navegador|google|site|safari|chrome)\b|pesquisar na web/,
      steps:['Abra o navegador, como Chrome ou Safari.','Toque na barra de endereço, escreva o assunto que quer pesquisar e toque em buscar. Confira o nome do site antes de inserir informações.']
    },
    celular: {
      name:'Encontrar e abrir um aplicativo', match:/^(?:como )?(?:usar (?:o |meu )?celular|mexer no celular|achar (?:um )?aplicativo)$|onde (?:fica|esta) (?:um |o )?(?:app|aplicativo)|como (?:achar|abrir|encontrar) (?:um |o )?(?:app|aplicativo)/,
      steps:['Vá à tela inicial e procure o desenho do aplicativo.','Se não encontrar, use a busca de aplicativos do aparelho e digite o nome. Toque uma vez para abrir.']
    },
    plataforma: {
      name:'Ajuda com o Conectados', match:/\bcertificado\b|\bcodigo do instrutor\b|\bconectados\b|\bcomp(?:anheiro|anheira) digital\b/,
      steps:['Abra Meu perfil para conferir o progresso, ativar um cadastro ou personalizar seu Companheiro Digital.','O certificado aparece nesse perfil após a conclusão das quatro aulas e a sincronização do progresso. Peça ajuda à equipe pela Central de ajuda.']
    }
  };

  const safety = /golpe|fraude|phishing|clonaram|compartilhei .*codigo|falsa central|link suspeito|mensagem suspeita/;
  const help = /\b(?:nao (?:achei|encontrei|apareceu|consegui|funcionou|vejo)|onde (?:fica|esta)|cade|deu errado|sumiu)\b/;
  const followupPatterns = [
    /^(?:e )?(?:no |na |em |uso |meu (?:celular e )?|tenho )?(?:iphone|android|samsung|motorola|xiaomi|redmi|windows|macbook|mac)(?: [\d]+)?(?: pro|max|se){0,2}$/,
    /^(?:nao (?:achei|encontrei|apareceu|consegui|funcionou|vejo)|onde (?:fica|esta)|cade|deu errado|sumiu)(?: (?:o botao|o icone|isso|a opcao))?$/,
    /^(?:pode )?(?:repete|repetir|explica|explicar|simplifica|simplificar|resume|resumir)(?: (?:de novo|melhor|isso|mais devagar|passo a passo))?$/,
    /^(?:me d[ae] |d[ae] |um |por )?exemplo$/,
    /^(?:e |como )?(?:apago|apagar|desligo|desligar)(?: agora)?$/
  ];

  function normalized(text) {
    return String(text || '').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
  }

  function identifyDevice(words) {
    if (/\b(?:iphone|ios|apple)\b/.test(words)) return 'iphone';
    if (/\b(?:android|samsung|motorola|moto|xiaomi|redmi)\b/.test(words)) return 'android';
    if (/\b(?:windows|win10|win11)\b/.test(words)) return 'windows';
    if (/\b(?:mac|macbook|macos|imac)\b/.test(words)) return 'mac';
    return undefined;
  }

  function stepsText(steps) {
    return steps.map((step,index)=>String(index+1)+'. '+step).join('\n');
  }

  const deviceLabels = {android:'No Android',iphone:'No iPhone',windows:'No Windows',mac:'No Mac'};
  const related = {whatsapp:'whatsapp',contato:'whatsapp',audio:'whatsapp','enviar-foto':'fotos',fotos:'fotos',video:'videochamada',reuniao:'videochamada',pix:'pix',seguranca:'pix'};

  function choose({question,context={},level}) {
    const words = normalized(question);
    const device = identifyDevice(words) || context.device;
    const followup = followupPatterns.some(pattern=>pattern.test(words));
    const explicitTopic = safety.test(words) ? 'seguranca'
      : Object.keys(guides).find(key=>guides[key].match.test(words));
    const topic = explicitTopic ||
      (followup && context.topic && Object.hasOwn(guides,context.topic) ? context.topic : undefined);

    if (!topic) {
      let text = 'Entendi que você precisa de ajuda. Diga o que quer fazer e, se souber, qual aparelho está usando. Por exemplo: “ligar a lanterna no Samsung” ou “aumentar as letras no iPhone”.';
      if (/^(?:obrigad[oa]|valeu|consegui|deu certo)(?: aurora)?$/.test(words)) {
        text = 'Que bom! Se aparecer outra dúvida, me conte o que você quer fazer.';
      } else if (/^(?:oi|ola|bom dia|boa tarde|boa noite)(?: aurora)?$/.test(words)) {
        text = 'Olá! Posso ajudar com tarefas do celular. O que você quer fazer agora?';
      } else if (device && followup) {
        text = 'Certo, vou considerar esse aparelho. O que você quer fazer nele?';
      }
      return {text,context:{topic:context.topic,device}};
    }

    const guide = guides[topic];
    let text;
    if (topic==='lanterna' && /\b(?:apagar|desligar|apago|desligo)\b/.test(words)) {
      text = 'Abra novamente o painel de controles e toque no mesmo botão da lanterna. Quando o botão ficar apagado, a luz está desligada.';
    } else if ((help.test(words) || (topic==='governo' && /recuperar|esqueci/.test(words))) && guide.help) {
      text = guide.help;
    } else if (/\bexemplo\b/.test(words) && guide.example) {
      text = guide.example;
    } else if (guide.steps) {
      text = stepsText(guide.steps);
    } else if (device && guide[device]) {
      text = stepsText(guide[device]);
    } else {
      text = Object.entries(deviceLabels).filter(([key])=>guide[key])
        .map(([key,label])=>label+'\n'+stepsText(guide[key])).join('\n\n');
    }
    if (level?.startsWith('Iniciante') && guide.example && !/\bexemplo\b/.test(words) && !help.test(words)) {
      text += '\n\nExemplo: ' + guide.example;
    }
    return {text,topic,explicitTopic,name:guide.name,lesson:related[topic],context:{topic,device}};
  }

  function grounding(topic) {
    if (!Object.hasOwn(guides,topic)) return undefined;
    const guide = guides[topic];
    const steps = guide.steps?.join(' ') || Object.entries(deviceLabels).filter(([key])=>guide[key])
      .map(([key,label])=>label+': '+guide[key].join(' ')).join(' ');
    return guide.name + '. ' + steps + (guide.help ? ' ' + guide.help : '');
  }

  const api = {choose,grounding,name:topic=>Object.hasOwn(guides,topic)?guides[topic].name:undefined};
  if (typeof module!=='undefined' && module.exports) module.exports = api;
  else root.AuroraGuia = api;
})(globalThis);
