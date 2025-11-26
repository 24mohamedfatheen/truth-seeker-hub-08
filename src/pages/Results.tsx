import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Source {
  title: string;
  url: string;
  snippet: string;
  credibilityScore: number;
  credibilityReason: string;
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
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state as ResultsState;

  if (!results) {
    navigate("/");
    return null;
  }

  const isReal = results.status === "authentic" && results.authenticity >= 70;
  
  const getStatusIcon = () => {
    return isReal ? (
      <CheckCircle className="h-8 w-8 text-green-500" />
    ) : (
      <XCircle className="h-8 w-8 text-red-500" />
    );
  };

  const getStatusColor = () => {
    return isReal ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500";
  };

  const getStatusText = () => {
    return isReal ? "REAL" : "FAKE";
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-600 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    return "bg-red-500/10 text-red-600 border-red-500/30";
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  };

  // Use sources with credibility scores if available, otherwise fall back to searchResults
  const displaySources = results.sources || results.searchResults;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analysis
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Analysis Results</CardTitle>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Verification Result</span>
                <Badge className={`${getStatusColor()} text-lg px-4 py-2`}>
                  {getStatusText()}
                </Badge>
              </div>
              <div className={`w-full rounded-lg p-6 text-center ${
                isReal ? "bg-green-500/10 border-2 border-green-500/30" : "bg-red-500/10 border-2 border-red-500/30"
              }`}>
                <p className={`text-2xl font-bold ${isReal ? "text-green-600" : "text-red-600"}`}>
                  This content appears to be {isReal ? "REAL" : "FAKE"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Confidence: {results.authenticity}%
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Analysis Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                {results.details}
              </p>
            </div>

            {results.contentPreview && (
              <div>
                <h3 className="font-semibold mb-2">Content Analyzed</h3>
                <p className="text-sm text-muted-foreground bg-secondary p-4 rounded-md">
                  {results.contentPreview}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {displaySources && displaySources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Source Verification</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sources analyzed with credibility ratings
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displaySources.map((source, index) => {
                  const sourceWithCredibility = source as Source;
                  const hasCredibility = 'credibilityScore' in source && typeof sourceWithCredibility.credibilityScore === 'number';
                  return (
                    <div
                      key={index}
                      className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium flex-1">{source.title}</h4>
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
                                <span className="font-medium">{sourceWithCredibility.credibilityScore}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    sourceWithCredibility.credibilityScore >= 80
                                      ? "bg-green-500"
                                      : sourceWithCredibility.credibilityScore >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${sourceWithCredibility.credibilityScore}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground italic mt-2">
                                {sourceWithCredibility.credibilityReason}
                              </p>
                            </div>
                          )}
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {source.snippet}
                          </p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Results;
