const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Você vai precisar do CORS habilitado para o React não ser bloqueado

const app = express();
app.use(express.json());
app.use(cors()); // Permite que o frontend (porta 3000) acesse o backend (porta 3001)

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'barbearias-sd', 
    password: 'sua_senha', // coloque sua senha
    port: 5432,
});

// --- ROTA: GET /barbearias (A mesma que o React usa no useEffect) ---
app.get('/barbearias', async (req, res) => {
    try {
        // Busca tudo do banco
        const barbeariasRes = await pool.query('SELECT * FROM barbearias');
        const servicosRes = await pool.query('SELECT * FROM servicos');
        const barbeirosRes = await pool.query('SELECT * FROM barbeiros');

        // Monta o objeto aninhado exatamente como o React espera
        const barbearias = barbeariasRes.rows.map(barbearia => {
            return {
                id: barbearia.id,
                nome: barbearia.nome,
                endereco: barbearia.endereco,
                servicos: servicosRes.rows
                    .filter(s => s.barbearia_id === barbearia.id)
                    .map(s => ({ id: s.id, nome: s.nome, preco: Number(s.preco) })),
                barbeiros: barbeirosRes.rows
                    .filter(b => b.barbearia_id === barbearia.id)
                    .map(b => ({ id: b.id, nome: b.nome }))
            };
        });

        res.json(barbearias);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao carregar barbearias.' });
    }
});

// --- ROTA: GET /agendamentos (Para popular os horários ocupados) ---
app.get('/agendamentos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM agendamentos ORDER BY data_hora ASC');
        // O React espera as propriedades em camelCase (dataHora, barbeiroId)
        const agendamentosFormatados = resultado.rows.map(a => ({
            id: a.id,
            clienteId: a.cliente_id,
            barbeariaId: a.barbearia_id,
            servicoId: a.servico_id,
            barbeiroId: a.barbeiro_id,
            dataHora: a.data_hora,
            status: a.status
        }));
        res.json(agendamentosFormatados);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
    }
});

// --- ROTA: POST /agendamentos (Para salvar o agendamento final) ---
app.post('/agendamentos', async (req, res) => {
    // Recebe as variáveis com os nomes que o seu React envia no axios.post
    const { clienteId, barbeariaId, servicoId, barbeiroId, dataHora } = req.body;

    try {
        // Validação extra de segurança: verificar se o horário já está ocupado
        const ocupadoCheck = await pool.query(
            'SELECT id FROM agendamentos WHERE barbeiro_id = $1 AND data_hora = $2',
            [barbeiroId, dataHora]
        );

        if (ocupadoCheck.rows.length > 0) {
            return res.status(400).json({ erro: 'Este horário acabou de ser reservado por outra pessoa.' });
        }

        // Insere no banco
        const query = `
            INSERT INTO agendamentos (cliente_id, barbearia_id, servico_id, barbeiro_id, data_hora)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const valores = [clienteId, barbeariaId, servicoId, barbeiroId, dataHora];
        const novoAgendamento = await pool.query(query, valores);

        res.status(201).json(novoAgendamento.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao realizar agendamento.' });
    }
});

app.listen(3001, () => {
    console.log(`Servidor backend rodando na porta 3001`);
});