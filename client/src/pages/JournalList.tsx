import React, { useState } from "react";
import { journalsData } from "../components/journalsData";
import { Link } from "react-router-dom";
import {
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  BookOpen,
  GraduationCap,
  ExternalLink,
  Plus,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/navbar";

export default function JournalListPage() {
  const [isGridView, setIsGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(4);

  // Simulate a loading effect when "Load More" is clicked
  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + 2);
      setIsLoading(false);
    }, 1500); // 1.5s delay to show skeletons
  };

  const filteredJournals = journalsData.filter((j) =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-300 py-12 px-6 lg:px-12 selection:bg-blue-500/30">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        {/* --- HEADER --- */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-800 pb-10 mb-12 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-widest text-xs">
              <BookOpen size={16} />
              <span>Scientific E-journal Publishing</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Journals <span className="text-slate-600">Archive</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search journals..."
                className="w-full bg-[#0A0D14] border border-slate-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-white"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex bg-[#0A0D14] border border-slate-800 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setIsGridView(true)}
                className={`p-2.5 rounded-lg transition-all ${isGridView ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setIsGridView(false)}
                className={`p-2.5 rounded-lg transition-all ${!isGridView ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main>
          {/* // Loop chalane ke liye: */}
          {/* {journalsData.map((journal) => (
            <JournalCard
              key={journal.id}
              journal={journal}
              isGrid={isGridView}
            />
          ))} */}
          <div
            className={
              isGridView
                ? "grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16"
                : "flex flex-col gap-6"
            }
          >
            {/* Real Data */}
            {filteredJournals.map((journal) => (
              <JournalCard
                key={journal.id}
                journal={journal}
                isGrid={isGridView}
              />
            ))}

            {/* Skeletons appearing when loading more */}
            {isLoading && (
              <>
                <SkeletonCard isGrid={isGridView} />
                <SkeletonCard isGrid={isGridView} />
              </>
            )}
          </div>
          {/* Empty State */}
          {filteredJournals.length === 0 && !isLoading && (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl">
              <Search className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-500 text-lg">
                No journals found matching your search.
              </p>
            </div>
          )}
          {/* --- LOAD MORE BUTTON --- */}
          <div className="mt-24 mb-12 flex flex-col items-center justify-center border-t border-slate-800 pt-16">
            <p className="text-slate-500 text-sm mb-6 font-medium tracking-wide">
              Showing {filteredJournals.length} of 48 Journals
            </p>
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="group flex items-center gap-3 bg-transparent border border-slate-700 px-10 py-4 rounded-full text-white font-bold hover:bg-white hover:text-[#05070A] hover:border-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Plus
                  size={20}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
              )}
              {isLoading ? "Fetching Data..." : "Load More Journals"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function JournalCard({ journal, isGrid }: { journal: any; isGrid: boolean }) {
  return (
    <div
      className={`group relative bg-[#0A0D14]/40 border border-slate-800/50 p-6 rounded-3xl transition-all hover:bg-[#0A0D14] hover:border-blue-500/30 flex gap-6 ${!isGrid ? "items-center py-8" : "items-start h-full"}`}
    >
      <div
        className={`flex-shrink-0 relative rounded-lg overflow-hidden border border-slate-700/50 shadow-2xl transition-transform duration-500 group-hover:-translate-y-2 ${isGrid ? "w-36 h-48" : "w-24 h-32"}`}
      >
        <img
          src={journal.image}
          alt={journal.title}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
      </div>
      <div className="flex flex-col flex-1 h-full">
        <h2
          className={`font-bold text-white group-hover:text-blue-500 transition-colors leading-tight mb-2 ${isGrid ? "text-xl" : "text-lg"}`}
        >
          {journal.title}
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">
          {journal.issn}
        </p>
        <div className="mb-6">
          <h4 className="text-[11px] font-bold text-slate-400 italic mb-2 flex items-center gap-1.5 uppercase opacity-60">
            <GraduationCap size={14} /> Editors-in-Chief
          </h4>
          <div className="space-y-1">
            {journal.editors.map((editor: string, idx: number) => (
              <p key={idx} className="text-sm text-slate-400 font-medium">
                {editor}
              </p>
            ))}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <Link
            to={`/journal/${journal.id}`}
            className="flex items-center gap-2 text-xs font-bold text-blue-500 group/btn hover:text-blue-400 transition-all uppercase tracking-widest"
          >
            Read Journal
            <ChevronRight
              size={16}
              className="group-hover/btn:translate-x-1 transition-transform"
            />
          </Link>
          {!isGrid && (
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ExternalLink size={14} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ isGrid }: { isGrid: boolean }) {
  return (
    <div
      className={`bg-[#0A0D14]/40 border border-slate-800/50 p-6 rounded-3xl animate-pulse flex gap-6 ${!isGrid ? "items-center py-8" : "items-start"}`}
    >
      <div
        className={`bg-slate-800 rounded-lg ${isGrid ? "w-36 h-48" : "w-24 h-32"}`}
      ></div>
      <div className="flex-1 space-y-4">
        <div className="h-6 bg-slate-800 rounded w-3/4"></div>
        <div className="h-3 bg-slate-800 rounded w-1/4"></div>
        <div className="space-y-2 pt-4">
          <div className="h-3 bg-slate-800 rounded w-full"></div>
          <div className="h-3 bg-slate-800 rounded w-5/6"></div>
        </div>
        <div className="pt-4 flex justify-between">
          <div className="h-4 bg-slate-800 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}
