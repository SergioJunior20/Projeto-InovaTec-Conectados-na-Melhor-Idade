USE conectado_melhor_idade;

CREATE TABLE IF NOT EXISTS sessoes (
  token_hash CHAR(64) PRIMARY KEY,
  id_usuario INT NOT NULL,
  expira_em DATETIME NOT NULL,
  INDEX (expira_em),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS turmas (
  id_turma INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS convites (
  id_usuario INT PRIMARY KEY,
  codigo_hash CHAR(64) NOT NULL UNIQUE,
  expira_em DATETIME NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matriculas (
  id_turma INT NOT NULL,
  id_usuario INT NOT NULL,
  PRIMARY KEY (id_turma, id_usuario),
  INDEX (id_usuario),
  FOREIGN KEY (id_turma) REFERENCES turmas(id_turma),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS encontros (
  id_encontro INT AUTO_INCREMENT PRIMARY KEY,
  id_turma INT NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  dia DATE NOT NULL,
  INDEX (id_turma, dia),
  FOREIGN KEY (id_turma) REFERENCES turmas(id_turma)
);

CREATE TABLE IF NOT EXISTS presencas (
  id_encontro INT NOT NULL,
  id_usuario INT NOT NULL,
  presente BOOLEAN NOT NULL,
  PRIMARY KEY (id_encontro, id_usuario),
  INDEX (id_usuario),
  FOREIGN KEY (id_encontro) REFERENCES encontros(id_encontro),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS observacoes (
  id_observacao INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  texto VARCHAR(1000) NOT NULL,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (id_usuario, criada_em),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS certificados (
  codigo CHAR(36) PRIMARY KEY,
  id_usuario INT NOT NULL UNIQUE,
  emitido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tema VARCHAR(50) NOT NULL,
  correta BOOLEAN NOT NULL,
  registrada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (id_usuario, tema, registrada_em),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS avisos (
  id_aviso INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  texto VARCHAR(1000) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS respostas_ajuda (
  id_resposta INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  texto VARCHAR(1000) NOT NULL,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (id_pedido, id_resposta),
  FOREIGN KEY (id_pedido) REFERENCES pedidos_ajuda(id_pedido)
);

CREATE TABLE IF NOT EXISTS uso_aurora (
  id_usuario INT NOT NULL,
  dia DATE NOT NULL,
  consultas INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id_usuario, dia),
  INDEX (dia),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS auditoria_instrutor (
  id_evento BIGINT AUTO_INCREMENT PRIMARY KEY,
  acao VARCHAR(50) NOT NULL,
  ocorrido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (ocorrido_em)
);

INSERT INTO certificados (codigo,id_usuario,emitido_em)
SELECT UUID(),p.id_usuario,COALESCE(MAX(p.data_conclusao),NOW())
FROM progresso p
LEFT JOIN certificados c ON c.id_usuario=p.id_usuario
WHERE p.concluido=1 AND p.id_licao IN (1,2,3,4) AND c.id_usuario IS NULL
GROUP BY p.id_usuario
HAVING COUNT(DISTINCT p.id_licao)=4;
