package handler

import (
	"embed"
	"net/http"
	"path/filepath"
	"strings"
)

//go:embed data
var dataFS embed.FS

func Handler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/")

	// Rota para listar provas
	if path == "exams" || strings.HasSuffix(path, "/exams") {
		if r.Method != http.MethodGet {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}
		serveJSON(w, "data/exams.json")
		return
	}

	// Rota para detalhes do exame (lista de questões): exams/{year}
	if strings.Contains(path, "exams/") {
		parts := strings.Split(path, "/")
		idx := -1
		for i, p := range parts {
			if p == "exams" {
				idx = i
				break
			}
		}

		if idx != -1 && len(parts) == idx+2 {
			year := parts[idx+1]
			filePath := "data/" + year + "/details.json"
			serveJSON(w, filePath)
			return
		}

		// Rota para detalhes da questão: exams/{year}/questions/{id}
		if idx != -1 && len(parts) >= idx+4 && parts[idx+2] == "questions" {
			year := parts[idx+1]
			id := parts[idx+3]
			
			// Lidar com idiomas (ex: 1-ingles)
			lang := r.URL.Query().Get("lang")
			folderName := id
			if lang != "" {
				folderName = id + "-" + lang
			}

			filePath := "data/" + year + "/questions/" + folderName + "/details.json"
			serveJSON(w, filePath)
			return
		}
	}

	// Rota para arquivos estáticos: data/...
	if strings.Contains(path, "data/") {
		parts := strings.Split(path, "/")
		idx := -1
		for i, p := range parts {
			if p == "data" {
				idx = i
				break
			}
		}
		if idx != -1 {
			dataRelPath := strings.Join(parts[idx:], "/")
			filePath := "data/" + dataRelPath
			serveFile(w, filePath)
			return
		}
	}

	http.Error(w, "Caminho não encontrado: "+path, http.StatusNotFound)
}

func serveJSON(w http.ResponseWriter, filePath string) {
	data, err := dataFS.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Recurso não encontrado: "+filePath, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func serveFile(w http.ResponseWriter, filePath string) {
	data, err := dataFS.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Arquivo não encontrado: "+filePath, http.StatusNotFound)
		return
	}

	ext := filepath.Ext(filePath)
	contentType := "application/octet-stream"
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".svg":
		contentType = "image/svg+xml"
	case ".json":
		contentType = "application/json"
	}

	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
