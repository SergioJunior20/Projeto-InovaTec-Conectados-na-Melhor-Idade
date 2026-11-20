CREATE TABLE IF NOT EXISTS janelas_instrutor (
  instrutor VARCHAR(32) NOT NULL,
  janela BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (instrutor,janela),
  INDEX (janela)
);

CREATE TABLE IF NOT EXISTS eventos_institucionais (
  id_evento BIGINT AUTO_INCREMENT PRIMARY KEY,
  instrutor VARCHAR(32) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  ocorrido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (instrutor,ocorrido_em),
  INDEX (ocorrido_em)
);

CREATE TABLE IF NOT EXISTS matriculas_encerradas (
  id_encerramento BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_turma INT NOT NULL,
  id_usuario INT NOT NULL,
  encerrada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (id_usuario, encerrada_em),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_turma) REFERENCES turmas(id_turma)
);

CREATE TABLE IF NOT EXISTS estudo_atividade (
  evento CHAR(36) PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_licao INT NOT NULL,
  segundos SMALLINT UNSIGNED NOT NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (id_usuario, registrado_em),
  INDEX (registrado_em),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_licao) REFERENCES licoes(id_licao)
);

CREATE TABLE IF NOT EXISTS acesso_familiar (
  id_acesso INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  convite_hash CHAR(64) UNIQUE,
  convite_expira DATETIME NOT NULL,
  sessao_hash CHAR(64) UNIQUE,
  sessao_expira DATETIME,
  revogado_em DATETIME,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (id_usuario, revogado_em),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS conversa_familiar (
  id_mensagem BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_acesso INT NOT NULL,
  autor ENUM('familiar','instrutor') NOT NULL,
  criptograma VARBINARY(4096) NOT NULL,
  enviada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (id_acesso,id_mensagem),
  FOREIGN KEY (id_acesso) REFERENCES acesso_familiar(id_acesso)
);
