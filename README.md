# 👵📱 Conectados na Melhor Idade  
### Sistema de Capacitação Digital para Idosos

---

## 📘 Visão Geral do Projeto

O **Conectados na Melhor Idade** é um projeto dedicado à inclusão digital de idosos, oferecendo capacitação prática no uso de smartphones, tablets e computadores. O objetivo é promover autonomia, segurança e conexão social através da tecnologia.

---

## 🎯 Objetivos

- Ensinar o uso básico de dispositivos digitais. Facilitar a comunicação entre idosos, familiares e amigos.  
- Incentivar o acesso seguro a serviços online, como bancos, agendamentos e compras.  
- Orientar sobre golpes digitais, segurança e boas práticas na internet.  
- Acompanhar o progresso dos participantes com atividades e registro de presença.

---
### 🧩 Protótipo

- [Figma](https://www.figma.com/design/GzvQRLo6gc79rH6Hsspvwz/Prototipo-conectado-na-melhor-idade?m=auto&t=AoPWFPki9Mr0lJU7-1)

---
## 🧩 Estrutura Pedagógica

O curso é dividido em módulos progressivos, com exercícios práticos e acompanhamento individualizado.

### 📍 Módulos do Curso

#### **Módulo 1 – Introdução aos Dispositivos Digitais**
- Ligar e desligar dispositivos  
- Uso do touchscreen  
- Navegação básica  
- **Exercício:** Fazer uma chamada telefônica ou enviar uma mensagem  

---

#### **Módulo 2 – Aplicativos de Comunicação**
- Uso do WhatsApp, Messenger e videochamadas  
- Envio de mensagens de texto, áudio e imagem  
- **Exercício:** Realizar videochamada com familiar  

---

#### **Módulo 3 – Redes Sociais e Entretenimento**
- Navegação no Facebook, YouTube e Instagram  
- Busca de conteúdos  
- **Exercício:** Criar uma conta e publicar uma foto ou vídeo  

---

#### **Módulo 4 – Segurança Digital**
- Como identificar golpes e fraudes  
- Criação e uso de senhas seguras  
- Reconhecimento de mensagens suspeitas  
- **Exercício:** Identificar sinais de um e-mail fraudulento  

---

#### **Módulo 5 – Serviços Online**
- Uso de plataformas de saúde, bancos e compras  
- Navegação segura em sites  
- **Exercício:** Acessar um serviço simulado  

---

## 📅 Estrutura do Projeto

### **Fase 1 – Diagnóstico e Planejamento**
- Identificação das necessidades dos idosos  
- Organização dos módulos e conteúdos  
- Preparação dos materiais educacionais  

---

### **Fase 2 – Execução dos Módulos**
- Aplicação das aulas  
- Realização dos exercícios práticos  
- Apoio de voluntários para atendimento individual  

---

### **Fase 3 – Revisão e Acompanhamento**
- Sessões extras de revisão  
- Monitoramento da presença  
- Acompanhamento do desempenho individual  

---

## 👥 Membros do Projeto

| Nome         | GitHub |
|--------------|--------|
| **Lyvia**    | [@LyviaVilela](https://github.com/LyviaVilela) |
| **Nicole**   | [@niiukiyo](https://github.com/niiukiyo) |
| **Sergio**   | [@SergioJunior20](https://github.com/SergioJunior20) |
| **Tiago**    | [@TiagoCosta777](https://github.com/TiagoCosta777) |

---

<div align="center">

**Disciplina:** Projeto InovaTec 
**Instituição:** Unasp 

**Período:** 2025.2

</div>

## Executar a versão atual

A aplicação usa Node.js, Express e MySQL. Abra o front-end pelo servidor Express para manter os arquivos e a API na mesma origem.

1. Em uma base nova, execute, na ordem, [Database.sql](Database/Database.sql), [dados_iniciais.sql](Database/dados_iniciais.sql), [evolucao.sql](Database/evolucao.sql), [institucional.sql](Database/institucional.sql), [jornada.sql](Database/jornada.sql) e [percurso.sql](Database/percurso.sql). Execute os três últimos scripts com o banco de destino selecionado.
2. Em uma base existente, faça um backup e aplique apenas as migrações pendentes na ordem acima. A base que já recebeu `jornada.sql` precisa apenas de `percurso.sql`, que registra identificadores de avaliações para sincronização idempotente.
3. Em `Back-end`, instale as dependências com `npm ci`, configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` e execute `npm start`. No Windows PowerShell, use `npm.cmd` se a política de execução impedir o uso de `npm.ps1`.
4. Abra http://127.0.0.1:3000. Para experimentar o painel institucional, configure INSTRUTOR_TOKEN antes de iniciar o servidor e informe a chave em Área do instrutor.

A configuração padrão usa `localhost:3306` e a base `conectado_melhor_idade`. `PORT` e `HOST` definem onde o servidor escuta. `/saude` verifica o processo e `/prontidao` verifica a conexão e as tabelas de sessão e estudo. Configure a credencial atual do MySQL fora do código e rotacione a senha que constava na versão anterior.

### Fluxos

- O participante pode iniciar pelo diagnóstico ou usar um código gerado pelo instrutor. Para recuperar um cadastro existente, gere o código na ficha do participante correto. O código é de uso único e dura 24 horas. A sessão do navegador dura 30 dias.
- O painel do instrutor cadastra alunos e turmas, cria matrículas e atividades, registra presença, publica avisos e envia respostas a pedidos de ajuda. O aluno acompanha as respostas, a agenda e os avisos dentro da plataforma.
- O perfil mostra tempo em aulas abertas, histórico agrupado por dia e aula, progresso, medalhas, frequência e certificado. O tempo é contabilizado enquanto a aba está visível, em intervalos de até 30 segundos. Após a quarta aula sincronizada, o servidor emite um certificado em PDF com QR Code. A verificação pública apresenta curso, código e data de emissão. O instrutor pode solicitar a emissão após a conclusão das quatro aulas.
- Cada participante pode convidar um familiar e revogar o acesso pela área da família. O familiar vê um resumo do progresso e os avisos da instituição, com acesso à conversa com a equipe quando a criptografia estiver configurada. O participante pode baixar uma cópia dos dados de estudo em JSON.
- O instrutor acompanha a turma por indicadores e exporta até 1.000 participantes por relatório em PDF ou Excel. A retirada da matrícula preserva as presenças anteriores. O painel atual apresenta até 500 participantes.
- O navegador guarda foto, preferências de acessibilidade e tentativas recentes. O banco grava a avaliação quando há uma sessão ativa e o serviço está disponível. A foto fica no dispositivo.
- A Aurora sugere aulas em função do diagnóstico e revisões em função dos exercícios. A tutora usa respostas do guia do curso, combinadas por assunto. O painel registra o total de consultas e o servidor recebe apenas a contagem de uso.

### Operação e implantação

Mantenha um backup MySQL independente dos arquivos do projeto. Use mysqldump com --single-transaction durante uma janela sem alterações de esquema. Para recuperar, importe a cópia em uma instância separada e valide /prontidao, os totais das tabelas e os fluxos de cadastro, presença e certificado antes de trocar a conexão da aplicação. Use uma conta MySQL de execução com permissões limitadas às tabelas da aplicação e uma conta separada para aplicar migrações.

### Autenticação e configuração institucional

Em produção, defina `NODE_ENV=production`, use TLS na frente do Express e configure `PUBLIC_ORIGIN` com a origem HTTPS em instalações com um banco único. Configure `INSTRUTOR_TOKEN` com pelo menos 32 caracteres, `INSTRUTOR_TOTP_HEX` com o segredo aleatório de 20 a 64 bytes em hexadecimal e `DADOS_CHAVE_HEX` com uma chave aleatória de 32 bytes em hexadecimal. Cadastre os mesmos bytes do segredo TOTP no autenticador, usando Base32 quando o aplicativo exigir, com seis dígitos e período de 30 segundos. Guarde os segredos fora do repositório. Preserve a chave de criptografia ao restaurar backups para poder ler as mensagens existentes.

Para múltiplas instituições, use `INSTITUICOES_JSON` com uma lista de objetos contendo `dominio`, `banco`, `usuario`, `senha`, `chave`, `totp` e `criptografia`. Os nomes de banco, domínios e segredos devem ser distintos. Use um usuário MySQL dedicado a cada banco. No proxy, aceite apenas os domínios configurados e preserve o cabeçalho Host original. Com proxy local que sobrescreve os campos de encaminhamento, configure `TRUST_LOCAL_PROXY=1` para identificar o cliente real na limitação de solicitações. Para cada base, selecione o destino e aplique o esquema e as migrações necessárias conforme o estado dos dados. Os scripts antigos que selecionam o nome padrão precisam ser parametrizados para o nome da base de destino antes de executar.

O segundo fator protege o acesso do instrutor em produção e no modo multi-institucional. Para habilitar contas individuais, configure `INSTRUTORES_JSON` com uma lista de objetos contendo `id`, `chave` e `totp` em instalações de banco único, ou use a propriedade `instrutores` em cada instituição no modo multi-institucional. Cada conta usa par de credenciais próprio. A configuração com chave institucional única continua disponível para compatibilidade. O modo local de demonstração aceita a chave sem TOTP. A auditoria registra conta, operação e horário em entradas, operações de gestão, convites, respostas a familiares e exportações.

A limitação de solicitações é por processo e deve ser complementada por um limite compartilhado no proxy em instalações com múltiplas réplicas. As contas individuais são provisionadas pela configuração do ambiente. Para revogar a conta, remova-a da configuração e reinicie os processos correspondentes.

### Verificações antes de publicar

O projeto oferece minimização no verificador público, acesso familiar revogável, cópia de dados de estudo e criptografia autenticada das novas mensagens familiares. A instituição ainda precisa definir retenção, atendimento aos titulares, revisão de configuração e responsabilidades pelo tratamento de dados.

Faça testes manuais com teclado, leitor de tela, zoom de 200%, telas pequenas e reconhecimento de voz antes de declarar conformidade com a WCAG 2.1 AA. O reconhecimento de voz depende do navegador e pode usar o serviço de voz do fabricante. O progresso e as atividades principais também podem ser acessados pelos controles de tela.

Para executar a integração, configure `TEST_MYSQL_USER` e `TEST_MYSQL_PASSWORD` de uma instância MySQL descartável com permissão para criar e remover bancos. Na raiz do repositório, execute `node --test Back-end/test/institucional.test.js`. O teste cria duas bases com nomes exclusivos, valida os principais fluxos e remove essas bases ao terminar.

Ainda estão pendentes provisionamento de contas pelo painel, paginação das listagens, teste de carga, notificações push, aplicativos nativos, eventos online, vídeos e editor de conteúdos. As recomendações da Aurora usam regras e o conteúdo pedagógico do projeto.

### Companheiro Digital e estudo sem conexão

O Companheiro apresenta um passeio guiado, sugestões de retomada, missões, XP e medalhas. A jornada adaptativa usa o nível do diagnóstico, os erros recentes e o tempo observado por etapa. O modo automático altera a densidade e os controles. O usuário pode escolher a apresentação manualmente. Os sinais de aprendizagem, XP e sequência ficam neste navegador. Um lembrete de retomada é uma regra de inatividade, sem modelo de previsão. A Aurora complementa as aulas com instruções do guia e usa a síntese de voz do navegador.

O manifesto permite instalar a versão web em navegadores compatíveis. Abra a aplicação online pelo menos uma vez e permita que o carregamento inicial termine. Em produção, o service worker precisa de HTTPS. Em teste, use localhost. A biblioteca, os exercícios locais e os tutoriais podem ser usados offline. Com a sessão do aluno ativa, o aplicativo tenta reenviar progresso e tempo de estudo ao recuperar a conexão. Mensagens, relatórios, certificados, moderação e calendário institucional precisam de conexão. A fila depende do armazenamento do navegador. Atualize a versão de cache em `Front-end/sw.js` ao publicar alterações nos ativos que ele armazena.

O familiar convidado pode acompanhar as últimas atividades e enviar incentivo privado. A comunidade requer sessão de participante, confirmação de cada publicação e aprovação de instrutor. Publicações aprovadas são exibidas sem o nome da conta. A operação de moderação fica na auditoria institucional.

A fonte OpenDyslexic é distribuída sob licença SIL OFL. A cópia da licença está em [Front-end/assets/OpenDyslexic-LICENSE.txt](Front-end/assets/OpenDyslexic-LICENSE.txt).

### Backup e monitoramento

O script [backup.ps1](Database/scripts/backup.ps1) gera um dump MySQL por execução e um arquivo SHA-256. Configure previamente o `login-path` com o `mysql_config_editor`, aponte para um diretório protegido e agende o script no ambiente de operação. Por exemplo, execute `& .\Database\scripts\backup.ps1 -Database conectado_melhor_idade -OutputDirectory D:\Backups\Conectados`. Valide uma restauração antes de usar a rotina em produção. O agendamento, a retenção, o armazenamento protegido e o coletor central devem ser configurados na infraestrutura. Erros de disponibilidade são emitidos em JSON no stderr e podem ser coletados sem registrar conteúdo de mensagens.

Execute `node --test Back-end/test/*.test.js` com as credenciais de teste indicadas acima. A cobertura inclui isolamento institucional, revisão de publicações, revogação de incentivo familiar, regras de XP e escopo do cache offline.

### Painel de evolução e revisão

O guia da Aurora atende dúvidas práticas como ligar a lanterna, fazer captura de tela, ajustar letras e volume, conectar Wi-Fi e enviar mídia pelo WhatsApp. Quando os caminhos variam, distingue Android e iPhone. Perguntas curtas como “não achei” e “e no iPhone?” usam o assunto recente da conversa. O guia é incluído no cache público da PWA e também fornece o contexto do curso para o modelo local opcional.

O plano semanal combina aula recomendada, revisões pendentes e uma meta de prática. A confiança digital representa o percentual de marcos registrados, com peso igual para cada uma das quatro aulas e para o primeiro acerto em cada um dos quatro temas de segurança. O gráfico mostra atividades diárias neste aparelho. A foto, o nome do Companheiro, o avatar, as ligas pessoais e parte do histórico continuam vinculados ao navegador.

A Aurora seleciona um tema a partir das últimas respostas e alterna cenários revisados e ordem das opções. A conversa usa o contexto da última pergunta reconhecida. Essa adaptação funciona com regras e conteúdo do próprio curso. No modo offline, as avaliações entram na fila e usam o mesmo identificador em novas tentativas de envio.

Para respostas generativas opcionais, a instituição pode disponibilizar um modelo Ollama na mesma máquina do servidor. Configure `AURORA_MODELO_LOCAL` com um modelo local já carregado e `AURORA_PORTA_LOCAL` se a porta diferir de 11434. Mantenha o serviço de inferência em loopback com processamento local. Com a opção ativa, cada participante autenticado escolhe quando enviar somente a pergunta atual e o tema do curso. O histórico da conversa e o cadastro ficam de fora do pedido ao modelo. O aplicativo bloqueia padrões comuns de links, e-mails e números na pergunta e usa o guia quando a inferência estiver indisponível. As respostas generativas devem ser avaliadas antes do piloto. Consulte a [API de chat do Ollama](https://docs.ollama.com/api/chat).

O mapa institucional considera a última resposta de cada participante matriculado por turma e tema nos últimos 30 dias. A lista de acompanhamento mostra pessoas que já registraram atividade, passaram sete dias sem novo registro e ainda não têm certificado. As intervenções sugeridas são pontos para revisão da equipe. A tabela de participantes usa busca e paginação. A central familiar e a moderação carregam sob demanda. A compressão HTTP se aplica aos arquivos públicos de texto.

Em Guia e voz, o verificador interno checa idioma, título, atributos de imagens e contraste das cores-base na tela atual. A avaliação de acessibilidade completa ainda exige testes manuais, tecnologias assistivas e observação em dispositivos reais.

### Demonstração estática sem banco

Execute `node scripts/build-demo.cjs` para gerar `.deploy/demo`. A pasta contém apenas o front-end público e habilita o modo demonstração. O diagnóstico, as aulas, os exercícios e a Aurora funcionam no navegador, com progresso local. Turmas, mensagens, certificados emitidos e sincronização entre sessões dependem da versão institucional.

- **GitHub Pages:** ative GitHub Actions como fonte em Settings → Pages. O workflow de publicação pode ser disparado manualmente e roda após alterações relevantes na `main`. Os caminhos relativos permitem publicar em `/<repositorio>/`. [Documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- **Vercel e Netlify:** importe o repositório com a raiz como diretório do projeto. Os arquivos `vercel.json` e `netlify.toml` apontam para o mesmo build estático. Confirme as condições do plano para o uso pretendido. [Configuração do Vercel](https://vercel.com/docs/project-configuration) · [Configuração do Netlify](https://docs.netlify.com/build/configure-builds/file-based-configuration/)
- **Prévia local da demonstração:** após instalar as dependências de `Back-end`, execute `node scripts/demo-server.cjs` na raiz e abra `http://127.0.0.1:43766/demonstracao/`.

### Hospedar a versão institucional

O `Dockerfile` publica o Express e o front-end na mesma origem, preservando o modelo de sessões. Use o Blueprint `render.yaml` no Render ou `railway.toml` no Railway. Forneça uma base MySQL 8 persistente, execute nela os scripts de esquema e migração e configure as variáveis de `.env.example` no provedor. Os segredos de produção e a origem pública HTTPS são obrigatórios. Ative `DB_TLS=1` para banco remoto e informe `DB_CA_PEM` se o provedor usar uma autoridade privada. Em desenvolvimento, é possível carregar um arquivo local com `node --env-file=.env Back-end/server.js`.

O Render oferece uma modalidade gratuita com suspensão por inatividade e partida a frio. O Railway tem plano gratuito com cota limitada. A gratuitidade da aplicação completa depende também do banco e do consumo. A demo estática é o caminho que dispensa qualquer serviço de banco. [Render Free](https://render.com/docs/free) · [Railway Free](https://docs.railway.com/pricing/free-plan)

O esquema atual foi validado em MySQL. Supabase e Neon usam PostgreSQL e exigem uma migração de SQL e de driver. PlanetScale só é candidato pela modalidade MySQL, mediante validação das migrações e confirmação de custos. TiDB Cloud Starter com compatibilidade MySQL é outra opção a avaliar dentro da cota gratuita. Os serviços gerenciados não foram validados neste repositório. [Banco Supabase](https://supabase.com/docs/guides/database/overview) · [Neon](https://neon.com/docs/introduction) · [PlanetScale](https://planetscale.com/pricing) · [TiDB Cloud](https://docs.pingcap.com/tidbcloud/select-cluster-tier/)

### Aurora, instalação e testes

O guia inclui e-mail e anexos, gov.br, bancos digitais, Pix, Windows, Mac e reuniões por vídeo. A Aurora adapta a orientação ao aparelho citado e oferece exemplos para participantes iniciantes quando disponíveis. A memória opcional, na tela da Aurora, usa somente tema, frequência e data neste navegador. Desmarque para apagar esse histórico. O texto da conversa fica apenas na sessão da página. A Aurora usa os temas recorrentes para sugerir revisão e indica aulas relacionadas quando existem.

As instruções do guia consultam fontes oficiais de [segurança no Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca), [recuperação da conta gov.br](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/atendimento-gov.br/duvidas-na-conta-gov.br/recuperar-senha-da-conta-gov.br/recuperar-senha-da-conta-gov.br/), [capturas de tela no Windows](https://support.microsoft.com/pt-br/windows/apps/use-snipping-tool-to-capture-screenshots) e [capturas de tela no Mac](https://support.apple.com/pt-br/102646).

O botão Instalar aplicativo abre a instalação quando o navegador oferece essa opção. No Safari do iPhone, use Compartilhar e Adicionar à Tela de Início. Em navegadores sem instalação, os fluxos continuam disponíveis na aba. O aplicativo precisa de uma primeira visita conectada para preparar o cache. A atualização é ativada após o download completo. Quando há entrada em edição, a página atual evita recarregar automaticamente.

O workflow de validação roda testes Node/MySQL e Playwright em Chromium, Firefox e WebKit, com perfis desktop e tamanhos móveis. Para reproduzir a suíte visual, execute `npx playwright install chromium firefox webkit` e `npx playwright test` dentro de `Back-end`. Os testes de navegador emulam telas e não substituem a verificação em aparelhos reais. A imagem principal passou de aproximadamente 134 kB para 43 kB, e o Express comprime CSS e JavaScript.

Em três carregamentos da demo local, o evento de carga terminou entre 1,92 s e 1,96 s em Chromium com tela de 390 px, cache vazio, CPU 4× mais lenta, download de 1,6 Mb/s e latência de 150 ms simulados. Valide o tempo em produção separadamente, especialmente em serviços que suspendem a aplicação por inatividade.
