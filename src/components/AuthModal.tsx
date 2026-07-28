import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetTabName: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetTabName,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default password is cellph7018!
    const currentPassword = localStorage.getItem('app_admin_password') || 'cellph7018!';

    if (passwordInput === currentPassword) {
      sessionStorage.setItem('app_admin_authenticated', 'true');
      setErrorMsg('');
      setPasswordInput('');
      onSuccess();
    } else {
      setErrorMsg('비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600/30 border border-indigo-500/40 p-2.5 rounded-xl">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">보안 접근 인증</h3>
              <p className="text-xs text-slate-400">보안실 및 관리부서 전용 권한</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong className="font-semibold block mb-0.5 text-amber-900">
                [{targetTabName}] 접근 제한
              </strong>
              해당 메뉴는 보안실 및 관리부서 담당자만 이용 가능합니다. 접속 비밀번호를 입력해주세요.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>접속 비밀번호</span>
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="비밀번호를 입력하세요"
                autoFocus
                className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                  errorMsg
                    ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                    : 'border-slate-300 focus:ring-indigo-500 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center space-x-1">
                <span>⚠️ {errorMsg}</span>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              인증 및 접속
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
