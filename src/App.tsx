import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VisitorForm } from './components/VisitorForm';
import { SecurityDashboard } from './components/SecurityDashboard';
import { PrintView } from './components/PrintView';
import { AuthModal } from './components/AuthModal';
import { ApplicationRecord } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'FORM' | 'SECURITY' | 'PRINT'>('FORM');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [pendingCount, setPendingCount] = useState(0);
  const [currentlyInCount, setCurrentlyInCount] = useState(0);

  // Password Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('app_admin_authenticated') === 'true';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<'SECURITY' | 'PRINT'>('SECURITY');

  // Fetch header stats
  const fetchBadgeStats = async () => {
    try {
      const res = await fetch('/api/stats/today');
      const json = await res.json();
      if (json.success) {
        setPendingCount(json.data.pendingApproval);
        setCurrentlyInCount(json.data.currentlyIn);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBadgeStats();
  }, [refreshTrigger]);

  const handleFormSubmitSuccess = (newRecord: ApplicationRecord) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTabChange = (tab: 'FORM' | 'SECURITY' | 'PRINT') => {
    if (tab === 'FORM') {
      setActiveTab('FORM');
    } else {
      // SECURITY or PRINT tab requires password authentication
      if (isAuthenticated) {
        setActiveTab(tab);
      } else {
        setPendingTab(tab);
        setIsAuthModalOpen(true);
      }
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setActiveTab(pendingTab);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('app_admin_authenticated');
    setIsAuthenticated(false);
    if (activeTab !== 'FORM') {
      setActiveTab('FORM');
    }
  };

  if (activeTab === 'PRINT') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          pendingCount={pendingCount}
          currentlyInCount={currentlyInCount}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
        <div className="flex-1">
          <PrintView onBack={() => handleTabChange('SECURITY')} />
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          targetTabName={pendingTab === 'SECURITY' ? '보안실 대시보드' : '출입일지 인쇄'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pendingCount={pendingCount}
        currentlyInCount={currentlyInCount}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTab === 'FORM' && (
          <VisitorForm onSubmitSuccess={handleFormSubmitSuccess} />
        )}

        {activeTab === 'SECURITY' && (
          <SecurityDashboard
            onOpenPrintView={() => handleTabChange('PRINT')}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Auth Password Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        targetTabName={pendingTab === 'SECURITY' ? '보안실 대시보드' : '출입일지 인쇄'}
      />
    </div>
  );
}
