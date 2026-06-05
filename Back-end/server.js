const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '2210', // coloque sua senha do MySQL aqui
    database: 'conectado_melhor_idade'
});

db.connect((err) => {
    if (err) {
        console.log('Erro ao conectar no banco:', err);
    } else {
        console.log('Conectado ao banco de dados MySQL');
    }
});

app.get('/', (req, res) => {
    res.send('API Conectado na Melhor Idade funcionando!');
});

// CRUD de usuários
app.get('/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/usuarios', (req, res) => {
    const { nome, nivel, pontuacao } = req.body;
    const sql = 'INSERT INTO usuarios (nome, nivel, pontuacao) VALUES (?, ?, ?)';

    db.query(sql, [nome, nivel, pontuacao], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ mensagem: 'Usuário cadastrado com sucesso!', id_usuario: result.insertId });
    });
});

app.put('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, nivel, pontuacao } = req.body;
    const sql = 'UPDATE usuarios SET nome = ?, nivel = ?, pontuacao = ? WHERE id_usuario = ?';

    db.query(sql, [nome, nivel, pontuacao, id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensagem: 'Usuário atualizado com sucesso!' });
    });
});

app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensagem: 'Usuário excluído com sucesso!' });
    });
});

// Listar lições cadastradas no banco
app.get('/licoes', (req, res) => {
    db.query('SELECT * FROM licoes', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Salvar ou atualizar progresso de aula
app.post('/progresso', (req, res) => {
    const { id_usuario, id_licao, concluido } = req.body;

    const verificar = 'SELECT id_progresso FROM progresso WHERE id_usuario = ? AND id_licao = ?';

    db.query(verificar, [id_usuario, id_licao], (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length > 0) {
            const atualizar = `
                UPDATE progresso
                SET concluido = ?, data_conclusao = CASE WHEN ? = true THEN NOW() ELSE NULL END
                WHERE id_usuario = ? AND id_licao = ?
            `;

            db.query(atualizar, [concluido, concluido, id_usuario, id_licao], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ mensagem: 'Progresso atualizado com sucesso!' });
            });
        } else {
            const inserir = `
                INSERT INTO progresso (id_usuario, id_licao, concluido, data_conclusao)
                VALUES (?, ?, ?, CASE WHEN ? = true THEN NOW() ELSE NULL END)
            `;

            db.query(inserir, [id_usuario, id_licao, concluido, concluido], (err, result) => {
                if (err) return res.status(500).json(err);
                res.json({ mensagem: 'Progresso salvo com sucesso!', id_progresso: result.insertId });
            });
        }
    });
});

// Consultar progresso de um usuário
app.get('/progresso/:id_usuario', (req, res) => {
    const { id_usuario } = req.params;

    const sql = `
        SELECT p.id_progresso, p.id_usuario, p.id_licao, p.concluido, p.data_conclusao,
               l.titulo, l.dificuldade
        FROM progresso p
        INNER JOIN licoes l ON p.id_licao = l.id_licao
        WHERE p.id_usuario = ?
        ORDER BY p.data_conclusao DESC
    `;

    db.query(sql, [id_usuario], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Sugestões
app.post('/sugestoes', (req, res) => {
    const { id_usuario, mensagem } = req.body;
    const sql = 'INSERT INTO sugestoes (id_usuario, mensagem) VALUES (?, ?)';

    db.query(sql, [id_usuario, mensagem], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensagem: 'Sugestão enviada com sucesso!' });
    });
});

app.get('/sugestoes', (req, res) => {
    db.query('SELECT * FROM sugestoes ORDER BY data_envio DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Pedidos de ajuda
app.post('/ajuda', (req, res) => {
    const { id_usuario, mensagem } = req.body;
    const sql = 'INSERT INTO pedidos_ajuda (id_usuario, mensagem) VALUES (?, ?)';

    db.query(sql, [id_usuario, mensagem], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensagem: 'Pedido de ajuda registrado com sucesso!' });
    });
});

app.get('/ajuda', (req, res) => {
    db.query('SELECT * FROM pedidos_ajuda ORDER BY data_pedido DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
