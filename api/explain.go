package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type ExplainRequest struct {
	Title             string `json:"title"`
	Content           string `json:"content"`
	CorrectAlternative string `json:"correctAlternative"`
	Alternatives      []struct {
		Letter string `json:"letter"`
		Text   string `json:"text"`
	} `json:"alternatives"`
}

type OpenRouterRequest struct {
	Model    string `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenRouterResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req ExplainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao decodificar request: "+err.Error(), http.StatusBadRequest)
		return
	}

	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		http.Error(w, "Chave de API não configurada", http.StatusInternalServerError)
		return
	}

	// Criar o prompt para a LLM
	prompt := fmt.Sprintf(
		"Você é um professor especialista no ENEM. Explique de forma didática por que a alternativa %s é a correta para a seguinte questão:\n\n"+
		"Título: %s\n"+
		"Enunciado: %s\n\n"+
		"Alternativas:\n",
		req.CorrectAlternative, req.Title, req.Content,
	)

	for _, alt := range req.Alternatives {
		prompt += fmt.Sprintf("%s) %s\n", alt.Letter, alt.Text)
	}

	prompt += "\nPor favor, forneça uma explicação clara, passo a passo, focada nos conceitos cobrados na questão."

	// Chamar OpenRouter
	orReq := OpenRouterRequest{
		Model: "google/gemini-2.0-flash-001", // Modelo rápido e eficiente
		Messages: []Message{
			{Role: "user", Content: prompt},
		},
	}

	jsonData, _ := json.Marshal(orReq)
	
	clientReq, _ := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(jsonData))
	clientReq.Header.Set("Authorization", "Bearer "+apiKey)
	clientReq.Header.Set("Content-Type", "application/json")
	clientReq.Header.Set("HTTP-Referer", "https://questoes-enem.vercel.app") // Opcional para OpenRouter
	clientReq.Header.Set("X-Title", "ENEM API Browser") // Opcional

	client := &http.Client{}
	resp, err := client.Do(clientReq)
	if err != nil {
		http.Error(w, "Erro ao chamar LLM: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	
	if resp.StatusCode != http.StatusOK {
		http.Error(w, "Erro da API OpenRouter: "+string(body), resp.StatusCode)
		return
	}

	var orResp OpenRouterResponse
	if err := json.Unmarshal(body, &orResp); err != nil {
		http.Error(w, "Erro ao processar resposta da LLM", http.StatusInternalServerError)
		return
	}

	if len(orResp.Choices) == 0 {
		http.Error(w, "LLM não retornou resposta", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"explanation": orResp.Choices[0].Message.Content,
	})
}
