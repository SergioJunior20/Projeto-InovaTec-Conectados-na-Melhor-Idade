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
| **Ana Eliza**| [@anaelizatx](https://github.com/anaelizatx) |
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

1. Em uma base nova, execute, na ordem, [Database.sql](Database/Database.sql), [dados_iniciais.sql](Database/dados_iniciais.sql), [evolucao.sql](Database/evolucao.sql), [institucional.sql](Database/institucional.sql) e [jornada.sql](Database/jornada.sql). Execute os dois últimos scripts com o banco de destino selecionado.
2. Em uma base existente, faça um backup e aplique as migrações na ordem acima. Em uma base que já recebeu a versão institucional, aplique somente `jornada.sql`. Ela acrescenta publicações moderadas e incentivos familiares, preservando os registros anteriores.
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
