/* ============================================================
   DATA.JS — single source of truth for portfolio content
   Shared by script.js (renders + edits the live page) and by
   owner/resume-builder.js (reads the same facts to build an
   ATS resume — never invents anything beyond what's here).
   Edit DEFAULT_DATA to set your real content before publishing.
   ============================================================ */
const STORAGE_KEY = 'portfolio-v3-data';
const NOTES_KEY   = 'portfolio-v3-notes';
const THEME_KEY   = 'portfolio-v3-theme';

// Snapshot of the live content (GET /api/content, 2026-10-15).
// Visitors normally get the live copy from the Worker; this is what they see
// if it can't be reached, so it must be real content, not template text.
const DEFAULT_DATA = {
  "hero": {
    "eyebrow": "Available for opportunities",
    "name": "RISHI SINGH",
    "initials": "RS",
    "role": "Computer Science Engineer + AI & Data Science",
    "pitch": "I build machine learning systems that turn messy real-world data into something useful — from NLP pipelines to computer vision models, shipped and documented on GitHub.",
    "stats": [
      {
        "num": "8.97",
        "lbl": "CGPA in B.Tech"
      },
      {
        "num": "9.69",
        "lbl": "CGPA in M.Tech (1st year)"
      },
      {
        "num": "12",
        "lbl": "Projects"
      }
    ],
    "terminalLine2": "Building: AI agents & ML systems, research to deployment",
    "terminalLine3": "Status: open to opportunities"
  },
  "about": {
    "bio": "I'm an M.Tech (AI & DS) student at IIT (ISM) Dhanbad, drawn to problems where messy real-world data meets a genuinely useful outcome. I've trained models across ML, DL, NLP and computer vision, working on a research topic, and enjoy the moment a system finally does what it was supposed to. Outside coursework, I read research papers slower than I should.",
    "quote": "Good models are built twice: once to make them work, once to make them trustworthy."
  },
  "skills": [
    "Python",
    "Machine Learning",
    "Deep Learning",
    "PyTorch",
    "TensorFlow",
    "NLP",
    "Computer Vision",
    "SQL",
    "Data Analysis",
    "Git",
    "Java",
    "C"
  ],
  "sections": [
    {
      "id": "ai-tools-known-1784959721752",
      "title": "AI Tools Known",
      "subtitle": "Tools I use regularly in my workflow",
      "kind": "showcase",
      "items": [
        {
          "title": "Claude Code",
          "description": "",
          "link": "https://claude.ai",
          "meta": "",
          "tags": []
        },
        {
          "title": "ChatGPT",
          "description": "",
          "link": "https://chatgpt.com",
          "meta": "",
          "tags": []
        },
        {
          "title": "Emergent",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Google AI Studio",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Perplexity",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Grok",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Kimi",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Wispr Flow",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "GLM 5.2",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "NotebookLM",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Google Flow",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        }
      ]
    },
    {
      "id": "projects",
      "title": "AI & ML Projects",
      "subtitle": "Machine learning, deep learning and LLM systems. Each card links to its GitHub repository.",
      "kind": "cards",
      "items": [
        {
          "title": "MLOps Pipeline",
          "description": "End-to-end MLOps platform built in 6 phases: Airflow orchestration, MLflow experiment tracking, FastAPI serving with A/B testing and shadow mode, and Prometheus/Grafana monitoring with drift-triggered auto-retraining. Deployed on Kubernetes with HPA.",
          "link": "https://github.com/Rishichamp/mlops-pipeline",
          "meta": "2026 · Personal Project",
          "tags": [
            "Python",
            "Airflow",
            "MLflow",
            "FastAPI",
            "Docker",
            "Kubernetes"
          ]
        },
        {
          "title": "Deepfake Detection Platform",
          "description": "Multi-model deepfake detector combining EfficientNet-B4, Vision Transformer and CNN-LSTM, with a FastAPI backend, an AI explainability agent and a full training pipeline.",
          "link": "https://github.com/Rishichamp/deepfake-detection-platform",
          "meta": "2026 · Personal Project",
          "tags": [
            "Python",
            "PyTorch",
            "EfficientNet",
            "ViT",
            "FastAPI"
          ]
        },
        {
          "title": "AegisEdge — Real-Time Edge AI Surveillance",
          "description": "Detects intrusion, fights and theft in live video: YOLOv8 + ByteTrack tracking, LSTM behaviour classification and optical-flow fusion, on a real-time Flask/SocketIO dashboard. Runs on Jetson or Raspberry Pi via ONNX/TensorRT.",
          "link": "https://github.com/Rishichamp/AegisEdge-SmartSurveillance",
          "meta": "2026 · Personal Project",
          "tags": [
            "Python",
            "YOLOv8",
            "PyTorch",
            "OpenCV",
            "ONNX",
            "Edge AI"
          ]
        },
        {
          "title": "IEEE Fraud Detection",
          "description": "Fraud detection on 590k IEEE-CIS transactions: an ensemble of XGBoost, Isolation Forest, Autoencoder and a graph neural network. Best model AUC-ROC 0.959, with SHAP explanations and a Dockerised FastAPI service.",
          "link": "https://github.com/Rishichamp/ieee-fraud-detection",
          "meta": "2026 · Personal Project",
          "tags": [
            "Python",
            "XGBoost",
            "GNN",
            "SHAP",
            "FastAPI",
            "Docker"
          ]
        },
        {
          "title": "GNN Recommendation System",
          "description": "Movie recommender using LightGCN graph neural networks on MovieLens 100K, with anomaly detection on user behaviour.",
          "link": "https://github.com/Rishichamp/gnn-recommendation-system",
          "meta": "2026 · Personal Project",
          "tags": [
            "Python",
            "PyTorch",
            "LightGCN",
            "GNN",
            "RecSys"
          ]
        },
        {
          "title": "RAG Chatbot",
          "description": "Chat with PDFs using hybrid BM25 + FAISS retrieval (Reciprocal Rank Fusion), multi-turn memory with question condensation, and source-cited answers. FastAPI + LangChain + Gemini.",
          "link": "https://github.com/Rishichamp/RAG-Chatbot",
          "meta": "2026 · Personal Project",
          "tags": [
            "Python",
            "LangChain",
            "FAISS",
            "Gemini",
            "FastAPI",
            "RAG"
          ]
        }
      ]
    },
    {
      "id": "software-engineering-projects",
      "title": "Software Engineering Projects",
      "subtitle": "Full-stack and mobile applications, built and shipped end to end.",
      "kind": "cards",
      "items": [
        {
          "title": "SecureAsset Vulnerability Manager (SAVM)",
          "description": "Full-stack asset and vulnerability management: CVE-linked findings with automatic risk scoring, an SLA engine with daily escalation, 5-role access control and tamper-proof audit logs. FastAPI + PostgreSQL (Supabase) + React, deployed on Render.",
          "link": "https://github.com/Rishichamp/SecureAsset-Vulnerability-Manager-SAVM-",
          "meta": "2026 · Group Project · ADBMS Course",
          "tags": [
            "Python",
            "FastAPI",
            "PostgreSQL",
            "React",
            "Supabase",
            "Security"
          ]
        },
        {
          "title": "Lumen — Research Retention Copilot",
          "description": "Upload papers, chat with them through RAG with page-level citations, and retain what you read with spaced-repetition review. FastAPI + PostgreSQL backend, Next.js/TypeScript frontend, local embeddings, Docker and CI with tests.",
          "link": "https://github.com/Rishichamp/lumen",
          "meta": "2026 · Personal Project",
          "tags": [
            "Python",
            "FastAPI",
            "PostgreSQL",
            "Next.js",
            "TypeScript",
            "RAG"
          ]
        },
        {
          "title": "Nexus OS — AI Second Brain",
          "description": "Full-stack knowledge app: instant LLM classification of notes, a live knowledge graph, and 5 specialist AI agents running in parallel to suggest your highest-impact next action. Next.js + Supabase.",
          "link": "https://github.com/Rishichamp/nexus-os",
          "meta": "2026 · Personal Project",
          "tags": [
            "TypeScript",
            "Next.js",
            "Supabase",
            "LLM",
            "Multi-Agent"
          ]
        },
        {
          "title": "ProHub — AI Productivity Assistant (Android)",
          "description": "Android app unifying tasks, schedule, fitness tracking and notification digests, with a Gemini voice/chat assistant and encrypted local storage (SQLCipher). Jetpack Compose + MVVM + Hilt.",
          "link": "https://github.com/Rishichamp/ProHub",
          "meta": "2026 · Personal Project",
          "tags": [
            "Kotlin",
            "Android",
            "Jetpack Compose",
            "Gemini",
            "Hilt",
            "Room"
          ]
        },
        {
          "title": "Daily Dose of DS — Automated Learning Site",
          "description": "Self-running pipeline that turns a daily newsletter into a 129-chapter learning site: reads the public archive, writes structured notes and infographics with Gemini, keeps history in SQLite, and deploys twice daily via GitHub Actions to GitHub Pages and Render. Self-healing, with failure alerts.",
          "link": "https://github.com/Rishichamp/daily-dose-site",
          "meta": "2026 · Personal Project · Live: rishichamp.github.io/daily-dose-site",
          "tags": [
            "Python",
            "Gemini",
            "GitHub Actions",
            "SQLite",
            "Automation"
          ]
        }
      ]
    },
    {
      "id": "minor-projects",
      "title": "Minor Projects",
      "subtitle": "Smaller builds and experiments.",
      "kind": "cards",
      "items": [
        {
          "title": "Visio — AI Visual Scanner",
          "description": "Progressive web app that turns your phone camera into an AI scanner powered by Gemini: 6 modes (identify, read text, nutrition, barcode, hazard check, quiz), voice in and out, works on any device.",
          "link": "https://github.com/Rishichamp/visio-ai-scanner",
          "meta": "2026 · Personal Project · Live: rishichamp.github.io/visio-ai-scanner",
          "tags": [
            "JavaScript",
            "PWA",
            "Gemini",
            "Computer Vision"
          ]
        }
      ]
    },
    {
      "id": "education",
      "title": "Education",
      "subtitle": "Academic record.",
      "kind": "timeline",
      "items": [
        {
          "title": "M.Tech — AI & DS",
          "description": "Indian Institute of Technology (ISM), Dhanbad",
          "link": "https://www.iitism.ac.in",
          "meta": "2025 – 2027 · CGPA 9.69/10 (1st year)",
          "tags": []
        },
        {
          "title": "B.Tech — CSE",
          "description": "Ramkrishna Mahato Government Engineering College, Purulia",
          "meta": "2021 – 2025 · CGPA 8.97/10",
          "link": "https://rkmgec.ac.in/",
          "tags": []
        },
        {
          "title": "Higher Secondary (Class XII)",
          "description": "St. Joseph & Mary's School, New Alipore, Kolkata · ISC · PCM + Computer Science",
          "meta": "2020 · 92.4%",
          "link": "https://stjms.in/",
          "tags": []
        },
        {
          "title": "Secondary (Class X)",
          "description": "Meghmala Roy Education Centre, Behala, Kolkata · ICSE",
          "meta": "2018 · 84.33%",
          "link": "https://meghmalaroy.com",
          "tags": []
        }
      ]
    },
    {
      "id": "b-tech-project-research-1783892799218",
      "title": "B TECH PROJECT/RESEARCH",
      "subtitle": "Rebuilt from scratch with honest, reproducible results.",
      "kind": "cards",
      "items": [
        {
          "title": "Source Camera Identification — Hybrid PRNU + CNN",
          "description": "A hybrid source-camera-identification system combining classical Sensor Pattern Noise (PRNU) correlation with a small CNN trained from scratch, fused via a logistic-regression meta-classifier. Achieves 94.58% test accuracy (92.17% ± 1.57% across 5-fold cross-validation), with the fused result beating either branch alone by a wide margin (CNN: 74.17%, PRNU: 80.00%) — evidence the two signals are genuinely complementary rather than one just carrying the other. Rebuilt from the original final-year version with a documented iteration history (root-caused bugs, design changes, and why), a full unit test suite, and CI — every reported number is regenerated automatically from the actual code, not hand-entered.",
          "link": "https://github.com/Rishichamp/hybrid-source-camera-identification",
          "meta": "Dataset - IEEE's Signal Processing Society Camera Model Identification dataset, hosted on Kaggle",
          "tags": [
            "Digital Forensics",
            "PRNU",
            "CNN",
            "Hybrid Model",
            "Reproducible ML"
          ]
        }
      ]
    },
    {
      "id": "research",
      "title": "Research Papers Read (Literature Survey)",
      "subtitle": "",
      "kind": "cards",
      "hasNotes": true,
      "items": [
        {
          "title": "Attention Is All You Need — Vaswani et al.",
          "description": "Foundational transformer architecture paper. Reading list.",
          "meta": "2017",
          "link": "https://arxiv.org/abs/1706.03762",
          "tags": [
            "Reference"
          ]
        },
        {
          "title": "BERT — Devlin et al.",
          "description": "Pre-training deep bidirectional transformers for language understanding. Reading list.",
          "meta": "2019",
          "link": "https://arxiv.org/abs/1810.04805",
          "tags": [
            "Reference"
          ]
        },
        {
          "title": "Color Separation in Forensic Image Processing",
          "description": "Introduces a color deconvolution technique to separate overlapping ink colors in documents and fingerprints, using vector decomposition in RGB space.",
          "link": "https://charles-berger.com/docs/2006_JFS-Color_Deconvolution-manuscript.pdf",
          "meta": "Berger, de Koeijer, Glas & Madhuizen · J. Forensic Sci. 2006",
          "tags": [
            "Color Deconvolution",
            "Document Forensics"
          ]
        },
        {
          "title": "Forensic Colour Differentiation of Ink Strokes using Image Processing",
          "description": "Compares ballpoint pen inks of similar color using Adobe Photoshop and Picasa-based image processing workflows, achieving separation in most samples tested.",
          "link": "https://forensics.org.my/mjofs/pdf/fssmVol.8No.1/Article%2005.pdf",
          "meta": "Saini & Kaur · Malaysian J. Forensic Sciences, 2018",
          "tags": [
            "Ink Differentiation",
            "Image Processing"
          ]
        },
        {
          "title": "Color Separation to Facilitate Handwriting Examination",
          "description": "Proposes a polynomial color-transformation method allowing more than one sample point per color class, improving on earlier three-point color deconvolution.",
          "link": "https://www.researchgate.net/publication/241632263_Color_separation_to_facilitate_handwriting_examination",
          "meta": "Schirripa Spagnolo, Calabrese & Ferrari · ISCCSP 2012",
          "tags": [
            "Polynomial Transform",
            "Handwriting"
          ]
        },
        {
          "title": "Color Deconvolution and Support Vector Machines",
          "description": "Combines SVM classification with color deconvolution to automatically determine separation parameters from sampled ink clusters, reducing manual guesswork.",
          "link": "https://charles-berger.com/docs/2009_Springer_LNCS-Color_Deconvolution_and_SVMs-manuscript.pdf",
          "meta": "Berger & Veenman · 2009",
          "tags": [
            "SVM",
            "Color Deconvolution",
            "Machine Learning"
          ]
        },
        {
          "title": "Color Separation in Forensic Image Processing Using Interactive Differential Evolution",
          "description": "Uses interactive differential evolution to optimize color-separation parameters based on human visual feedback, improving on manually-chosen parameters.",
          "link": "http://rahnamayan.ca/assets/documents/Color%20Separation%20in%20Forensic%20Image.pdf",
          "meta": "Mushtaq, Rahnamayan & Siddiqi · J. Forensic Sci. 2015",
          "tags": [
            "Differential Evolution",
            "Optimization"
          ]
        }
      ]
    },
    {
      "id": "current-research-1783233839726",
      "title": "Current Research",
      "subtitle": "My ongoing M.Tech research — recovering forensic handwriting hidden under scribbles.",
      "kind": "cards",
      "items": [
        {
          "title": "ML-Based Recovery of Handwriting Concealed by Pen Scribbles",
          "description": "Building an ML pipeline to recover handwriting hidden under ballpoint-pen scribbles for forensic use — scanned word crop → image restoration → TrOCR → structured Excel output. Designing a 1,920-sample dataset across 4 controlled scribble-intensity levels using a zero-annotation, paired-scan protocol, with entirely unseen pen brands held out for testing to measure genuine generalization. Corrects three design flaws in a prior lab approach: wrong task framing (segmentation instead of restoration), wrong ground truth (masks instead of paired clean scans), and testing only on easy cases.",
          "link": "",
          "meta": "M.Tech Research · In progress · Baseline phase",
          "tags": [
            "Computer Vision",
            "Image Restoration",
            "OCR",
            "Forensic Document Examination"
          ]
        },
        {
          "title": "Dataset Design: Paired-Scan Scribble Protocol",
          "description": "Designed a controlled dataset of 1,920 paired samples (1,680 train / 240 test) spanning 4 scribble-intensity levels — from a light single-pass stroke (~30% coverage) to a fully obscured word (~100% coverage) — enabling curriculum learning during training and per-level failure analysis. Ground truth comes from a zero-annotation paired-scan protocol: each page is scanned once before scribbling (clean reference) and once after (scribbled input) on the exact same physical sheet, guaranteeing pixel-perfect alignment without any manual labelling. Test-set pens (10 total) are from entirely different brands than the 14 training pens, isolating true out-of-distribution generalization rather than memorized pen signatures. All crops are stored as TIFF with LZW compression to preserve exact pixel values for restoration training, extracted automatically by a custom word-cropper tool using morphological detection.",
          "link": "",
          "meta": "1920 samples · 4 scribble-intensity levels · Zero manual annotation",
          "tags": [
            "Dataset Design",
            "Forensic Imaging",
            "Data Collection",
            "Generalization"
          ]
        }
      ]
    },
    {
      "id": "hobbies-1784354384292",
      "title": "Hobbies",
      "subtitle": "",
      "kind": "timeline",
      "items": [
        {
          "title": "Playing Football",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Watching Anime and movies",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Listening to music ",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        },
        {
          "title": "Listening to English short stories",
          "description": "",
          "link": "",
          "meta": "",
          "tags": []
        }
      ]
    }
  ],
  "hiddenSections": [
    {
      "id": "certifications",
      "title": "Certifications",
      "subtitle": "Courses & achievements.",
      "kind": "cards",
      "items": [
        {
          "title": "Machine Learning Specialization",
          "description": "Coursera · Andrew Ng",
          "meta": "2023",
          "link": "",
          "tags": []
        },
        {
          "title": "Deep Learning Specialization",
          "description": "Coursera · deeplearning.ai",
          "meta": "2023",
          "link": "",
          "tags": []
        },
        {
          "title": "Python for Data Science",
          "description": "IBM · edX",
          "meta": "2022",
          "link": "",
          "tags": []
        },
        {
          "title": "Hackathon — 2nd place",
          "description": "College Tech Fest",
          "meta": "2023",
          "link": "",
          "tags": []
        }
      ]
    },
    {
      "id": "hobbies-1784354328067",
      "title": "Hobbies",
      "subtitle": "",
      "kind": "cards",
      "items": []
    }
  ],
  "contact": {
    "note": "Open to internships, graduate roles, and research collaborations.",
    "links": [
      {
        "title": "Email",
        "link": "mailto:rishi12345champ@gmail.com",
        "icon": "mail"
      },
      {
        "title": "GitHub",
        "link": "https://github.com/Rishichamp",
        "icon": "github"
      },
      {
        "title": "LinkedIn",
        "link": "http://www.linkedin.com/in/rishi-singh-5570aa255",
        "icon": "linkedin"
      },
      {
        "title": "Instagram",
        "link": "https://www.instagram.com/rishi13062002/?hl=en",
        "icon": "link"
      }
    ]
  }
};

