# Questões ENEM - API

Uma API robusta e independente desenvolvida em Go para servir questões das edições do ENEM (Exame Nacional do Ensino Médio). Este projeto fornece acesso programmatico a dados históricos do ENEM, incluindo enunciados, alternativas, respostas e imagens associadas.

## 🚀 Tecnologias

- **Linguagem:** Go (Golang)
- **Servidor HTTP:** Net/HTTP (Biblioteca padrão)
- **Armazenamento:** Arquivos JSON locais

## 📂 Estrutura do Projeto

```text
questoes-enem/
└───backend-go/
    ├───main.go        # Ponto de entrada e rotas da API
    ├───go.mod         # Gerenciamento de módulos Go
    ├───README.md      # Documentação específica do backend
    └───data/          # Repositório de dados (JSONs e Imagens)
        ├───exams.json # Lista consolidada de edições
        └───{ano}/     # Organização por ano e questão
```

## 🛠️ Endpoints da API

O servidor roda por padrão na porta `8081`.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/exams` | Lista todas as edições do ENEM e suas disciplinas. |
| `GET` | `/exams/{ano}/questions/{id}` | Retorna os detalhes completos de uma questão específica. |
| `GET` | `/data/{caminho}` | Serve recursos estáticos (imagens, figuras, etc). |

## 🏁 Como Executar

1. **Pré-requisitos:** Certifique-se de ter o [Go](https://golang.org/dl/) instalado.
2. **Navegue até o diretório:**
   ```bash
   cd backend-go
   ```
3. **Inicie o servidor:**
   ```bash
   go run main.go
   ```
4. **Acesse:** `http://localhost:8081/exams`

## 🧠 Futuras Integrações

Este projeto está sendo preparado para integração com LLMs via **OpenRouter**, permitindo funcionalidades como:
- Explicação detalhada de questões.
- Geração de dicas contextuais.
- Resumo de temas recorrentes por ano.

---
Desenvolvido para facilitar o estudo e acesso aos dados do ENEM.
