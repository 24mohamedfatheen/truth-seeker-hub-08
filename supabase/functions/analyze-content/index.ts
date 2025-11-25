import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for database operations
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, content, fileData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SEARCH1API_KEY = Deno.env.get('SEARCH1API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing content type:', contentType);

    let analysisPrompt = '';
    let messages: any[] = [];

    switch (contentType) {
      case 'text':
        // Use search1api to verify news articles
        if (!SEARCH1API_KEY) {
          throw new Error('SEARCH1API_KEY is not configured');
        }

        console.log('Using search1api for news article verification');
        
        // Search for related articles using search1api
        const searchResponse = await fetch('https://api.search1api.com/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SEARCH1API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: content.substring(0, 500), // Use first 500 chars as search query
            max_results: 5,
            search_service: 'google'
          }),
        });

        if (!searchResponse.ok) {
          console.error('Search1API error:', searchResponse.status);
          throw new Error('Failed to verify article with search service');
        }

        const searchData = await searchResponse.json();
        const searchResults = searchData.results || [];
        
        // Analyze with AI using search results as context
        analysisPrompt = `Analyze this news article for authenticity using the search results provided.

Article:
${content}

Reference Sources:
${searchResults.map((r: any, i: number) => `${i + 1}. ${r.title} - ${r.snippet}`).join('\n')}

Evaluate: content accuracy vs sources, contradictions, language manipulation, credibility.

Return ONLY JSON (max 150 words in details, NO website recommendations):
{
  "authenticity": <0-100>,
  "status": "<authentic|suspicious|fake>",
  "details": "<concise explanation>",
  "searchResults": ${JSON.stringify(searchResults)}
}`;
        
        messages = [
          { role: 'system', content: 'Expert analyst. Return ONLY valid JSON. Be concise. Never recommend external verification tools.' },
          { role: 'user', content: analysisPrompt }
        ];
        break;

      case 'image':
        if (!fileData) {
          throw new Error('Image data is required');
        }
        
        analysisPrompt = `Analyze image authenticity. Check: manipulation artifacts, lighting inconsistencies, AI signatures, unnatural patterns.

Return ONLY JSON (max 100 words in details):
{
  "authenticity": <0-100>,
  "status": "<authentic|suspicious|fake>",
  "details": "<concise findings>"
}`;

        messages = [
          { 
            role: 'system', 
            content: 'Image forensics expert. Return ONLY valid JSON. Be concise.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: analysisPrompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: fileData
                } 
              }
            ]
          }
        ];
        break;

      case 'audio':
        analysisPrompt = `Analyze audio for deepfakes/manipulation. Check: quality consistency, noise patterns, speech naturalness, editing artifacts.

Return ONLY JSON (max 80 words in details):
{
  "authenticity": <0-100>,
  "status": "<authentic|suspicious|fake>",
  "details": "<concise analysis>"
}`;

        messages = [
          { role: 'system', content: 'Audio forensics expert. Return ONLY valid JSON. Be brief.' },
          { role: 'user', content: analysisPrompt }
        ];
        break;

      case 'video':
        analysisPrompt = `Analyze video for deepfakes/manipulation. Check: frame consistency, facial movements, lip-sync, lighting, edge artifacts.

Return ONLY JSON (max 80 words in details):
{
  "authenticity": <0-100>,
  "status": "<authentic|suspicious|fake>",
  "details": "<concise analysis>"
}`;

        messages = [
          { role: 'system', content: 'Video forensics expert. Return ONLY valid JSON. Be brief.' },
          { role: 'user', content: analysisPrompt }
        ];
        break;

      default:
        throw new Error('Invalid content type');
    }

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits depleted. Please add more credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse JSON response
    let result;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response
        result = {
          authenticity: 50,
          status: 'suspicious',
          details: aiResponse
        };
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      result = {
        authenticity: 50,
        status: 'suspicious',
        details: aiResponse
      };
    }

    // Save analysis to database
    try {
      const contentPreview = contentType === 'text' && content 
        ? content.substring(0, 200) 
        : `${contentType} analysis`;

      const { error: dbError } = await supabase
        .from('analysis_results')
        .insert({
          user_id: user.id, // Add user_id to the analysis
          content_type: contentType,
          authenticity_score: result.authenticity,
          detailed_analysis: result.details,
          manipulation_indicators: result.manipulationIndicators || [],
          content_preview: contentPreview,
        });

      if (dbError) {
        console.error("Error saving analysis to database:", dbError);
      } else {
        console.log("Analysis saved to database successfully");
      }
    } catch (dbSaveError) {
      console.error("Database save exception:", dbSaveError);
      // Don't fail the request if DB save fails
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Analysis failed',
        authenticity: 0,
        status: 'error',
        details: 'An error occurred during analysis. Please try again.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
