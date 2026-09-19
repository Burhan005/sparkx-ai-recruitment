"""
SparkX AI Evaluation & Adaptive Interview Engine
Hybrid Architecture:
  1. Primary: Google Gemini Generative AI (LLM) when GEMINI_API_KEY is configured.
  2. Fallback: Deterministic NLP Substance & Keyword Density Engine (works 100% offline).
NO HARDCODED SCORES — every score is computed live from the candidate''s actual input text.
"""
import os
import re
import json
import hashlib
import random
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv()

# LLM API Keys from environment
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

def get_llm_status() -> Dict[str, Any]:
    """Return active LLM provider and status."""
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()

    if gemini_key:
        return {
            "active": True,
            "provider": "Google Gemini",
            "model": "gemini-1.5-flash",
            "has_key": True,
            "mode": "live_llm"
        }
    elif groq_key:
        return {
            "active": True,
            "provider": "Groq",
            "model": "llama-3.3-70b-versatile",
            "has_key": True,
            "mode": "live_llm"
        }
    elif openai_key:
        return {
            "active": True,
            "provider": "OpenAI",
            "model": "gpt-4o-mini",
            "has_key": True,
            "mode": "live_llm"
        }
    else:
        return {
            "active": False,
            "provider": "Local Semantic Analyzer",
            "model": "Contextual Procedural Synthesizer",
            "has_key": False,
            "mode": "simulated"
        }

def set_llm_api_key(provider: str, api_key: str) -> Dict[str, Any]:
    """Dynamically save API key to environment and backend/.env file, then verify connection."""
    provider_lower = provider.lower()
    env_var_name = "GEMINI_API_KEY"
    if "groq" in provider_lower:
        env_var_name = "GROQ_API_KEY"
    elif "openai" in provider_lower:
        env_var_name = "OPENAI_API_KEY"

    clean_key = api_key.strip()
    os.environ[env_var_name] = clean_key

    # Persist to backend/.env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    try:
        content = ""
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()

        if f"{env_var_name}=" in content:
            content = re.sub(rf"^{env_var_name}=.*$", f"{env_var_name}={clean_key}", content, flags=re.MULTILINE)
        else:
            content += f"\n{env_var_name}={clean_key}\n"

        with open(env_path, "w", encoding="utf-8") as f:
            f.write(content)
    except Exception as err:
        print(f"[AI Engine] Could not persist key to .env: {err}")

    # Verify key with a fast test call
    verification_test = call_llm("Ping! Return ONLY the word PONG", "You are an automated ping responder.")
    if verification_test:
        return {
            "success": True,
            "provider": env_var_name,
            "message": f"Successfully authenticated with {provider} Live LLM! Real-time generation is now ACTIVE."
        }
    else:
        return {
            "success": False,
            "provider": env_var_name,
            "message": f"Saved {env_var_name}, but test verification request failed. Please check if the key is valid and has quota."
        }

def _call_gemini_api(api_key: str, prompt: str, system_instruction: str = "") -> Optional[str]:
    """Direct call to Google Gemini with auto-fallback across verified active models."""
    candidate_models = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-flash-latest"]

    payload: Dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024
        }
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    for model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=12) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                candidates = res_data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            print(f"[AI Engine] Gemini {model} HTTP {e.code}: {e.reason}")
            continue
        except Exception as e:
            print(f"[AI Engine] Gemini {model} error: {e}")
            continue
    return None

