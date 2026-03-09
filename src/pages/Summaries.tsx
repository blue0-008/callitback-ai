import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Eye, Trash2, RefreshCw, FileText } from "lucide-react";
import { getSummaries, deleteSummary, getSubjectEmoji, SavedSummary } from "@/lib/summaryStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Summaries = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<SavedSummary[]>(getSummaries());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [viewingSummary, setViewingSummary] = useState<SavedSummary | null>(null);

  const modes = ["all", "tldr", "deep", "feynman"];
  const subjects = ["all", ...Array.from(new Set(summaries.map(s => s.subject)))];

  const filteredSummaries = summaries.filter(summary => {
    const matchesSearch = summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         summary.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = selectedMode === "all" || summary.mode === selectedMode;
    const matchesSubject = selectedSubject === "all" || summary.subject === selectedSubject;
    return matchesSearch && matchesMode && matchesSubject;
  });

  const handleDelete = (id: string) => {
    deleteSummary(id);
    setSummaries(getSummaries());
    toast.success("Summary deleted");
    if (viewingSummary?.id === id) {
      setViewingSummary(null);
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "tldr": return "TL;DR";
      case "deep": return "Deep Dive";
      case "feynman": return "Feynman";
      default: return mode;
    }
  };

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-semibold mt-6 mb-3 text-foreground">{line.replace('## ', '')}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.replace('### ', '')}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 mb-1 text-muted-foreground">{line.replace('- ', '')}</li>;
      } else if (line.trim() === '') {
        return <br key={i} />;
      } else {
        return <p key={i} className="mb-2 text-muted-foreground">{line}</p>;
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">My Summaries</h1>
        <p className="text-muted-foreground">All your saved summaries in one place</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search summaries by keyword or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => (
          <Badge
            key={mode}
            variant={selectedMode === mode ? "default" : "outline"}
            className={cn(
              "cursor-pointer capitalize",
              selectedMode === mode && "bg-primary text-primary-foreground"
            )}
            onClick={() => setSelectedMode(mode)}
          >
            {mode === "all" ? "All" : getModeLabel(mode)}
          </Badge>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        {subjects.map((subject) => (
          <Badge
            key={subject}
            variant={selectedSubject === subject ? "default" : "outline"}
            className={cn(
              "cursor-pointer capitalize",
              selectedSubject === subject && "bg-primary text-primary-foreground"
            )}
            onClick={() => setSelectedSubject(subject)}
          >
            {subject === "all" ? "All Subjects" : `${getSubjectEmoji(subject)} ${subject}`}
          </Badge>
        ))}
      </div>

      {/* Empty State */}
      {filteredSummaries.length === 0 && summaries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No summaries yet</h3>
          <p className="text-muted-foreground mb-4">Generate your first summary to get started</p>
          <Button onClick={() => navigate("/study")}>
            Generate your first summary →
          </Button>
        </div>
      )}

      {/* No Results */}
      {filteredSummaries.length === 0 && summaries.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No summaries match your filters</p>
        </div>
      )}

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSummaries.map((summary) => (
          <div
            key={summary.id}
            className="group relative border border-border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer bg-card"
            onClick={() => setViewingSummary(summary)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getSubjectEmoji(summary.subject)}</span>
                <span className="font-medium text-foreground capitalize">{summary.subject}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setViewingSummary(summary);
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(summary.id);
                  }} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    navigate("/study");
                    toast.info("Open Study page and generate a new summary");
                  }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="font-medium text-foreground mb-2 line-clamp-2">
              {summary.title}
            </h3>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                {getModeLabel(summary.mode)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(summary.dateCreated).toLocaleDateString()}
              </span>
              <span className="text-xs text-muted-foreground">
                · {summary.estimatedReadTime} min read
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* View Summary Dialog */}
      <Dialog open={!!viewingSummary} onOpenChange={() => setViewingSummary(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">{viewingSummary && getSubjectEmoji(viewingSummary.subject)}</span>
              {viewingSummary?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {viewingSummary && getModeLabel(viewingSummary.mode)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {viewingSummary && new Date(viewingSummary.dateCreated).toLocaleDateString()}
            </span>
            <span className="text-sm text-muted-foreground">
              · {viewingSummary?.estimatedReadTime} min read
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            {viewingSummary && formatContent(viewingSummary.content)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Summaries;
