import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, FileText, Target, Filter, Image, Music, Video, AlertCircle, BarChart3, Loader2 } from "lucide-react";
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
      return <Badge className="bg-success/20 text-success border border-success/30">Authentic</Badge>;
    } else if (score >= 30) {
      return <Badge className="bg-warning/20 text-warning border border-warning/30">Suspicious</Badge>;
    } else {
      return <Badge className="bg-destructive/20 text-destructive border border-destructive/30">Fake</Badge>;
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

  const totalAnalyses = analyses.length;
  const avgAuthenticityScore = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.authenticity_score, 0) / analyses.length)
    : 0;
  const authenticCount = analyses.filter(a => a.authenticity_score >= 70).length;

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

  const contentTypeData = ["text", "image", "video", "audio"].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: analyses.filter(a => a.content_type === type).length
  })).filter(item => item.value > 0);

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

  const COLORS = ["hsl(280, 100%, 65%)", "hsl(180, 100%, 50%)", "hsl(160, 100%, 45%)", "hsl(45, 100%, 55%)"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(280_100%_65%/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(280_100%_65%/0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-black tracking-tight">
                  <span className="text-gradient">ANALYTICS</span>
                  <span className="text-foreground"> DASHBOARD</span>
                </h1>
              </div>
              <p className="text-muted-foreground">Overview of your content analysis history</p>
            </div>
            <TabsList className="bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger 
                value="overview"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Total Analyses", value: totalAnalyses, subtitle: "All time", icon: FileText },
                { title: "Avg Authenticity", value: `${avgAuthenticityScore}%`, subtitle: "Across all analyses", icon: Target },
                { title: "Authentic Content", value: authenticCount, subtitle: "Score ≥ 70%", icon: TrendingUp },
              ].map((stat, i) => (
                <div key={i} className="gradient-border group hover:scale-105 transition-all duration-500">
                  <div className="bg-card p-6 rounded-[calc(var(--radius)-1px)]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:glow-primary transition-all">
                        <stat.icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gradient mb-1">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend Chart */}
              <div className="gradient-border">
                <div className="bg-card p-6 rounded-[calc(var(--radius)-1px)]">
                  <h3 className="text-lg font-bold mb-1">Analysis Trend</h3>
                  <p className="text-sm text-muted-foreground mb-4">Last 7 days activity</p>
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
                        <Line type="monotone" dataKey="count" stroke="hsl(280, 100%, 65%)" strokeWidth={3} dot={{ fill: "hsl(280, 100%, 65%)" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>

              {/* Content Type Distribution */}
              <div className="gradient-border">
                <div className="bg-card p-6 rounded-[calc(var(--radius)-1px)]">
                  <h3 className="text-lg font-bold mb-1">Content Type Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-4">Analysis by content type</p>
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
                </div>
              </div>

              {/* Authenticity Score Distribution */}
              <div className="gradient-border lg:col-span-2">
                <div className="bg-card p-6 rounded-[calc(var(--radius)-1px)]">
                  <h3 className="text-lg font-bold mb-1">Authenticity Score Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-4">Distribution of authenticity scores across all analyses</p>
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
                        <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(280, 100%, 65%)" />
                            <stop offset="100%" stopColor="hsl(180, 100%, 50%)" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Filters */}
            <div className="gradient-border">
              <div className="bg-card p-6 rounded-[calc(var(--radius)-1px)]">
                <div className="flex items-center gap-3 mb-4">
                  <Filter className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-bold">Filters</h3>
                    <p className="text-sm text-muted-foreground">Filter your analysis history</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Content Type</label>
                    <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50">
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
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue placeholder="All scores" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50">
                        <SelectItem value="all">All Scores</SelectItem>
                        <SelectItem value="authentic">Authentic (70-100)</SelectItem>
                        <SelectItem value="suspicious">Suspicious (30-69)</SelectItem>
                        <SelectItem value="fake">Fake (0-29)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black">
                Analysis History <span className="text-muted-foreground font-normal text-lg">({filteredAnalyses.length})</span>
              </h2>

              {filteredAnalyses.length === 0 ? (
                <div className="gradient-border">
                  <div className="bg-card p-12 rounded-[calc(var(--radius)-1px)] flex flex-col items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-bold mb-2">No results found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or run a new analysis
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredAnalyses.map((analysis) => (
                    <div key={analysis.id} className="gradient-border group hover:scale-[1.01] transition-all duration-300">
                      <div className="bg-card p-6 rounded-[calc(var(--radius)-1px)]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary group-hover:glow-primary transition-all">
                              {getContentIcon(analysis.content_type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-bold capitalize">
                                  {analysis.content_type} Analysis
                                </h3>
                                {getStatusBadge(analysis.authenticity_score)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(analysis.created_at), "PPpp")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-gradient">
                              {analysis.authenticity_score}%
                            </div>
                            <div className="text-xs text-muted-foreground">Authenticity</div>
                          </div>
                        </div>
                        
                        {analysis.content_preview && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <h4 className="text-sm font-medium mb-1">Content Preview</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {analysis.content_preview}
                            </p>
                          </div>
                        )}
                        
                        {analysis.detailed_analysis && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-1">Analysis</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {analysis.detailed_analysis}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
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
