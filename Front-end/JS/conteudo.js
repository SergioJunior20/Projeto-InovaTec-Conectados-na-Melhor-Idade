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


