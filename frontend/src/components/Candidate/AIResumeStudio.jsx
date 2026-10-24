import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import CustomDropdown from '../ui/CustomDropdown';
import FancyStudioDropdown from '../ui/FancyStudioDropdown';
import { 
  FileText, Sparkles, Plus, Trash2, Edit3, Save, Download, 
  CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Copy, Eye, 
  RotateCcw, History, Briefcase, GraduationCap, Award, FolderGit2, 
  ExternalLink, Printer, Check, X, RefreshCw, ChevronDown, 
  HelpCircle, ShieldCheck, ChevronRight, Layers, FileDown,
  User, Phone, Mail, MapPin, Globe, Link, Code2,
  Languages, Trophy, Heart, Camera, Palette, Upload,
  Type, List, Target, Crown, Terminal, Landmark, BookOpen, Zap,
  Columns, Layout, Image, Sliders, CheckSquare, Circle, Square,
  Building, Clock, BarChart3, Cpu, Feather, Rocket
} from 'lucide-react';

const RESUME_THEMES = [
  { 
    id: 'executive', 
    name: 'Executive Modern', 
    badge: 'Executive', 
    desc: 'Warm roasted amber accents, bold title hierarchy, refined header rule and gold indicator',
    icon: Crown
  },
  { 
    id: 'tech', 
    name: 'Silicon Valley Tech', 
    badge: 'Developer', 
    desc: 'Monospace comment tags (//), crisp syntax highlights, and developer badges',
    icon: Terminal
  },
  { 
    id: 'classic', 
    name: 'Wall Street Classic', 
    badge: 'Finance & Law', 
    desc: 'Timeless serif typography, centered contact bar, and formal double-rule dividers',
    icon: Landmark
  },
  { 
    id: 'minimal', 
    name: 'Nordic Minimalist', 
    badge: 'Clean Swiss', 
    desc: 'Ultra-thin hairline dividers, high white space, and Swiss grotesque precision',
    icon: Sparkles
  },
  { 
    id: 'creative', 
    name: 'Creative Studio', 
    badge: 'Design & UX', 
    desc: 'Bold left accent border, high-impact titles, and contemporary pill headers',
    icon: Palette
  },
  { 
    id: 'academic', 
    name: 'Academic & Research', 
    badge: 'Research', 
    desc: 'Formal publication structure, section symbols (§), and comprehensive citations',
    icon: BookOpen
  },
  { 
    id: 'compact', 
    name: 'Compact ATS Blitz', 
    badge: '1-Page ATS', 
    desc: 'Engineered high-density layout designed to fit full careers into a single page',
    icon: Zap
  },
  { 
    id: 'modernist', 
    name: 'Contemporary Luxe', 
    badge: 'Modern Leadership', 
    desc: 'Dual-tone header card, rounded section badges, and roasted amber hairlines',
    icon: Layers
  },
];

const LAYOUT_FORMATS = [
  {
    id: 'two_column_left',
    name: 'Modern 2-Column (Sidebar Left)',
    badge: 'Executive',
    desc: 'Full-width top hero header; tinted left sidebar for skills & contact; wide right column for experience',
    icon: Columns
  },
  {
    id: 'two_column_right',
    name: 'Modern 2-Column (Sidebar Right)',
    badge: 'Creative',
    desc: 'Full-width top hero header; wide left column for experience; clean right sidebar for skills & credentials',
    icon: Layout
  },
  {
    id: 'executive_banner',
    name: 'Executive Luxe Banner',
    badge: 'Leadership',
    desc: 'Full-width obsidian & gold banner with integrated photo and dual-column lower grid',
    icon: Crown
  },
  {
    id: 'tech_terminal',
    name: 'Silicon Tech Terminal',
    badge: 'Developer',
    desc: 'Terminal header with git branches, command prompts, syntax tags, and monospace log',
    icon: Terminal
  },
  {
    id: 'classic',
    name: 'Wall Street Classic (Harvard)',
    badge: 'Finance & Law',
    desc: 'Authoritative centered serif header, formal horizontal rules, and high-density academic flow',
    icon: Landmark
  },
  {
    id: 'minimal',
    name: 'Nordic Minimalist',
    badge: 'Clean Swiss',
    desc: 'Airy asymmetrical grid with hairline borders, generous negative space, and Swiss grotesque',
    icon: Sparkles
  },
  {
    id: 'creative',
    name: 'Creative Studio Ribbon',
    badge: 'Design & UX',
    desc: 'High-impact left accent color bar, modern section pills, and project card glow',
    icon: Palette
  },
  {
    id: 'compact',
    name: 'Compact ATS Blitz (1-Page)',
    badge: '1-Page ATS',
    desc: 'High-density space optimization engineered to fit complete multi-year careers on 1 page',
    icon: Zap
  },
  {
    id: 'modernist',
    name: 'Contemporary Luxe Card',
    badge: 'Modern Luxe',
    desc: 'Floating header card with dual-tone badges, roasted amber hairline dividers, and balanced columns',
    icon: Layers
  },
  {
    id: 'academic',
    name: 'Oxford Academic & Research',
    badge: 'Research & PhD',
    desc: 'Formal publication structure, section symbols (§), and comprehensive research citations',
    icon: BookOpen
  },
  {
    id: 'startup',
    name: 'Silicon Startup Velocity',
    badge: 'High Growth',
    desc: 'Dynamic accent badge header, metrics-first experience layout, and tech stack tags',
    icon: Rocket
  },
  {
    id: 'timeline',
    name: 'Modern Hybrid ATS Timeline',
    badge: 'Chronological',
    desc: 'Left-aligned chronological milestone rail with glowing status pins and connected career timeline',
    icon: Clock
  },
  {
    id: 'corporate',
    name: 'Fortune 500 Corporate Standard',
    badge: 'Enterprise',
    desc: 'Traditional institutional header, clean double-column skills matrix, and corporate hierarchy',
    icon: Building
  },
  {
    id: 'infographic',
    name: 'Infographic Clean Matrix',
    badge: 'Metrics First',
    desc: 'Visual metrics stats bar, credential badges, and high-contrast metric callouts',
    icon: BarChart3
  },
  {
    id: 'elegant',
    name: 'Parisian Luxe Editorial',
    badge: 'Luxury Serif',
    desc: 'Sophisticated luxury editorial layout, italicized company headings, and generous breathing room',
    icon: Feather
  },
  {
    id: 'engineering',
    name: 'Cloud Systems Architect',
    badge: 'DevOps & Systems',
    desc: 'Systems engineering layout with architectural skill groups, certifications grid, and project deliverables',
    icon: Cpu
  },
];

const PHOTO_POSITION_OPTIONS = [
  { value: 'right', label: 'Header Right', badge: 'Classic', desc: 'Standard top-right position beside contact info' },
  { value: 'left', label: 'Header Left', badge: 'Modern', desc: 'Leading top-left position before your name' },
  { value: 'sidebar', label: 'In Sidebar Column', badge: '2-Column', desc: 'Integrated top of the sidebar card' },
  { value: 'centered', label: 'Centered Header', badge: 'Editorial', desc: 'Centered above your name and headline' },
  { value: 'hidden', label: 'Hidden / Off', badge: 'ATS Clean', desc: 'Hide photo for blind or standard US ATS screening' },
];

const PHOTO_SHAPE_OPTIONS = [
  { value: 'circle', label: 'Round Circle', badge: 'Classic' },
  { value: 'rounded', label: 'Soft Squircle', badge: 'Modern' },
  { value: 'square', label: 'Crisp Square', badge: 'Geometric' },
];

const PHOTO_SIZE_OPTIONS = [
  { value: 'sm', label: 'Small (64px)', badge: 'Compact' },
  { value: 'md', label: 'Medium (80px)', badge: 'Balanced' },
  { value: 'lg', label: 'Large (96px)', badge: 'Prominent' },
];

