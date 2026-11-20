CREATE TABLE IF NOT EXISTS incentivos_familiares (
  id_incentivo BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_acesso INT NOT NULL,
  criptograma VARBINARY(4096) NOT NULL,
  enviado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (id_acesso,id_incentivo),
  FOREIGN KEY (id_acesso) REFERENCES acesso_familiar(id_acesso)
);

CREATE TABLE IF NOT EXISTS comunidade_publicacoes (
  id_publicacao BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  titulo VARCHAR(90) NOT NULL,
  texto VARCHAR(600) NOT NULL,
  estado ENUM('pendente','publicada','oculta') NOT NULL DEFAULT 'pendente',
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderada_em DATETIME,
  INDEX (estado,id_publicacao),
  INDEX (id_usuario,id_publicacao),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
