package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/")

	// Debug info
	wd, _ := os.Getwd()

	// List files for debugging (only if path is "debug")
	if path == "debug" {
		var filesList []string
		filepath.Walk(".", func(p string, info os.FileInfo, err error) error {
			if err == nil && !info.IsDir() {
				filesList = append(filesList, p)
			}
			return nil
		})
		debugInfo := "\nWD: " + wd + "\nFiles: " + strings.Join(filesList, ", ")
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Debug Info:" + debugInfo))
		return
	}

	debugInfo := "\nPath: " + path + "\nWD: " + wd

	// Rota para listar provas
	if path == "exams" || strings.HasSuffix(path, "/exams") {
		if r.Method != http.MethodGet {
			http.Error(w, "Método não permitido"+debugInfo, http.StatusMethodNotAllowed)
			return
		}
		serveJSON(w, "api/data/exams.json", debugInfo)
		return
	}

	// Rota para detalhes da questão: exams/{year}/questions/{id}
	if strings.Contains(path, "exams/") {
		parts := strings.Split(path, "/")
		idx := -1
		for i, p := range parts {
			if p == "exams" {
				idx = i
				break
			}
		}

		if idx != -1 && len(parts) >= idx+4 && parts[idx+2] == "questions" {
			year := parts[idx+1]
			id := parts[idx+3]
			filePath := filepath.Join("api", "data", year, "questions", id, "details.json")
			serveJSON(w, filePath, debugInfo)
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
			filePath := filepath.Join("api", dataRelPath)
			serveFile(w, filePath, debugInfo)
			return
		}
	}

	http.Error(w, "Caminho não mapeado: "+path+debugInfo, http.StatusNotFound)
}

func serveJSON(w http.ResponseWriter, filePath string, debugInfo string) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Recurso não encontrado: "+filePath+debugInfo, http.StatusNotFound)
		} else {
			http.Error(w, "Erro interno do servidor: "+err.Error()+debugInfo, http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func serveFile(w http.ResponseWriter, filePath string, debugInfo string) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Arquivo não encontrado: "+filePath+debugInfo, http.StatusNotFound)
		} else {
			http.Error(w, "Erro interno ao ler arquivo: "+err.Error()+debugInfo, http.StatusInternalServerError)
		}
		return
	}

	// Tentar inferir o Content-Type pela extensão
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
