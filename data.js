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

const DEFAULT_DATA = {
  hero: {
    eyebrow: 'Available for opportunities',
    name: 'Your Name',
    initials: 'YN',
    role: 'Computer Science Engineer — AI & Data Science',
    pitch: 'I build machine learning systems that turn messy real-world data into something useful — from NLP pipelines to computer vision models, shipped and documented on GitHub.',
    stats: [
      { num: '8.9', lbl: 'CGPA' },
      { num: '6+', lbl: 'Projects' },
      { num: '6', lbl: 'Certificates' },
      { num: '2', lbl: 'Publications' },
    ],
  },
  about: {
    bio: 'I\'m a final-year engineering student focused on AI and data science, drawn to problems where messy real-world data meets a genuinely useful outcome. I\'ve trained models across NLP and computer vision, contributed to two research write-ups, and enjoy the moment a system finally does what it was supposed to. Outside coursework, I ship small tools and read papers slower than I should.',
    quote: 'Good models are built twice: once to make them work, once to make them trustworthy.',
  },
  skills: ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision', 'SQL', 'Data Analysis', 'Git'],
  sections: [
    {
      id: 'projects', title: 'Projects', subtitle: 'Most projects link directly to their GitHub repository.', kind: 'cards',
      items: [
        { title: 'AI-powered chatbot with NLP', description: 'Transformer-based conversational agent with multi-intent classification and context retention across sessions.', meta: '2024', link: 'https://github.com/yourhandle/chatbot-nlp', tags: ['Python', 'HuggingFace', 'Flask'] },
        { title: 'Image classification using CNN', description: 'CNN trained from scratch on a custom dataset, 94.3% test accuracy, with transfer-learning comparison.', meta: '2023', link: 'https://github.com/yourhandle/cnn-classifier', tags: ['TensorFlow', 'Keras', 'OpenCV'] },
        { title: 'Crop disease detection', description: 'Mobile-friendly CNN for detecting plant disease from leaf images, deployed as a lightweight web demo.', meta: '2023', link: 'https://github.com/yourhandle/crop-disease', tags: ['PyTorch', 'ONNX'] },
        { title: 'Realtime object tracking', description: 'YOLO-based pipeline for multi-object tracking on live video, benchmarked against three trackers.', meta: '2022', link: 'https://github.com/yourhandle/object-tracking', tags: ['YOLO', 'OpenCV'] },
      ],
    },
    {
      id: 'education', title: 'Education', subtitle: 'Academic record.', kind: 'timeline',
      items: [
        { title: 'B.Tech — CSE (AI & Data Science)', description: 'Your University · Kolkata', meta: '2021 – 2025 · CGPA 8.9/10', link: '', tags: [] },
        { title: 'Higher Secondary (Class XII)', description: 'Your School · WBCHSE · PCM + Computer Science', meta: '2021 · 92.4%', link: '', tags: [] },
        { title: 'Secondary (Class X)', description: 'Your School · WBBSE', meta: '2019 · 94.1%', link: '', tags: [] },
      ],
    },
    {
      id: 'certifications', title: 'Certifications', subtitle: 'Courses & achievements.', kind: 'cards',
      items: [
        { title: 'Machine Learning Specialization', description: 'Coursera · Andrew Ng', meta: '2023', link: '', tags: [] },
        { title: 'Deep Learning Specialization', description: 'Coursera · deeplearning.ai', meta: '2023', link: '', tags: [] },
        { title: 'Python for Data Science', description: 'IBM · edX', meta: '2022', link: '', tags: [] },
        { title: 'Hackathon — 2nd place', description: 'College Tech Fest', meta: '2023', link: '', tags: [] },
      ],
    },
    {
      id: 'research', title: 'Research', subtitle: 'Papers & reading.', kind: 'cards', hasNotes: true,
      items: [
        { title: 'Sentiment analysis with transformer models', description: 'Comparative study of BERT, RoBERTa and DistilBERT on 50k labelled social posts. Under review.', meta: '2024', link: '', tags: ['NLP', 'Transformers'] },
        { title: 'Attention Is All You Need — Vaswani et al.', description: 'Foundational transformer architecture paper. Reading list.', meta: '2017', link: 'https://arxiv.org/abs/1706.03762', tags: ['Reference'] },
        { title: 'BERT — Devlin et al.', description: 'Pre-training deep bidirectional transformers for language understanding. Reading list.', meta: '2019', link: 'https://arxiv.org/abs/1810.04805', tags: ['Reference'] },
      ],
    },
  ],
  hiddenSections: [],
  contact: {
    note: 'Open to internships, graduate roles, and research collaborations.',
    links: [
      { title: 'Email', link: 'mailto:you@example.com', icon: 'mail' },
      { title: 'GitHub', link: 'https://github.com/yourhandle', icon: 'github' },
      { title: 'LinkedIn', link: 'https://linkedin.com', icon: 'linkedin' },
    ],
  },
};

function loadPortfolioData(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }
  catch(e){ console.warn('Using default data.', e); }
  return structuredClone(DEFAULT_DATA);
}

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
    projects: withIds(findSection('projects')),
    education: withIds(findSection('education')),
    certifications: withIds(findSection('certifications')),
    research: withIds(findSection('research')),
    contactLinks: data.contact.links,
  };
}
