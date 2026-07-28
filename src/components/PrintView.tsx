import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { ApplicationRecord } from '../types';
import { exportToExcel } from '../utils/excel';
import { formatPhoneNumber } from '../utils/phone';

interface PrintViewProps {
  onBack: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ onBack }) => {
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?date=${selectedDate}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  // Flatten records into single visitor rows matching the Excel sheet
  const visitorRows: {
    seq: number;
    company: string;
    visitorDept: string;
    name: string;
    position: string;
    phone: string;
    carModel: string;
    carPlate: string;
    reason: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    zone: string;
    hostDept: string;
    hostName: string;
    hostPosition: string;
    hostPhone: string;
    remarks: string;
    status: string;
  }[] = [];

  let globalCounter = 1;
  records.filter((app) => app.status !== 'DELETED').forEach((app) => {
    app.visitors.forEach((v) => {
      visitorRows.push({
        seq: globalCounter++,
        company: v.companyName || '-',
        visitorDept: v.deptName || '-',
        name: v.visitorName || '-',
        position: v.position || '-',
        phone: v.phone ? formatPhoneNumber(v.phone) : '-',
        carModel: v.carModel || '-',
        carPlate: v.carPlate || '-',
        reason: v.visitReason || '-',
        startDate: app.period.startDate,
        startTime: app.period.startTime,
        endDate: app.period.endDate,
        endTime: app.period.endTime,
        zone: app.visitZone,
        hostDept: app.host.deptName || '-',
        hostName: app.host.employeeName || '-',
        hostPosition: app.host.position || '-',
        hostPhone: app.host.phone ? formatPhoneNumber(app.host.phone) : '-',
        remarks: app.host.remarks || '-',
        status: app.status === 'CHECKED_IN' ? '입실중' : app.status === 'APPROVED' ? '승인' : '대기',
      });
    });
  });

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      {/* Top Controls Bar - Hidden during actual print */}
      <div className="print:hidden max-w-7xl mx-auto mb-6 bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-base sm:text-lg">보안실 출입일지 출력 양식</h2>
            <p className="text-xs text-slate-400">Excel 원본 서식 구조와 완벽히 호환되는 인쇄 레이아웃</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-semibold focus:outline-none"
          />

          <button
            onClick={() => exportToExcel(records, `외부방문자_사전방문신청_양식_${selectedDate}.xlsx`)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel 저장</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>즉시 인쇄 (Print)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="max-w-[1200px] mx-auto bg-white p-6 shadow-2xl rounded-sm border border-slate-300 print:shadow-none print:p-0 print:border-none print:w-full">
        {/* Title Block */}
        <div className="text-center mb-4 border-b-2 border-slate-900 pb-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            외부방문자 사전 방문신청 대장 ({selectedDate})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            [보안실 확인 및 출입 통제용 서식] - 총 {visitorRows.length}건 등록됨
          </p>
        </div>

        {/* Table matching exact headers from user's Excel screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-slate-900 text-[11px] text-center">
            <thead>
              {/* Row 1 Header Groups */}
              <tr className="bg-slate-200 font-bold text-slate-900">
                <th rowSpan={2} className="border border-slate-700 px-1 py-1.5 w-12 bg-slate-300">
                  구분
                </th>
                <th colSpan={8} className="border border-slate-700 py-1 bg-sky-100 text-sky-900">
                  외부 방문자 정보
                </th>
                <th colSpan={4} className="border border-slate-700 py-1 bg-emerald-100 text-emerald-900">
                  방문기간
                </th>
                <th rowSpan={2} className="border border-slate-700 px-2 py-1.5 bg-amber-100 text-amber-900">
                  방문장소
                </th>
                <th colSpan={5} className="border border-slate-700 py-1 bg-amber-100 text-amber-900">
                  담당 임직원 정보
                </th>
                <th rowSpan={2} className="border border-slate-700 px-1 py-1.5 bg-slate-300">
                  상태
                </th>
              </tr>

              {/* Row 2 Sub-Headers */}
              <tr className="bg-slate-100 font-bold text-slate-800">
                <th className="border border-slate-600 px-1 py-1">업체명</th>
                <th className="border border-slate-600 px-1 py-1">부서명</th>
                <th className="border border-slate-600 px-1 py-1">성명</th>
                <th className="border border-slate-600 px-1 py-1">직급</th>
                <th className="border border-slate-600 px-1 py-1">연락처(폰)</th>
                <th className="border border-slate-600 px-1 py-1">차번호</th>
                <th className="border border-slate-600 px-1 py-1">차종</th>
                <th className="border border-slate-600 px-1 py-1">방문사유</th>

                <th className="border border-slate-600 px-1 py-1">시작일</th>
                <th className="border border-slate-600 px-1 py-1">시작시간</th>
                <th className="border border-slate-600 px-1 py-1">종료일</th>
                <th className="border border-slate-600 px-1 py-1">종료시간</th>

                <th className="border border-slate-600 px-1 py-1">부서명</th>
                <th className="border border-slate-600 px-1 py-1">성명</th>
                <th className="border border-slate-600 px-1 py-1">직급</th>
                <th className="border border-slate-600 px-1 py-1">연락처(폰)</th>
                <th className="border border-slate-600 px-1 py-1">비고</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={20} className="py-8 text-center text-slate-400">
                    로딩 중...
                  </td>
                </tr>
              ) : visitorRows.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-8 text-center text-slate-500 font-medium">
                    등록된 방문 신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                visitorRows.map((r) => (
                  <tr key={r.seq} className="hover:bg-slate-50 border-b border-slate-300">
                    <td className="border border-slate-400 font-bold py-1.5">{`방문자 ${r.seq}`}</td>
                    <td className="border border-slate-400 px-1 font-medium">{r.company}</td>
                    <td className="border border-slate-400 px-1">{r.visitorDept}</td>
                    <td className="border border-slate-400 px-1 font-bold">{r.name}</td>
                    <td className="border border-slate-400 px-1">{r.position}</td>
                    <td className="border border-slate-400 px-1 font-mono">{r.phone}</td>
                    <td className="border border-slate-400 px-1 font-mono font-bold text-slate-900">{r.carPlate}</td>
                    <td className="border border-slate-400 px-1">{r.carModel}</td>
                    <td className="border border-slate-400 px-1 text-left">{r.reason}</td>
                    <td className="border border-slate-400 px-1 font-mono">{r.startDate}</td>
                    <td className="border border-slate-400 px-1 font-mono">{r.startTime}</td>
                    <td className="border border-slate-400 px-1 font-mono">{r.endDate}</td>
                    <td className="border border-slate-400 px-1 font-mono">{r.endTime}</td>
                    <td className="border border-slate-400 px-1 font-bold">{r.zone}</td>
                    <td className="border border-slate-400 px-1">{r.hostDept}</td>
                    <td className="border border-slate-400 px-1 font-bold">{r.hostName}</td>
                    <td className="border border-slate-400 px-1">{r.hostPosition}</td>
                    <td className="border border-slate-400 px-1 font-mono">{r.hostPhone}</td>
                    <td className="border border-slate-400 px-1 text-left">{r.remarks}</td>
                    <td className="border border-slate-400 px-1 font-bold">{r.status}</td>
                  </tr>
                ))
              )}

              {/* Empty placeholder rows for paper writing if needed */}
              {Array.from({ length: Math.max(0, 10 - visitorRows.length) }).map((_, i) => (
                <tr key={`blank-${i}`} className="h-8">
                  <td className="border border-slate-300 text-slate-300 font-bold">{`방문자 ${visitorRows.length + i + 1}`}</td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Approval Signature Block */}
        <div className="mt-8 pt-4 border-t border-slate-400 flex items-end justify-between text-xs text-slate-600">
          <div>
            <p>※ 본 출입대장은 사업장 보안 관리 규정에 따라 작성되었습니다.</p>
            <p>작성자: 총무팀 / 확인자: 당직 보안실장</p>
          </div>

          <div className="flex items-center space-x-6 border border-slate-900 p-2 text-center bg-slate-50">
            <div className="w-20">
              <p className="font-bold border-b border-slate-400 pb-1 mb-6">작 성</p>
              <p className="text-[10px] text-slate-400">(서명)</p>
            </div>
            <div className="w-20">
              <p className="font-bold border-b border-slate-400 pb-1 mb-6">검 토</p>
              <p className="text-[10px] text-slate-400">(서명)</p>
            </div>
            <div className="w-20">
              <p className="font-bold border-b border-slate-400 pb-1 mb-6">승 인</p>
              <p className="text-[10px] text-slate-400">(서명)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