function loadPortfolioData(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }
  catch(e){ console.warn('Using default data.', e); }
  return structuredClone(DEFAULT_DATA);
}

function contentApiUrl(){
  return (window.OWNER_WORKER_URL || 'https://your-worker-subdomain.workers.dev') + '/api/content';
}

/** Pulls the live content from the server (the same source every
 *  visitor's browser reads) so this page matches it regardless of
 *  what's cached locally. Never throws — if the Worker is slow,
 *  offline, or unreachable, the page just keeps whatever it already
 *  has (local cache or the bundled DEFAULT_DATA) and tries again
 *  next visit. Returns the fetched data, or null if nothing changed. */
async function syncPortfolioDataFromServer(onUpdated){
  try{
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(contentApiUrl(), { signal: controller.signal });
    clearTimeout(timeoutId);
    if(!res.ok) return null;
    const result = await res.json();
    if(result && result.found && result.data){
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data)); }catch(e){}
      if(onUpdated) onUpdated(result.data);
      return result.data;
    }
    if(result && result.found === false){
      // Nothing published to the server yet. If this browser is the
      // signed-in owner and already has real local content (not just
      // the bundled placeholder), publish it once — this is what
      // makes every other device start seeing it, with no manual step.
      const local = loadPortfolioData();
      const hasRealContent = local && local.hero && local.hero.name && local.hero.name !== 'Your Name'  /* template placeholder */;
      if(hasRealContent && window.OwnerAuth && await window.OwnerAuth.isAuthenticated()){
        pushPortfolioDataToServer(local);
      }
    }
  }catch(e){
    console.warn('Could not reach the content server — showing local/default content.', e);
  }
  return null;
}

