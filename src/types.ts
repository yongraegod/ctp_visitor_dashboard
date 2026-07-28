export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'REJECTED' | 'DELETED';

export interface VisitorInfo {
  id: string;
  sequence: number; // 1, 2, 3... (방문자 1, 방문자 2...)
  companyName: string; // 업체명
  deptName: string; // 방문자 부서명
  visitorName: string; // 성명
  position: string; // 직급
  phone: string; // 연락처
  carModel: string; // 차종
  carPlate: string; // 차번호
  visitReason: string; // 방문사유
  remarks?: string; // 비고 (선택사항)
}

export interface VisitPeriod {
  startDate: string; // 시작일 YYYY-MM-DD
  startTime: string; // 시작시간 HH:mm
  endDate: string; // 종료일 YYYY-MM-DD
  endTime: string; // 종료시간 HH:mm
}

export interface HostEmployeeInfo {
  deptName: string; // 담당 부서명
  employeeName: string; // 담당자 성명
  position: string; // 담당자 직급
  phone: string; // 담당자 연락처
}

export interface ApplicationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  visitZone: string; // 방문구역 (e.g. 생산동 1층, 본관 3층 회의실)
  status: ApplicationStatus;
  period: VisitPeriod;
  host: HostEmployeeInfo;
  visitors: VisitorInfo[];
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  securityNote?: string;
}

export interface AppStats {
  totalToday: number;
  currentlyIn: number;
  pendingApproval: number;
  completedToday: number;
  totalVehiclesToday: number;
}
