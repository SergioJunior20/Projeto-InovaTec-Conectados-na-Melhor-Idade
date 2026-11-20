CREATE TABLE IF NOT EXISTS envios_avaliacao (
  id_usuario INT NOT NULL,
  evento CHAR(36) NOT NULL,
  recebido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario,evento),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
