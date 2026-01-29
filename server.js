const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());

// CORS - permitir todas as origens (ajuste conforme necessário)
app.use(cors({
  origin: '*',
  methods: ['GET'],
  credentials: false
}));

// Compressão GZIP para reduzir tamanho da resposta
app.use(compression());

// Cache dos dados em memória
let cardsCache = null;
let lastModified = null;
let setsCache = null;

// Função para carregar dados do JSON
async function loadCards() {
  try {
    const jsonPath = path.join(__dirname, 'data', 'cards.json');
    const data = await fs.readFile(jsonPath, 'utf-8');
    const stats = await fs.stat(jsonPath);
    
    cardsCache = JSON.parse(data);
    lastModified = stats.mtime.toUTCString();
    
    console.log(`✅ Carregadas ${cardsCache.length} cartas do JSON`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao carregar cards.json:', error.message);
    return false;
  }
}

// Função para carregar sets do JSON
async function loadSets() {
  try {
    const jsonPath = path.join(__dirname, 'data', 'sets.json');
    const data = await fs.readFile(jsonPath, 'utf-8');
    
    setsCache = JSON.parse(data);
    
    console.log(`✅ Carregados ${setsCache.length} sets do JSON`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao carregar sets.json:', error.message);
    return false;
  }
}

// Carregar dados na inicialização
loadCards();
loadSets();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    cardsLoaded: cardsCache ? cardsCache.length : 0,
    timestamp: new Date().toISOString()
  });
});

// Endpoint principal - retorna todas as cartas
app.get('/api/cards', (req, res) => {
  // Se não há dados em cache, recarregar
  if (!cardsCache) {
    return res.status(503).json({ 
      error: 'Dados não disponíveis',
      message: 'Aguarde o carregamento dos dados' 
    });
  }

  // Headers de cache
  res.set({
    'Cache-Control': 'public, max-age=3600', // Cache de 1 hora
    'Last-Modified': lastModified,
    'X-Total-Cards': cardsCache.length
  });

  // Se cliente tem versão em cache válida
  const clientModified = req.headers['if-modified-since'];
  if (clientModified && clientModified === lastModified) {
    return res.status(304).end(); // Not Modified
  }

  res.json(cardsCache);
});

// Endpoint para buscar por set específico (otimizado)
app.get('/api/cards/set/:setId', (req, res) => {
  if (!cardsCache) {
    return res.status(503).json({ error: 'Dados não disponíveis' });
  }

  const { setId } = req.params;
  const filtered = cardsCache.filter(card => {
    if (card.id) {
      const cardSetId = card.id.split('-')[0];
      return cardSetId === setId;
    }
    return false;
  });

  res.set({
    'Cache-Control': 'public, max-age=3600',
    'X-Total-Cards': filtered.length
  });

  res.json(filtered);
});

// Endpoint para recarregar dados (útil para updates)
app.post('/api/reload', async (req, res) => {
  const cardsSuccess = await loadCards();
  const setsSuccess = await loadSets();
  
  if (cardsSuccess && setsSuccess) {
    res.json({ 
      message: 'Dados recarregados com sucesso',
      totalCards: cardsCache.length,
      totalSets: setsCache.length
    });
  } else {
    res.status(500).json({ error: 'Falha ao recarregar dados' });
  }
});

// Endpoint para estatísticas
app.get('/api/stats', (req, res) => {
  if (!cardsCache) {
    return res.status(503).json({ error: 'Dados não disponíveis' });
  }

  // Contar sets únicos
  const sets = new Set();
  cardsCache.forEach(card => {
    if (card.id) {
      const setId = card.id.split('-')[0];
      sets.add(setId);
    }
  });

  res.json({
    totalCards: cardsCache.length,
    totalSets: sets.size,
    lastUpdated: lastModified
  });
});

// Endpoint para listar sets com imagens em base64
app.get('/api/sets', (req, res) => {
  if (!setsCache) {
    return res.status(503).json({ error: 'Dados não disponíveis' });
  }

  res.set({
    'Cache-Control': 'public, max-age=3600',
    'X-Total-Sets': setsCache.length
  });

  res.json(setsCache);
});

// 404 para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    availableEndpoints: [
      'GET /health',
      'GET /api/cards',
      'GET /api/cards/set/:setId',
      'GET /api/sets',
      'GET /api/stats',
      'POST /api/reload'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
  console.log(`📊 Total de cartas: ${cardsCache ? cardsCache.length : 'carregando...'}`);
  console.log(`📦 Total de sets: ${setsCache ? setsCache.length : 'carregando...'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});
