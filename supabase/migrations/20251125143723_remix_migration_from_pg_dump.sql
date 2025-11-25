CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: content_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_type AS ENUM (
    'text',
    'image',
    'audio',
    'video'
);


SET default_table_access_method = heap;

--
-- Name: analysis_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    content_type public.content_type NOT NULL,
    authenticity_score integer NOT NULL,
    detailed_analysis text NOT NULL,
    manipulation_indicators text[] DEFAULT '{}'::text[],
    content_preview text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT analysis_results_authenticity_score_check CHECK (((authenticity_score >= 0) AND (authenticity_score <= 100)))
);


--
-- Name: analysis_results analysis_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_results
    ADD CONSTRAINT analysis_results_pkey PRIMARY KEY (id);


--
-- Name: idx_analysis_results_content_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_content_type ON public.analysis_results USING btree (content_type);


--
-- Name: idx_analysis_results_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_created_at ON public.analysis_results USING btree (created_at DESC);


--
-- Name: idx_analysis_results_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_user_id ON public.analysis_results USING btree (user_id);


--
-- Name: analysis_results analysis_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_results
    ADD CONSTRAINT analysis_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: analysis_results Anyone can insert analysis results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert analysis results" ON public.analysis_results FOR INSERT WITH CHECK (true);


--
-- Name: analysis_results Users can delete their own analysis results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own analysis results" ON public.analysis_results FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: analysis_results Users can view their own analysis results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own analysis results" ON public.analysis_results FOR SELECT USING (((user_id IS NULL) OR (auth.uid() = user_id)));


--
-- Name: analysis_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