/** Pushes the current content to the server. Silently does nothing if
 *  not signed in (this should only ever be called from Edit mode,
 *  which is itself gated behind Owner auth) or if the Worker can't be
 *  reached — the change is still safe locally either way, since
 *  saveData() always writes to localStorage first regardless. */
async function pushPortfolioDataToServer(data){
  const session = window.OwnerAuth && window.OwnerAuth.getSession && window.OwnerAuth.getSession();
  if(!session) return false;
  try{
    const res = await fetch(contentApiUrl(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify(data),
    });
    return res.ok;
  }catch(e){
    console.warn('Could not sync this change to the server. It is saved locally in this browser; try again once online, or re-save from this device later.', e);
    return false;
  }
}

/** Extra sections (besides 'projects') whose entries are projects. */
const PROJECT_SECTION_IDS = ['software-engineering-projects', 'minor-projects'];

/** Flattens DEFAULT/edited DATA into the shape the Resume Builder
 *  and the Worker's ATS prompt use, with stable ids for cross-refs. */
function buildCandidateProfile(data){
  const findSection = (id) => data.sections.find(s => s.id === id);
  const withIds = (section) => (section?.items || []).map((item, i) => ({ id: `${section.id}-${i}`, ...item }));
  return {
    name: data.hero.name,
    role: data.hero.role,
    pitch: data.hero.pitch,
    bio: data.about.bio,
    skills: data.skills,
    // Projects are split across several sections (AI & ML, Software
    // Engineering, Minor), so gather every one of them, not just 'projects'.
    projects: data.sections
      .filter(s => s.id === 'projects' || PROJECT_SECTION_IDS.includes(s.id))
      .flatMap(withIds),
    education: withIds(findSection('education')),
    certifications: withIds(findSection('certifications')),
    research: withIds(findSection('research')),
    contactLinks: data.contact.links,
  };
}
