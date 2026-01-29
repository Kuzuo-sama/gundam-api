# Gundam Cards API

API REST otimizada para servir dados de cartas Gundam.

## 🚀 Funcionalidades

- ✅ Compressão GZIP automática
- ✅ Cache HTTP (1 hora)
- ✅ Cache em memória
- ✅ CORS habilitado
- ✅ Segurança com Helmet
- ✅ Filtro por set otimizado
- ✅ Estatísticas de dados

## 📦 Instalação

```bash
npm install
```

## 🏃 Executar Localmente

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

A API estará disponível em `http://localhost:3000`

## 🌐 Endpoints

### GET /health
Verifica o status da API
```json
{
  "status": "ok",
  "cardsLoaded": 800,
  "timestamp": "2026-01-29T..."
}
```

### GET /api/cards
Retorna todas as cartas
- Cache: 1 hora
- Compressão: GZIP
- Suporta `If-Modified-Since`

### GET /api/cards/set/:setId
Retorna cartas de um set específico
```
Exemplo: /api/cards/set/BT01
```

### GET /api/sets ⭐
Retorna lista de sets com imagens em base64
```json
[
  {
    "id": "EXB",
    "name": "EXB!",
    "image": "data:image/webp;base64,UklGRiQAAABXRUJQ..."
  }
]
```
✅ **Rápido**: Imagens já estão em base64 no `sets.json`

### GET /api/stats
Retorna estatísticas gerais
```json
{
  "totalCards": 800,
  "totalSets": 15,
  "lastUpdated": "..."
}
```

### POST /api/reload
Recarrega os dados do JSON (útil após updates)

## 📁 Estrutura

```
gundam-api/
├── server.js          # Servidor principal
├── package.json       # Dependências
├── data/
│   ├── cards.json    # Dados das cartas
│   └── sets.json     # Dados dos sets com imagens em base64
└── README.md
```

## 📝 Formato do sets.json

```json
[
  {
    "id": "EXB",
    "name": "EXB!",
    "image": "data:image/webp;base64,UklGRiQAAABXRUJQ..."
  },
  {
    "id": "EXBP",
    "name": "EXBP!",
    "image": "data:image/webp;base64,..."
  }
]
```

## 🔧 Configuração

### Variáveis de Ambiente
- `PORT`: Porta do servidor (padrão: 3000)

## 🚀 Deploy

### Railway
1. Conectar repositório GitHub
2. Railway detecta automaticamente o Node.js
3. Deploy automático!

### Render
1. Criar novo Web Service
2. Conectar repositório
3. Build Command: `npm install`
4. Start Command: `npm start`

### Fly.io
```bash
fly launch
fly deploy
```

## 💡 Otimizações Incluídas

1. **Compressão GZIP**: Reduz tamanho em ~70%
2. **Cache HTTP**: Evita redownloads desnecessários
3. **Cache em Memória**: JSON carregado uma vez
4. **If-Modified-Since**: Retorna 304 se dados não mudaram
5. **Helmet**: Headers de segurança automáticos

## 📊 Performance

Para 800 cartas (~2MB JSON):
- Com GZIP: ~300KB
- Com cache: 0KB (304 Not Modified)
- Tempo de resposta: <50ms

## 🔄 Atualizar Dados

1. Substituir `data/cards.json`
2. Fazer POST para `/api/reload`
3. Ou reiniciar servidor
