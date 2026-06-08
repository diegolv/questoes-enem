"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface Alternative {
  letter: string;
  text: string;
}

interface QuestionDetails {
  title: string;
  index: number;
  content: string;
  alternatives: Alternative[];
  correctAlternative: string;
  discipline: string;
  year: number;
  context?: string;
  files?: string[];
}

export default function QuestionPage({ params: paramsPromise }: { params: Promise<{ year: string; id: string }> }) {
  const params = use(paramsPromise);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [question, setQuestion] = useState<QuestionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const lang = searchParams.get("lang");
    const folderName = lang ? `${params.id}-${lang}` : params.id;
    const url = `/data/${params.year}/questions/${folderName}/details.json`;
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setQuestion(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching question:", err);
        setLoading(false);
      });
  }, [params.year, params.id, searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Questão não encontrada</h1>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  const handleCheck = () => {
    if (selectedAlternative) {
      setShowResult(true);
    }
  };

  const handleExplain = async () => {
    if (!question) return;
    
    setLoadingAI(true);
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: question.title,
          content: question.content,
          correctAlternative: question.correctAlternative,
          alternatives: question.alternatives,
        }),
      });

      if (!response.ok) throw new Error("Erro ao buscar explicação");
      
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao gerar a explicação com IA.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
      {/* Header / Nav */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">ENEM {question.year}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Questão {question.index}</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Question Content */}
        <Card className="mb-8 border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="capitalize">{question.discipline}</Badge>
              {searchParams.get("lang") && (
                <Badge className="bg-blue-600">{searchParams.get("lang")?.toUpperCase()}</Badge>
              )}
            </div>
            <CardTitle className="text-xl md:text-2xl leading-relaxed text-slate-800 dark:text-zinc-100 font-medium">
              {question.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 bg-white dark:bg-zinc-900">
            {/* Images if any */}
            {question.files && question.files.map((file, idx) => {
              const lang = searchParams.get("lang");
              const folderName = lang ? `${params.id}-${lang}` : params.id;
              return (
                <div key={idx} className="mb-6 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
                  <img 
                    src={`/data/${question.year}/questions/${folderName}/${file}`} 
                    alt={`Figura ${idx + 1}`}
                    className="w-full h-auto max-h-[500px] object-contain bg-slate-50"
                  />
                </div>
              );
            })}

            <div 
              className="prose prose-slate dark:prose-invert max-w-none text-lg text-slate-700 dark:text-zinc-300 leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: question.content.replace(/\n/g, '<br />') }}
            />

            {/* Alternatives */}
            <div className="space-y-3">
              {question.alternatives.map((alt) => {
                const isSelected = selectedAlternative === alt.letter;
                const isCorrect = alt.letter === question.correctAlternative;
                
                let variant = "border-slate-200 dark:border-zinc-800 hover:border-blue-400";
                if (isSelected) variant = "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
                if (showResult) {
                  if (isCorrect) variant = "border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500";
                  else if (isSelected) variant = "border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500";
                }

                return (
                  <button
                    key={alt.letter}
                    disabled={showResult}
                    onClick={() => setSelectedAlternative(alt.letter)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex gap-4 ${variant}`}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                    }`}>
                      {alt.letter}
                    </span>
                    <span className="text-slate-700 dark:text-zinc-200">{alt.text}</span>
                    
                    {showResult && isCorrect && (
                      <CheckCircle2 className="ml-auto text-green-600 w-6 h-6 flex-shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="ml-auto text-red-600 w-6 h-6 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-slate-100 dark:border-zinc-800 pt-8">
              {!showResult ? (
                <Button 
                  size="lg" 
                  onClick={handleCheck} 
                  disabled={!selectedAlternative}
                  className="w-full sm:w-auto px-12 bg-blue-600 hover:bg-blue-700 rounded-full h-12 text-base font-bold shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  Verificar Resposta
                </Button>
              ) : (
                <div className="flex flex-col gap-6 w-full">
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="flex-1 rounded-full h-12 border-2 gap-2"
                      onClick={() => {
                          setShowResult(false);
                          setSelectedAlternative(null);
                          setExplanation(null);
                      }}
                    >
                      Tentar Novamente
                    </Button>
                    <Button 
                      size="lg" 
                      onClick={handleExplain}
                      disabled={loadingAI || !!explanation}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-full h-12 gap-2 text-white font-bold shadow-lg shadow-purple-200 dark:shadow-none"
                    >
                      <Sparkles className={`w-5 h-5 ${loadingAI ? 'animate-pulse' : ''}`} />
                      {loadingAI ? "Gerando explicação..." : explanation ? "Explicação Gerada" : "Explicar com IA"}
                    </Button>
                  </div>

                  {explanation && (
                    <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                          <Sparkles className="w-4 h-4" />
                          <h3 className="font-bold text-sm uppercase tracking-tight">Explicação do Especialista</h3>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br />') }}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
