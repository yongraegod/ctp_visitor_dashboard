import React from 'react';
import { ShieldCheck, ClipboardList, QrCode, Printer, Building2, Lock, LogOut, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  activeTab: 'FORM' | 'SECURITY' | 'PRINT';
  setActiveTab: (tab: 'FORM' | 'SECURITY' | 'PRINT') => void;
  pendingCount?: number;
  currentlyInCount?: number;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  currentlyInCount = 0,
  isAuthenticated = false,
  onLogout,
}) => {
  const todayFormatted = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('FORM')}>
            <div className="bg-indigo-600 p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  셀트리온제약 본사 방문자 관리시스템
                </h1>
                <span className="hidden sm:inline-block bg-slate-800 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-indigo-500/30">
                  보안실 공유 시스템
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xs:block">{todayFormatted}</p>
            </div>
          </div>

          {/* Nav Tabs for Desktop & Tablet */}
          <div className="hidden md:flex items-center space-x-3">
            <nav className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setActiveTab('FORM')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'FORM'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>방문 신청</span>
              </button>

              <button
                onClick={() => setActiveTab('SECURITY')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  activeTab === 'SECURITY'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                <ShieldCheck className="w-4 h-4" />
                <span>보안실 대시보드</span>
                {currentlyInCount > 0 && (
                  <span className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                    {currentlyInCount}입실
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                    {pendingCount}대기
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('PRINT')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'PRINT'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                <Printer className="w-4 h-4" />
                <span>출입일지 인쇄</span>
              </button>
            </nav>

            {isAuthenticated && onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-300 rounded-xl text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
                title="보안 권한 잠금 (로그아웃)"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
                <span>보안잠금</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar for Touch Screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 px-2 py-2 shadow-2xl">
        <div className="grid grid-cols-3 gap-1 text-center">
          <button
            onClick={() => setActiveTab('FORM')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'FORM' ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span>방문신청</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all relative ${
              activeTab === 'SECURITY' ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-0.5">
              {!isAuthenticated && <Lock className="w-3 h-3 text-amber-400 mr-0.5" />}
              <ShieldCheck className="w-5 h-5 mb-0.5" />
            </div>
            <span>보안실</span>
            {(pendingCount > 0 || currentlyInCount > 0) && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('PRINT')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'PRINT' ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-0.5">
              {!isAuthenticated && <Lock className="w-3 h-3 text-amber-400 mr-0.5" />}
              <Printer className="w-5 h-5 mb-0.5" />
            </div>
            <span>인쇄양식</span>
          </button>
        </div>
      </div>
    </header>
  );
};
