import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, ArrowUpDown, Shield, AlertCircle, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Source {
  title: string;
  url: string;
  snippet: string;
  credibilityScore: number;
  credibilityReason: string;
}

interface Claim {
  claim: string;
  verdict: 'verified' | 'contradicted' | 'unverified';
  explanation: string;
  sourceIndexes: number[];
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface ResultsState {
  authenticity: number;
  status: string;
  details: string;
  contentPreview: string;
  searchResults?: SearchResult[];
  sources?: Source[];
  claims?: Claim[];
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state as ResultsState;
  
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('desc');
  const [credibilityFilter, setCredibilityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  if (!results) {
    navigate("/");
    return null;
  }

  const isReal = results.status === "authentic" && results.authenticity >= 70;
  
  const getStatusIcon = () => {
    return isReal ? (
      <CheckCircle className="h-8 w-8 text-success" />
    ) : (
      <XCircle className="h-8 w-8 text-destructive" />
    );
  };

  const getStatusColor = () => {
    return isReal ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30";
  };

  const getStatusText = () => {
    return isReal ? "REAL" : "FAKE";
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return "bg-success/10 text-success border-success/30";
    if (score >= 60) return "bg-warning/10 text-warning border-warning/30";
    return "bg-destructive/10 text-destructive border-destructive/30";
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  };

  const getVerdictIcon = (verdict: 'verified' | 'contradicted' | 'unverified') => {
    switch (verdict) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'contradicted':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'unverified':
        return <HelpCircle className="h-5 w-5 text-warning" />;
    }
  };

  const getVerdictColor = (verdict: 'verified' | 'contradicted' | 'unverified') => {
    switch (verdict) {
      case 'verified':
        return "bg-success/10 text-success border-success/30";
      case 'contradicted':
        return "bg-destructive/10 text-destructive border-destructive/30";
      case 'unverified':
        return "bg-warning/10 text-warning border-warning/30";
    }
  };

  const getVerdictLabel = (verdict: 'verified' | 'contradicted' | 'unverified') => {
    switch (verdict) {
      case 'verified':
        return "Verified";
      case 'contradicted':
        return "Contradicted";
      case 'unverified':
        return "Unverified";
    }
  };

  const baseSources = results.sources || results.searchResults;
  
  const displaySources = useMemo(() => {
    if (!baseSources) return null;
    
    let filtered = baseSources;
    
    if (results.sources && credibilityFilter !== 'all') {
      filtered = filtered.filter((source) => {
        const src = source as Source;
        if (!('credibilityScore' in src)) return true;
        
        if (credibilityFilter === 'high') return src.credibilityScore >= 80;
        if (credibilityFilter === 'medium') return src.credibilityScore >= 60 && src.credibilityScore < 80;
        if (credibilityFilter === 'low') return src.credibilityScore < 60;
        return true;
      });
    }
    
    if (results.sources && sortOrder !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        const aScore = (a as Source).credibilityScore ?? 50;
        const bScore = (b as Source).credibilityScore ?? 50;
        return sortOrder === 'desc' ? bScore - aScore : aScore - bScore;
      });
    }
    
    return filtered;
  }, [baseSources, credibilityFilter, sortOrder, results.sources]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(280_100%_65%/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(280_100%_65%/0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analysis
        </Button>

        {/* Main Results Card */}
        <div className="gradient-border mb-6">
          <div className="bg-card p-8 rounded-[calc(var(--radius)-1px)]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-black tracking-tight">Analysis Results</h1>
              </div>
              {getStatusIcon()}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Verification Result</span>
                  <Badge className={`${getStatusColor()} text-lg px-4 py-2 border font-black`}>
                    {getStatusText()}
                  </Badge>
                </div>
                <div className={`w-full rounded-xl p-8 text-center border-2 ${
                  isReal ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
                }`}>
                  <p className={`text-3xl font-black ${isReal ? "text-success" : "text-destructive"}`}>
                    This content appears to be {isReal ? "REAL" : "FAKE"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    Confidence: <span className="font-bold text-foreground">{results.authenticity}%</span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">Analysis Summary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {results.details}
                </p>
              </div>

              {results.contentPreview && (
                <div>
                  <h3 className="font-bold mb-3 text-lg">Content Analyzed</h3>
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-border/50">
                    {results.contentPreview}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Claims Section */}
        {results.claims && results.claims.length > 0 && (
          <div className="gradient-border mb-6">
            <div className="bg-card p-8 rounded-[calc(var(--radius)-1px)]">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-black">Claim Verification Breakdown</h2>
                  <p className="text-sm text-muted-foreground">
                    Individual claims from the article checked against sources
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {results.claims.map((claim, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-5 ${getVerdictColor(claim.verdict)}`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {getVerdictIcon(claim.verdict)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-medium text-sm leading-relaxed">
                            "{claim.claim}"
                          </p>
                          <Badge className={`${getVerdictColor(claim.verdict)} border shrink-0`}>
                            {getVerdictLabel(claim.verdict)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {claim.explanation}
                        </p>
                        
                        {claim.sourceIndexes && claim.sourceIndexes.length > 0 && results.sources && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-medium mb-2 text-muted-foreground">
                              Referenced Sources:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {claim.sourceIndexes.map((sourceIdx) => {
                                const source = results.sources?.[sourceIdx];
                                if (!source) return null;
                                return (
                                  <a
                                    key={sourceIdx}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-lg hover:bg-primary/10 hover:border-primary/50 transition-all inline-flex items-center gap-1"
                                  >
                                    {source.title.substring(0, 40)}...
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sources Section */}
        {displaySources && displaySources.length > 0 && (
          <div className="gradient-border">
            <div className="bg-card p-8 rounded-[calc(var(--radius)-1px)]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black">Source Verification</h2>
                  <p className="text-sm text-muted-foreground">
                    Sources analyzed with credibility ratings
                  </p>
                </div>
                
                {results.sources && (
                  <div className="flex gap-2">
                    <div className="flex gap-1 border border-border/50 rounded-xl p-1 bg-secondary/30">
                      {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
                        <Button
                          key={filter}
                          variant={credibilityFilter === filter ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setCredibilityFilter(filter)}
                          className={`h-8 text-xs capitalize ${credibilityFilter === filter ? 'bg-gradient-to-r from-primary to-accent' : ''}`}
                        >
                          {filter}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : sortOrder === 'asc' ? 'none' : 'desc')}
                      className="h-8 gap-1 border-border/50"
                    >
                      <ArrowUpDown className="h-3 w-3" />
                      {sortOrder === 'desc' ? 'High→Low' : sortOrder === 'asc' ? 'Low→High' : 'Sort'}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {displaySources.map((source, index) => {
                  const sourceWithCredibility = source as Source;
                  const hasCredibility = 'credibilityScore' in source && typeof sourceWithCredibility.credibilityScore === 'number';
                  return (
                    <div
                      key={index}
                      className="border border-border/50 rounded-xl p-5 hover:bg-secondary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold flex-1">{source.title}</h4>
                            {hasCredibility && (
                              <Badge 
                                className={`${getCredibilityColor(sourceWithCredibility.credibilityScore)} border text-xs`}
                              >
                                {getCredibilityLabel(sourceWithCredibility.credibilityScore)} Credibility
                              </Badge>
                            )}
                          </div>
                          
                          {hasCredibility && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Credibility Score</span>
                                <span className="font-bold">{sourceWithCredibility.credibilityScore}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    sourceWithCredibility.credibilityScore >= 80
                                      ? "bg-gradient-to-r from-success to-accent"
                                      : sourceWithCredibility.credibilityScore >= 60
                                      ? "bg-gradient-to-r from-warning to-destructive"
                                      : "bg-gradient-to-r from-destructive to-primary"
                                  }`}
                                  style={{ width: `${sourceWithCredibility.credibilityScore}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground italic mt-2">
                                {sourceWithCredibility.credibilityReason}
                              </p>
                            </div>
                          )}
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {source.snippet}
                          </p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-accent transition-colors inline-flex items-center gap-1 font-medium"
                          >
                            View Source
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