const SAMPLE_AVATARS = [
  { id: 'av1', name: 'Executive A', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250' },
  { id: 'av2', name: 'Executive B', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250' },
  { id: 'av3', name: 'Engineering', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250' },
  { id: 'av4', name: 'Product/Design', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250' },
];

const FONT_OPTIONS = [
  { value: 'sans', label: 'Inter Sans (Clean Modern)', badge: 'Modern', fontFamily: "'Inter', sans-serif", description: 'Balanced geometric grotesque for maximum ATS legibility', sample: 'Aa' },
  { value: 'jakarta', label: 'Plus Jakarta Sans (Fluid)', badge: 'Fluid', fontFamily: "'Plus Jakarta Sans', sans-serif", description: 'Contemporary, warm grotesque with exceptional readability', sample: 'Aa' },
  { value: 'serif', label: 'Merriweather (Executive Serif)', badge: 'Classic', fontFamily: "'Merriweather', serif", description: 'Authoritative, editorial serif typeface for formal leadership', sample: 'Aa' },
  { value: 'playfair', label: 'Playfair Display (Luxe Editorial)', badge: 'Editorial', fontFamily: "'Playfair Display', serif", description: 'High-contrast luxury serif for executive presentations', sample: 'Aa' },
  { value: 'cormorant', label: 'Cormorant Garamond (Prestige)', badge: 'Prestige', fontFamily: "'Cormorant Garamond', serif", description: 'Classic bespoke luxury serif favored by prestige institutions', sample: 'Aa' },
  { value: 'mono', label: 'JetBrains (Tech Monospace)', badge: 'Tech', fontFamily: "'JetBrains Mono', monospace", description: 'Technical, code-inspired monospace font for developer roles', sample: '</>' },
  { value: 'space', label: 'Space Grotesk (Systems)', badge: 'Systems', fontFamily: "'Space Grotesk', sans-serif", description: 'Distinctive mathematical grotesque for cutting-edge roles', sample: '01' },
];

const BULLET_OPTIONS = [
  { value: '•', label: 'Classic Dot (•)', badge: 'Standard', sample: '•', description: 'Industry standard round bullet point' },
  { value: '—', label: 'Em Dash (—)', badge: 'Minimal', sample: '—', description: 'Sleek horizontal dash favored by designers' },
  { value: '▸', label: 'Modern Chevron (▸)', badge: 'Action', sample: '▸', description: 'Dynamic directional arrow highlighting achievements' },
  { value: '▪', label: 'Geometric Square (▪)', badge: 'Tech', sample: '▪', description: 'Contemporary block bullet for engineering resumes' },
  { value: '◆', label: 'Diamond Rhombus (◆)', badge: 'Luxe', sample: '◆', description: 'Refined diamond bullet for executive resumes' },
  { value: '✓', label: 'Verified Check (✓)', badge: 'Impact', sample: '✓', description: 'High-impact checkmark emphasizing completed deliverables' },
];

const LANGUAGE_PROFICIENCY_OPTIONS = [
  { value: 'Native or Bilingual', label: 'Native or Bilingual', badge: 'Fluent' },
  { value: 'Full Professional', label: 'Full Professional', badge: 'C2' },
  { value: 'Professional Working', label: 'Professional Working', badge: 'C1' },
  { value: 'Conversational', label: 'Conversational', badge: 'B2' },
  { value: 'Elementary', label: 'Elementary', badge: 'A2' },
];

const ACCENT_COLORS = [
  { id: 'amber', hex: '#C27803', name: 'Amber Gold', desc: 'Signature ARETE roasted amber' },
  { id: 'bronze', hex: '#D97706', name: 'Sunset Bronze', desc: 'Warm polished bronze' },
  { id: 'copper', hex: '#B45309', name: 'Warm Copper', desc: 'Deep metallic earth tone' },
  { id: 'emerald', hex: '#059669', name: 'Emerald Forest', desc: 'Authoritative growth green' },
  { id: 'teal', hex: '#0D9488', name: 'Nordic Teal', desc: 'Modern technical spruce' },
  { id: 'cyan', hex: '#0891B2', name: 'Pacific Cyan', desc: 'Crisp vibrant high-contrast' },
  { id: 'sapphire', hex: '#2563EB', name: 'Royal Sapphire', desc: 'Executive cobalt blue' },
  { id: 'navy', hex: '#1D4ED8', name: 'Deep Navy', desc: 'Timeless institutional navy' },
  { id: 'indigo', hex: '#4F46E5', name: 'Electric Indigo', desc: 'Modern SaaS tech hue' },
  { id: 'violet', hex: '#7C3AED', name: 'Vibrant Violet', desc: 'Creative engineering purple' },
  { id: 'amethyst', hex: '#9333EA', name: 'Imperial Purple', desc: 'Rich regal amethyst' },
  { id: 'rose', hex: '#BE123C', name: 'Crimson Rose', desc: 'Bold executive ruby' },
  { id: 'burgundy', hex: '#9F1239', name: 'Bordeaux Burgundy', desc: 'Deep prestige wine' },
  { id: 'slate', hex: '#334155', name: 'Charcoal Slate', desc: 'Architectural neutral dark' },
  { id: 'onyx', hex: '#0F172A', name: 'Midnight Onyx', desc: 'Minimalist high-contrast black' },
];

const COLOR_THEME_OPTIONS = ACCENT_COLORS.map(c => ({
  value: c.hex,
  label: c.name,
  badge: c.id === 'amber' ? 'Signature' : c.id === 'sapphire' ? 'Executive' : c.id === 'emerald' ? 'Growth' : c.id === 'slate' ? 'Neutral' : undefined,
  colorHex: c.hex,
  desc: c.desc,
}));

export default function AIResumeStudio() {
  const navigate = useNavigate();
  const toast = useToast();
  const { resumeId: routeResumeId } = useParams();
  const [searchParams] = useSearchParams();
  const targetJobIdFromQuery = searchParams.get('jobId');

  const { currentUser, userRole, jobs: contextJobs } = useRecruitment();

  // ─── Data & Resume State ──────────────────────────────────────────────────
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(routeResumeId || null);
  const [activeResume, setActiveResume] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'unsaved' | 'error'
  const [saveError, setSaveError] = useState(null);

  // Missing profile information flags from initialization
  const [missingProfileFields, setMissingProfileFields] = useState([]);
  const [dismissMissingBanner, setDismissMissingBanner] = useState(false);

  // Active Editor Section: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications'
  const [activeSection, setActiveSection] = useState('contact');

  // View layout: 'split' (side-by-side) | 'editor' | 'preview'
  const [viewMode, setViewMode] = useState('split');

  // Available jobs for tailoring
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [selectedTailorJobId, setSelectedTailorJobId] = useState(targetJobIdFromQuery || '');
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState(null);

  // AI Assistance Dialog State
  const [aiModal, setAiModal] = useState({
    isOpen: false,
    action: '',
    title: '',
    targetField: null, // { section, index, field, subIndex }
    originalText: '',
    suggestedText: '',
    alternatives: [],
    reasoning: '',
    groundedSource: '',
    isLoading: false,
    error: null,
  });

  // Gap Audit State
  const [auditFindings, setAuditFindings] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Version History Modal State
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // ─── Initial Load: Fetch Resumes or Initialize from Profile ──────────────
  const loadResumes = useCallback(async () => {
    setIsLoading(true);
    setSaveError(null);
    try {
      const list = await api.getResumes();
      const safeList = Array.isArray(list) ? list : [];
      setResumes(safeList);

      if (safeList.length > 0) {
        // Select route ID or first available
        const target = routeResumeId 
          ? safeList.find(r => r.id === routeResumeId) || safeList[0]
          : safeList.find(r => r.is_base_resume) || safeList[0];
        setSelectedResumeId(target.id);
        setActiveResume(JSON.parse(JSON.stringify(target)));
        setSaveStatus('saved');
      } else {
        // No resumes exist yet: Auto-initialize from verified profile
        const initData = await api.getResumeInitFromProfile();
        if (initData && initData.draft) {
          setActiveResume(initData.draft);
          setSelectedResumeId(null);
          setMissingProfileFields(initData.missing_fields || []);
          setSaveStatus('unsaved');
        }
      }
    } catch (err) {
      setSaveError('Failed to load resume documents from database');
    } finally {
      setIsLoading(false);
    }
  }, [routeResumeId]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // Load available jobs for tailoring with automatic fallback to context jobs
  const loadTailorJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const jobsList = await api.getJobs();
      if (Array.isArray(jobsList) && jobsList.length > 0) {
        setAvailableJobs(jobsList);
      }
    } catch (err) {
      console.warn('[AIResumeStudio] loadTailorJobs notice:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadTailorJobs();
  }, [loadTailorJobs]);

  const allTailorJobs = useMemo(() => {
    const primary = (availableJobs && availableJobs.length > 0) ? availableJobs : (contextJobs || []);
    const activeOnes = primary.filter(j => !j.status || j.status.toLowerCase() === 'active');
    return activeOnes.length > 0 ? activeOnes : primary;
  }, [availableJobs, contextJobs]);

  // Real-time ATS Strength Score calculation (0 - 100)
  const atsStrength = useMemo(() => {
    let score = 0;
    const info = activeResume?.contact_info || {};
    if (info.full_name) score += 10;
    if (info.email) score += 10;
    if (info.phone) score += 5;
    if (activeResume?.summary && activeResume.summary.trim().length >= 40) score += 15;
    const expCount = (activeResume?.experience || []).length;
    if (expCount >= 1) score += 15;
    if (expCount >= 2) score += 10;
    const skillCount = (activeResume?.skills || []).length;
    if (skillCount >= 3) score += 10;
    if (skillCount >= 6) score += 5;
    if ((activeResume?.education || []).length >= 1) score += 10;
    if ((activeResume?.projects || []).length >= 1 || (activeResume?.certifications || []).length >= 1) score += 10;
    return Math.min(score, 100);
  }, [activeResume]);

  useEffect(() => {
    if (isTailorModalOpen) {
      loadTailorJobs();
      if (!selectedTailorJobId && allTailorJobs.length > 0) {
        setSelectedTailorJobId(allTailorJobs[0].id);
      }
    }
  }, [isTailorModalOpen, loadTailorJobs, selectedTailorJobId, allTailorJobs]);

  // Candidate Profile Photo Handlers
  const handlePhotoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.warning('Image size exceeds 3MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target?.result;
      if (base64Data) {
        updateContactField('photo_url', base64Data);
        updateContactField('show_photo', true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateContactField('photo_url', '');
    updateContactField('show_photo', false);
  };

  // ─── Keyboard Shortcut: Ctrl/Cmd + S to Save ─────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveResume(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ─── Resume Selection Switcher ───────────────────────────────────────────
  const handleSelectResume = (id) => {
    const target = resumes.find(r => r.id === id);
    if (target) {
      setSelectedResumeId(target.id);
      setActiveResume(JSON.parse(JSON.stringify(target)));
      setSaveStatus('saved');
      setSaveError(null);
      setAuditFindings(null);
    }
  };

  // ─── Resume Field Mutators ───────────────────────────────────────────────
  const updateContactField = (field, value) => {
    setActiveResume(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        contact_info: {
          ...(prev.contact_info || {}),
          [field]: value
        }
      };
    });
    setSaveStatus('unsaved');
  };

  const updateSummary = (value) => {
    setActiveResume(prev => {
      if (!prev) return prev;
      return { ...prev, summary: value };
    });
    setSaveStatus('unsaved');
  };

  // Work Experience Handlers
  const addExperienceItem = () => {
    const newItem = {
      id: `exp-${Date.now().toString(36)}`,
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: 'Present',
      is_current: true,
      bullets: [''],
      technologies: []
    };
    setActiveResume(prev => ({
      ...prev,
      experience: [...(prev.experience || []), newItem]
    }));
    setSaveStatus('unsaved');
  };

  const updateExperienceItem = (index, field, value) => {
    setActiveResume(prev => {
      const list = [...(prev.experience || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, experience: list };
    });
    setSaveStatus('unsaved');
  };

  const removeExperienceItem = (index) => {
    setActiveResume(prev => {
      const list = [...(prev.experience || [])];
      list.splice(index, 1);
      return { ...prev, experience: list };
    });
    setSaveStatus('unsaved');
  };

  const addExperienceBullet = (expIndex) => {
    setActiveResume(prev => {
      const list = [...(prev.experience || [])];
      const bullets = [...(list[expIndex].bullets || []), ''];
      list[expIndex] = { ...list[expIndex], bullets };
      return { ...prev, experience: list };
    });
    setSaveStatus('unsaved');
  };

  const updateExperienceBullet = (expIndex, bulletIndex, text) => {
    setActiveResume(prev => {
      const list = [...(prev.experience || [])];
      const bullets = [...(list[expIndex].bullets || [])];
      bullets[bulletIndex] = text;
      list[expIndex] = { ...list[expIndex], bullets };
      return { ...prev, experience: list };
    });
    setSaveStatus('unsaved');
  };

  const removeExperienceBullet = (expIndex, bulletIndex) => {
    setActiveResume(prev => {
      const list = [...(prev.experience || [])];
      const bullets = [...(list[expIndex].bullets || [])];
      bullets.splice(bulletIndex, 1);
      list[expIndex] = { ...list[expIndex], bullets };
      return { ...prev, experience: list };
    });
    setSaveStatus('unsaved');
  };

  // Education Handlers
  const addEducationItem = () => {
    const newItem = {
      id: `edu-${Date.now().toString(36)}`,
      degree: '',
      institution: '',
      field_of_study: '',
      start_year: '',
      graduation_year: '',
      gpa: ''
    };
    setActiveResume(prev => ({
      ...prev,
      education: [...(prev.education || []), newItem]
    }));
    setSaveStatus('unsaved');
  };

  const updateEducationItem = (index, field, value) => {
    setActiveResume(prev => {
      const list = [...(prev.education || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, education: list };
    });
    setSaveStatus('unsaved');
  };

  const removeEducationItem = (index) => {
    setActiveResume(prev => {
      const list = [...(prev.education || [])];
      list.splice(index, 1);
      return { ...prev, education: list };
    });
    setSaveStatus('unsaved');
  };

  // Skills Handlers
  const addSkill = (skillName) => {
    const clean = skillName.trim();
    if (!clean) return;
    setActiveResume(prev => {
      const current = prev.skills || [];
      if (current.includes(clean)) return prev;
      return { ...prev, skills: [...current, clean] };
    });
    setSaveStatus('unsaved');
  };

  const removeSkill = (index) => {
    setActiveResume(prev => {
      const skills = [...(prev.skills || [])];
      skills.splice(index, 1);
      return { ...prev, skills };
    });
    setSaveStatus('unsaved');
  };

  // Projects Handlers
  const addProjectItem = () => {
    const newItem = {
      id: `proj-${Date.now().toString(36)}`,
      name: '',
      role: '',
      description: '',
      url: '',
      technologies: [],
      bullets: ['']
    };
    setActiveResume(prev => ({
      ...prev,
      projects: [...(prev.projects || []), newItem]
    }));
    setSaveStatus('unsaved');
  };

  const updateProjectItem = (index, field, value) => {
    setActiveResume(prev => {
      const list = [...(prev.projects || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, projects: list };
    });
    setSaveStatus('unsaved');
  };

  const removeProjectItem = (index) => {
    setActiveResume(prev => {
      const list = [...(prev.projects || [])];
      list.splice(index, 1);
      return { ...prev, projects: list };
    });
    setSaveStatus('unsaved');
  };

  // Certifications Handlers
  const addCertificationItem = () => {
    const newItem = {
      id: `cert-${Date.now().toString(36)}`,
      name: '',
      issuer: '',
      issue_date: '',
      expiration_date: '',
      credential_id: '',
      credential_url: ''
    };
    setActiveResume(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), newItem]
    }));
    setSaveStatus('unsaved');
  };

  const updateCertificationItem = (index, field, value) => {
    setActiveResume(prev => {
      const list = [...(prev.certifications || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, certifications: list };
    });
    setSaveStatus('unsaved');
  };

  const removeCertificationItem = (index) => {
    setActiveResume(prev => {
      const list = [...(prev.certifications || [])];
      list.splice(index, 1);
      return { ...prev, certifications: list };
    });
    setSaveStatus('unsaved');
  };

  // Languages Handlers
  const addLanguageItem = () => {
    const newItem = {
      id: `lang-${Date.now().toString(36)}`,
      language: '',
      proficiency: 'Professional Working'
    };
    setActiveResume(prev => ({
      ...prev,
      languages: [...(prev.languages || []), newItem]
    }));
    setSaveStatus('unsaved');
  };

  const updateLanguageItem = (index, field, value) => {
    setActiveResume(prev => {
      const list = [...(prev.languages || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, languages: list };
    });
    setSaveStatus('unsaved');
  };

  const removeLanguageItem = (index) => {
    setActiveResume(prev => {
      const list = [...(prev.languages || [])];
      list.splice(index, 1);
      return { ...prev, languages: list };
    });
    setSaveStatus('unsaved');
  };

  // Awards & Honors Handlers
  const addAwardItem = () => {
    const newItem = {
      id: `award-${Date.now().toString(36)}`,
      title: '',
      issuer: '',
      date: '',
      description: ''
    };
    setActiveResume(prev => ({
      ...prev,
      awards: [...(prev.awards || []), newItem]
    }));
    setSaveStatus('unsaved');
  };

  const updateAwardItem = (index, field, value) => {
    setActiveResume(prev => {
      const list = [...(prev.awards || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, awards: list };
    });
    setSaveStatus('unsaved');
  };

  const removeAwardItem = (index) => {
    setActiveResume(prev => {
      const list = [...(prev.awards || [])];
      list.splice(index, 1);
      return { ...prev, awards: list };
    });
    setSaveStatus('unsaved');
  };

  // Volunteering Handlers
  const addVolunteerItem = () => {
    const newItem = {
      id: `vol-${Date.now().toString(36)}`,
      role: '',
      organization: '',
      start_date: '',
      end_date: 'Present',
      is_current: false,
      description: '',
      bullets: ['']
    };
    setActiveResume(prev => ({
      ...prev,
      volunteering: [...(prev.volunteering || []), newItem]
    }));
    setSaveStatus('unsaved');
  };

  const updateVolunteerItem = (index, field, value) => {
    setActiveResume(prev => {
      const list = [...(prev.volunteering || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, volunteering: list };
    });
    setSaveStatus('unsaved');
  };

  const removeVolunteerItem = (index) => {
    setActiveResume(prev => {
      const list = [...(prev.volunteering || [])];
      list.splice(index, 1);
      return { ...prev, volunteering: list };
    });
    setSaveStatus('unsaved');
  };

  // ─── Persistence: Save or Create New Version ──────────────────────────────
  const handleSaveResume = async (createNewVersion = false) => {
    if (!activeResume) return;
    setIsSaving(true);
    setSaveError(null);

    const payload = {
      title: activeResume.title || 'My Resume',
      target_job_id: activeResume.target_job_id || null,
      target_job_title: activeResume.target_job_title || null,
      is_base_resume: activeResume.is_base_resume ?? false,
      contact_info: activeResume.contact_info || {},
      summary: activeResume.summary || '',
      experience: activeResume.experience || [],
      education: activeResume.education || [],
      skills: activeResume.skills || [],
      projects: activeResume.projects || [],
      certifications: activeResume.certifications || [],
      languages: activeResume.languages || [],
      awards: activeResume.awards || [],
      volunteering: activeResume.volunteering || [],
      change_summary: createNewVersion 
        ? `Version ${(activeResume.version || 1) + 1} Checkpoint` 
        : 'Updated resume details',
      create_new_version: createNewVersion
    };

    try {
      let saved;
      if (selectedResumeId && !createNewVersion) {
        // In-place update
        saved = await api.updateResume(selectedResumeId, payload);
      } else if (selectedResumeId && createNewVersion) {
        // New version row
        saved = await api.updateResume(selectedResumeId, payload);
      } else {
        // Initial creation
        saved = await api.createResume(payload);
      }

      if (saved && saved.id) {
        setSelectedResumeId(saved.id);
        setActiveResume(JSON.parse(JSON.stringify(saved)));
        setSaveStatus('saved');
        toast.success(createNewVersion ? `Saved Version ${saved.version} checkpoint` : 'Resume saved to database');
        // Refresh master list
        const refreshedList = await api.getResumes();
        setResumes(Array.isArray(refreshedList) ? refreshedList : []);
      }
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err.message || 'Failed to persist resume changes to database');
      toast.error(err.message || 'Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Profile Sync ─────────────────────────────────────────────────────────
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [syncProfileSuccess, setSyncProfileSuccess] = useState(false);

  const handleSyncToProfile = async () => {
    if (!selectedResumeId) {
      await handleSaveResume(false);
    }
    if (!selectedResumeId && !activeResume?.id) return;
    const targetId = selectedResumeId || activeResume.id;

    setIsSyncingProfile(true);
    try {
      await api.syncResumeToProfile(targetId);
      setSyncProfileSuccess(true);
      toast.success('Candidate profile updated from resume');
      setTimeout(() => setSyncProfileSuccess(false), 3000);
    } catch (err) {
      toast.error(`Profile sync failed: ${err.message}`);
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // ─── AI Assistance Dialog Dispatcher ──────────────────────────────────────
  const handleOpenAIAssist = async (action, currentText, targetField, modalTitle) => {
    setAiModal({
      isOpen: true,
      action,
      title: modalTitle || 'ARETE AI Resume Intelligence',
      targetField,
      originalText: currentText || '',
      suggestedText: '',
      alternatives: [],
      reasoning: '',
      groundedSource: '',
      isLoading: true,
      error: null
    });

    try {
      const res = await api.assistResumeAI({
        action,
        current_text: currentText,
        resume_context: activeResume,
        job_id: activeResume?.target_job_id || null
      });

      if (res && res.suggestion) {
        setAiModal(prev => ({
          ...prev,
          isLoading: false,
          suggestedText: res.suggestion,
          alternatives: res.alternatives || [],
          reasoning: res.reasoning || '',
          groundedSource: res.grounded_source || 'Verified Profile Evidence'
        }));
      } else {
        throw new Error('AI engine returned empty suggestion');
      }
    } catch (err) {
      setAiModal(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'AI assistance is currently unreachable. Your current resume data is intact.'
      }));
    }
  };

  const handleApplyAISuggestion = (chosenText) => {
    const textToApply = chosenText || aiModal.suggestedText;
    if (!textToApply || !aiModal.targetField) {
      setAiModal(prev => ({ ...prev, isOpen: false }));
      return;
    }

    const { section, index, field, subIndex } = aiModal.targetField;

    if (section === 'summary') {
      updateSummary(textToApply);
    } else if (section === 'experience_bullet') {
      updateExperienceBullet(index, subIndex, textToApply);
    }

    setAiModal(prev => ({ ...prev, isOpen: false }));
  };

  // ─── Audit Gap Run ────────────────────────────────────────────────────────
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditFindings(null);
    try {
      const res = await api.assistResumeAI({
        action: 'audit_gaps',
        resume_context: activeResume
      });
      if (res && Array.isArray(res.audit_findings)) {
        setAuditFindings(res.audit_findings);
        toast.info(`ATS Audit complete: ${res.audit_findings.length} findings identified`);
      }
    } catch (err) {
      toast.error(`Audit failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // ─── Job-Specific Tailoring ───────────────────────────────────────────────
  const handleStartTailoring = async () => {
    if (!selectedTailorJobId) return;
    setIsTailoring(true);
    setTailorResult(null);

    try {
      // 1. Keyword Gap Analysis
      const kwRes = await api.assistResumeAI({
        action: 'suggest_keywords',
        job_id: selectedTailorJobId,
        resume_context: activeResume
      });

      // 2. Job-Specific Alignment
      const tailorRes = await api.assistResumeAI({
        action: 'tailor_resume',
        job_id: selectedTailorJobId,
        resume_context: activeResume
      });

      const selectedJob = allTailorJobs.find(j => j.id === selectedTailorJobId);

      setTailorResult({
        job: selectedJob,
        matchedKeywords: kwRes?.matched_keywords || [],
        missingKeywords: kwRes?.missing_keywords || [],
        recommendedKeywords: kwRes?.suggested_keywords || [],
        tailoredSummary: tailorRes?.suggestion || '',
        reasoning: tailorRes?.reasoning || kwRes?.reasoning || ''
      });
      toast.success('Position alignment analysis complete');
    } catch (err) {
      toast.error(`Tailoring failed: ${err.message}`);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleApplyTailoredClone = async () => {
    if (!tailorResult || !tailorResult.job) return;

    const clonedResume = {
      ...JSON.parse(JSON.stringify(activeResume)),
      title: `Tailored - ${tailorResult.job.title}`,
      target_job_id: tailorResult.job.id,
      target_job_title: tailorResult.job.title,
      is_base_resume: false,
      summary: tailorResult.tailoredSummary || activeResume.summary,
      change_summary: `Job-tailored clone for ${tailorResult.job.title}`
    };

    try {
      const saved = await api.createResume(clonedResume);
      if (saved && saved.id) {
        setSelectedResumeId(saved.id);
        setActiveResume(saved);
        setSaveStatus('saved');
        setIsTailorModalOpen(false);
        setTailorResult(null);
        toast.success(`Created tailored resume for ${tailorResult.job.title}`);
        // Refresh list
        const refreshedList = await api.getResumes();
        setResumes(Array.isArray(refreshedList) ? refreshedList : []);
      }
    } catch (err) {
      toast.error(`Failed to save tailored clone: ${err.message}`);
    }
  };

  // ─── Version History Modal ────────────────────────────────────────────────
  const handleOpenVersionHistory = async () => {
    if (!selectedResumeId) return;
    setIsVersionModalOpen(true);
    setIsLoadingVersions(true);
    try {
      const versions = await api.getResumeVersions(selectedResumeId);
      setVersionHistory(Array.isArray(versions) ? versions : []);
    } catch (err) {
      console.warn('Failed to load version history:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // ─── Export / Print Handlers ──────────────────────────────────────────────
  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadFile = async (format) => {
    if (!selectedResumeId && activeResume) {
      // Save first
      await handleSaveResume(false);
    }
    const targetId = selectedResumeId || activeResume?.id;
    if (!targetId) return;

    const token = localStorage.getItem('sparkx_token');
    const url = `${api.API_BASE_URL || 'http://localhost:8000/api'}/resumes/${targetId}/export?format=${format}`;
    
    fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${(activeResume?.title || 'Resume').replace(/\s+/g, '_')}.${format === 'markdown' ? 'md' : format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Exported as .${format === 'markdown' ? 'md' : format}`);
      })
      .catch(err => toast.error(`Download failed: ${err.message}`));
  };

  // ─── Render Loading Screen ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-4 animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin text-[#C27803]" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
          Loading AI Resume Studio
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
          Fetching authoritative profile credentials and persisted resume ledgers from the database...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#120D0A] text-stone-900 dark:text-stone-100 flex flex-col print:bg-white print:text-black print:min-h-0 print:block">
      {/* Print CSS to enforce crisp pagination, page breaks, and exact background color reproduction */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: letter portrait;
            margin: 8mm 12mm 12mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden, [data-print-hidden="true"] {
            display: none !important;
          }
        }
      `}} />

      
      {/* ─── Top Studio Action Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[#EAE2D9] dark:border-[#2B201A] bg-white/90 dark:bg-[#1C130E]/90 backdrop-blur-md px-4 sm:px-6 py-3.5 shadow-2xs print:hidden">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Col 1: Breadcrumbs & Resume Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my-applications')}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-[#281D17] text-stone-600 dark:text-stone-400 transition"
              title="Return to Applications"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-[#C27803] dark:text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
                    AI Resume Studio
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold">
                    ATS Engine v3
                  </span>
                  <span 
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 transition ${
                      atsStrength >= 80 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                        : atsStrength >= 60 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                    title={`Real-Time ATS Strength: ${atsStrength}/100. Maximize your score by completing all sections.`}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>ATS: {atsStrength}%</span>
                  </span>
                </div>

                {/* Resumes Selector Dropdown */}
                <div className="mt-1 min-w-[240px] max-w-[340px]">
                  <FancyStudioDropdown
                    value={selectedResumeId || ''}
                    onChange={(val) => handleSelectResume(val)}
                    icon={FileText}
                    options={resumes.length > 0 ? resumes.map(r => ({
                      value: r.id,
                      label: r.title,
                      badge: r.is_base_resume ? 'Base' : (r.target_job_title ? 'Tailored' : `v${r.version || 1}`),
                      description: r.target_job_title ? `Targeted: ${r.target_job_title}` : `Version ${r.version || 1} • Saved in DB`,
                      icon: FileText
                    })) : [{ value: '', label: 'Draft (Unsaved)', badge: 'Draft', icon: FileText }]}
                    placeholder="Select Resume..."
                    menuWidth="w-80"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Action Controls & Status */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Save Status Telemetry */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#281D17] text-stone-600 dark:text-stone-400">
              {saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Saved to DB</span>
                </>
              ) : saveStatus === 'unsaved' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved changes</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Save needed</span>
                </>
              )}
            </div>

            {/* Audit Button */}
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-[#281D17] hover:bg-stone-200 dark:hover:bg-[#34261E] text-stone-700 dark:text-stone-300 transition"
              title="Audit resume for missing data and ATS compliance gaps"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-amber-500' : 'text-stone-500'}`} />
              <span className="hidden md:inline">Audit Gaps</span>
            </button>

            {/* Tailor to Job Button */}
            <button
              onClick={() => setIsTailorModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs transition active:scale-98"
              title="Target this resume to a specific job requisition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-100" />
              <span>Tailor to Job</span>
              {activeResume?.target_job_title && (
                <span className="hidden sm:inline-block ml-0.5 px-1.5 py-0.2 text-[9px] uppercase font-mono rounded bg-black/25 text-white">
                  Active
                </span>
              )}
            </button>

            {/* Match Analyzer Button */}
            <button
              onClick={() => {
                const targetJob = activeResume?.target_job_id ? `&jobId=${encodeURIComponent(activeResume.target_job_id)}` : '';
                navigate(`/resume-analyzer?resumeId=${encodeURIComponent(selectedResumeId || activeResume?.id || '')}${targetJob}`);
              }}
              disabled={!selectedResumeId && !activeResume?.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-[#C27803] dark:text-amber-400 border border-amber-500/30 transition disabled:opacity-50"
              title="Analyze match against a target job description"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Analyze Match</span>
            </button>

            {/* Version History Button */}
            <button
              onClick={handleOpenVersionHistory}
              disabled={!selectedResumeId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-[#281D17] hover:bg-stone-200 dark:hover:bg-[#34261E] text-stone-700 dark:text-stone-300 transition disabled:opacity-50"
              title="View version history checkpoints"
            >
              <History className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden lg:inline">Versions</span>
            </button>

            {/* Sync to Profile Button */}
            <button
              onClick={handleSyncToProfile}
              disabled={isSyncingProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-[#281D17] hover:bg-stone-200 dark:hover:bg-[#34261E] text-stone-700 dark:text-stone-300 transition"
              title="Update your permanent candidate profile with these details"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSyncingProfile ? 'animate-spin text-amber-500' : 'text-stone-500'}`} />
              <span className="hidden lg:inline">{syncProfileSuccess ? 'Synced!' : 'Sync Profile'}</span>
            </button>

            {/* Export Dropdown / Print */}
            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-[#281D17] hover:bg-stone-200 dark:hover:bg-[#34261E] text-stone-700 dark:text-stone-300 transition"
              title="Print or export as PDF via browser print"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={() => handleDownloadFile('markdown')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-[#281D17] hover:bg-stone-200 dark:hover:bg-[#34261E] text-stone-700 dark:text-stone-300 transition"
              title="Export formatted Markdown (.md)"
            >
              <FileDown className="w-3.5 h-3.5 text-stone-500" />
              <span>.md</span>
            </button>

            {/* Primary Save Button */}
            <button
              onClick={() => handleSaveResume(false)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#C27803] hover:bg-[#a66702] text-white shadow-sm transition active:scale-98 disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            {/* Layout Switcher */}
            <div className="hidden xl:flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-[#281D17] border border-stone-200 dark:border-[#382820]">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition ${
                  viewMode === 'editor' 
                    ? 'bg-white dark:bg-[#1E1612] text-stone-900 dark:text-white shadow-2xs' 
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition ${
                  viewMode === 'split' 
                    ? 'bg-white dark:bg-[#1E1612] text-stone-900 dark:text-white shadow-2xs' 
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition ${
                  viewMode === 'preview' 
                    ? 'bg-white dark:bg-[#1E1612] text-stone-900 dark:text-white shadow-2xs' 
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Preview
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ─── Missing Profile Information Notice (Truthful Grounding Banner) ── */}
      {missingProfileFields.length > 0 && !dismissMissingBanner && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 sm:px-6 py-2.5 print:hidden">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Profile Completeness Notice:</strong> Some verified credentials are missing ({missingProfileFields.join(', ')}). Please provide them below to ensure full ATS compliance without fabricated defaults.
              </span>
            </div>
            <button
              onClick={() => setDismissMissingBanner(true)}
              className="text-amber-700 dark:text-amber-400 hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ─── Gap Audit Results Drawer/Banner ──────────────────────────────── */}
      {auditFindings && (
        <div className="bg-white dark:bg-[#1E1612] border-b border-[#EAE2D9] dark:border-[#382820] p-4 sm:px-6 print:hidden">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C27803]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 font-mono">
                  ATS Verification Audit ({auditFindings.length} Items)
                </h3>
              </div>
              <button
                onClick={() => setAuditFindings(null)}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                Close Audit
              </button>
            </div>
            {auditFindings.length === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ No structural gaps or formatting defects found. Your resume structure is verified.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {auditFindings.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-stone-200 dark:border-[#382820] bg-stone-50 dark:bg-[#140E0B] flex items-start gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${f.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <div>
                      <span className="font-semibold capitalize text-stone-800 dark:text-stone-200">{f.section}: </span>
                      <span className="text-stone-600 dark:text-stone-400">{f.issue}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Main Workspace: Split or Full ─────────────────────────────────── */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:p-0 print:m-0 print:max-w-none">
        
        {/* LEFT COLUMN: Structured Resume Editor */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7 xl:col-span-6' : 'lg:col-span-12'} flex flex-col gap-5 print:hidden`}>
            
            {/* Section Tabs Navigation - Zero Scrollbar Responsive Wrap */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#FAF8F5]/90 dark:bg-[#160E0A]/90 border border-[#EAE2D9] dark:border-[#2B201A] text-xs font-semibold shadow-2xs">
              {[
                { id: 'contact', label: 'Contact Info', icon: User },
                { id: 'summary', label: 'Summary', icon: Sparkles },
                { id: 'experience', label: 'Experience', icon: Briefcase, count: activeResume?.experience?.length || 0 },
                { id: 'education', label: 'Education', icon: GraduationCap, count: activeResume?.education?.length || 0 },
                { id: 'skills', label: 'Skills', icon: Award, count: activeResume?.skills?.length || 0 },
                { id: 'projects', label: 'Projects', icon: FolderGit2, count: activeResume?.projects?.length || 0 },
                { id: 'certifications', label: 'Certifications', icon: ShieldCheck, count: activeResume?.certifications?.length || 0 },
                { id: 'languages', label: 'Languages', icon: Languages, count: activeResume?.languages?.length || 0 },
                { id: 'awards', label: 'Awards', icon: Trophy, count: activeResume?.awards?.length || 0 },
                { id: 'volunteering', label: 'Volunteering', icon: Heart, count: activeResume?.volunteering?.length || 0 },
              ].map(sec => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition duration-150 ${
                      isActive 
                        ? 'bg-white dark:bg-[#20150F] text-[#C27803] dark:text-amber-400 border border-[#EAE2D9] dark:border-[#3D2C22] shadow-xs font-bold ring-1 ring-amber-500/20'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-[#281D17]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{sec.label}</span>
                    {sec.count != null && sec.count > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-amber-500/15 text-[#C27803] dark:text-amber-300' : 'bg-stone-200/80 dark:bg-[#34241B] text-stone-500 dark:text-stone-400'
                      }`}>
                        {sec.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* SECTION 1: Contact Information */}
            {activeSection === 'contact' && (
              <div className="space-y-4 bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Contact & Identity</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Verifiable candidate contact and professional headline</p>
                  </div>
                </div>

                {/* Candidate Profile Photo & Avatar Card */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-[#382820] bg-stone-50/70 dark:bg-[#140E0B]/70 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    {activeResume?.contact_info?.photo_url ? (
                      <img
                        src={activeResume.contact_info.photo_url}
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 shadow-sm"
                        style={{ borderColor: activeResume?.contact_info?.accent_color || '#C27803' }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-stone-200 dark:bg-[#281D17] border-2 border-dashed border-stone-300 dark:border-[#382820] flex flex-col items-center justify-center text-stone-400">
                        <User className="w-8 h-8" />
                        <span className="text-[9px] mt-0.5">No Photo</span>
                      </div>
                    )}
                    {activeResume?.contact_info?.photo_url && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-500 text-white shadow-xs hover:bg-rose-600 transition"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-xs w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-[11px] uppercase tracking-wider">
                        Candidate Profile Picture
                      </span>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-600 dark:text-stone-300">
                        <input
                          type="checkbox"
                          checked={activeResume?.contact_info?.show_photo !== false}
                          onChange={(e) => updateContactField('show_photo', e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 accent-[#C27803]"
                        />
                        <span>Show Photo on Resume</span>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C130E] border border-stone-200 dark:border-[#382820] hover:border-amber-500 text-stone-700 dark:text-stone-200 cursor-pointer transition font-medium shadow-2xs">
                        <Camera className="w-3.5 h-3.5 text-[#C27803]" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-stone-400">Supports PNG, JPG, WebP up to 3MB</span>
                    </div>

                    <div className="pt-1">
                      <input
                        type="url"
                        value={activeResume?.contact_info?.photo_url || ''}
                        onChange={(e) => {
                          updateContactField('photo_url', e.target.value);
                          if (e.target.value) updateContactField('show_photo', true);
                        }}
                        placeholder="Or paste external image URL (e.g. LinkedIn, GitHub avatar, Gravatar)"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Preset Avatars for 1-Click Testing */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        1-Click Sample Headshots:
                      </span>
                      {SAMPLE_AVATARS.map(av => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            updateContactField('photo_url', av.url);
                            updateContactField('show_photo', true);
                          }}
                          className="w-6 h-6 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 hover:scale-125 transition cursor-pointer"
                          title={`Apply ${av.name} sample photo`}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    {/* Photo Placement, Shape & Size Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-200/60 dark:border-[#281D17]">
                      <div>
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                          Placement
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {PHOTO_POSITION_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                updateContactField('photo_position', opt.value);
                                if (opt.value === 'hidden') updateContactField('show_photo', false);
                                else updateContactField('show_photo', true);
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition ${
                                (activeResume?.contact_info?.photo_position || 'right') === opt.value
                                  ? 'bg-amber-500/15 border-amber-500 text-[#C27803] dark:text-amber-400'
                                  : 'border-stone-200 dark:border-[#382820] text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                          Shape
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {PHOTO_SHAPE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateContactField('photo_shape', opt.value)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition ${
                                (activeResume?.contact_info?.photo_shape || 'circle') === opt.value
                                  ? 'bg-amber-500/15 border-amber-500 text-[#C27803] dark:text-amber-400'
                                  : 'border-stone-200 dark:border-[#382820] text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                          Size
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {PHOTO_SIZE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateContactField('photo_size', opt.value)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition ${
                                (activeResume?.contact_info?.photo_size || 'md') === opt.value
                                  ? 'bg-amber-500/15 border-amber-500 text-[#C27803] dark:text-amber-400'
                                  : 'border-stone-200 dark:border-[#382820] text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={activeResume?.contact_info?.full_name || ''}
                      onChange={(e) => updateContactField('full_name', e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Professional Headline
                    </label>
                    <input
                      type="text"
                      value={activeResume?.contact_info?.headline || ''}
                      onChange={(e) => updateContactField('headline', e.target.value)}
                      placeholder="Senior Full-Stack Engineer • Distributed Systems"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={activeResume?.contact_info?.email || ''}
                      onChange={(e) => updateContactField('email', e.target.value)}
                      placeholder="candidate@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={activeResume?.contact_info?.phone || ''}
                      onChange={(e) => updateContactField('phone', e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Location / Region
                    </label>
                    <input
                      type="text"
                      value={activeResume?.contact_info?.location || ''}
                      onChange={(e) => updateContactField('location', e.target.value)}
                      placeholder="San Francisco, CA (or Remote)"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={activeResume?.contact_info?.linkedin_url || ''}
                      onChange={(e) => updateContactField('linkedin_url', e.target.value)}
                      placeholder="linkedin.com/in/username"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      GitHub Profile
                    </label>
                    <input
                      type="url"
                      value={activeResume?.contact_info?.github_url || ''}
                      onChange={(e) => updateContactField('github_url', e.target.value)}
                      placeholder="github.com/username"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Portfolio / Personal Site
                    </label>
                    <input
                      type="url"
                      value={activeResume?.contact_info?.portfolio_url || ''}
                      onChange={(e) => updateContactField('portfolio_url', e.target.value)}
                      placeholder="https://portfolio.dev"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Professional Summary */}
            {activeSection === 'summary' && (
              <div className="space-y-4 bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] shadow-2xs">
                
                {/* Requisition Alignment & Tailoring Context Card */}
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-400/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-[#C27803] dark:text-amber-400 shrink-0 mt-0.5">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Target Position Requisition
                        </h4>
                        {activeResume?.target_job_title ? (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Aligned: {activeResume.target_job_title}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            General Draft
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {activeResume?.target_job_title 
                          ? `This resume is targeted for ${activeResume.target_job_title}. AI optimizations emphasize matching credentials from your profile.`
                          : 'Target this resume to one of 800+ open database requisitions to unlock ATS keyword matching and role-specific alignment.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTailorModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C27803] hover:bg-[#a66702] text-white transition shrink-0 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activeResume?.target_job_title ? 'Re-Tailor Target' : 'Tailor to Requisition'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Professional Summary</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Concise overview of technical strengths and engineering scope</p>
                  </div>

                  {/* Grounded AI Refinement Trigger */}
                  <button
                    onClick={() => handleOpenAIAssist(
                      'refine_summary',
                      activeResume?.summary || '',
                      { section: 'summary' },
                      'AI Summary Optimizer'
                    )}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-[#C27803] dark:text-amber-400 border border-amber-500/20 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Refine with AI</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={activeResume?.summary || ''}
                    onChange={(e) => updateSummary(e.target.value)}
                    placeholder="Enter or refine your executive career summary..."
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-xs leading-relaxed text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-sans"
                  />
                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    <span>Truthful grounding rule: summaries reflect verified experience.</span>
                    <span>{(activeResume?.summary || '').split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: Work Experience */}
            {activeSection === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#1C130E] p-4 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A]">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Work Experience</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Verifiable employment history and scoped technical impact</p>
                  </div>
                  <button
                    onClick={addExperienceItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C27803] hover:bg-[#a66702] text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role</span>
                  </button>
                </div>

                {(activeResume?.experience || []).map((exp, expIdx) => (
                  <div key={exp.id || expIdx} className="bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-3">
                      <span className="text-xs font-mono font-bold text-stone-400">Role #{expIdx + 1}</span>
                      <button
                        onClick={() => removeExperienceItem(expIdx)}
                        className="text-stone-400 hover:text-rose-500 transition p-1"
                        title="Delete this role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Job Title</label>
                        <input
                          type="text"
                          value={exp.title || ''}
                          onChange={(e) => updateExperienceItem(expIdx, 'title', e.target.value)}
                          placeholder="Senior Backend Engineer"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Company / Organization</label>
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => updateExperienceItem(expIdx, 'company', e.target.value)}
                          placeholder="Acme Corp"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Location</label>
                        <input
                          type="text"
                          value={exp.location || ''}
                          onChange={(e) => updateExperienceItem(expIdx, 'location', e.target.value)}
                          placeholder="New York, NY (Hybrid)"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Start Date</label>
                          <input
                            type="text"
                            value={exp.start_date || ''}
                            onChange={(e) => updateExperienceItem(expIdx, 'start_date', e.target.value)}
                            placeholder="Jan 2022"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">End Date</label>
                          <input
                            type="text"
                            value={exp.end_date || ''}
                            onChange={(e) => updateExperienceItem(expIdx, 'end_date', e.target.value)}
                            placeholder="Present"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points with Google X-Y-Z AI Enhancer */}
                    <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-[#2B201A]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-700 dark:text-stone-300">Key Achievements & Responsibilities</span>
                        <button
                          onClick={() => addExperienceBullet(expIdx)}
                          className="text-[#C27803] dark:text-amber-400 font-semibold hover:underline text-[11px] inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet</span>
                        </button>
                      </div>

                      {(exp.bullets || []).map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="flex items-start gap-2">
                          <span className="mt-2.5 text-stone-400 text-xs">•</span>
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => updateExperienceBullet(expIdx, bulletIdx, e.target.value)}
                            placeholder="Describe what you built, how you implemented it, and verifiable impact..."
                            className="flex-1 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-xs leading-relaxed text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex flex-col gap-1 mt-0.5">
                            {/* AI Strengthen Bullet Trigger */}
                            <button
                              onClick={() => handleOpenAIAssist(
                                'improve_bullet',
                                bullet,
                                { section: 'experience_bullet', index: expIdx, subIndex: bulletIdx },
                                'Strengthen Bullet (Google X-Y-Z Formula)'
                              )}
                              disabled={!bullet || bullet.trim().length < 5}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#C27803] dark:text-amber-400 border border-amber-500/20 transition disabled:opacity-40"
                              title="Strengthen with action verbs and impact structure"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeExperienceBullet(expIdx, bulletIdx)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 transition"
                              title="Remove bullet"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECTION 4: Education */}
            {activeSection === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#1C130E] p-4 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A]">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Education & Academic Background</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Degrees, institutions, and academic credentials</p>
                  </div>
                  <button
                    onClick={addEducationItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C27803] hover:bg-[#a66702] text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>

                {(activeResume?.education || []).map((edu, eduIdx) => (
                  <div key={edu.id || eduIdx} className="bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-2">
                      <span className="text-xs font-mono font-bold text-stone-400">Degree #{eduIdx + 1}</span>
                      <button
                        onClick={() => removeEducationItem(eduIdx)}
                        className="text-stone-400 hover:text-rose-500 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Degree</label>
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={(e) => updateEducationItem(eduIdx, 'degree', e.target.value)}
                          placeholder="Bachelor of Science in Computer Science"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Institution / University</label>
                        <input
                          type="text"
                          value={edu.institution || ''}
                          onChange={(e) => updateEducationItem(eduIdx, 'institution', e.target.value)}
                          placeholder="University of California, Berkeley"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Field of Study</label>
                        <input
                          type="text"
                          value={edu.field_of_study || ''}
                          onChange={(e) => updateEducationItem(eduIdx, 'field_of_study', e.target.value)}
                          placeholder="Software Engineering & Systems"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Graduation Year</label>
                          <input
                            type="text"
                            value={edu.graduation_year || ''}
                            onChange={(e) => updateEducationItem(eduIdx, 'graduation_year', e.target.value)}
                            placeholder="2022"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">GPA / Honors</label>
                          <input
                            type="text"
                            value={edu.gpa || ''}
                            onChange={(e) => updateEducationItem(eduIdx, 'gpa', e.target.value)}
                            placeholder="3.8 / 4.0"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECTION 5: Skills */}
            {activeSection === 'skills' && (
              <div className="bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Skills & Technical Competencies</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Verified languages, tools, architectures, and domain knowledge</p>
                  </div>
                  <button
                    onClick={() => setIsTailorModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-[#C27803] dark:text-amber-400 border border-amber-500/20 transition"
                    title="Audit skills against open jobs in ARETE"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Match against Positions</span>
                  </button>
                </div>

                {/* Skill Add Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="skill-add-input"
                    placeholder="Type skill and press Add (e.g. PostgreSQL, Go, Docker)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      const inp = document.getElementById('skill-add-input');
                      if (inp && inp.value) {
                        addSkill(inp.value);
                        inp.value = '';
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C27803] hover:bg-[#a66702] text-white transition"
                  >
                    Add
                  </button>
                </div>

                {/* Skills Badges Cloud */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(activeResume?.skills || []).map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-[#281D17] border border-stone-200 dark:border-[#382820] text-xs font-medium text-stone-800 dark:text-stone-200"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(sIdx)}
                        className="text-stone-400 hover:text-rose-500 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {(activeResume?.skills || []).length === 0 && (
                    <p className="text-xs text-stone-500 italic">No skills listed yet. Add your core technical competencies above.</p>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 6: Projects */}
            {activeSection === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#1C130E] p-4 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A]">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Engineering Projects</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Verifiable production systems, open source, or side projects</p>
                  </div>
                  <button
                    onClick={addProjectItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C27803] hover:bg-[#a66702] text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {(activeResume?.projects || []).map((proj, pIdx) => (
                  <div key={proj.id || pIdx} className="bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-2">
                      <span className="text-xs font-mono font-bold text-stone-400">Project #{pIdx + 1}</span>
                      <button
                        onClick={() => removeProjectItem(pIdx)}
                        className="text-stone-400 hover:text-rose-500 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Project Name</label>
                        <input
                          type="text"
                          value={proj.name || ''}
                          onChange={(e) => updateProjectItem(pIdx, 'name', e.target.value)}
                          placeholder="Real-Time Telemetry Engine"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Repository / Live URL</label>
                        <input
                          type="url"
                          value={proj.url || ''}
                          onChange={(e) => updateProjectItem(pIdx, 'url', e.target.value)}
                          placeholder="https://github.com/org/repo"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Project Description & Architecture</label>
                      <textarea
                        rows={2}
                        value={proj.description || ''}
                        onChange={(e) => updateProjectItem(pIdx, 'description', e.target.value)}
                        placeholder="Built an asynchronous high-throughput ingestion pipeline handling 10k events/sec..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-xs leading-relaxed text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECTION 7: Certifications */}
            {activeSection === 'certifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#1C130E] p-4 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A]">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Certifications & Accreditations</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Industry licenses, cloud certifications, and credentials</p>
                  </div>
                  <button
                    onClick={addCertificationItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C27803] hover:bg-[#a66702] text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Certification</span>
                  </button>
                </div>

                {(activeResume?.certifications || []).map((cert, cIdx) => (
                  <div key={cert.id || cIdx} className="bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-2">
                      <span className="text-xs font-mono font-bold text-stone-400">Certification #{cIdx + 1}</span>
                      <button
                        onClick={() => removeCertificationItem(cIdx)}
                        className="text-stone-400 hover:text-rose-500 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Certification Name</label>
                        <input
                          type="text"
                          value={cert.name || ''}
                          onChange={(e) => updateCertificationItem(cIdx, 'name', e.target.value)}
                          placeholder="AWS Certified Solutions Architect - Associate"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Issuing Authority</label>
                        <input
                          type="text"
                          value={cert.issuer || ''}
                          onChange={(e) => updateCertificationItem(cIdx, 'issuer', e.target.value)}
                          placeholder="Amazon Web Services"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Issue Date</label>
                        <input
                          type="text"
                          value={cert.issue_date || ''}
                          onChange={(e) => updateCertificationItem(cIdx, 'issue_date', e.target.value)}
                          placeholder="Oct 2023"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Credential URL or ID</label>
                        <input
                          type="text"
                          value={cert.credential_id || ''}
                          onChange={(e) => updateCertificationItem(cIdx, 'credential_id', e.target.value)}
                          placeholder="AWS-82914712"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECTION 8: Languages */}
            {activeSection === 'languages' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#1C130E] p-4 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A]">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Languages & Multilingual Proficiency</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Spoken and written language proficiencies</p>
                  </div>
                  <button
                    onClick={addLanguageItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C27803] hover:bg-[#a66702] text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Language</span>
                  </button>
                </div>

                {(activeResume?.languages || []).map((lang, lIdx) => (
                  <div key={lang.id || lIdx} className="bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-2">
                      <span className="text-xs font-mono font-bold text-stone-400">Language #{lIdx + 1}</span>
                      <button
                        onClick={() => removeLanguageItem(lIdx)}
                        className="text-stone-400 hover:text-rose-500 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Language</label>
                        <input
                          type="text"
                          value={lang.language || ''}
                          onChange={(e) => updateLanguageItem(lIdx, 'language', e.target.value)}
                          placeholder="English, Spanish, Mandarin..."
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Proficiency Level</label>
                        <FancyStudioDropdown
                          value={lang.proficiency || 'Professional Working'}
                          onChange={(val) => updateLanguageItem(lIdx, 'proficiency', val)}
                          options={LANGUAGE_PROFICIENCY_OPTIONS}
                          placeholder="Select proficiency..."
                          menuWidth="w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECTION 9: Awards & Honors */}
            {activeSection === 'awards' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#1C130E] p-4 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A]">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Awards & Honors</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Scholarships, hackathon wins, honors, and notable recognitions</p>
                  </div>
                  <button
                    onClick={addAwardItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C27803] hover:bg-[#a66702] text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Award</span>
                  </button>
                </div>

                {(activeResume?.awards || []).map((award, aIdx) => (
                  <div key={award.id || aIdx} className="bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-2">
                      <span className="text-xs font-mono font-bold text-stone-400">Award #{aIdx + 1}</span>
                      <button
                        onClick={() => removeAwardItem(aIdx)}
                        className="text-stone-400 hover:text-rose-500 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Award Title</label>
                        <input
                          type="text"
                          value={award.title || ''}
                          onChange={(e) => updateAwardItem(aIdx, 'title', e.target.value)}
                          placeholder="Global AI Hackathon 1st Place"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Date / Year</label>
                        <input
                          type="text"
                          value={award.date || ''}
                          onChange={(e) => updateAwardItem(aIdx, 'date', e.target.value)}
                          placeholder="2023"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Grantor / Issuer</label>
                      <input
                        type="text"
                        value={award.issuer || ''}
                        onChange={(e) => updateAwardItem(aIdx, 'issuer', e.target.value)}
                        placeholder="OpenAI / TechCrunch"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="text-xs">
                      <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                      <textarea
                        rows={2}
                        value={award.description || ''}
                        onChange={(e) => updateAwardItem(aIdx, 'description', e.target.value)}
                        placeholder="Awarded top honors among 450 engineering teams for autonomous distributed systems..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECTION 10: Volunteer & Leadership Experience */}
            {activeSection === 'volunteering' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#1C130E] p-4 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A]">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Volunteer & Community Leadership</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Non-profit contributions, mentoring, open-source community service</p>
                  </div>
                  <button
                    onClick={addVolunteerItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C27803] hover:bg-[#a66702] text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Volunteering</span>
                  </button>
                </div>

                {(activeResume?.volunteering || []).map((vol, vIdx) => (
                  <div key={vol.id || vIdx} className="bg-white dark:bg-[#1C130E] p-5 rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-2">
                      <span className="text-xs font-mono font-bold text-stone-400">Volunteer #{vIdx + 1}</span>
                      <button
                        onClick={() => removeVolunteerItem(vIdx)}
                        className="text-stone-400 hover:text-rose-500 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Role / Title</label>
                        <input
                          type="text"
                          value={vol.role || ''}
                          onChange={(e) => updateVolunteerItem(vIdx, 'role', e.target.value)}
                          placeholder="Technical Mentor / Volunteer Lead"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Organization</label>
                        <input
                          type="text"
                          value={vol.organization || ''}
                          onChange={(e) => updateVolunteerItem(vIdx, 'organization', e.target.value)}
                          placeholder="Code.org / Local Youth Center"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Start Date</label>
                        <input
                          type="text"
                          value={vol.start_date || ''}
                          onChange={(e) => updateVolunteerItem(vIdx, 'start_date', e.target.value)}
                          placeholder="Jan 2022"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">End Date</label>
                        <input
                          type="text"
                          value={vol.end_date || ''}
                          onChange={(e) => updateVolunteerItem(vIdx, 'end_date', e.target.value)}
                          placeholder="Present"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Description / Impact</label>
                      <textarea
                        rows={2}
                        value={vol.description || ''}
                        onChange={(e) => updateVolunteerItem(vIdx, 'description', e.target.value)}
                        placeholder="Mentored 25+ aspiring developers through foundational algorithms and open-source contributions..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* RIGHT COLUMN: Real-Time ATS Document Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5 xl:col-span-6' : 'lg:col-span-12'} sticky top-20 self-start print:static print:w-full print:block print:p-0 print:m-0`}>
            
            {/* Live Document Appearance Controls */}
            <div className="mb-3 p-4 rounded-2xl bg-white dark:bg-[#1C130E] border border-[#EAE2D9] dark:border-[#2B201A] shadow-xs space-y-3.5 print:hidden">
              
              {/* Primary Document Styling Selectors (Balanced 3-column grid with ample width and zero collision) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                
                {/* 1. Layout Template Format */}
                <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 truncate">
                    Layout Template
                  </label>
                  <FancyStudioDropdown
                    value={activeResume?.contact_info?.layout_template || (
                      (activeResume?.contact_info?.theme === 'tech') ? 'tech_terminal' :
                      (activeResume?.contact_info?.theme === 'executive') ? 'executive_banner' :
                      (activeResume?.contact_info?.theme === 'classic' || activeResume?.contact_info?.theme === 'academic') ? 'classic' :
                      (activeResume?.contact_info?.theme === 'creative') ? 'creative' :
                      (activeResume?.contact_info?.theme === 'compact') ? 'compact' :
                      (activeResume?.contact_info?.theme === 'minimal') ? 'minimal' :
                      'two_column_left'
                    )}
                    onChange={(val) => updateContactField('layout_template', val)}
                    icon={Columns}
                    options={LAYOUT_FORMATS}
                    placeholder="Select Layout..."
                    menuWidth="w-80 sm:w-88"
                  />
                </div>

                {/* 2. Color Palette Theme Dropdown */}
                <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 truncate" title="Color theme for headings, section indicators, lines, icons and highlights">
                    Color Theme (Headings & Accents)
                  </label>
                  <FancyStudioDropdown
                    value={activeResume?.contact_info?.accent_color || '#C27803'}
                    onChange={(val) => updateContactField('accent_color', val)}
                    icon={Palette}
                    options={COLOR_THEME_OPTIONS}
                    placeholder="Select Color..."
                    menuWidth="w-80 sm:w-84"
                  />
                </div>

                {/* 3. Style Theme Preset */}
                <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 truncate">
                    Style Theme
                  </label>
                  <FancyStudioDropdown
                    value={activeResume?.contact_info?.theme || 'executive'}
                    onChange={(val) => updateContactField('theme', val)}
                    icon={Sparkles}
                    options={RESUME_THEMES}
                    placeholder="Select Theme..."
                    menuWidth="w-80 sm:w-84"
                    align="right"
                  />
                </div>

                {/* 4. Typography Font Family */}
                <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 truncate">
                    Typography Font
                  </label>
                  <FancyStudioDropdown
                    value={activeResume?.contact_info?.font_family || 'sans'}
                    onChange={(val) => updateContactField('font_family', val)}
                    icon={Type}
                    options={FONT_OPTIONS}
                    placeholder="Select Font..."
                    menuWidth="w-80 sm:w-84"
                  />
                </div>

                {/* 5. Photo Placement */}
                <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 truncate">
                    Photo Position
                  </label>
                  <FancyStudioDropdown
                    value={activeResume?.contact_info?.photo_position || 'right'}
                    onChange={(val) => {
                      updateContactField('photo_position', val);
                      if (val === 'hidden') {
                        updateContactField('show_photo', false);
                      } else {
                        updateContactField('show_photo', true);
                        if (!activeResume?.contact_info?.photo_url) {
                          updateContactField('photo_url', SAMPLE_AVATARS[0].url);
                        }
                      }
                    }}
                    icon={Camera}
                    options={PHOTO_POSITION_OPTIONS}
                    placeholder="Photo Pos..."
                    menuWidth="w-72 sm:w-80"
                  />
                </div>

                {/* 6. Bullet Point Style */}
                <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 truncate">
                    Bullet Point Style
                  </label>
                  <FancyStudioDropdown
                    value={activeResume?.contact_info?.bullet_style || '•'}
                    onChange={(val) => updateContactField('bullet_style', val)}
                    icon={List}
                    options={BULLET_OPTIONS}
                    placeholder="Bullet Style..."
                    menuWidth="w-72 sm:w-80"
                    align="right"
                  />
                </div>

              </div>

              {/* Quick Actions Bar: Color Swatches, Photo Shape, Density & Tailor Button */}
              <div className="pt-2.5 border-t border-stone-100 dark:border-[#281D17] flex flex-wrap items-center justify-between gap-3 text-xs">
                
                {/* Theme Color Quick Swatches */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-stone-700 dark:text-stone-300 mr-0.5 shrink-0" title="Changes headings, highlights, lines, and bullet color">
                    Quick Colors (Headings & Dividers):
                  </span>
                  
                  {/* Color dots with real, fixed 20px sizes */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ACCENT_COLORS.map(c => {
                      const currentHex = (activeResume?.contact_info?.accent_color || '#C27803').toLowerCase();
                      const isSelected = currentHex === c.hex.toLowerCase();
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateContactField('accent_color', c.hex)}
                          className={`w-5 h-5 rounded-full shrink-0 transition-all transform hover:scale-130 cursor-pointer ${
                            isSelected ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-white scale-110 shadow-xs' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={`${c.name} (${c.desc})`}
                        />
                      );
                    })}

                    {/* Custom Color Input for Infinite Flexibility */}
                    <label className="relative w-5 h-5 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 hover:scale-125 transition cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-500 shadow-xs" title="Pick any custom hex color">
                      <input
                        type="color"
                        value={activeResume?.contact_info?.accent_color || '#C27803'}
                        onChange={(e) => updateContactField('accent_color', e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Right controls: Photo Shape, Density, Tailor to Job */}
                <div className="flex items-center gap-2 flex-wrap">

                  {/* Photo Shape pills */}
                  <div className="flex items-center gap-1 border-l border-stone-200 dark:border-[#382820] pl-2">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Shape:</span>
                    <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-[#251A14] p-0.5 rounded-lg border border-stone-200 dark:border-[#382820]">
                      {PHOTO_SHAPE_OPTIONS.map(ps => {
                        const isShapeSelected = (activeResume?.contact_info?.photo_shape || 'circle') === ps.value;
                        return (
                          <button
                            key={ps.value}
                            type="button"
                            onClick={() => updateContactField('photo_shape', ps.value)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              isShapeSelected
                                ? 'bg-white dark:bg-[#1C130E] text-[#C27803] dark:text-amber-400 shadow-xs'
                                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                            }`}
                            title={ps.label}
                          >
                            {ps.value === 'circle' ? <Circle className="w-2.5 h-2.5" /> : ps.value === 'rounded' ? <Square className="w-2.5 h-2.5 rounded-xs" /> : <Square className="w-2.5 h-2.5" />}
                            <span>{ps.value === 'circle' ? 'Round' : ps.value === 'rounded' ? 'Soft' : 'Square'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Density toggle */}
                  <button
                    type="button"
                    onClick={() => updateContactField('compact', !(activeResume?.contact_info?.compact))}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                      activeResume?.contact_info?.compact
                        ? 'bg-amber-500/10 border-amber-500/30 text-[#C27803] dark:text-amber-400 shadow-2xs'
                        : 'border-stone-200 dark:border-[#382820] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-[#251A14]'
                    }`}
                    title="Toggle compact 1-page line spacing"
                  >
                    {activeResume?.contact_info?.compact ? 'Density: Compact' : 'Density: Standard'}
                  </button>

                  {/* Tailor to Job */}
                  <button
                    type="button"
                    onClick={() => setIsTailorModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C27803] hover:bg-[#a66702] text-white transition shadow-xs cursor-pointer"
                    title="Tailor resume to open job requisition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tailor to Job</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Document Paper Container */}
            {(() => {
              const curTheme = activeResume?.contact_info?.theme || 'executive';
              const curAccent = activeResume?.contact_info?.accent_color || '#C27803';
              const isCompact = Boolean(activeResume?.contact_info?.compact);
              const curFont = activeResume?.contact_info?.font_family || 'sans';
              
              // Authentic CSS Font Family application
              const selectedFontObj = FONT_OPTIONS.find(f => f.value === curFont) || FONT_OPTIONS[0];
              const curFontFamilyCss = selectedFontObj.fontFamily || "'Inter', sans-serif";

              const curBullet = activeResume?.contact_info?.bullet_style || '•';

              // Photo configuration
              const photoUrl = activeResume?.contact_info?.photo_url;
              const showPhoto = activeResume?.contact_info?.show_photo !== false && Boolean(photoUrl);
              const photoPos = activeResume?.contact_info?.photo_position || 'right';
              const photoShape = activeResume?.contact_info?.photo_shape || 'circle';
              const photoSize = activeResume?.contact_info?.photo_size || 'md';

              const photoShapeClass = 
                photoShape === 'square' ? 'rounded-lg border-2' :
                photoShape === 'rounded' ? 'rounded-2xl border-2' :
                'rounded-full border-2';

              const photoSizeClass = 
                photoSize === 'sm' ? 'w-16 h-16 sm:w-16 sm:h-16' :
                photoSize === 'lg' ? 'w-24 h-24 sm:w-26 sm:h-26' :
                'w-20 h-20 sm:w-22 sm:h-22';

              // Inferred or explicit layout format
              const curLayout = activeResume?.contact_info?.layout_template || (
                curTheme === 'tech' ? 'tech_terminal' :
                curTheme === 'executive' ? 'executive_banner' :
                curTheme === 'creative' ? 'creative' :
                curTheme === 'classic' || curTheme === 'academic' ? 'classic' :
                curTheme === 'compact' ? 'compact' :
                curTheme === 'minimal' ? 'minimal' :
                'two_column_left'
              );

              // Candidate text fields
              const fullName = activeResume?.contact_info?.full_name || currentUser?.name || 'Candidate Name';
              const headline = activeResume?.contact_info?.headline || '';
              const email = activeResume?.contact_info?.email || '';
              const phone = activeResume?.contact_info?.phone || '';
              const location = activeResume?.contact_info?.location || '';
              const linkedin = activeResume?.contact_info?.linkedin_url || '';
              const github = activeResume?.contact_info?.github_url || '';
              const portfolio = activeResume?.contact_info?.portfolio_url || '';
              const summary = activeResume?.summary || '';
              const skills = activeResume?.skills || [];
              const experience = activeResume?.experience || [];
              const education = activeResume?.education || [];
              const projects = activeResume?.projects || [];
              const certifications = activeResume?.certifications || [];
              const languages = activeResume?.languages || [];
              const awards = activeResume?.awards || [];
              const volunteering = activeResume?.volunteering || [];

              // Helper: Photo Renderer
              const renderPhoto = (customImgClass = '', extraContainerClass = '') => {
                if (!showPhoto || photoPos === 'hidden') return null;
                return (
                  <div className={`shrink-0 print:block ${extraContainerClass}`}>
                    <img
                      src={photoUrl}
                      alt="Candidate Profile"
                      className={`${customImgClass || photoSizeClass} ${photoShapeClass} object-cover shadow-md ring-offset-2 ring-stone-900/10 dark:ring-white/10`}
                      style={{ borderColor: curAccent }}
                    />
                  </div>
                );
              };

              // Helper: Section Header Renderer
              const renderHeader = (title) => {
                if (curTheme === 'executive') {
                  return (
                    <div className={`flex items-center gap-2 border-b pb-1 ${isCompact ? 'mb-1.5' : 'mb-2'}`} style={{ borderColor: `${curAccent}35` }}>
                      <span className="w-1.5 h-3.5 rounded-xs" style={{ backgroundColor: curAccent }} />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 font-mono">
                        {title}
                      </h3>
                    </div>
                  );
                }
                if (curTheme === 'tech') {
                  return (
                    <div className={`border-b border-stone-200 dark:border-stone-800 pb-1 ${isCompact ? 'mb-1.5' : 'mb-2'}`}>
                      <h3 className="text-xs font-mono font-bold tracking-wider text-stone-900 dark:text-stone-100">
                        <span style={{ color: curAccent }}>//</span> {title.toUpperCase()}
                      </h3>
                    </div>
                  );
                }
                if (curTheme === 'classic') {
                  return (
                    <div className={`border-b-2 pb-0.5 ${isCompact ? 'mb-1.5' : 'mb-2'}`} style={{ borderBottomColor: curAccent }}>
                      <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                        {title}
                      </h3>
                    </div>
                  );
                }
                if (curTheme === 'creative') {
                  return (
                    <div className={`flex items-center gap-2 pb-1 ${isCompact ? 'mb-1.5' : 'mb-2'}`}>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-2xs" style={{ backgroundColor: curAccent }}>
                        {title}
                      </span>
                      <div className="flex-1 h-[1.5px]" style={{ backgroundColor: `${curAccent}35` }} />
                    </div>
                  );
                }
                if (curTheme === 'academic') {
                  return (
                    <div className={`border-b pb-0.5 ${isCompact ? 'mb-1.5' : 'mb-2'}`} style={{ borderColor: `${curAccent}50` }}>
                      <h3 className="text-xs font-serif italic tracking-wide text-stone-900 dark:text-stone-100">
                        <span style={{ color: curAccent }}>§</span> {title}
                      </h3>
                    </div>
                  );
                }
                if (curTheme === 'compact') {
                  return (
                    <div className={`flex items-center gap-2 border-b pb-0.5 ${isCompact ? 'mb-1' : 'mb-1.5'}`} style={{ borderColor: `${curAccent}40` }}>
                      <h3 className="text-[11px] font-bold uppercase tracking-tight font-sans" style={{ color: curAccent }}>
                        {title}
                      </h3>
                      <div className="flex-1 h-px" style={{ backgroundColor: `${curAccent}25` }} />
                    </div>
                  );
                }
                if (curTheme === 'minimal') {
                  return (
                    <div className={`border-b pb-1 ${isCompact ? 'mb-1.5' : 'mb-2'}`} style={{ borderColor: `${curAccent}40` }}>
                      <h3 className="text-xs font-light uppercase tracking-widest text-stone-900 dark:text-stone-100">
                        {title}
                      </h3>
                    </div>
                  );
                }
                return (
                  <div className={`flex items-center justify-between p-1 px-2.5 rounded-lg border pb-1 ${isCompact ? 'mb-1.5' : 'mb-2'}`} style={{ borderColor: `${curAccent}40`, backgroundColor: `${curAccent}0c` }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider font-sans" style={{ color: curAccent }}>
                      {title}
                    </h3>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: curAccent }} />
                  </div>
                );
              };

              // Helper: Contact List Renderer
              const renderContactStrip = (isVertical = false, isTerminal = false, isClassic = false) => {
                const items = [
                  email && { icon: Mail, label: email },
                  phone && { icon: Phone, label: phone },
                  location && { icon: MapPin, label: location },
                  linkedin && { icon: Globe, label: linkedin.replace(/^https?:\/\//, '') },
                  github && { icon: Code2, label: github.replace(/^https?:\/\//, '') },
                  portfolio && { icon: Link, label: portfolio.replace(/^https?:\/\//, '') }
                ].filter(Boolean);

                if (items.length === 0) return null;

                if (isTerminal) {
                  return (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {items.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 flex items-center gap-1.5">
                          <item.icon className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="select-all [overflow-wrap:anywhere]">{item.label}</span>
                        </span>
                      ))}
                    </div>
                  );
                }

                if (isVertical) {
                  return (
                    <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 min-w-0">
                          <item.icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: curAccent }} />
                          <span className="text-[11px] leading-snug select-all [overflow-wrap:anywhere] break-normal font-medium text-stone-700 dark:text-stone-300">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (isClassic) {
                  return (
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-stone-600 dark:text-stone-400">
                      {items.map((item, idx) => (
                        <React.Fragment key={idx}>
                          <span className="select-all [overflow-wrap:anywhere]">{item.label}</span>
                          {idx < items.length - 1 && <span className="text-stone-400 select-none">◆</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-stone-600 dark:text-stone-400 ${photoPos === 'centered' && showPhoto ? 'justify-center' : ''}`}>
                    {items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5">
                        <item.icon className="w-3.5 h-3.5 shrink-0 text-stone-400" style={{ color: curAccent }} />
                        <span className="select-all [overflow-wrap:anywhere]">{item.label}</span>
                      </span>
                    ))}
                  </div>
                );
              };

              // Helper: Professional Summary
              const renderSummary = () => {
                if (!summary) return null;
                return (
                  <div className={isCompact ? 'mb-3' : 'mb-4'}>
                    {renderHeader('Professional Summary')}
                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                      {summary}
                    </p>
                  </div>
                );
              };

              // Helper: Core Skills
              const renderSkills = (variant = 'pill') => {
                if (skills.length === 0) return null;
                return (
                  <div className={isCompact ? 'mb-3' : 'mb-4'}>
                    {renderHeader('Core Competencies & Technologies')}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {skills.map((s, i) => (
                        <span 
                          key={i} 
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                            variant === 'terminal' ? 'bg-stone-900 border-stone-800 text-emerald-300' : ''
                          }`}
                          style={
                            variant !== 'terminal' ? {
                              backgroundColor: `${curAccent}10`,
                              borderColor: `${curAccent}30`,
                              color: curTheme === 'tech' ? curAccent : undefined
                            } : {}
                          }
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              };

              // Helper: Professional Experience
              const renderExperience = (withTimeline = false, isTerminal = false) => {
                if (experience.length === 0) return null;
                return (
                  <div className={isCompact ? 'mb-3' : 'mb-4'}>
                    {renderHeader('Professional Experience')}
                    <div className={`${isCompact ? 'space-y-2.5' : 'space-y-3.5'} ${withTimeline ? 'border-l-2 pl-3 ml-1' : ''}`} style={withTimeline ? { borderColor: `${curAccent}30` } : {}}>
                      {experience.map((exp, i) => (
                        <div key={i} className="text-xs relative break-inside-avoid print:break-inside-avoid">
                          {withTimeline && (
                            <span 
                              className="absolute -left-[17px] top-1 w-2 h-2 rounded-full" 
                              style={{ backgroundColor: curAccent }} 
                            />
                          )}
                          <div className="flex flex-wrap items-baseline justify-between font-bold text-stone-900 dark:text-white">
                            <span>{exp.title} • <span style={{ color: curAccent }}>{exp.company}</span></span>
                            <span className="text-[11px] font-mono text-stone-500 font-normal">
                              {exp.start_date || 'Start'} – {exp.end_date || 'Present'}
                            </span>
                          </div>
                          {exp.location && (
                            <div className="text-[11px] text-stone-500 italic mb-1">{exp.location}</div>
                          )}
                          <ul className={`list-none ${isCompact ? 'space-y-0.5' : 'space-y-1'} text-stone-700 dark:text-stone-300 text-[11.5px] leading-relaxed mt-1`}>
                            {(exp.bullets || []).filter(Boolean).map((b, bi) => (
                              <li key={bi} className="flex items-start gap-2">
                                <span className="font-bold shrink-0 select-none text-[12px] leading-[18px]" style={{ color: curAccent }}>
                                  {curBullet}
                                </span>
                                <span className="flex-1">{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              // Helper: Education
              const renderEducation = () => {
                if (education.length === 0) return null;
                return (
                  <div className={isCompact ? 'mb-3' : 'mb-4'}>
                    {renderHeader('Education')}
                    <div className="space-y-2">
                      {education.map((edu, i) => (
                        <div key={i} className="text-xs flex items-baseline justify-between break-inside-avoid print:break-inside-avoid">
                          <div>
                            <span className="font-bold text-stone-900 dark:text-white">{edu.degree}</span>
                            {edu.institution && (
                              <span className="text-stone-600 dark:text-stone-400">, {edu.institution}</span>
                            )}
                            {edu.field_of_study && (
                              <span className="text-stone-500 italic"> ({edu.field_of_study})</span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-stone-500">
                            {edu.graduation_year || ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              // Helper: Projects
              const renderProjects = () => {
                if (projects.length === 0) return null;
                return (
                  <div className={isCompact ? 'mb-3' : 'mb-4'}>
                    {renderHeader('Featured Projects')}
                    <div className="space-y-2.5">
                      {projects.map((proj, i) => (
                        <div key={i} className="text-xs p-2.5 rounded-xl bg-stone-50/60 dark:bg-[#140E0B]/60 border border-stone-200/60 dark:border-[#281D17] break-inside-avoid print:break-inside-avoid">
                          <div className="flex items-baseline justify-between font-bold text-stone-900 dark:text-white">
                            <span>{proj.name}</span>
                            {proj.url && (
                              <a 
                                href={proj.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[11px] hover:underline font-mono"
                                style={{ color: curAccent }}
                              >
                                View Link ↗
                              </a>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-stone-700 dark:text-stone-300 text-[11px] mt-0.5">{proj.description}</p>
                          )}
                          {(proj.technologies || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {proj.technologies.map((t, ti) => (
                                <span key={ti} className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              // Helper: Certifications
              const renderCertifications = () => {
                if (certifications.length === 0) return null;
                return (
                  <div className={isCompact ? 'mb-3' : 'mb-4'}>
                    {renderHeader('Certifications')}
                    <div className="space-y-1.5">
                      {certifications.map((cert, i) => (
                        <div key={i} className="text-xs flex items-baseline justify-between text-stone-700 dark:text-stone-300 break-inside-avoid print:break-inside-avoid">
                          <span><strong>{cert.name}</strong> • {cert.issuer}</span>
                          <span className="text-[11px] font-mono text-stone-500">{cert.issue_date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              // Helper: Languages
              const renderLanguages = () => {
                if (languages.length === 0) return null;
                return (
                  <div className={isCompact ? 'mb-3' : 'mb-4'}>
                    {renderHeader('Languages')}
                    <div className="flex flex-wrap gap-2 text-xs text-stone-800 dark:text-stone-200">
                      {languages.map((lang, i) => (
                        <span key={i} className="bg-stone-100 dark:bg-[#201814] px-2.5 py-1 rounded-md text-[11px] border border-stone-200/80 dark:border-[#34241B]">
                          <strong>{lang.language}</strong> <span className="text-stone-500 dark:text-stone-400">({lang.proficiency})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              };

              // Helper: Awards
              const renderAwards = () => {
                if (awards.length === 0) return null;
                return (
                  <div className={isCompact ? 'mb-3' : 'mb-4'}>
                    {renderHeader('Awards & Honors')}
                    <div className="space-y-1.5">
                      {awards.map((award, i) => (
                        <div key={i} className="text-xs text-stone-700 dark:text-stone-300 break-inside-avoid print:break-inside-avoid">
                          <div className="flex items-baseline justify-between">
                            <span><strong>{award.title}</strong>{award.issuer && ` • ${award.issuer}`}</span>
                            <span className="text-[11px] font-mono text-stone-500">{award.date}</span>
                          </div>
                          {award.description && (
                            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">{award.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              // Helper: Volunteering
              const renderVolunteering = () => {
                if (volunteering.length === 0) return null;
                return (
                  <div>
                    {renderHeader('Volunteer & Community')}
                    <div className="space-y-2">
                      {volunteering.map((vol, i) => (
                        <div key={i} className="text-xs text-stone-700 dark:text-stone-300 break-inside-avoid print:break-inside-avoid">
                          <div className="flex items-baseline justify-between font-bold text-stone-900 dark:text-white">
                            <span>{vol.role} • {vol.organization}</span>
                            <span className="text-[11px] font-mono font-normal text-stone-500">
                              {vol.start_date && `${vol.start_date} - ${vol.end_date || 'Present'}`}
                            </span>
                          </div>
                          {vol.description && (
                            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">{vol.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              return (
                <div 
                  className={`bg-white dark:bg-[#18110D] rounded-2xl border border-[#EAE2D9] dark:border-[#2B201A] shadow-md p-6 sm:p-8 max-h-[calc(100vh-6.5rem)] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible print:bg-white print:text-black print:rounded-none ${isCompact ? 'text-[11px]' : ''}`}
                  style={{ fontFamily: curFontFamilyCss }}
                >
                  
                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 1: Modern 2-Column with Sidebar Left
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'two_column_left') && (
                    <div className="space-y-6">
                      {/* Full-Width Universal Hero Header */}
                      <div className="pb-5 border-b" style={{ borderColor: `${curAccent}30` }}>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-2.5">
                                {renderPhoto()}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-sm font-bold uppercase tracking-wider mt-1" style={{ color: curAccent }}>
                                {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'sidebar', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2-Column Lower Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Left Sidebar */}
                        <div className="md:col-span-5 lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-[#140E0B]/80 border border-stone-200/60 dark:border-[#281D17] space-y-5">
                          {photoPos === 'sidebar' && (
                            <div className="flex justify-center mb-1">
                              {renderPhoto()}
                            </div>
                          )}
                          <div>
                            {renderHeader('Contact')}
                            {renderContactStrip(true)}
                          </div>
                          {skills.length > 0 && renderSkills('pill')}
                          {education.length > 0 && renderEducation()}
                          {languages.length > 0 && renderLanguages()}
                          {certifications.length > 0 && renderCertifications()}
                        </div>

                        {/* Right Main Column */}
                        <div className="md:col-span-7 lg:col-span-8 space-y-5">
                          {renderSummary()}
                          {renderExperience(true)}
                          {renderProjects()}
                          {renderAwards()}
                          {renderVolunteering()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 2: Modern 2-Column with Sidebar Right
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'two_column_right') && (
                    <div className="space-y-6">
                      {/* Full-Width Universal Hero Header */}
                      <div className="pb-5 border-b" style={{ borderColor: `${curAccent}30` }}>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-2.5">
                                {renderPhoto()}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-sm font-bold uppercase tracking-wider mt-1" style={{ color: curAccent }}>
                                {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'sidebar', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2-Column Lower Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Left Main Column */}
                        <div className="md:col-span-7 lg:col-span-8 space-y-5">
                          {renderSummary()}
                          {renderExperience(true)}
                          {renderProjects()}
                          {renderAwards()}
                          {renderVolunteering()}
                        </div>

                        {/* Right Sidebar */}
                        <div className="md:col-span-5 lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-[#140E0B]/80 border border-stone-200/60 dark:border-[#281D17] space-y-5">
                          {photoPos === 'sidebar' && (
                            <div className="flex justify-center mb-1">
                              {renderPhoto()}
                            </div>
                          )}
                          <div>
                            {renderHeader('Contact')}
                            {renderContactStrip(true)}
                          </div>
                          {skills.length > 0 && renderSkills('pill')}
                          {education.length > 0 && renderEducation()}
                          {languages.length > 0 && renderLanguages()}
                          {certifications.length > 0 && renderCertifications()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 3: Executive Luxe Banner
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'executive_banner') && (
                    <div>
                      {/* Full-Width Luxury Banner */}
                      <div 
                        className="p-6 rounded-2xl text-white shadow-md mb-6 relative overflow-hidden"
                        style={{ 
                          background: `linear-gradient(135deg, #1C130E 0%, #2A1C14 50%, #150E0A 100%)`, 
                          borderLeft: `6px solid ${curAccent}` 
                        }}
                      >
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto('ring-amber-500/50')}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto('ring-amber-500/50')}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-sm font-bold uppercase tracking-wider mt-1 text-amber-400">
                                {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto('ring-amber-500/50')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lower 2-Column Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-5">
                          {renderSummary()}
                          {renderExperience(true)}
                          {renderProjects()}
                        </div>
                        <div className="md:col-span-4 space-y-5">
                          {renderSkills('pill')}
                          {renderEducation()}
                          {renderCertifications()}
                          {renderLanguages()}
                          {renderAwards()}
                          {renderVolunteering()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 4: Silicon Tech Terminal
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'tech_terminal') && (
                    <div className="rounded-2xl border-2 border-stone-800 dark:border-stone-700 bg-stone-950 text-stone-100 font-mono shadow-xl overflow-hidden -m-2 sm:-m-4">
                      {/* macOS/Linux Terminal Bar */}
                      <div className="bg-stone-900 border-b border-stone-800 px-4 py-2.5 flex items-center justify-between text-xs select-none">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                          <span className="ml-2 text-stone-400 font-mono text-[11px]">bash — arete-cli@developer-studio</span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono">git:(main) ✔</span>
                      </div>

                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Prompt Header */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-4 border-b border-stone-800">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto('border-2 border-emerald-500/40 rounded-xl')}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto('border-2 border-emerald-500/40 rounded-xl')}
                              </div>
                            )}
                            <p className="text-emerald-400 text-xs font-mono mb-1">$ whoami</p>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono uppercase">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-xs font-mono mt-1" style={{ color: curAccent }}>
                                <span className="text-stone-500">&gt; ROLE:</span> {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false, true)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto('border-2 border-emerald-500/40 rounded-xl')}
                            </div>
                          )}
                        </div>

                        {summary && (
                          <div>
                            <p className="text-stone-500 text-[11px] mb-1">// cat professional_summary.md</p>
                            <p className="text-stone-300 text-xs leading-relaxed bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                              {summary}
                            </p>
                          </div>
                        )}

                        {skills.length > 0 && (
                          <div>
                            <p className="text-stone-500 text-[11px] mb-1">// npm list --core-skills</p>
                            {renderSkills('terminal')}
                          </div>
                        )}

                        {experience.length > 0 && (
                          <div>
                            <p className="text-stone-500 text-[11px] mb-2">// git log --graph --oneline --experience</p>
                            {renderExperience(false, true)}
                          </div>
                        )}

                        {projects.length > 0 && (
                          <div>
                            <p className="text-stone-500 text-[11px] mb-2">// ls -la ~/featured_projects/</p>
                            {renderProjects(true)}
                          </div>
                        )}

                        {education.length > 0 && (
                          <div>
                            <p className="text-stone-500 text-[11px] mb-2">// cat academic_credentials.json</p>
                            {renderEducation(true)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 5: Wall Street Classic / Harvard
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'classic') && (
                    <div className="space-y-4 font-serif">
                      <div className="pb-3 border-b-2 border-stone-900 dark:border-stone-100">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${photoPos === 'centered' || !showPhoto || photoPos === 'hidden' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-2">
                                {renderPhoto()}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-wider text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-xs font-serif font-bold uppercase tracking-widest mt-1 text-stone-700 dark:text-stone-300">
                                {headline}
                              </p>
                            )}
                            <div className={`mt-2 ${photoPos === 'centered' || !showPhoto || photoPos === 'hidden' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false, false, true)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSummary()}
                      {renderExperience()}
                      {renderEducation()}
                      {renderSkills('clean')}
                      {renderProjects()}
                      {renderCertifications()}
                      {renderLanguages()}
                      {renderAwards()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 6: Nordic Minimalist
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'minimal') && (
                    <div className="space-y-5">
                      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto()}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-widest text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-xs font-medium tracking-wide uppercase mt-1" style={{ color: curAccent }}>
                                {headline}
                              </p>
                            )}
                            <div className={`mt-2 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSummary()}
                      {renderSkills('pill')}
                      {renderExperience(true)}
                      {renderProjects()}
                      {renderEducation()}
                      {renderLanguages()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 7: Creative Studio Ribbon
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'creative') && (
                    <div className="space-y-5 border-l-4 pl-5 sm:pl-6" style={{ borderLeftColor: curAccent }}>
                      <div className="pb-3 border-b border-stone-200 dark:border-stone-800">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto()}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold text-white mt-1 shadow-xs" style={{ backgroundColor: curAccent }}>
                                {headline}
                              </span>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSummary()}
                      {renderSkills('pill')}
                      {renderExperience(true)}
                      {renderProjects()}
                      {renderEducation()}
                      {renderLanguages()}
                      {renderAwards()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 8: Compact ATS Blitz (1-Page High Density)
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'compact') && (
                    <div className="space-y-2.5 text-[11px] leading-tight">
                      <div className="pb-1.5 border-b" style={{ borderColor: `${curAccent}40` }}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto('w-12 h-12')}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-1.5">
                                {renderPhoto('w-12 h-12')}
                              </div>
                            )}
                            <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-stone-900 dark:text-white inline-block mr-2">
                              {fullName}
                            </h1>
                            {headline && (
                              <span className="text-[11px] font-bold uppercase tracking-tight font-mono" style={{ color: curAccent }}>
                                // {headline}
                              </span>
                            )}
                            <div className={`mt-0.5 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto('w-12 h-12')}
                            </div>
                          )}
                        </div>
                      </div>

                      {summary && (
                        <div>
                          {renderHeader('Summary')}
                          <p className="text-stone-700 dark:text-stone-300 text-[11px]">{summary}</p>
                        </div>
                      )}

                      {skills.length > 0 && (
                        <div>
                          {renderHeader('Skills')}
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {skills.map((s, i) => (
                              <span key={i} className="px-1.5 py-0.2 rounded border bg-stone-50 dark:bg-stone-900 font-mono">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {renderExperience(false)}
                      {renderEducation()}
                      {renderProjects()}
                      {renderCertifications()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 9: Contemporary Luxe Card
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'modernist') && (
                    <div className="space-y-6">
                      {/* Floating Header Card */}
                      <div 
                        className="p-6 rounded-2xl border shadow-sm relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${curAccent}0c 0%, ${curAccent}03 100%)`,
                          borderColor: `${curAccent}35`
                        }}
                      >
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto('ring-4 ring-offset-2 ring-stone-900/10')}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto('ring-4 ring-offset-2 ring-stone-900/10')}
                              </div>
                            )}
                            <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${showPhoto && photoPos === 'centered' ? 'mx-auto' : ''}`} style={{ backgroundColor: `${curAccent}20`, color: curAccent }}>
                              <Crown className="w-3 h-3" />
                              <span>Executive Profile</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-sm font-bold uppercase tracking-wider mt-1 text-stone-700 dark:text-stone-300">
                                {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto('ring-4 ring-offset-2 ring-stone-900/10')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Balanced Dual-Column Flow */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-5">
                          {renderSummary()}
                          {renderExperience(true)}
                          {renderProjects()}
                          {renderAwards()}
                        </div>
                        <div className="md:col-span-4 space-y-5">
                          {renderSkills('pill')}
                          {renderEducation()}
                          {renderCertifications()}
                          {renderLanguages()}
                          {renderVolunteering()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 10: Oxford Academic & Research
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'academic') && (
                    <div className="space-y-5 font-serif">
                      {/* Formal Centered Letterhead */}
                      <div className="pb-4 border-b-2 border-stone-800 dark:border-stone-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${photoPos === 'centered' || !showPhoto || photoPos === 'hidden' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-2">
                                {renderPhoto()}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black uppercase tracking-wider text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-xs font-serif italic tracking-widest mt-1 text-stone-700 dark:text-stone-300">
                                {headline}
                              </p>
                            )}
                            <div className={`mt-2.5 ${photoPos === 'centered' || !showPhoto || photoPos === 'hidden' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false, false, true)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {summary && (
                        <div>
                          <div className="border-b border-stone-400 dark:border-stone-600 pb-0.5 mb-2">
                            <h3 className="text-xs font-serif italic tracking-wide text-stone-900 dark:text-stone-100">
                              § I. RESEARCH STATEMENT & SUMMARY
                            </h3>
                          </div>
                          <p className="text-xs leading-relaxed text-stone-800 dark:text-stone-200">
                            {summary}
                          </p>
                        </div>
                      )}

                      {education.length > 0 && (
                        <div>
                          <div className="border-b border-stone-400 dark:border-stone-600 pb-0.5 mb-2">
                            <h3 className="text-xs font-serif italic tracking-wide text-stone-900 dark:text-stone-100">
                              § II. ACADEMIC APPOINTMENTS & DEGREES
                            </h3>
                          </div>
                          {renderEducation()}
                        </div>
                      )}

                      {experience.length > 0 && (
                        <div>
                          <div className="border-b border-stone-400 dark:border-stone-600 pb-0.5 mb-2">
                            <h3 className="text-xs font-serif italic tracking-wide text-stone-900 dark:text-stone-100">
                              § III. PROFESSIONAL & RESEARCH EXPERIENCE
                            </h3>
                          </div>
                          {renderExperience(false)}
                        </div>
                      )}

                      {projects.length > 0 && (
                        <div>
                          <div className="border-b border-stone-400 dark:border-stone-600 pb-0.5 mb-2">
                            <h3 className="text-xs font-serif italic tracking-wide text-stone-900 dark:text-stone-100">
                              § IV. PUBLICATIONS, GRANTS & RESEARCH PROJECTS
                            </h3>
                          </div>
                          {renderProjects()}
                        </div>
                      )}

                      {skills.length > 0 && (
                        <div>
                          <div className="border-b border-stone-400 dark:border-stone-600 pb-0.5 mb-2">
                            <h3 className="text-xs font-serif italic tracking-wide text-stone-900 dark:text-stone-100">
                              § V. METHODOLOGIES & TECHNICAL COMPETENCIES
                            </h3>
                          </div>
                          {renderSkills('clean')}
                        </div>
                      )}

                      {awards.length > 0 && (
                        <div>
                          <div className="border-b border-stone-400 dark:border-stone-600 pb-0.5 mb-2">
                            <h3 className="text-xs font-serif italic tracking-wide text-stone-900 dark:text-stone-100">
                              § VI. HONORS, AWARDS & FELLOWSHIPS
                            </h3>
                          </div>
                          {renderAwards()}
                        </div>
                      )}

                      {certifications.length > 0 && renderCertifications()}
                      {languages.length > 0 && renderLanguages()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 11: Silicon Startup Velocity
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'startup') && (
                    <div className="space-y-5">
                      {/* Dynamic Header */}
                      <div className="p-5 rounded-2xl bg-stone-900 text-white shadow-md border border-stone-800">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto('border-2 border-emerald-500/50')}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto('border-2 border-emerald-500/50')}
                              </div>
                            )}
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider mb-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ${showPhoto && photoPos === 'centered' ? 'mx-auto' : ''}`}>
                              <Rocket className="w-3 h-3" />
                              <span>HIGH GROWTH OPERATOR</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-xs font-mono font-bold uppercase tracking-wider mt-1 text-amber-400">
                                {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto('border-2 border-emerald-500/50')}
                            </div>
                          )}
                        </div>

                        {/* Velocity Metric Stats Bar */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-800 text-center font-mono text-[11px]">
                          <div className="p-2 rounded-xl bg-stone-800/60">
                            <span className="block text-stone-400 text-[9px] uppercase font-bold">Skills Mastered</span>
                            <span className="text-sm font-black text-amber-400">{skills.length}+ Technologies</span>
                          </div>
                          <div className="p-2 rounded-xl bg-stone-800/60">
                            <span className="block text-stone-400 text-[9px] uppercase font-bold">Career Roles</span>
                            <span className="text-sm font-black text-emerald-400">{experience.length} Positions</span>
                          </div>
                          <div className="p-2 rounded-xl bg-stone-800/60">
                            <span className="block text-stone-400 text-[9px] uppercase font-bold">Shipped Projects</span>
                            <span className="text-sm font-black text-cyan-400">{projects.length} Repos</span>
                          </div>
                        </div>
                      </div>

                      {renderSummary()}
                      {renderSkills('pill')}
                      {renderExperience(true)}
                      {renderProjects()}
                      {renderEducation()}
                      {renderCertifications()}
                      {renderLanguages()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 12: Modern Hybrid ATS Timeline
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'timeline') && (
                    <div className="space-y-6">
                      {/* Top Header */}
                      <div className="pb-4 border-b" style={{ borderColor: `${curAccent}30` }}>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto()}
                              </div>
                            )}
                            <div className={`flex items-center gap-2 mb-1 ${showPhoto && photoPos === 'centered' ? 'justify-center' : ''}`}>
                              <Clock className="w-4 h-4" style={{ color: curAccent }} />
                              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500">
                                Chronological Milestone Track
                              </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-sm font-bold uppercase tracking-wider mt-1" style={{ color: curAccent }}>
                                {headline}
                              </p>
                            )}
                            <div className={`mt-2.5 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSummary()}

                      {/* Timeline Experience Rail */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-4">
                          <div className="border-b pb-1" style={{ borderColor: `${curAccent}30` }}>
                            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-stone-900 dark:text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: curAccent }} />
                              Career Trajectory & Milestones
                            </h3>
                          </div>
                          {renderExperience(true)}
                          {renderProjects()}
                        </div>

                        <div className="md:col-span-4 space-y-5">
                          {renderSkills('pill')}
                          {renderEducation()}
                          {renderCertifications()}
                          {renderLanguages()}
                          {renderAwards()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 13: Fortune 500 Corporate Standard
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'corporate') && (
                    <div className="space-y-4">
                      {/* Executive Letterhead Header */}
                      <div className="pb-3 border-b-2 border-stone-800 dark:border-stone-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${photoPos === 'centered' || !showPhoto || photoPos === 'hidden' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-2">
                                {renderPhoto()}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-xs font-bold uppercase tracking-wider mt-1 text-stone-700 dark:text-stone-300">
                                {headline}
                              </p>
                            )}
                            <div className={`mt-2 pt-2 border-t border-stone-200 dark:border-stone-800 ${photoPos === 'centered' || !showPhoto || photoPos === 'hidden' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSummary()}

                      {skills.length > 0 && (
                        <div>
                          {renderHeader('Executive Core Competencies')}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {skills.map((s, i) => (
                              <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-50 dark:bg-[#140E0B] border border-stone-200/80 dark:border-[#281D17]">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: curAccent }} />
                                <span className="font-semibold text-stone-800 dark:text-stone-200 text-[11px] truncate">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {renderExperience(true)}
                      {renderEducation()}
                      {renderProjects()}
                      {renderCertifications()}
                      {renderLanguages()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 14: Infographic Clean Matrix
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'infographic') && (
                    <div className="space-y-5">
                      {/* Top Visual Header */}
                      <div className="p-5 rounded-2xl border-2" style={{ borderColor: `${curAccent}40`, backgroundColor: `${curAccent}08` }}>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto()}
                              </div>
                            )}
                            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${showPhoto && photoPos === 'centered' ? 'mx-auto' : ''}`} style={{ backgroundColor: `${curAccent}25`, color: curAccent }}>
                              <BarChart3 className="w-3 h-3" />
                              <span>Quantified Career Profile</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-xs font-bold uppercase tracking-wider mt-1 text-stone-600 dark:text-stone-400">
                                {headline}
                              </p>
                            )}
                            <div className={`mt-2.5 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSummary()}

                      {/* 2-Column Modular Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        <div className="md:col-span-8 space-y-5">
                          {renderExperience(true)}
                          {renderProjects()}
                        </div>
                        <div className="md:col-span-4 space-y-5">
                          {skills.length > 0 && (
                            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200/80 dark:border-[#281D17]">
                              {renderHeader('Key Competencies')}
                              <div className="flex flex-wrap gap-1.5">
                                {skills.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded text-[11px] font-semibold border" style={{ backgroundColor: `${curAccent}15`, borderColor: `${curAccent}30`, color: curAccent }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {renderEducation()}
                          {renderCertifications()}
                          {renderLanguages()}
                          {renderAwards()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 15: Parisian Luxe Editorial
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'elegant') && (
                    <div className="space-y-6 font-serif">
                      {/* Refined Minimal Editorial Header */}
                      <div className="pb-5 border-b" style={{ borderColor: `${curAccent}30` }}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto('rounded-full ring-4 ring-offset-2 ring-stone-200 dark:ring-stone-800')}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${photoPos === 'centered' || !showPhoto || photoPos === 'hidden' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto('rounded-full ring-4 ring-offset-2 ring-stone-200 dark:ring-stone-800')}
                              </div>
                            )}
                            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 dark:text-white uppercase">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-sm font-serif italic tracking-wider mt-1" style={{ color: curAccent }}>
                                {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${photoPos === 'centered' || !showPhoto || photoPos === 'hidden' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false, false, true)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto('rounded-full ring-4 ring-offset-2 ring-stone-200 dark:ring-stone-800')}
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSummary()}
                      {renderExperience(false)}
                      {renderProjects()}
                      {renderEducation()}
                      {renderSkills('pill')}
                      {renderCertifications()}
                      {renderLanguages()}
                      {renderAwards()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      LAYOUT 16: Cloud Systems Architect
                  ───────────────────────────────────────────────────────────── */}
                  {(curLayout === 'engineering') && (
                    <div className="space-y-5 font-mono">
                      {/* Architecture Blueprint Header */}
                      <div className="p-5 rounded-2xl bg-stone-950 text-stone-100 border-2 border-stone-800 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto('border-2 border-indigo-500/50 rounded-xl')}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-3">
                                {renderPhoto('border-2 border-indigo-500/50 rounded-xl')}
                              </div>
                            )}
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono mb-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ${showPhoto && photoPos === 'centered' ? 'mx-auto' : ''}`}>
                              <Cpu className="w-3 h-3" />
                              <span>DISTRIBUTED SYSTEMS ARCHITECTURE</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-mono">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-xs font-mono font-bold uppercase tracking-wider mt-1" style={{ color: curAccent }}>
                                // {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false, true)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto('border-2 border-indigo-500/50 rounded-xl')}
                            </div>
                          )}
                        </div>
                      </div>

                      {renderSummary()}
                      {skills.length > 0 && renderSkills('terminal')}
                      {renderExperience(true)}
                      {renderProjects()}
                      {renderEducation(true)}
                      {renderCertifications()}
                      {renderLanguages()}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      FALLBACK: If unknown layout template, default to two_column_left
                  ───────────────────────────────────────────────────────────── */}
                  {(!['two_column_left', 'two_column_right', 'executive_banner', 'tech_terminal', 'classic', 'minimal', 'creative', 'compact', 'modernist', 'academic', 'startup', 'timeline', 'corporate', 'infographic', 'elegant', 'engineering'].includes(curLayout)) && (
                    <div className="space-y-6">
                      <div className="pb-5 border-b" style={{ borderColor: `${curAccent}30` }}>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                          {showPhoto && photoPos === 'left' && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${showPhoto && photoPos === 'centered' ? 'text-center' : 'text-center sm:text-left'}`}>
                            {showPhoto && photoPos === 'centered' && (
                              <div className="flex justify-center mb-2.5">
                                {renderPhoto()}
                              </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
                              {fullName}
                            </h1>
                            {headline && (
                              <p className="text-sm font-bold uppercase tracking-wider mt-1" style={{ color: curAccent }}>
                                {headline}
                              </p>
                            )}
                            <div className={`mt-3 ${showPhoto && photoPos === 'centered' ? 'flex justify-center' : ''}`}>
                              {renderContactStrip(false)}
                            </div>
                          </div>
                          {showPhoto && (photoPos === 'right' || (!['left', 'centered', 'sidebar', 'hidden'].includes(photoPos))) && (
                            <div className="shrink-0">
                              {renderPhoto()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-5 lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-[#140E0B]/80 border border-stone-200/60 dark:border-[#281D17] space-y-5">
                          {photoPos === 'sidebar' && (
                            <div className="flex justify-center mb-1">
                              {renderPhoto()}
                            </div>
                          )}
                          <div>
                            {renderHeader('Contact')}
                            {renderContactStrip(true)}
                          </div>
                          {skills.length > 0 && renderSkills('pill')}
                          {education.length > 0 && renderEducation()}
                          {languages.length > 0 && renderLanguages()}
                          {certifications.length > 0 && renderCertifications()}
                        </div>

                        <div className="md:col-span-7 lg:col-span-8 space-y-5">
                          {renderSummary()}
                          {renderExperience(true)}
                          {renderProjects()}
                          {renderAwards()}
                          {renderVolunteering()}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}
          </div>
        )}

      </main>

      {/* ─── MODAL 1: AI Suggestion Review & Grounding Modal ──────────────── */}
      {aiModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:hidden">
          <div className="w-full max-w-xl bg-white dark:bg-[#1C130E] rounded-2xl border border-[#EAE2D9] dark:border-[#382820] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C27803] dark:text-amber-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  {aiModal.title}
                </h3>
              </div>
              <button
                onClick={() => setAiModal(prev => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiModal.isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-8 h-8 text-[#C27803] animate-spin mb-3" />
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Synthesizing Grounded Wording...
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
                  Applying Google X-Y-Z active achievement formula while strictly preserving your factual claims.
                </p>
              </div>
            ) : aiModal.error ? (
              <div className="py-4 space-y-3">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{aiModal.error}</span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setAiModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 dark:bg-[#281D17] text-stone-800 dark:text-stone-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Original Candidate Draft */}
                {aiModal.originalText && (
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Original Draft</span>
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-xs text-stone-700 dark:text-stone-300">
                      {aiModal.originalText}
                    </div>
                  </div>
                )}

                {/* Primary AI Grounded Suggestion */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C27803] dark:text-amber-400">
                      Recommended Refinement (Grounded)
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      Source: {aiModal.groundedSource}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/20 text-xs font-medium leading-relaxed text-stone-900 dark:text-stone-100">
                    {aiModal.suggestedText}
                  </div>
                  {aiModal.reasoning && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 italic">
                      Rationale: {aiModal.reasoning}
                    </p>
                  )}
                </div>

                {/* Alternative Phrasings */}
                {aiModal.alternatives && aiModal.alternatives.length > 0 && (
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Alternative Variations
                    </span>
                    {aiModal.alternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleApplyAISuggestion(alt)}
                        className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#140E0B] border border-stone-200 dark:border-[#382820] text-xs hover:border-amber-400 cursor-pointer transition flex items-center justify-between"
                      >
                        <span className="flex-1 text-stone-700 dark:text-stone-300">{alt}</span>
                        <span className="text-[10px] font-bold text-[#C27803] ml-2 shrink-0">Use this →</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-[#2B201A]">
                  <button
                    onClick={() => setAiModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#281D17] transition"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => handleApplyAISuggestion(aiModal.suggestedText)}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#C27803] hover:bg-[#a66702] text-white transition shadow-sm"
                  >
                    Apply Suggestion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Job-Specific Tailoring Modal ────────────────────────── */}
      {isTailorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:hidden">
          <div className={`w-full max-w-2xl bg-white dark:bg-[#1C130E] rounded-2xl border border-[#EAE2D9] dark:border-[#382820] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] ${
            tailorResult ? 'overflow-y-auto' : 'overflow-visible min-h-[480px]'
          }`}>
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#C27803]" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Job-Specific Resume Tailoring
                </h3>
              </div>
              <button
                onClick={() => { setIsTailorModalOpen(false); setTailorResult(null); }}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Target this resume to an active job requisition in the platform. Tailoring prioritizes your verified overlapping competencies and generates a targeted summary without fabricating claims. Your original base resume will remain untouched.
            </p>

            {/* Job Requisition Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Select Active Position ({allTailorJobs.length} Available)
                </label>
                <button
                  type="button"
                  onClick={loadTailorJobs}
                  disabled={isLoadingJobs}
                  className="inline-flex items-center gap-1 text-[11px] text-[#C27803] dark:text-amber-400 hover:underline"
                  title="Refresh jobs from ledger"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                  <span>Refresh Positions</span>
                </button>
              </div>
              <FancyStudioDropdown
                value={selectedTailorJobId || ''}
                onChange={(val) => { setSelectedTailorJobId(val); setTailorResult(null); }}
                icon={Briefcase}
                searchable={true}
                searchPlaceholder="Search 800+ positions by role, company, or team..."
                options={allTailorJobs.map(job => ({
                  value: job.id,
                  label: job.title,
                  badge: job.department || 'Active',
                  description: `${job.companyName || job.company_name || 'SparkX'} • ${job.location || 'Remote'} • ${job.experience_level || 'Engineering'}`,
                  icon: Briefcase
                }))}
                placeholder={isLoadingJobs ? 'Loading active positions...' : `Choose a Job Requisition (${allTailorJobs.length} available)`}
                menuWidth="w-full"
              />
              {allTailorJobs.length === 0 && !isLoadingJobs && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>No active positions currently published in the ledger.</span>
                  <button
                    type="button"
                    onClick={loadTailorJobs}
                    className="font-bold underline ml-2"
                  >
                    Try Refreshing
                  </button>
                </div>
              )}
            </div>

            {/* Run Tailoring Button */}
            {!tailorResult && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleStartTailoring}
                  disabled={!selectedTailorJobId || isTailoring}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#C27803] hover:bg-[#a66702] text-white transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isTailoring ? 'animate-spin' : ''}`} />
                  <span>{isTailoring ? 'Analyzing Requisition...' : 'Analyze & Generate Alignment'}</span>
                </button>
              </div>
            )}

            {/* Tailoring Results Display */}
            {tailorResult && (
              <div className="space-y-4 pt-3 border-t border-stone-100 dark:border-[#2B201A]">
                
                {/* Keywords Match Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="block font-bold text-emerald-800 dark:text-emerald-300 text-[11px] mb-1">
                      Matched Competencies ({tailorResult.matchedKeywords.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tailorResult.matchedKeywords.map((k, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-[10px] text-emerald-800 dark:text-emerald-200 font-mono">
                          {k}
                        </span>
                      ))}
                      {tailorResult.matchedKeywords.length === 0 && (
                        <span className="text-[11px] text-stone-500 italic">No exact matches yet.</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                    <span className="block font-bold text-amber-800 dark:text-amber-300 text-[11px] mb-1">
                      High-Priority Role Keywords ({tailorResult.recommendedKeywords.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tailorResult.recommendedKeywords.map((k, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-[10px] text-amber-800 dark:text-amber-200 font-mono">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Job Aligned Summary */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#C27803] dark:text-amber-400 mb-1">
                    Tailored Summary for {tailorResult.job?.title}
                  </span>
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
                    {tailorResult.tailoredSummary}
                  </div>
                </div>

                {/* Create Cloned Tailored Resume Button */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-[#2B201A]">
                  <p className="text-[11px] text-stone-500">
                    Creates a dedicated tailored version without altering your base resume.
                  </p>
                  <button
                    onClick={handleApplyTailoredClone}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#C27803] hover:bg-[#a66702] text-white transition shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Create Tailored Resume Clone</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Version History Checkpoints Modal ───────────────────── */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:hidden">
          <div className="w-full max-w-lg bg-white dark:bg-[#1C130E] rounded-2xl border border-[#EAE2D9] dark:border-[#382820] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2B201A] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#C27803]" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Resume Version History
                </h3>
              </div>
              <button
                onClick={() => setIsVersionModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingVersions ? (
              <div className="py-6 text-center text-xs text-stone-500">Loading version checkpoints...</div>
            ) : versionHistory.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">No previous version checkpoints recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {versionHistory.map(ver => (
                  <div
                    key={ver.id}
                    onClick={() => {
                      handleSelectResume(ver.id);
                      setIsVersionModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      ver.id === selectedResumeId
                        ? 'bg-amber-500/10 border-amber-500/30 text-[#C27803] dark:text-amber-400 font-bold'
                        : 'bg-stone-50 dark:bg-[#140E0B] border-stone-200 dark:border-[#382820] text-stone-700 dark:text-stone-300 hover:border-amber-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span>Version {ver.version || 1}</span>
                        {ver.id === selectedResumeId && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">Current</span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 block mt-0.5">{ver.change_summary || 'Saved checkpoint'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      {new Date(ver.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-[#2B201A]">
              <button
                onClick={() => {
                  handleSaveResume(true);
                  setIsVersionModalOpen(false);
                }}
                className="text-xs font-semibold text-[#C27803] hover:underline"
              >
                + Create Checkpoint Now
              </button>
              <button
                onClick={() => setIsVersionModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 dark:bg-[#281D17] text-stone-800 dark:text-stone-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
