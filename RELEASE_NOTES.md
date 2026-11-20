# Conectados na Melhor Idade v1.0.0

20 de novembro de 2026

## O que a versão entrega

- **Aprendizagem:** diagnóstico, trilhas, biblioteca, tutoriais, exercícios, calendário, histórico e registro do progresso.
- **Acessibilidade:** navegação por teclado, controle de tamanho das letras, OpenDyslexic, alto contraste, modo essencial, leitura e comandos de voz conforme o navegador.
- **Aurora e Companheiro Digital:** guia de dúvidas em linguagem simples, orientação por aparelho, exercícios de revisão, sugestões de retomada e memória opcional de assuntos no navegador. O modelo generativo local é opcional e complementa o guia.
- **Gamificação:** XP, ligas pessoais, missões, medalhas e acompanhamento da sequência de estudo.
- **Operação institucional:** turmas, matrículas, presenças, avisos, auditoria, exportações e acompanhamento por turma. Inclui acesso familiar revogável e comunidade moderada.
- **Certificados:** emissão em PDF após a trilha, com QR Code para consulta pública do código.
- **PWA:** instalação em navegadores compatíveis, conteúdo público disponível offline após a primeira visita e fila para reenviar progresso, tempo e avaliações quando a sessão e a conexão estiverem disponíveis.
- **Segurança:** sessões, acesso institucional por perfil, segundo fator de instrutor em produção, isolamento por banco, mensagens familiares criptografadas e limites de requisição.

## Revisão técnica

As dependências instaladas foram retiradas do controle de versão. O lockfile continua sendo a referência para instalações reproduzíveis. A dependência CORS sem uso foi removida, o comando de desenvolvimento usa o monitor nativo do Node e as dependências receberam correções compatíveis. O diretório de build, relatórios temporários, chaves e backups ficam fora do Git. O README principal foi preservado integralmente durante a revisão.

## Resultado da validação

| Verificação | Resultado |
|---|---|
| Node e integração MySQL | 11 executados, 11 aprovados |
| Playwright | 21 planejados, 17 executados e aprovados, 4 pulados por escopo |
| Responsividade e PWA | Chromium, Firefox e WebKit. Perfis desktop, celular e tablet emulados. Fonte de 200% em 320 px. Offline verificado em Chromium |
| Build estático | Gerado e servido em subpasta |
| Produção | Instalação limpa com dependências de produção. Prontidão, ativos PWA, controle de acesso e atributos do cookie verificados em MySQL descartável |
| Análise estática e dependências | Sem ocorrências nas regras executadas. Ambas as instalações auditadas pelo npm retornaram zero vulnerabilidades reportadas |
| Segredos | A varredura de padrões no conteúdo desta versão retornou zero ocorrências. Uma credencial legada permanece no histórico anterior |

## Publicação

O ambiente definitivo recomendado para o sistema completo é o **Render**, com MySQL persistente externo. O Node serve a interface e a API na mesma origem, preservando o fluxo de sessões. A URL proposta é `https://conectados-melhor-idade.onrender.com/`, sujeita à disponibilidade do nome no provedor. GitHub Pages, Vercel e Netlify têm configuração para a demonstração estática. [Render Web Services](https://render.com/docs/web-services) · [Limites do Render Free](https://render.com/docs/free)

Antes do envio público, rotacione a credencial legada de banco e revise com o responsável pelo repositório a remediação do histórico. A versão foi verificada localmente. A imagem Docker e o deploy externo ainda precisam ser executados em um ambiente com Docker ou no provedor. Também seguem pendentes a instalação em aparelhos físicos, testes com leitores de tela e o ensaio de restauração do backup institucional. [Remoção de dados sensíveis no GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
