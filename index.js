const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Dados simulados
const barbearias = [
  {
    id: "1",
    nome: "Barbearia do Henrique",
    endereco: "Rua das Flores, 123",
    barbeiros: [
      { id: "b1_1", nome: "Henrique Silva" },
      { id: "b1_2", nome: "Carlos (Gago)" }
    ],
    servicos: [
      { id: "s1", nome: "Corte", preco: 40.00 },
      { id: "s2", nome: "Barba", preco: 30.00 },
      { id: "s3", nome: "Corte + Barba", preco: 65.00 }
    ]
  },
  {
    id: "2",
    nome: "Vintage Barber Shop",
    endereco: "Av. Central, 500",
    barbeiros: [
      { id: "b2_1", nome: "Mestre Yoda" },
      { id: "b2_2", nome: "Luke Skywalker" },
      { id: "b2_3", nome: "Vader" }
    ],
    servicos: [
      { id: "s1", nome: "Corte", preco: 50.00 },
      { id: "s2", nome: "Barba", preco: 35.00 },
      { id: "s3", nome: "Corte + Barba", preco: 75.00 }
    ]
  }
];

const agendamentos = [];

// Rotas
app.get('/barbearias', (req, res) => {
  res.json(barbearias);
});

app.get('/barbearias/:id', (req, res) => {
  const barbearia = barbearias.find(b => b.id === req.params.id);
  if (!barbearia) return res.status(404).json({ erro: "Barbearia não encontrada" });
  res.json(barbearia);
});

app.post('/agendamentos', (req, res) => {
  const { clienteId, barbeariaId, servicoId, barbeiroId, dataHora } = req.body;

  if (!clienteId || !barbeariaId || !servicoId || !barbeiroId || !dataHora) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  }

  const dataAgendamento = new Date(dataHora);
  const agora = new Date();

  // VALIDACAO 1: Impede agendamentos no passado
  if (dataAgendamento < agora) {
    return res.status(400).json({ erro: "Não é possível realizar agendamentos em horários passados." });
  }

  // VALIDACAO 2: Procura se já existe um agendamento para o MESMO barbeiro no MESMO horário
  const horarioOcupado = agendamentos.some(agendamento => 
    agendamento.barbeiroId === barbeiroId && 
    agendamento.dataHora === dataHora
  );

  if (horarioOcupado) {
    return res.status(400).json({ erro: "Este profissional já possui um agendamento neste horário." });
  }

  const novoAgendamento = {
    id: String(agendamentos.length + 1),
    clienteId,
    barbeariaId,
    servicoId,
    barbeiroId,
    dataHora,
    status: "confirmado"
  };

  agendamentos.push(novoAgendamento);
  res.status(201).json(novoAgendamento);
});

app.get('/agendamentos', (req, res) => {
  res.json(agendamentos);
});

// Outra rota útil: Listar agendamentos de um cliente específico
app.get('/agendamentos/cliente/:clienteId', (req, res) => {
  const filtrados = agendamentos.filter(a => a.clienteId === req.params.clienteId);
  res.json(filtrados);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});