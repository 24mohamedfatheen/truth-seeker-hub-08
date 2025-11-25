import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state as ResultsState;

  if (!results) {
    navigate("/");
    return null;
  }

  const getStatusIcon = () => {
    if (results.status === "authentic") {
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    } else if (results.status === "suspicious") {
      return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
    }
    return <XCircle className="h-8 w-8 text-red-500" />;
  };

  const getStatusColor = () => {
    if (results.status === "authentic") return "bg-green-500/10 text-green-500";
    if (results.status === "suspicious") return "bg-yellow-500/10 text-yellow-500";
    return "bg-red-500/10 text-red-500";
  };

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
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Authenticity Score</span>
                <Badge className={getStatusColor()}>
                  {results.status.toUpperCase()}
                </Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    results.authenticity >= 70
                      ? "bg-green-500"
                      : results.authenticity >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${results.authenticity}%` }}
                />
              </div>
              <p className="text-right text-sm text-muted-foreground mt-1">
                {results.authenticity}%
              </p>
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

        {results.searchResults && results.searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Source Verification</CardTitle>
              <p className="text-sm text-muted-foreground">
                Related articles found during verification
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{result.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.snippet}
                        </p>
                        <a
                          href={result.url}
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Results;