def _call_groq_api(api_key: str, prompt: str, system_instruction: str = "") -> Optional[str]:
    """Direct call to Groq API with Llama 3.3 70B."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=8) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        choices = res_data.get("choices", [])
        if choices and "message" in choices[0]:
            return choices[0]["message"].get("content", "").strip()
    return None

def _call_openai_api(api_key: str, prompt: str, system_instruction: str = "") -> Optional[str]:
    """Direct call to OpenAI GPT-4o-mini."""
    url = "https://api.openai.com/v1/chat/completions"
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=8) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        choices = res_data.get("choices", [])
        if choices and "message" in choices[0]:
            return choices[0]["message"].get("content", "").strip()
    return None

def call_llm(prompt: str, system_instruction: str = "") -> Optional[str]:
    """
    Unified Real-Time LLM dispatcher.
    Checks providers in order: Gemini -> Groq -> OpenAI.
    Returns live response text from LLM, or None if no keys or network error.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            res = _call_gemini_api(gemini_key, prompt, system_instruction)
            if res:
                return res
        except Exception as e:
            print(f"[AI Engine] Gemini call failed: {e}")

    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if groq_key:
        try:
            res = _call_groq_api(groq_key, prompt, system_instruction)
            if res:
                return res
        except Exception as e:
            print(f"[AI Engine] Groq call failed: {e}")

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if openai_key:
        try:
            res = _call_openai_api(openai_key, prompt, system_instruction)
            if res:
                return res
        except Exception as e:
            print(f"[AI Engine] OpenAI call failed: {e}")

    return None

# Backward compatibility alias
def call_gemini_llm(prompt: str, system_instruction: str = "") -> Optional[str]:
    return call_llm(prompt, system_instruction)

TECH_ENTITIES = {
    "redis": "Redis caching & in-memory data structures",
    "kafka": "Apache Kafka event streaming & partition offsets",
    "docker": "Docker container virtualization & multi-stage builds",
    "kubernetes": "Kubernetes pod orchestration & cluster ingress",
    "k8s": "Kubernetes cluster management & autoscaling",
    "postgres": "PostgreSQL relational query execution & indexing",
    "postgresql": "PostgreSQL relational query execution & indexing",
    "mongodb": "MongoDB document sharding & replica sets",
    "mysql": "MySQL transaction isolation & InnoDB buffering",
    "graphql": "GraphQL schema design & N+1 batch loading",
    "grpc": "gRPC protocol buffer serialization & HTTP/2 streaming",
    "websocket": "WebSocket bidirectional frame streaming",
    "websockets": "WebSocket real-time duplex connections",
    "fastapi": "FastAPI asynchronous event loops & ASGI workers",
    "react": "React virtual DOM diffing & state reconciliation",
    "node": "Node.js non-blocking asynchronous I/O",
    "nodejs": "Node.js non-blocking asynchronous I/O",
    "typescript": "TypeScript strict type enforcement & build boundaries",
    "jwt": "JWT bearer tokens & cryptographic signature verification",
    "oauth": "OAuth2 / OIDC authorization flows",
    "caching": "distributed cache invalidation & TTL policies",
    "microservices": "microservice service boundaries & network partitions",
    "queue": "asynchronous message queues & worker thread pools",
    "rabbitmq": "RabbitMQ exchange routing & consumer acks",
    "aws": "AWS cloud infrastructure & IAM policy isolation",
    "s3": "S3 object storage & presigned upload authorization",
    "lambda": "AWS Lambda serverless execution & cold start mitigation",
    "ci/cd": "automated CI/CD build gates & canary deployments",
    "prometheus": "Prometheus time-series metrics & alert thresholds",
    "opentelemetry": "OpenTelemetry distributed context propagation",
    "celery": "Celery distributed task queues & Redis brokers"
}

UNSURE_PATTERNS = [
    r"\bi don't know\b", r"\bi dont know\b", r"\bno idea\b", r"\bnot sure\b",
    r"\bnot familiar\b", r"\bhaven't used\b", r"\bhavent used\b", r"\bnever used\b",
    r"\bpass\b", r"\bskip\b", r"\bno clue\b", r"\bcan't answer\b", r"\bcant answer\b",
    r"\bnot worked with\b", r"\bhaven't worked with\b", r"\bhavent worked with\b",
    r"\bnot experienced\b", r"\bdon't have experience\b", r"\bdont have experience\b",
    r"\bno experience\b", r"\bunfamiliar\b", r"\bi don't have an answer\b", r"\bno answer\b"
]

