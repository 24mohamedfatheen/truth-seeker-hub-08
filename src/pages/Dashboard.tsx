import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, FileText, Target, Filter, Image, Music, Video, AlertCircle } from "lucide-react";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  id: string;
  content_type: string;
  authenticity_score: number;
  created_at: string;
  content_preview?: string;
  detailed_analysis?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please login to view your dashboard",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate, toast]);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from("analysis_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error("Error fetching analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter analyses based on selected filters
  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesContentType = contentTypeFilter === "all" || analysis.content_type === contentTypeFilter;
    
    let matchesScore = true;
    if (scoreFilter === "fake") {
      matchesScore = analysis.authenticity_score < 30;
    } else if (scoreFilter === "suspicious") {
      matchesScore = analysis.authenticity_score >= 30 && analysis.authenticity_score < 70;
    } else if (scoreFilter === "authentic") {
      matchesScore = analysis.authenticity_score >= 70;
    }
    
    return matchesContentType && matchesScore;
  });

  const getStatusBadge = (score: number) => {
    if (score >= 70) {
      return <Badge className="bg-success text-success-foreground">Authentic</Badge>;
    } else if (score >= 30) {
      return <Badge className="bg-warning text-warning-foreground">Suspicious</Badge>;
    } else {
      return <Badge className="bg-destructive text-destructive-foreground">Fake</Badge>;
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="h-5 w-5" />;
      case "image":
        return <Image className="h-5 w-5" />;
      case "audio":
        return <Music className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Calculate statistics
  const totalAnalyses = analyses.length;
  const avgAuthenticityScore = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.authenticity_score, 0) / analyses.length)
    : 0;
  const authenticCount = analyses.filter(a => a.authenticity_score >= 70).length;

  // Prepare trend data (last 7 days)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayAnalyses = analyses.filter(a => 
      format(new Date(a.created_at), "yyyy-MM-dd") === dateStr
    );
    return {
      date: format(date, "MMM dd"),
      count: dayAnalyses.length,
      avgScore: dayAnalyses.length > 0
        ? Math.round(dayAnalyses.reduce((sum, a) => sum + a.authenticity_score, 0) / dayAnalyses.length)
        : 0
    };
  });

  // Prepare content type distribution
  const contentTypeData = ["text", "image", "video", "audio"].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: analyses.filter(a => a.content_type === type).length
  })).filter(item => item.value > 0);

  // Prepare authenticity score distribution
  const scoreRanges = [
    { name: "0-20", min: 0, max: 20 },
    { name: "21-40", min: 21, max: 40 },
    { name: "41-60", min: 41, max: 60 },
    { name: "61-80", min: 61, max: 80 },
    { name: "81-100", min: 81, max: 100 }
  ];
  const scoreDistribution = scoreRanges.map(range => ({
    name: range.name,
    count: analyses.filter(a => a.authenticity_score >= range.min && a.authenticity_score <= range.max).length
  }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--muted))"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Overview of your content analysis history</p>
            </div>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalAnalyses}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Authenticity</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{avgAuthenticityScore}%</div>
              <p className="text-xs text-muted-foreground">Across all analyses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authentic Content</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{authenticCount}</div>
              <p className="text-xs text-muted-foreground">Score ≥ 70%</p>
            </CardContent>
          </Card>
        </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Trend</CardTitle>
                <CardDescription>Last 7 days activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Analyses",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Content Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Content Type Distribution</CardTitle>
                <CardDescription>Analysis by content type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Count",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {contentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Authenticity Score Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Authenticity Score Distribution</CardTitle>
                <CardDescription>Distribution of authenticity scores across all analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Count",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription>Filter your analysis history</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Content Type</label>
                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="text">News Article</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Authenticity Score</label>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="authentic">Authentic (70-100)</SelectItem>
                      <SelectItem value="suspicious">Suspicious (30-69)</SelectItem>
                      <SelectItem value="fake">Fake (0-29)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  Analysis History ({filteredAnalyses.length})
                </h2>
              </div>

              {filteredAnalyses.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">No results found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or run a new analysis
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredAnalyses.map((analysis) => (
                    <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              {getContentIcon(analysis.content_type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg capitalize">
                                  {analysis.content_type} Analysis
                                </CardTitle>
                                {getStatusBadge(analysis.authenticity_score)}
                              </div>
                              <CardDescription>
                                {format(new Date(analysis.created_at), "PPpp")}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-primary">
                              {analysis.authenticity_score}%
                            </div>
                            <div className="text-xs text-muted-foreground">Authenticity</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysis.content_preview && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Content Preview</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {analysis.content_preview}
                            </p>
                          </div>
                        )}
                        {analysis.detailed_analysis && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Analysis Details</h4>
                            <p className="text-sm text-muted-foreground">
                              {analysis.detailed_analysis}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
