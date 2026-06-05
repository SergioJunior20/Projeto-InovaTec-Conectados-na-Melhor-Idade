CREATE DATABASE conectado_melhor_idade;
USE conectado_melhor_idade;

CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    nivel VARCHAR(50),
    pontuacao INT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
);

CREATE TABLE licoes (
    id_licao INT PRIMARY KEY AUTO_INCREMENT,
    id_categoria INT,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    dificuldade VARCHAR(30),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

CREATE TABLE progresso (
    id_progresso INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    id_licao INT,
    concluido BOOLEAN DEFAULT FALSE,
    data_conclusao TIMESTAMP NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_licao) REFERENCES licoes(id_licao)
);

CREATE TABLE sugestoes (
    id_sugestao INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE familiares (
    id_familiar INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    nome VARCHAR(100),
    telefone VARCHAR(20),
    parentesco VARCHAR(50),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE pedidos_ajuda (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    mensagem TEXT,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Aberto',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);