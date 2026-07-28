import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, Car, MapPin, Calendar, Clock, Phone, Share2, Copy, Building2, Shield } from 'lucide-react';
import { ApplicationRecord } from '../types';

interface VisitorPassModalProps {
  record: ApplicationRecord | null;
  onClose: () => void;
}

export const VisitorPassModal: React.FC<VisitorPassModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!record) return null;

  const handleCopyPassLink = () => {
    const url = `${window.location.origin}?passId=${record.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const primaryVisitor = record.visitors[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative animate-scale-up">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 text-center relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-indigo-600/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-lg tracking-tight text-white">외부방문자 디지털 출입증</h3>
          <p className="text-xs text-indigo-300 mt-0.5">보안실 확인용 모바일 출입패스</p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Badge */}
          <div className="flex justify-center">
            {record.status === 'CHECKED_IN' ? (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full flex items-center space-x-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>현재 입실 상태 (출입 승인됨)</span>
              </span>
            ) : record.status === 'APPROVED' ? (
              <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold text-xs px-3 py-1 rounded-full flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>사전 승인 완료 (보안실 확인 대기)</span>
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs px-3 py-1 rounded-full flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>사전 신청 접수 상태</span>
              </span>
            )}
          </div>

          {/* QR Code Graphic Simulation */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-2">
            <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-inner">
              {/* Simulated QR Code SVG pattern */}
              <div className="w-36 h-36 bg-slate-900 p-2 rounded-lg flex flex-col justify-between items-center relative">
                <div className="w-full flex justify-between">
                  <div className="w-8 h-8 bg-white border-4 border-slate-900 rounded-sm"></div>
                  <div className="w-8 h-8 bg-white border-4 border-slate-900 rounded-sm"></div>
                </div>
                <div className="text-center font-mono text-[9px] text-white tracking-widest bg-indigo-600 px-2 py-0.5 rounded">
                  {record.id}
                </div>
                <div className="w-full flex justify-between">
                  <div className="w-8 h-8 bg-white border-4 border-slate-900 rounded-sm"></div>
                  <div className="w-4 h-4 bg-white rounded-xs"></div>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">
              정문 보안실 게이트 바코드 스캐너 태그용
            </p>
          </div>

          {/* Visitor Info Details */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">방문 신청자:</span>
              <span className="font-bold text-slate-900 text-sm">
                {primaryVisitor?.visitorName} ({primaryVisitor?.companyName})
                {record.visitors.length > 1 && (
                  <span className="text-indigo-600 text-xs font-semibold ml-1">
                    외 {record.visitors.length - 1}명
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>방문 예정일:</span>
              </span>
              <span className="font-bold text-slate-800 font-mono">
                {record.period.startDate} ~ {record.period.endDate}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>방문 허용시간:</span>
              </span>
              <span className="font-bold text-slate-800 font-mono">
                {record.period.startTime} ~ {record.period.endTime}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>허용 구역:</span>
              </span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {record.visitZone}
              </span>
            </div>

            {primaryVisitor?.carPlate && primaryVisitor.carPlate !== '-' && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium flex items-center space-x-1">
                  <Car className="w-3.5 h-3.5 text-indigo-600" />
                  <span>등록 차량:</span>
                </span>
                <span className="font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
                  {primaryVisitor.carPlate} ({primaryVisitor.carModel || '차종미입력'})
                </span>
              </div>
            )}

            {primaryVisitor?.remarks && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">비고 (참고사항):</span>
                <span className="font-medium text-indigo-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{primaryVisitor.remarks}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 text-slate-600 space-y-0.5">
              <div className="font-semibold text-slate-900">
                접견 담당자: {record.host.employeeName} ({record.host.deptName})
              </div>
              <div className="text-slate-500 flex items-center space-x-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>비상연락처: <a href={`tel:${record.host.phone}`} className="text-indigo-600 underline font-mono">{record.host.phone}</a></span>
              </div>
            </div>
          </div>

          {/* Action Share Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCopyPassLink}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>링크 복사완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>방문자 공유링크 복사</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