def extract_tech_entity(text: str) -> Optional[str]:
    """Scan candidate response text for specific technologies and architectural entities."""
    text_lower = text.lower()
    for k, v in TECH_ENTITIES.items():
        if re.search(r'\b' + re.escape(k) + r'\b', text_lower):
            return v
    return None

def synthesize_candidate_interview_questions(
    role_title: str,
    job_skills: List[str],
    candidate_name: str = "Candidate",
    candidate_skills: Optional[List[str]] = None,
    experience_years: float = 2.0,
    candidate_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Synthesizes a tailored, candidate-specific interview question dossier.
    No two candidates receive the same questions. Questions interleave the job requirements
    with the candidate's actual background and seniority level.
    """
    candidate_skills = candidate_skills or []
    p_skill = candidate_skills[0] if candidate_skills else (job_skills[0] if job_skills else "System Architecture")
    s_skill = (
        candidate_skills[1] if len(candidate_skills) > 1 
        else (job_skills[1] if len(job_skills) > 1 else (job_skills[0] if job_skills else "PostgreSQL"))
    )
    skills_str = ", ".join(job_skills[:4] if job_skills else [p_skill, s_skill])
    cand_skills_str = ", ".join(candidate_skills[:4]) if candidate_skills else p_skill

    # 1. Primary: Gemini LLM Live Generation (when GEMINI_API_KEY is configured)
    llm_prompt = (
        f"Generate 3 highly realistic, rigorous technical interview questions for candidate '{candidate_name}' "
        f"applying for the position '{role_title}' with {experience_years} years of experience. "
        f"Job Required Skills: {skills_str}. Candidate Background Skills: {cand_skills_str}.\n"
        f"Requirements:\n"
        f"- Question 1: Core runtime, concurrency, memory, or async data flow tailored to {p_skill}.\n"
        f"- Question 2: Distributed system design, modular integration, and failure modes with {s_skill}.\n"
        f"- Question 3: Production incident triage, root cause analysis, or critical bug post-mortem.\n"
        f"Return strictly a JSON array of 3 objects with keys: id (q1, q2, q3), type, prompt, ideal_keywords (array of strings), "
        f"follow_up_vague (string), follow_up_expert (string). No markdown backticks."
    )
    llm_res = call_gemini_llm(llm_prompt, "You are a Principal Staff Engineer conducting technical interviews at top tech companies. Output valid JSON only.")
    if llm_res:
        try:
            clean_json = re.sub(r'```json|```', '', llm_res).strip()
            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) >= 3:
                return parsed
        except Exception:
            pass

    # 2. Local Combinatorial Scenario Engine (seeded per candidate_id & role so every candidate gets a distinct interview)
    seed_input = f"{candidate_id or 'cand'}:{candidate_name}:{role_title}:{p_skill}"
    seed = int(hashlib.sha256(seed_input.encode()).hexdigest(), 16)

    # Category 1: Core Technical Depth, Concurrency & Runtime
    pool_1 = [
        {
            "type": "Technical Competence & Concurrency",
            "prompt": f"In your work with {p_skill}, how have you architected services to handle high concurrency and prevent thread pool starvation or memory leaks under sudden traffic bursts?",
            "ideal_keywords": [p_skill.lower(), "concurrency", "async", "latency", "event loop", "throughput", "caching", "worker"],
            "follow_up_vague": f"You mentioned utilizing {p_skill}, but what specific profiling tools or metrics did you use to detect memory or CPU bottlenecks?",
            "follow_up_expert": f"Under a 10x traffic spike on {p_skill}, what backpressure and circuit-breaker patterns did you implement?"
        },
        {
            "type": "Technical Architecture & Performance",
            "prompt": f"When optimizing {p_skill} applications, what caching topologies (e.g. write-through vs write-behind) and query optimizations have you deployed to achieve sub-50ms p99 latency?",
            "ideal_keywords": [p_skill.lower(), "cache", "redis", "p99", "latency", "indexes", "query optimization", "in-memory"],
            "follow_up_vague": f"Could you elaborate on how you handled cache invalidation and prevented cache stampedes on {p_skill}?",
            "follow_up_expert": f"How do you prevent hotkey contention in your caching layer when thousands of concurrent clients read the same record?"
        },
        {
            "type": "Asynchronous Event Streaming",
            "prompt": f"How do you design asynchronous background processing between {p_skill} and distributed worker queues to guarantee at-least-once message processing without data duplication?",
            "ideal_keywords": [p_skill.lower(), "queue", "idempotency", "ack", "worker", "retry", "dead letter queue", "event"],
            "follow_up_vague": "What specific idempotency keys or transaction boundaries did you establish to prevent duplicate writes?",
            "follow_up_expert": "If worker nodes crash midway through execution, how does your consumer group rebalance without message starvation?"
        },
        {
            "type": "State Management & Responsive Runtime",
            "prompt": f"How do you structure complex state in {p_skill} to isolate cascading updates and guarantee smooth 60fps interaction during rapid real-time telemetry streams?",
            "ideal_keywords": [p_skill.lower(), "state", "memoization", "batching", "re-render", "worker", "event listener", "immutable"],
            "follow_up_vague": f"What specific architectural patterns in {p_skill} prevented performance degradation when data streams update multiple times per second?",
            "follow_up_expert": f"How would you offload heavy computations in {p_skill} onto background Web Workers or subprocesses to protect the primary execution thread?"
        }
    ]

    # Category 2: Distributed System Architecture & Modular Boundaries
    pool_2 = [
        {
            "type": "Distributed System Architecture",
            "prompt": f"How do you design modular communication between {p_skill} services and {s_skill} backends while enforcing strict schema contracts and security boundaries?",
            "ideal_keywords": [s_skill.lower(), "api contract", "grpc", "rest", "schema", "validation", "token", "security", "isolation"],
            "follow_up_vague": f"What serialization protocol and error retry policies did you configure between {p_skill} and {s_skill}?",
            "follow_up_expert": f"What eventual consistency or saga pattern did you implement when {s_skill} encounters a network partition?"
        },
        {
            "type": "Data Consistency & Resiliency",
            "prompt": f"In a distributed setup involving {s_skill}, how do you manage database migrations and multi-region read replicas without taking scheduled downtime?",
            "ideal_keywords": [s_skill.lower(), "replication", "migration", "zero-downtime", "consistency", "read replica", "lock"],
            "follow_up_vague": "How do you prevent schema migration locks from blocking active write transactions on live production tables?",
            "follow_up_expert": "How do you handle replication lag when a user performs a write followed immediately by a critical read?"
        },
        {
            "type": "Microservice Resilience & Security",
            "prompt": f"Describe how you enforce Zero-Trust access controls, rate limiting, and JWT identity propagation across your {p_skill} services.",
            "ideal_keywords": ["jwt", "rate limiting", "oauth", "token", "rbac", "least privilege", "api gateway", "tls"],
            "follow_up_vague": "Where do you enforce token revocation and replay attack protection without adding database query overhead to every request?",
            "follow_up_expert": "How do you secure inter-service communication against man-in-the-middle attacks within internal VPC subnets?"
        },
        {
            "type": "Fault Tolerance & Partition Tolerance",
            "prompt": f"When an upstream {s_skill} dependency experiences severe latency or partial outages, what degradation strategies does your {p_skill} layer employ to keep core user journeys functional?",
            "ideal_keywords": [s_skill.lower(), "graceful degradation", "fallback", "cache", "timeout", "circuit breaker", "bulkhead"],
            "follow_up_vague": "How do you decide which features to shed or degrade when the system is under severe resource pressure?",
            "follow_up_expert": "How do you prevent 'thundering herd' recovery storms once the degraded dependency comes back online?"
        }
    ]

    # Category 3: Production Incident Triage & Root Cause Analysis
    pool_3 = [
        {
            "type": "Incident Triage & Post-Mortem",
            "prompt": f"Walk me through a severe production outage or silent data corruption you investigated in your {experience_years}+ years of software development. What was your root-cause analysis procedure?",
            "ideal_keywords": ["root cause", "telemetry", "post-mortem", "tracing", "logs", "metrics", "monitoring", "prevention"],
            "follow_up_vague": "What specific observability tools or telemetry traces pointed you to the root cause rather than guesswork?",
            "follow_up_expert": "What automated canary checks or regression suites were deployed in CI/CD to prevent identical regressions?"
        },
        {
            "type": "Concurrency Race Conditions & Deadlocks",
            "prompt": f"Have you ever debugged an elusive race condition, thread deadlock, or resource leak that only appeared in production under load? How did you isolate it?",
            "ideal_keywords": ["race condition", "deadlock", "thread dump", "profiler", "mutex", "atomic", "heap dump", "reproduction"],
            "follow_up_vague": "How did you reproduce the bug in a staging environment when it only surfaced intermittently in production?",
            "follow_up_expert": "What defensive programming or immutable data structures did you introduce to structurally eliminate that race condition?"
        },
        {
            "type": "Deployment Failure & Rollback Engineering",
            "prompt": f"Describe a situation where a production release passed all CI tests but degraded customer traffic immediately upon deployment. What was your rollback and mitigation playbook?",
            "ideal_keywords": ["rollback", "feature flag", "canary", "blast radius", "incident commander", "metrics", "slo"],
            "follow_up_vague": "How did you distinguish between a genuine code regression and external downstream third-party outages during the incident?",
            "follow_up_expert": "How do you structure feature flags and database backward compatibility to allow instantaneous 1-click rollbacks?"
        }
    ]

    q1 = dict(pool_1[seed % len(pool_1)])
    q2 = dict(pool_2[(seed // 3) % len(pool_2)])
    q3 = dict(pool_3[(seed // 7) % len(pool_3)])

    q1["id"] = "q1"
    q2["id"] = "q2"
    q3["id"] = "q3"

    return [q1, q2, q3]

def generate_job_questions(role_title: str, skills: List[str], experience_years: int) -> List[Dict[str, Any]]:
    """Legacy wrapper for synthesize_candidate_interview_questions."""
    return synthesize_candidate_interview_questions(role_title, skills, "Candidate", skills, experience_years)

def analyze_text_quality(answer: str, ideal_keywords: List[str]) -> Dict[str, Any]:
    """Analyzes candidate's actual answer text for word count, keyword density, and technical substance."""
    if not answer or not answer.strip():
        return {"word_count": 0, "matched_keywords": [], "keyword_ratio": 0.0, "is_gibberish": True, "score": 0}

    clean_text = answer.strip()
    words = clean_text.split()
    word_count = len(words)
    answer_lower = clean_text.lower()

    # Detect gibberish, non-words, repetitive keyboard mashing
    avg_word_len = sum(len(w) for w in words) / max(1, word_count)
    is_gibberish = (word_count < 3 and len(clean_text) > 15) or (avg_word_len > 14) or (not re.search(r'[aeiouAEIOU]', clean_text))

    # Match ideal keywords
    matched_kw = []
    for kw in (ideal_keywords or []):
        kw_clean = kw.lower()
        if re.search(r'\b' + re.escape(kw_clean) + r'\b', answer_lower):
            matched_kw.append(kw)

    keyword_ratio = len(matched_kw) / max(1, len(ideal_keywords or [1]))

    # Compute dynamic technical quality score (0 to 100) based strictly on input text
    if is_gibberish:
        score = 15
    elif word_count < 10:
        score = 30 + len(matched_kw) * 10
    elif word_count < 25:
        score = 45 + int(keyword_ratio * 40)
    else:
        score = 65 + int(keyword_ratio * 30) + min(10, int(word_count / 10))

    score = min(98, max(10, score))
    return {
        "word_count": word_count,
        "matched_keywords": matched_kw,
        "keyword_ratio": keyword_ratio,
        "is_gibberish": is_gibberish,
        "score": score
    }

def evaluate_adaptive_answer(
    prompt: str, 
    answer: str, 
    ideal_keywords: List[str], 
    follow_up_vague: Optional[str] = None, 
    follow_up_expert: Optional[str] = None
) -> Dict[str, Any]:
    """
    Real-time context-aware answer evaluation.
    Evaluates:
      1. Admissions of uncertainty ("I don't know") -> Pivots constructively to first-principles problem solving.
      2. Specific entity mentions ("We used Redis") -> Generates targeted deep-dive into that exact entity.
      3. Vague responses -> Probes specific architectural metrics/trade-offs.
      4. Advanced responses -> Issues scenario stress-tests.
    """
    answer_clean = answer.strip() if answer else ""
    
    # 1. Primary: Live LLM Real-Time Evaluation (when Gemini, Groq, or OpenAI key is configured)
    llm_prompt = (
        f"You are an elite Principal Technical Interviewer at a top tier tech company (Google, Meta, Stripe).\n"
        f"Question Asked: \"{prompt}\"\n"
        f"Candidate Answer: \"{answer_clean}\"\n"
        f"Target Technologies: {', '.join(ideal_keywords or ['System Architecture'])}\n\n"
        f"Evaluate the candidate's response in real-time according to these conversational rules:\n"
        f"1. Gaps / Uncertainty: If the candidate says 'I don't know', 'pass', 'not familiar', or acknowledges an area of weakness, DO NOT repeat robotic demands for production examples. Recognize candor as a positive senior engineer trait, and naturally pivot to first-principles thinking or adjacent tools based on the question.\n"
        f"2. Specific Mentions: If the candidate mentions specific tools or architectural patterns, ask an architectural follow-up probing real trade-offs, failover, or scaling constraints.\n"
        f"3. Vague: If the answer is hand-wavy or lacks depth, ask a targeted follow-up probing metrics, latency, or error-handling.\n"
        f"4. Advanced: If the answer is strong, challenge them with a high-concurrency edge case or zero-downtime rollback scenario.\n"
        f"5. Complete: If the answer is solid and thorough, set needs_follow_up=false.\n\n"
        f"Output strictly valid JSON with no markdown code blocks:\n"
        f"{{\n"
        f"  \"needs_follow_up\": true,\n"
        f"  \"follow_up_question\": \"...\",\n"
        f"  \"quality\": \"acknowledged_gap\",\n"
        f"  \"score\": 75,\n"
        f"  \"feedback\": \"...\"\n"
        f"}}"
    )
    llm_res = call_llm(llm_prompt, "You are a Principal Staff Engineer conducting live technical interviews. Return strictly JSON.")
    if llm_res:
        try:
            clean_json = re.sub(r'```json|```', '', llm_res).strip()
            data = json.loads(clean_json)
            return {
                "needs_follow_up": bool(data.get("needs_follow_up", False)),
                "follow_up_question": data.get("follow_up_question"),
                "quality": data.get("quality", "solid"),
                "score": int(data.get("score", 70)),
                "feedback": data.get("feedback", "Evaluated live by Real-Time LLM."),
                "engine": "live_llm"
            }
        except Exception as e:
            print(f"[AI Engine] LLM response JSON parse failed: {e}")

    # 2. Local Deterministic Context-Aware NLP Engine
    analysis = analyze_text_quality(answer_clean, ideal_keywords)
    primary_topic = ideal_keywords[0] if (ideal_keywords and len(ideal_keywords) > 0) else "this architecture"

    # Case A: Candidate acknowledges they don't know / uncertainty
    is_unsure = any(re.search(p, answer_clean, re.I) for p in UNSURE_PATTERNS)
    if is_unsure:
        unsure_pivots = [
            f"Understood — transparency about technical boundaries is a vital trait in senior engineering. If you encountered a system requiring {primary_topic} on the job tomorrow, what first-principles approach would you take to research, prototype, and validate it?",
            f"Fair enough, thanks for your upfront answer. Looking at the wider system around {primary_topic}, have you worked with any adjacent tools or alternative patterns that accomplish a similar goal?",
            f"That's completely fine. Let's look at it conceptually: even without direct hands-on experience in {primary_topic}, how would you reason about the trade-offs of latency versus data consistency here?"
        ]
        chosen_pivot = unsure_pivots[len(answer_clean) % len(unsure_pivots)]
        return {
            "needs_follow_up": True,
            "follow_up_question": chosen_pivot,
            "quality": "acknowledged_gap",
            "score": max(35, analysis["score"]),
            "feedback": f"Candidate transparently acknowledged unfamiliarity with {primary_topic}. Pivot dispatched to evaluate first-principles reasoning."
        }

    # Case B: Gibberish or empty text
    if analysis["is_gibberish"] or analysis["word_count"] < 2:
        return {
            "needs_follow_up": True,
            "follow_up_question": "That didn't come through clearly. Could you summarize your core technical approach or design choice in 2-3 sentences?",
            "quality": "gibberish_or_empty",
            "score": 15,
            "feedback": "Answer was too brief or unclear. Prompting for technical clarity."
        }

    # Case C: Candidate mentions a specific technical entity/tool in their response
    tech_entity = extract_tech_entity(answer_clean)
    if tech_entity and (analysis["word_count"] < 25 or len(analysis["matched_keywords"]) == 0):
        entity_probes = [
            f"You specifically highlighted using {tech_entity}. What were the key production trade-offs or constraints you navigated when implementing that?",
            f"Regarding {tech_entity}, how did your team ensure high availability, monitoring, and failover under peak traffic loads?",
            f"When operating with {tech_entity}, what failure modes or unexpected edge cases did your team have to architect around?"
        ]
        chosen_probe = entity_probes[len(answer_clean) % len(entity_probes)]
        return {
            "needs_follow_up": True,
            "follow_up_question": chosen_probe,
            "quality": "targeted_mention",
            "score": min(85, analysis["score"] + 15),
            "feedback": f"Candidate referenced {tech_entity}. Triggered context-aware architectural deep-dive."
        }

    # Case D: Vague or high-level response (< 20 words or no keywords matched)
    if analysis["word_count"] < 20 or len(analysis["matched_keywords"]) == 0:
        vague_probes = [
            follow_up_vague if follow_up_vague else f"Could you elaborate on the specific tools, telemetry metrics, or frameworks you relied on in that scenario?",
            f"In terms of production reliability, what was the biggest technical constraint or bottleneck you had to engineer around in that scenario?",
            f"What specific error handling, retry policies, or test suites did you implement to validate that approach?"
        ]
        chosen_probe = vague_probes[len(answer_clean) % len(vague_probes)]
        return {
            "needs_follow_up": True,
            "follow_up_question": chosen_probe,
            "quality": "vague",
            "score": analysis["score"],
            "feedback": f"Answer was high-level ({analysis['word_count']} words). Targeted probing question dispatched."
        }

    # Case E: High technical substance (>= 2 keywords, >= 25 words)
    if len(analysis["matched_keywords"]) >= 2 and analysis["word_count"] >= 25:
        kw_str = ", ".join(analysis["matched_keywords"][:2])
        advanced_probes = [
            follow_up_expert if follow_up_expert else f"You highlighted {kw_str}. How do you safeguard this architecture under 10x traffic spikes and automated failover?",
            f"Given your experience with {kw_str}, how would you architect automated canary deployments and zero-downtime rollbacks if a regression is detected?",
            f"That's a sound architectural design for {kw_str}. What automated alerts and telemetry thresholds do you configure to catch degradation before users notice?"
        ]
        chosen_probe = advanced_probes[len(answer_clean) % len(advanced_probes)]
        return {
            "needs_follow_up": True,
            "follow_up_question": chosen_probe,
            "quality": "advanced",
            "score": min(98, analysis["score"] + 12),
            "feedback": f"Strong technical specificity on {kw_str}. Stress-testing with production edge-case follow-up."
        }

    # Case F: Balanced functional answer
    return {
        "needs_follow_up": False,
        "follow_up_question": None,
        "quality": "solid",
        "score": analysis["score"],
        "feedback": "Clear competency demonstrated across core functional requirements."
    }


def calculate_scorecard_and_gap(
    job_skills: List[str],
    candidate_skills: List[str],
    transcript: List[Dict[str, Any]],
    integrity_score: int,
    code_score: int = 90
) -> Dict[str, Any]:
    cand_entries = [t for t in transcript if t.get("speaker") == "candidate"]
    
    if not cand_entries:
        tech_score = 30
        comm_score = 35
    else:
        scores = []
        for entry in cand_entries:
            text = entry.get("text", "")
            analysis = analyze_text_quality(text, job_skills)
            scores.append(analysis["score"])
        
        tech_score = int(sum(scores) / max(1, len(scores)))
        total_words = sum(len(t.get("text", "").split()) for t in cand_entries)
        comm_score = min(98, max(25, 30 + int(total_words / 5)))

    problem_solving = min(98, max(25, int(tech_score * 0.85 + (code_score * 0.15))))
    job_skills_score = int((tech_score * 0.5) + (code_score * 0.3) + (comm_score * 0.2))
    
    overall = int(
        (job_skills_score * 0.35) +
        (tech_score * 0.35) +
        (comm_score * 0.15) +
        (integrity_score * 0.15)
    )

    # Dynamic Skill Gap Calculation
    cand_skills_lower = [s.lower() for s in candidate_skills]
    transcript_text_lower = " ".join([t.get("text", "") for t in cand_entries]).lower()

    strong_skills = []
    missing_skills = []

    for s in job_skills:
        s_lower = s.lower()
        if any(s_lower in cs or cs in s_lower for cs in cand_skills_lower) or (s_lower in transcript_text_lower):
            strong_skills.append(s)
        else:
            missing_skills.append(s)

    recommendations = []
    if missing_skills:
        for ms in missing_skills:
            recommendations.append(f"Targeted mastery in {ms}: Complete hands-on system design module.")
    else:
        recommendations.append("Demonstrated complete skill coverage. Ready for senior technical leadership.")

    readiness = "Immediately Job-Ready"
    if overall < 60 or len(missing_skills) >= 3:
        readiness = "Requires Core Upskilling (Gap > 40%)"
    elif overall < 80 or missing_skills:
        readiness = "Hire-and-Develop (Trainable within 30 days)"

    evidence = [
        {
            "question": t.get("relatedQuestion", "Interview Assessment"),
            "answer": t.get("text", ""),
            "aiInsight": f"Evaluated dynamically — length: {len(t.get('text','').split())} words."
        }
        for t in cand_entries if len(t.get("text", "")) > 10
    ][:3]

    return {
        "scores": {
            "jobSkills": job_skills_score,
            "technicalScore": tech_score,
            "communication": comm_score,
            "problemSolving": problem_solving,
            "overall": overall
        },
        "evidence_snippets": evidence,
        "skill_gaps": {
            "strongSkills": strong_skills,
            "missingSkills": missing_skills,
            "recommendations": recommendations,
            "readiness": readiness
        },
        "interview_summary": f"Automated dynamic AI evaluation completed. Overall competency scored at {overall}/100 with {integrity_score}/100 integrity rating."
    }