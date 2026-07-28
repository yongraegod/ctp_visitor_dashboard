import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Car,
  UserPlus
} from 'lucide-react';
import { ApplicationRecord, HostEmployeeInfo, VisitPeriod, VisitorInfo } from '../types';
import { downloadExcelTemplate, parseExcelFile } from '../utils/excel';
import { formatPhoneNumber } from '../utils/phone';

interface VisitorFormProps {
  onSubmitSuccess: (newRecord: ApplicationRecord) => void;
}

export const VisitorForm: React.FC<VisitorFormProps> = ({ onSubmitSuccess }) => {
  // Preset Host Employee Info (Saved in LocalStorage)
  const [host, setHost] = useState<HostEmployeeInfo>(() => {
    const saved = localStorage.getItem('visitor_app_host_preset');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        delete parsed.remarks;
        return parsed;
      } catch (e) {
        // ignore
      }
    }
    return {
      deptName: '총무팀',
      employeeName: '',
      position: '사원',
      phone: '',
    };
  });

  // Save host preset when changed
  useEffect(() => {
    localStorage.setItem('visitor_app_host_preset', JSON.stringify(host));
  }, [host]);

  // Visit Period
  const todayStr = new Date().toISOString().split('T')[0];
  const [period, setPeriod] = useState<VisitPeriod>({
    startDate: todayStr,
    startTime: '09:00',
    endDate: todayStr,
    endTime: '18:00',
  });

  // Visit Location (세부위치)
  const [visitZone, setVisitZone] = useState('');

  // Visitors List (Matching Excel Visitor 1, Visitor 2...)
  const [visitors, setVisitors] = useState<VisitorInfo[]>([
    {
      id: `v-${Date.now()}-1`,
      sequence: 1,
      companyName: '',
      deptName: '-',
      visitorName: '',
      position: '-',
      phone: '',
      carModel: '',
      carPlate: '',
      visitReason: '',
      remarks: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [excelImportLoading, setExcelImportLoading] = useState(false);

  // Add Visitor Row
  const handleAddVisitor = () => {
    const nextSeq = visitors.length + 1;
    // Pre-fill company name, reason, car info from visitor 1 if available
    const firstV = visitors[0];
    setVisitors([
      ...visitors,
      {
        id: `v-${Date.now()}-${nextSeq}`,
        sequence: nextSeq,
        companyName: firstV ? firstV.companyName : '',
        deptName: '-',
        visitorName: '',
        position: '-',
        phone: '',
        carModel: firstV ? firstV.carModel : '',
        carPlate: firstV ? firstV.carPlate : '',
        visitReason: firstV ? firstV.visitReason : '',
        remarks: firstV ? firstV.remarks || '' : '',
      },
    ]);
  };

  // Remove Visitor Row
  const handleRemoveVisitor = (index: number) => {
    if (visitors.length <= 1) {
      alert('최소 1명의 방문자 정보가 필요합니다.');
      return;
    }
    const updated = visitors.filter((_, i) => i !== index).map((v, idx) => ({ ...v, sequence: idx + 1 }));
    setVisitors(updated);
  };

  // Update Visitor Row Field
  const handleVisitorChange = (index: number, field: keyof VisitorInfo, value: string) => {
    const updated = [...visitors];
    const val = field === 'phone' ? formatPhoneNumber(value) : value;
    updated[index] = { ...updated[index], [field]: val };
    setVisitors(updated);
  };

  // Excel File Upload Handler
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelImportLoading(true);
    setErrorMessage(null);
    try {
      const parsed = await parseExcelFile(file);

      if (parsed.visitors.length > 0) {
        setVisitors(parsed.visitors);
      }
      if (parsed.host.employeeName) {
        setHost((prev) => ({
          ...prev,
          deptName: parsed.host.deptName || prev.deptName,
          employeeName: parsed.host.employeeName || prev.employeeName,
          position: parsed.host.position || prev.position,
          phone: parsed.host.phone || prev.phone,
        }));
      }
      if (parsed.period.startDate) {
        setPeriod(parsed.period);
      }
      if (parsed.visitZone) {
        setVisitZone(parsed.visitZone);
      }

      setSuccessMessage(`엑셀 파일에서 ${parsed.visitors.length}명의 방문자 정보를 성공적으로 불러왔습니다.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || '엑셀 파일 해석 중 오류가 발생했습니다. 표준 양식을 확인해주세요.');
    } finally {
      setExcelImportLoading(false);
      e.target.value = '';
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!host.employeeName.trim()) {
      setErrorMessage('담당 임직원 성명을 입력해주세요.');
      return;
    }
    if (!host.phone.trim()) {
      setErrorMessage('담당 임직원 연락처를 입력해주세요.');
      return;
    }

    // Period Validation
    if (period.endDate < period.startDate) {
      setErrorMessage('방문 종료일은 시작일 이전일 수 없습니다.');
      return;
    }
    if (period.startDate === period.endDate && period.endTime < period.startTime) {
      setErrorMessage('방문 시작일과 종료일이 같은 경우, 종료시간은 시작시간 이전일 수 없습니다.');
      return;
    }

    if (!visitZone.trim()) {
      setErrorMessage('방문장소(세부위치)를 입력해주세요.');
      return;
    }

    for (let i = 0; i < visitors.length; i++) {
      const v = visitors[i];
      if (!v.companyName.trim()) {
        setErrorMessage(`방문자 ${i + 1}의 업체명을 입력해주세요.`);
        return;
      }
      if (!v.visitorName.trim()) {
        setErrorMessage(`방문자 ${i + 1}의 성명을 입력해주세요.`);
        return;
      }
      if (!v.phone.trim()) {
        setErrorMessage(`방문자 ${i + 1}의 연락처를 입력해주세요.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        visitZone: visitZone.trim(),
        period,
        host,
        visitors,
      };

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || '저장 실패');
      }

      setSuccessMessage(`외부방문자 사전 방문신청이 완료되었습니다! (신청번호: ${json.data.id})`);
      onSubmitSuccess(json.data);

      // Reset form to default except host details
      setVisitors([
        {
          id: `v-${Date.now()}-1`,
          sequence: 1,
          companyName: '',
          deptName: '-',
          visitorName: '',
          position: '-',
          phone: '',
          carModel: '',
          carPlate: '',
          visitReason: '',
          remarks: '',
        },
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || '방문 신청 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 pb-24">
      {/* Top Banner / Excel Quick Toolbar */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 sm:p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>외부방문자 사전 신청 서식</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              방문 신청 작성 및 엑셀 일괄 등록
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              신청을 완료하면 보안실 대시보드에 실시간 공유되어 입출입 확인에 반영됩니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/40 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>양식 엑셀 다운로드</span>
            </button>

            <label className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>{excelImportLoading ? '불러오는 중...' : '작성한 엑셀 업로드'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelUpload}
                disabled={excelImportLoading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl flex items-start space-x-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 text-red-900 border border-red-300 rounded-xl flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: 담당 임직원 정보 (Host Info) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">1. 담당 임직원 정보</h3>
            <span className="text-xs text-slate-400 ml-auto">※ 입력 정보는 다음 접속 시 자동 저장됩니다</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                부서명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={host.deptName}
                onChange={(e) => setHost({ ...host, deptName: e.target.value })}
                placeholder="예: 총무팀, IT운영팀"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                성명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={host.employeeName}
                onChange={(e) => setHost({ ...host, employeeName: e.target.value })}
                placeholder="예: 김셀트"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">직급</label>
              <input
                type="text"
                value={host.position}
                onChange={(e) => setHost({ ...host, position: e.target.value })}
                placeholder="예: 사원, 선임, 팀장"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                연락처(폰) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={host.phone}
                onChange={(e) => setHost({ ...host, phone: formatPhoneNumber(e.target.value) })}
                placeholder="010-0000-0000"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: 방문기간 및 방문장소 (Schedule & Location) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">2. 방문기간 및 방문장소</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visit Period */}
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>방문 일시 설정</span>
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">시작일</label>
                  <input
                    type="date"
                    value={period.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      let newEnd = period.endDate;
                      if (newEnd && newEnd < newStart) {
                        newEnd = newStart;
                      }
                      setPeriod({ ...period, startDate: newStart, endDate: newEnd });
                      setErrorMessage(null);
                    }}
                    required
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">시작시간</label>
                  <input
                    type="time"
                    value={period.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      let newEndTime = period.endTime;
                      if (period.startDate === period.endDate && newEndTime && newEndTime < newStartTime) {
                        newEndTime = newStartTime;
                      }
                      setPeriod({ ...period, startTime: newStartTime, endTime: newEndTime });
                      setErrorMessage(null);
                    }}
                    required
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">종료일</label>
                  <input
                    type="date"
                    value={period.endDate}
                    min={period.startDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      if (period.startDate && newEnd < period.startDate) {
                        setErrorMessage('방문 종료일은 시작일 이전일 수 없습니다.');
                      } else {
                        setErrorMessage(null);
                      }
                      setPeriod({ ...period, endDate: newEnd });
                    }}
                    required
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">종료시간</label>
                  <input
                    type="time"
                    value={period.endTime}
                    min={period.startDate === period.endDate ? period.startTime : undefined}
                    onChange={(e) => {
                      const newEndTime = e.target.value;
                      if (period.startDate === period.endDate && newEndTime < period.startTime) {
                        setErrorMessage('방문 시작일과 종료일이 같은 경우, 종료시간은 시작시간 이전일 수 없습니다.');
                      } else {
                        setErrorMessage(null);
                      }
                      setPeriod({ ...period, endTime: newEndTime });
                    }}
                    required
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Visit Location (세부위치) */}
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>방문장소 (세부위치)</span>
              </span>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  세부위치 입력 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={visitZone}
                  onChange={(e) => setVisitZone(e.target.value)}
                  placeholder="예: 본부동 2층 대회의실, 유틸리티동 1층, 품질창고동 1층 등"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: 외부 방문자 정보 (External Visitors List) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">3. 외부 방문자 정보</h3>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">
                총 {visitors.length}명
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAddVisitor}
                className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>방문자 추가</span>
              </button>
            </div>
          </div>

          {/* Visitor Cards / Rows */}
          <div className="space-y-4">
            {visitors.map((v, idx) => (
              <div
                key={v.id}
                className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/90 relative transition-all hover:border-slate-300"
              >
                {/* Header for Visitor Row */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded-md">
                      방문자 {idx + 1}
                    </span>
                    {v.companyName && (
                      <span className="text-xs font-semibold text-slate-600 hidden xs:inline">
                        {v.companyName}
                      </span>
                    )}
                  </div>

                  {visitors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVisitor(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      title="방문자 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      업체명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={v.companyName}
                      onChange={(e) => handleVisitorChange(idx, 'companyName', e.target.value)}
                      placeholder="예: ABC 산업"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">부서명</label>
                    <input
                      type="text"
                      value={v.deptName}
                      onChange={(e) => handleVisitorChange(idx, 'deptName', e.target.value)}
                      placeholder="예: 기술지원부, -"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      성명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={v.visitorName}
                      onChange={(e) => handleVisitorChange(idx, 'visitorName', e.target.value)}
                      placeholder="예: 홍길동"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">직급</label>
                    <input
                      type="text"
                      value={v.position}
                      onChange={(e) => handleVisitorChange(idx, 'position', e.target.value)}
                      placeholder="예: 대리, 부장, -"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      연락처(폰) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={v.phone}
                      onChange={(e) => handleVisitorChange(idx, 'phone', e.target.value)}
                      placeholder="010-0000-0000"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>차번호</span>
                      <Car className="w-3 h-3 text-slate-400" />
                    </label>
                    <input
                      type="text"
                      value={v.carPlate}
                      onChange={(e) => handleVisitorChange(idx, 'carPlate', e.target.value)}
                      placeholder="예: 123호4567"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">차종</label>
                    <input
                      type="text"
                      value={v.carModel}
                      onChange={(e) => handleVisitorChange(idx, 'carModel', e.target.value)}
                      placeholder="예: 카니발, 그랜저"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">방문사유</label>
                    <input
                      type="text"
                      value={v.visitReason}
                      onChange={(e) => handleVisitorChange(idx, 'visitReason', e.target.value)}
                      placeholder="예: 생산동 기계장비 점검"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      비고 <span className="text-slate-400 font-normal">(선택사항)</span>
                    </label>
                    <input
                      type="text"
                      value={v.remarks || ''}
                      onChange={(e) => handleVisitorChange(idx, 'remarks', e.target.value)}
                      placeholder="예: 특이사항, VIP 등"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleAddVisitor}
              className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>동행 방문자 추가하기</span>
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white font-bold text-base rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
          >
            {isSubmitting ? (
              <span>등록 중입니다...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>외부방문자 사전 방문신청 완료하기</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
