"use client";

import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Filter, Search } from "lucide-react";
import Link from "next/link";

interface Exam {
  title: string;
  year: number;
  disciplines: { label: string; value: string }[];
  languages: { label: string; value: string }[];
}

interface Question {
  title: string;
  index: number;
  discipline: string;
  language?: string | null;
}

interface ExamDetails {
  questions: Question[];
}

export default function Home() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Fetch initial list of exams
  useEffect(() => {
    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        setExams(data);
        if (data.length > 0) {
          setSelectedYear(data[0].year.toString());
        }
        setLoadingExams(false);
      })
      .catch((err) => console.error("Error fetching exams:", err));
  }, []);

  // Fetch questions when year changes
  useEffect(() => {
    if (!selectedYear) return;

    setLoadingQuestions(true);
    fetch(`/api/exams/${selectedYear}`)
      .then((res) => res.json())
      .then((data: ExamDetails) => {
        setQuestions(data.questions);
        setLoadingQuestions(false);
      })
      .catch((err) => {
        console.error("Error fetching exam details:", err);
        setLoadingQuestions(false);
      });
  }, [selectedYear]);

  const currentExam = exams.find((e) => e.year.toString() === selectedYear);

  const filteredQuestions = questions.filter((q) => {
    const disciplineMatch = selectedDiscipline === "all" || q.discipline === selectedDiscipline;
    const languageMatch = selectedLanguage === "all" || q.language === selectedLanguage;
    return disciplineMatch && languageMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ENEM API Browser</h1>
          </div>
          <Badge variant="outline" className="font-mono">v1.0.0</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8">
        {/* Filters Section */}
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Filtros de Busca</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Year Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Ano da Edição</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.year} value={exam.year.toString()}>
                      ENEM {exam.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discipline Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Disciplina</label>
              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {currentExam?.disciplines.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Select (only if discipline is linguagens) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Idioma (Opcional)</label>
              <Select 
                value={selectedLanguage} 
                onValueChange={setSelectedLanguage}
                disabled={selectedDiscipline !== "linguagens" && selectedDiscipline !== "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Qualquer idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer idioma</SelectItem>
                  <SelectItem value="ingles">Inglês</SelectItem>
                  <SelectItem value="espanhol">Espanhol</SelectItem>
                  <SelectItem value="null">Nenhum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <p className="text-slate-500 text-sm">
              Encontramos <span className="font-bold text-slate-900 dark:text-white">{filteredQuestions.length}</span> questões
            </p>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loadingQuestions ? (
            Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
          ) : (
            filteredQuestions.map((q) => (
              <Link 
                key={`${q.index}-${q.language}`} 
                href={`/exams/${selectedYear}/questions/${q.index}${q.language ? `?lang=${q.language}` : ''}`}
                className="group"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-blue-400 group-hover:-translate-y-1 overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter">
                        Questão {q.index}
                      </Badge>
                      {q.language && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px]">
                          {q.language.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-bold line-clamp-1 text-slate-800 dark:text-zinc-100">
                      {q.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-slate-500 capitalize line-clamp-2">
                      {currentExam?.disciplines.find(d => d.value === q.discipline)?.label || q.discipline}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
