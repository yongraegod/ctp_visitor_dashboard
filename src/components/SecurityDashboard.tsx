import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Car,
  Download,
  Printer,
  QrCode,
  CheckCircle,
  LogOut,
  Clock,
  UserCheck,
  Building,
  RefreshCw,
  XCircle,
  AlertCircle,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { ApplicationRecord, ApplicationStatus, AppStats } from '../types';
import { exportToExcel } from '../utils/excel';
import { formatPhoneNumber } from '../utils/phone';

interface SecurityDashboardProps {
  onOpenPassModal?: (record: ApplicationRecord) => void;
  onOpenPrintView: () => void;
  refreshTrigger: number;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  onOpenPassModal,
  onOpenPrintView,
  refreshTrigger,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AppStats>({
    totalToday: 0,
    currentlyIn: 0,
    pendingApproval: 0,
    completedToday: 0,
    totalVehiclesToday: 0,
  });

  // Filter States
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vehicleOnly, setVehicleOnly] = useState<boolean>(false);
  const [timeSortOrder, setTimeSortOrder] = useState<'asc' | 'desc'>('asc');

  // Helper to extract timestamp for time-based sorting
  const getAppTimeValue = (app: ApplicationRecord): number => {
    if (app.status === 'CHECKED_IN' && app.actualCheckInTime) {
      return new Date(app.actualCheckInTime).getTime();
    }
    if (app.status === 'CHECKED_OUT' && app.actualCheckOutTime) {
      return new Date(app.actualCheckOutTime).getTime();
    }
    if (app.period?.startDate && app.period?.startTime) {
      const t = new Date(`${app.period.startDate}T${app.period.startTime}:00`).getTime();
      if (!isNaN(t)) return t;
    }
    return new Date(app.createdAt).getTime();
  };

  const getStatusPriority = (status: ApplicationStatus): number => {
    switch (status) {
      case 'CHECKED_IN':
        return 1;
      case 'APPROVED':
      case 'PENDING':
        return 2;
      case 'CHECKED_OUT':
        return 3;
      case 'REJECTED':
        return 4;
      case 'DELETED':
        return 5;
      default:
        return 6;
    }
  };

  const sortApplicationsList = (list: ApplicationRecord[], order: 'asc' | 'desc') => {
    return [...list].sort((a, b) => {
      const pDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (pDiff !== 0) return pDiff;

      const timeA = getAppTimeValue(a);
      const timeB = getAppTimeValue(b);

      return order === 'asc' ? timeA - timeB : timeB - timeA;
    });
  };

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      let url = `/api/applications?search=${encodeURIComponent(searchQuery)}`;
      if (selectedDate) url += `&date=${selectedDate}`;
      if (selectedStatus && selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        let list: ApplicationRecord[] = json.data;
        if (vehicleOnly) {
          list = list.filter((app) =>
            app.visitors.some((v) => v.carPlate && v.carPlate.trim() !== '' && v.carPlate.trim() !== '-')
          );
        }
        setApplications(sortApplicationsList(list, timeSortOrder));
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/today');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [selectedDate, selectedStatus, searchQuery, vehicleOnly, timeSortOrder, refreshTrigger]);

  // Status Change Handler (Check-in, Check-out, Approval, Rejection)
  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchApplications();
        fetchStats();
      }
    } catch (err) {
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>입실대기</span>
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-400 animate-pulse">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>입실 중</span>
          </span>
        );
      case 'CHECKED_OUT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <LogOut className="w-3 h-3 text-slate-500" />
            <span>퇴실완료</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>반려</span>
          </span>
        );
      case 'DELETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400 border border-slate-300 line-through">
            <Trash2 className="w-3 h-3 text-slate-400" />
            <span>삭제됨</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-24">
      {/* Top Header & Security Stats Row */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>보안실 실시간 출입 통제 대시보드</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              일일 외부방문자 및 차량 출입 조회
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportToExcel(applications, `보안실_외부방문자_목록_${selectedDate || '전체'}.xlsx`)}
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>엑셀 내보내기</span>
            </button>

            <button
              onClick={onOpenPrintView}
              className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄 서식 보기</span>
            </button>

            <button
              onClick={() => {
                fetchApplications();
                fetchStats();
              }}
              className="p-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">오늘 방문 신청자</p>
              <p className="text-xl font-bold text-slate-900">{stats.totalToday}명</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">현재 입실 중</p>
              <p className="text-xl font-bold text-emerald-600">{stats.currentlyIn}명</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">등록 차량 대수</p>
              <p className="text-xl font-bold text-indigo-900">{stats.totalVehiclesToday}대</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">입실 대기</p>
              <p className="text-xl font-bold text-amber-600">{stats.pendingApproval}건</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & VEHICLE QUICK SEARCH TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 mb-6 space-y-4">
        {/* Search Bar for License Plate or Visitor Name */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="차량번호(예: 123호4567), 방문자명, 업체명, 담당자 검색..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
              >
                지우기
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTimeSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100 transition-all cursor-pointer shadow-xs"
              title="동일 상태일 때 방문 및 입실 시간순 자동 정렬 방향 변경"
            >
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>시간순 ({timeSortOrder === 'asc' ? '빠른순 ▲' : '늦은순 ▼'})</span>
            </button>
            <button
              onClick={() => setVehicleOnly(!vehicleOnly)}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                vehicleOnly
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>차량 등록자만 보기</span>
            </button>
          </div>
        </div>

        {/* Date Quick Tabs & Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Date Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedDate === todayStr ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              오늘 ({todayStr.slice(5)})
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split('T')[0]);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              내일
            </button>
            <button
              onClick={() => setSelectedDate('')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedDate === '' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 날짜
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1">
            <span className="text-slate-400 font-semibold mr-1 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1" /> 상태:
            </span>
            {[
              { id: 'ALL', label: '전체' },
              { id: 'CHECKED_IN', label: '입실 중' },
              { id: 'PENDING', label: '입실대기' },
              { id: 'CHECKED_OUT', label: '퇴실완료' },
              { id: 'REJECTED', label: '반려' },
              { id: 'DELETED', label: '삭제건' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus === st.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VISITOR RECORDS LIST / TABLE */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm font-semibold">방문신청 내역을 불러오는 중입니다...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-base font-bold text-slate-700">해당 조건의 방문신청 내역이 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">
            검색어나 날짜 필터를 변경하거나 임직원 방문 신청을 진행해주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-3 px-3 border-b border-slate-800">구분 / 방문자</th>
                    <th className="py-3 px-3 border-b border-slate-800">업체명</th>
                    <th className="py-3 px-3 border-b border-slate-800">연락처</th>
                    <th className="py-3 px-3 border-b border-slate-800">차번호</th>
                    <th className="py-3 px-3 border-b border-slate-800">방문기간 & 장소</th>
                    <th className="py-3 px-3 border-b border-slate-800">담당 임직원</th>
                    <th className="py-3 px-3 border-b border-slate-800">상태</th>
                    <th className="py-3 px-3 border-b border-slate-800 text-right">보안실 출입 조치</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {applications.map((app) =>
                    app.visitors.map((v, vIdx) => {
                      const isDeleted = app.status === 'DELETED';
                      return (
                        <tr
                          key={`${app.id}-${v.id}`}
                          className={`transition-colors ${
                            isDeleted ? 'bg-slate-100/70 text-slate-400 italic line-through' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Visitor Index & Name */}
                          <td className="py-3 px-3 font-semibold">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded not-italic no-underline">
                                방문자 {v.sequence}
                              </span>
                              <span className={`text-sm font-bold ${isDeleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {v.visitorName}
                              </span>
                              {v.position && v.position !== '-' && (
                                <span className="text-[11px] text-slate-500">({v.position})</span>
                              )}
                            </div>
                          </td>

                          {/* Company */}
                          <td className={`py-3 px-3 font-medium ${isDeleted ? 'text-slate-400' : 'text-slate-700'}`}>
                            <div>{v.companyName}</div>
                            {v.deptName && v.deptName !== '-' && (
                              <div className="text-[10px] text-slate-400">{v.deptName}</div>
                            )}
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-3 font-mono font-medium">{formatPhoneNumber(v.phone)}</td>

                          {/* Vehicle */}
                          <td className="py-3 px-3">
                            {v.carPlate && v.carPlate !== '-' ? (
                              <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold border not-italic ${
                                isDeleted ? 'bg-slate-200/60 text-slate-400 border-slate-300 line-through' : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                              }`}>
                                <Car className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span>{v.carPlate}</span>
                                {v.carModel && <span className={`text-[10px] font-normal ${isDeleted ? 'text-slate-400' : 'text-indigo-700'}`}>({v.carModel})</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">도보 (차량없음)</span>
                            )}
                          </td>

                          {/* Schedule & Location */}
                          <td className="py-3 px-3">
                            <div className={isDeleted ? 'text-slate-400 font-semibold' : 'font-semibold text-slate-900'}>{app.visitZone}</div>
                            <div className="text-[11px] font-mono opacity-80">
                              {app.period.startDate} ({app.period.startTime}) ~ {app.period.endDate} ({app.period.endTime})
                            </div>
                            {v.visitReason && <div className="text-[10px] opacity-75 line-clamp-1">사유: {v.visitReason}</div>}
                            {v.remarks && <div className="text-[10px] opacity-80 line-clamp-1">비고: {v.remarks}</div>}
                          </td>

                          {/* Host Employee */}
                          <td className="py-3 px-3 font-medium">
                            <div className={isDeleted ? 'text-slate-400 font-bold' : 'text-slate-900 font-bold'}>
                              {app.host.employeeName} {app.host.position}
                            </div>
                            <div className="text-[11px] text-slate-500">{app.host.deptName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{formatPhoneNumber(app.host.phone)}</div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 not-italic no-underline">
                            {renderStatusBadge(app.status)}
                            {app.actualCheckInTime && (
                              <div className="text-[10px] font-mono text-emerald-700 mt-1">
                                입실: {new Date(app.actualCheckInTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            {app.actualCheckOutTime && (
                              <div className="text-[10px] font-mono text-slate-500">
                                퇴실: {new Date(app.actualCheckOutTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>

                          {/* Security Actions */}
                          <td className="py-3 px-3 text-right not-italic no-underline">
                            <div className="flex items-center justify-end space-x-1.5">
                              {isDeleted ? (
                                <button
                                  onClick={() => handleStatusChange(app.id, 'PENDING')}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                                  title="삭제 취소: 대기 상태로 원복"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>삭제 취소</span>
                                </button>
                              ) : (
                                <>
                                  {(app.status === 'PENDING' || app.status === 'APPROVED') && (
                                    <button
                                      onClick={() => handleStatusChange(app.id, 'CHECKED_IN')}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>입실 처리</span>
                                    </button>
                                  )}

                                  {app.status === 'CHECKED_IN' && (
                                    <>
                                      <button
                                        onClick={() => handleStatusChange(app.id, 'CHECKED_OUT')}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                                      >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>퇴실 처리</span>
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange(app.id, 'PENDING')}
                                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                                        title="실수 방지: 입실대기 상태로 원복"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>입실 취소(원복)</span>
                                      </button>
                                    </>
                                  )}

                                  {app.status === 'CHECKED_OUT' && (
                                    <button
                                      onClick={() => handleStatusChange(app.id, 'CHECKED_IN')}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                                      title="실수 방지: 입실중 상태로 원복"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>퇴실 취소(원복)</span>
                                    </button>
                                  )}

                                  {app.status === 'REJECTED' && (
                                    <button
                                      onClick={() => handleStatusChange(app.id, 'PENDING')}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                                      title="실수 방지: 대기 상태로 원복"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>반려 취소(원복)</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleStatusChange(app.id, 'DELETED')}
                                    className="bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1"
                                    title="방문 신청 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>삭제</span>
                                  </button>
                                </>
                              )}

                              {onOpenPassModal && !isDeleted && (
                                <button
                                  onClick={() => onOpenPassModal(app)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="모바일 방문증 확인"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="block lg:hidden space-y-3">
            {applications.map((app) => {
              const isDeleted = app.status === 'DELETED';
              return (
                <div
                  key={app.id}
                  className={`rounded-2xl p-4 shadow-sm border space-y-3 relative transition-all ${
                    isDeleted
                      ? 'bg-slate-100/80 border-slate-300 text-slate-400 italic line-through'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Status & ID Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 not-italic no-underline">
                    <div className="flex items-center space-x-2">
                      {renderStatusBadge(app.status)}
                      <span className="text-[11px] font-mono text-slate-400">#{app.id.slice(-6)}</span>
                    </div>
                    {onOpenPassModal && !isDeleted && (
                      <button
                        onClick={() => onOpenPassModal(app)}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>모바일증</span>
                      </button>
                    )}
                  </div>

                  {/* Visitors Info */}
                  <div className="space-y-2">
                    {app.visitors.map((v) => (
                      <div key={v.id} className={`p-2.5 rounded-xl text-xs space-y-1 ${isDeleted ? 'bg-slate-200/50' : 'bg-slate-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className={`font-bold text-sm ${isDeleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {v.visitorName} {v.position && <span className="font-normal text-xs opacity-75">({v.position})</span>}
                          </div>
                          <span className={`font-semibold px-2 py-0.5 rounded border ${isDeleted ? 'bg-slate-200 text-slate-400 border-slate-300' : 'bg-white text-slate-600 border-slate-200'}`}>
                            {v.companyName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between opacity-80">
                          <span>전화: <a href={`tel:${v.phone}`} className="underline font-mono">{v.phone}</a></span>
                          {v.carPlate && v.carPlate !== '-' && (
                            <span className={`inline-flex items-center space-x-1 font-mono font-bold px-1.5 py-0.5 rounded ${isDeleted ? 'bg-slate-300 text-slate-500' : 'bg-indigo-100 text-indigo-900'}`}>
                              <Car className="w-3 h-3" />
                              <span>{v.carPlate}</span>
                            </span>
                          )}
                        </div>

                        {v.visitReason && (
                          <p className="text-[11px] opacity-75 pt-0.5">사유: {v.visitReason}</p>
                        )}
                        {v.remarks && (
                          <p className="text-[11px] opacity-80 font-medium pt-0.5">비고: {v.remarks}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Visit Period & Location */}
                  <div className={`text-xs p-2.5 rounded-xl space-y-1 ${isDeleted ? 'bg-slate-200/40' : 'bg-slate-100/70'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">방문장소: {app.visitZone}</span>
                      <span className="font-mono text-[11px] opacity-80">{app.period.startDate}</span>
                    </div>
                    <div className="text-[11px] opacity-80">
                      시간: {app.period.startTime} ~ {app.period.endTime}
                    </div>
                    <div className="text-[11px] pt-1 border-t border-slate-200/60 opacity-90">
                      담당자: <span className="font-bold">{app.host.employeeName}</span> ({app.host.deptName}) / {app.host.phone}
                    </div>
                  </div>

                  {/* Mobile Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 not-italic no-underline">
                    {isDeleted ? (
                      <button
                        onClick={() => handleStatusChange(app.id, 'PENDING')}
                        className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                        title="삭제 취소: 대기 상태로 원복"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>삭제 취소 (원복)</span>
                      </button>
                    ) : (
                      <>
                        {(app.status === 'PENDING' || app.status === 'APPROVED') && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'CHECKED_IN')}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>입실 확인</span>
                          </button>
                        )}

                        {app.status === 'CHECKED_IN' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(app.id, 'CHECKED_OUT')}
                              className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>퇴실 완료</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(app.id, 'PENDING')}
                              className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1"
                              title="실수 방지: 입실대기 상태로 원복"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>입실 취소(원복)</span>
                            </button>
                          </>
                        )}

                        {app.status === 'CHECKED_OUT' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'CHECKED_IN')}
                            className="flex-1 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1"
                            title="실수 방지: 입실중 상태로 원복"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>퇴실 취소 (입실중 원복)</span>
                          </button>
                        )}

                        {app.status === 'REJECTED' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'PENDING')}
                            className="flex-1 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1"
                            title="실수 방지: 대기 상태로 원복"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>반려 취소 (대기 원복)</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStatusChange(app.id, 'DELETED')}
                          className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
                          title="삭제 처리"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>삭제</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
