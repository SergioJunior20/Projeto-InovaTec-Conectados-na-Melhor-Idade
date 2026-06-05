USE conectado_melhor_idade;

INSERT INTO categorias (id_categoria, nome, descricao) VALUES
(1, 'Comunicação', 'Aulas para conversar com familiares e amigos pelo celular'),
(2, 'Mídia', 'Aulas sobre fotos e câmera'),
(3, 'Segurança Digital', 'Conteúdos para usar o celular com segurança'),
(4, 'Serviços Bancários', 'Conteúdos sobre PIX e banco pelo celular')
ON DUPLICATE KEY UPDATE
nome = VALUES(nome),
descricao = VALUES(descricao);

INSERT INTO licoes (id_licao, id_categoria, titulo, descricao, dificuldade) VALUES
(1, 1, 'WhatsApp', 'Aprenda a mandar mensagens, fotos e áudios para familiares.', 'Fácil'),
(2, 2, 'Tirar e Enviar Fotos', 'Aprenda a tirar fotos e compartilhar com contatos.', 'Fácil'),
(3, 1, 'Videochamadas', 'Aprenda a fazer chamadas de vídeo com familiares.', 'Médio'),
(4, 4, 'PIX com Segurança', 'Aprenda o passo a passo para fazer PIX com cuidado.', 'Médio')
ON DUPLICATE KEY UPDATE
id_categoria = VALUES(id_categoria),
titulo = VALUES(titulo),
descricao = VALUES(descricao),
dificuldade = VALUES(dificuldade);
