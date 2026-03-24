import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { journalsData } from "../components/journalsData";
import {
  Search,
  Mail,
  BarChart3,
  FileText,
  ChevronDown,
  Facebook,
  Twitter,
  Youtube,
  Download,
  Award,
  Calendar,
  Share2,
  Globe,
  User,
  PlusCircle,
  PlayCircle,
} from "lucide-react";
import Navbar from "@/components/navbar";

export default function ViewJournal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [journal, setJournal] = useState<any>(null);

  useEffect(() => {
    const selected = journalsData.find((j) => j.id === Number(id));
    setJournal(selected);
    window.scrollTo(0, 0);
  }, [id]);

  if (!journal)
    return (
      <div className="p-10 text-center bg-[#05070A] text-white">Loading...</div>
    );

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-300 font-sans selection:bg-blue-500/30">
      <Navbar />
      {/* --- SECTION 1: JOURNAL IDENTITY (REF PG 1) --- */}
      <div className="bg-[#0A0D14] border-b border-slate-800 py-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8">
            <div className="flex flex-col mb-4">
              <span className="text-[#c0392b] font-black text-xs uppercase tracking-[0.3em] leading-none mb-2">
                NANO • MICRO • GIKI
              </span>
              <h1 className="text-6xl font-black text-white tracking-tighter leading-none uppercase italic">
                {journal.title}
              </h1>
            </div>
            <div className="text-[13px] text-slate-500 space-y-1 font-medium">
              <p>Online ISSN: {journal.issn.split(";")[0]}</p>
              <p>Print ISSN: {journal.issn.split(";")[1] || "1613-6810"}</p>
              <p className="pt-3 text-slate-400 font-bold">
                Editor-in-Chief: {journal.editors[0]}
              </p>
              <p className="text-[11px] text-slate-600">
                © 2026 JournalHub GIKI, Topi, Swabi
              </p>
            </div>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <div className="bg-[#111827] border border-slate-800 p-4 flex gap-5 max-w-sm rounded-lg shadow-2xl">
              <img
                src={journal.image}
                alt="cover"
                className="w-24 h-32 shadow-lg rounded-sm"
              />
              <div className="flex flex-col justify-center">
                <p className="text-blue-500 font-bold text-[10px] uppercase tracking-widest">
                  Latest Issue
                </p>
                <p className="text-white font-bold text-sm mt-1 tracking-tight">
                  Volume 22, Issue 12
                </p>
                <p className="text-[11px] text-slate-500 mt-4 italic font-medium">
                  {journal.publishedDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BLUE SUB-NAV BAR (REF PG 1) --- */}
      <div className="bg-blue-600 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-12 text-[11px] font-bold uppercase tracking-widest text-white">
          <div className="flex h-full">
            <button className="px-6 border-r border-white/10 hover:bg-white/20 h-full transition-colors">
              Home
            </button>
            <button className="px-6 border-r border-white/10 hover:bg-white/20 h-full flex items-center gap-1 transition-colors">
              About <ChevronDown size={14} />
            </button>
            <button className="px-6 border-r border-white/10 hover:bg-white/20 h-full flex items-center gap-1 transition-colors">
              Authors <ChevronDown size={14} />
            </button>
            <button className="px-6 border-r border-white/10 hover:bg-white/20 h-full flex items-center gap-1 transition-colors">
              Browse <ChevronDown size={14} />
            </button>
          </div>
          <div className="hidden md:flex gap-5 items-center pr-4">
            <Facebook
              size={16}
              className="cursor-pointer hover:text-slate-200 transition-colors"
            />
            <Twitter
              size={16}
              className="cursor-pointer hover:text-slate-200 transition-colors"
            />
            <Youtube
              size={16}
              className="cursor-pointer hover:text-slate-200 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA (REF PG 2 & 3) --- */}
      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* LEFT COLUMN: METRICS & ARTICLES (REF PG 2) */}
        <div className="lg:col-span-8 space-y-20">
          {/* JOURNAL METRICS */}
          <section>
            <div className="flex justify-between items-end border-b border-slate-800 pb-3 mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Journal Metrics
              </h2>
              <button className="text-blue-500 text-[10px] font-bold uppercase border border-blue-500/30 px-4 py-1.5 rounded-full hover:bg-blue-500 hover:text-white transition-all">
                Understand Metrics →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 bg-slate-800">
              <MetricBox label="CiteScore" value="16.1" />
              <MetricBox
                label="Journal Impact Factor"
                value={journal.impactFactor || "12.1"}
              />
              <MetricBox label="Acceptance Rate" value="32%" />
              <MetricBox label="First Decision" value="18 days" />
            </div>
          </section>

          {/* ARTICLES TAB SECTION (REF PG 2) */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tighter">
              Articles
            </h2>
            <div className="flex border-b border-slate-800 mb-10 overflow-x-auto scrollbar-hide">
              <button className="px-8 py-3 bg-[#0A0D14] border-t-2 border-blue-500 text-white text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                Most Recent
              </button>
              <button className="px-8 py-3 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors whitespace-nowrap">
                Most Cited
              </button>
              <button className="px-8 py-3 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors whitespace-nowrap">
                Most Accessed
              </button>
            </div>

            <div className="space-y-16">
              {[1, 2].map((i) => (
                <ArticleRow key={i} journal={journal} />
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button className="text-blue-500 text-xs font-bold uppercase flex items-center gap-1 hover:underline">
                More Articles <ChevronDown size={14} className="-rotate-90" />
              </button>
            </div>
          </section>

          {/* RECENT ISSUES GRID (REF PG 3) */}
          <section className="pt-10 border-t border-slate-800">
            <h2 className="text-3xl font-bold text-white mb-8 tracking-tighter">
              Recent issues
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <IssueCard
                vol="22"
                issue="12"
                date="25 February 2026"
                img={journal.image}
              />
              <IssueCard
                vol="22"
                issue="11"
                date="20 February 2026"
                img={journal.image}
              />
              <IssueCard
                vol="22"
                issue="10"
                date="17 February 2026"
                img={journal.image}
              />
              <IssueCard
                vol="22"
                issue="9"
                date="12 February 2026"
                img={journal.image}
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: SIDEBAR (REF PG 1) */}
        <div className="lg:col-span-4 space-y-10">
          {/* Action Box with Orange Accent (Wiley Signature) */}
          <div className="bg-[#0A0D14] border-t-4 border-orange-500 p-8 space-y-6 shadow-2xl rounded-b-lg">
            <SidebarLink
              icon={<Mail size={20} className="text-orange-500" />}
              text="Sign up for email alerts"
            />
            <SidebarLink
              icon={<FileText size={20} className="text-blue-500" />}
              text="Submit an article"
            />
            <SidebarLink
              icon={<BarChart3 size={20} className="text-blue-500" />}
              text="Journal Metrics"
            />
            <SidebarLink
              icon={<PlusCircle size={20} className="text-blue-500" />}
              text="Subscribe to this journal"
            />
          </div>

          {/* Video / Ad Section (Ref PG 1) */}
          <div className="bg-[#0A0D14] border border-slate-800 rounded-lg overflow-hidden group">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img
                src="https://via.placeholder.com/400x225/1e293b/ffffff?text=Advanced+Science+News"
                className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                alt="news"
              />
              <PlayCircle
                size={48}
                className="absolute text-white/80 group-hover:text-white transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Related Titles Section (Ref PG 1) */}
          <div className="bg-[#0A0D14] p-8 border border-slate-800 rounded-lg shadow-xl">
            <h3 className="text-white font-black border-b border-slate-800 pb-4 mb-6 text-xs uppercase tracking-widest">
              Related Titles
            </h3>
            <ul className="text-[13px] text-blue-500 space-y-4 font-bold">
              <li className="hover:text-white cursor-pointer transition-colors">
                • Advanced Materials
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                • Functional Polymers
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                • GIKI Research Review
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                • Sustainable Systems
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0A0D14] p-8 flex flex-col items-center justify-center text-center group hover:bg-[#111827] transition-all">
      <p className="text-3xl font-black text-white group-hover:text-blue-500 transition-transform group-hover:scale-110">
        {value}
      </p>
      <p className="text-[10px] uppercase font-black text-slate-500 mt-2 tracking-widest leading-none">
        {label}
      </p>
    </div>
  );
}

function ArticleRow({ journal }: any) {
  return (
    <div className="border-b border-slate-800/50 pb-12 last:border-0">
      <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em]">
        <span className="text-slate-500">Research Article</span>
        <span className="text-emerald-500 flex items-center gap-1 font-bold italic underline decoration-slate-800">
          Full Access
        </span>
      </div>
      <h3 className="text-xl font-bold text-blue-500 leading-snug hover:underline cursor-pointer mb-6 tracking-tight transition-colors">
        Molecular Engineering of Strong Electron-Deficient Acceptor for
        Construction of Conjugated Polymers in NIR-II Therapy
      </h3>

      {/* Graphical Abstract Layout (Ref PG 2) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-8">
        <div className="md:col-span-4 rounded border border-slate-800 overflow-hidden bg-white p-2 group cursor-zoom-in">
          <img
            src="https://via.placeholder.com/320x180/ffffff/000000?text=Graphical+Abstract"
            alt="graphical abstract"
            className="w-full h-auto"
          />
          <p className="text-[9px] text-slate-900 font-bold mt-2 uppercase text-center tracking-tighter">
            Graphical Abstract
          </p>
        </div>
        <div className="md:col-span-8">
          <p className="text-[14px] text-slate-400 leading-relaxed font-light">
            Developing conjugated polymer-based PTAs with NIR-II absorption is
            crucial for photothermal therapy. In this work, two D-A conjugated
            polymers were synthesized by introducing a strong electron-deficient
            acceptor.
          </p>
          <p className="text-[11px] text-slate-500 mt-4 italic flex items-center gap-2 font-medium">
            <Calendar size={12} /> First Published: 02 March 2026
          </p>
        </div>
      </div>

      {/* Article Links Bar (Ref PG 3) */}
      <div className="flex items-center justify-between border-t border-slate-900 pt-4">
        <div className="flex gap-6 text-[10px] font-black text-blue-500 uppercase tracking-widest">
          <button className="hover:text-white transition-colors">
            Abstract
          </button>
          <button className="hover:text-white transition-colors">
            Full text
          </button>
          <button className="hover:text-white transition-colors flex items-center gap-1">
            PDF <Download size={12} />
          </button>
          <button className="hover:text-white transition-colors">
            References
          </button>
        </div>
        <button className="text-slate-500 text-[10px] font-bold hover:text-white uppercase transition-colors tracking-tighter">
          Request Permissions
        </button>
      </div>
    </div>
  );
}

function IssueCard({ vol, issue, date, img }: any) {
  return (
    <div className="flex gap-4 group cursor-pointer p-2 hover:bg-[#0A0D14] rounded transition-all">
      <div className="relative overflow-hidden w-20 h-28 flex-shrink-0 border border-slate-800">
        <img
          src={img}
          className="w-full h-full object-cover rounded-sm group-hover:scale-105 transition-transform duration-500"
          alt="issue cover"
        />
      </div>
      <div className="flex flex-col justify-center">
        <h4 className="text-blue-500 font-bold text-[15px] group-hover:underline">
          Volume {vol}, Issue {issue}
        </h4>
        <p className="text-slate-500 text-[11px] mt-2 font-medium">{date}</p>
      </div>
    </div>
  );
}

function SidebarLink({ icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-800/50 last:border-0 group cursor-pointer transition-all hover:pl-2">
      <div className="transition-transform group-hover:scale-110">{icon}</div>
      <span className="text-[13px] font-black text-blue-500 group-hover:text-white transition-colors tracking-tight">
        {text}
      </span>
    </div>
  );
}
