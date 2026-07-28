import * as XLSX from 'xlsx';
import { ApplicationRecord, VisitorInfo } from '../types';
import { formatPhoneNumber } from './phone';

/**
 * Generates and downloads an Excel file matching the official company template format ("외부방문자 사전 방문신청 양식.xlsx")
 */
export function exportToExcel(records: ApplicationRecord[], filename = '외부방문자_방문신청_목록.xlsx') {
  // Construct headers
  const headersRow1 = [
    '구분',
    '외부 방문자 정보', '', '', '', '', '', '', '', '',
    '방문기간', '', '', '',
    '방문장소',
    '담당 임직원 정보', '', '', '',
    '상태 및 입퇴실 기록', ''
  ];

  const headersRow2 = [
    '구분',
    '업체명', '부서명', '성명', '직급', '연락처(폰)', '차번호', '차종', '방문사유', '비고',
    '시작일', '시작시간', '종료일', '종료시간',
    '방문장소',
    '부서명', '성명', '직급', '연락처(폰)',
    '신청상태', '실제입퇴실시간'
  ];

  const dataRows: (string | number)[][] = [headersRow1, headersRow2];

  let visitorCounter = 1;

  records.forEach((rec) => {
    rec.visitors.forEach((v) => {
      let statusText = '대기';
      if (rec.status === 'APPROVED') statusText = '승인완료';
      if (rec.status === 'CHECKED_IN') statusText = '입실중';
      if (rec.status === 'CHECKED_OUT') statusText = '퇴실완료';
      if (rec.status === 'REJECTED') statusText = '반려';
      if (rec.status === 'DELETED') statusText = '삭제됨';

      let actualTimeText = '';
      if (rec.actualCheckInTime) {
        actualTimeText = `입실: ${new Date(rec.actualCheckInTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      if (rec.actualCheckOutTime) {
        actualTimeText += ` / 퇴실: ${new Date(rec.actualCheckOutTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
      }

      dataRows.push([
        `방문자 ${v.sequence || visitorCounter++}`,
        v.companyName || '',
        v.deptName || '',
        v.visitorName || '',
        v.position || '',
        v.phone || '',
        v.carPlate || '',
        v.carModel || '',
        v.visitReason || '',
        v.remarks || '',
        rec.period.startDate || '',
        rec.period.startTime || '',
        rec.period.endDate || '',
        rec.period.endTime || '',
        rec.visitZone || '',
        rec.host.deptName || '',
        rec.host.employeeName || '',
        rec.host.position || '',
        rec.host.phone || '',
        statusText,
        actualTimeText
      ]);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet(dataRows);

  // Set merges for header groups
  worksheet['!merges'] = [
    // 외부 방문자 정보 (Cols B to J -> cols 1 to 9)
    { s: { r: 0, c: 1 }, e: { r: 0, c: 9 } },
    // 방문기간 (Cols K to N -> cols 10 to 13)
    { s: { r: 0, c: 10 }, e: { r: 0, c: 13 } },
    // 방문동 (Col O -> col 14)
    { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } },
    // 담당 임직원 정보 (Cols P to S -> cols 15 to 18)
    { s: { r: 0, c: 15 }, e: { r: 0, c: 18 } },
    // 상태 및 입퇴실 기록 (Cols T to U -> cols 19 to 20)
    { s: { r: 0, c: 19 }, e: { r: 0, c: 20 } },
  ];

  // Set column widths for comfortable reading
  worksheet['!cols'] = [
    { wch: 10 }, // 구분
    { wch: 16 }, // 업체명
    { wch: 12 }, // 부서명
    { wch: 10 }, // 성명
    { wch: 8 },  // 직급
    { wch: 15 }, // 연락처
    { wch: 10 }, // 차종
    { wch: 14 }, // 차번호
    { wch: 22 }, // 방문사유
    { wch: 18 }, // 비고
    { wch: 12 }, // 시작일
    { wch: 10 }, // 시작시간
    { wch: 12 }, // 종료일
    { wch: 10 }, // 종료시간
    { wch: 16 }, // 방문동
    { wch: 12 }, // 담당부서명
    { wch: 10 }, // 담당성명
    { wch: 8 },  // 담당직급
    { wch: 15 }, // 담당연락처
    { wch: 10 }, // 상태
    { wch: 25 }, // 실제입퇴실시간
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '외부방문자 신청목록');
  XLSX.writeFile(workbook, filename);
}

/**
 * Downloads a clean Excel template file for users to fill in visitor details offline
 */
export function downloadExcelTemplate() {
  const headersRow1 = [
    '구분',
    '외부 방문자 정보', '', '', '', '', '', '', '', '',
    '방문기간', '', '', '',
    '방문동',
    '담당 임직원 정보', '', '', '', ''
  ];

  const headersRow2 = [
    '구분',
    '업체명', '부서명', '성명', '직급', '연락처(폰)', '차번호', '차종', '방문사유', '비고',
    '시작일', '시작시간', '종료일', '종료시간',
    '방문동',
    '부서명', '성명', '직급', '연락처(폰)'
  ];

  const sampleRow1 = [
    '방문자 1',
    'ABC 산업', '-', '홍길동', '-', '010-1111-1111', '123호4567', '카니발', '생산동 자동창고 점검', 'VIP 방문',
    '2026-07-30', '09:00', '2026-07-31', '18:00',
    '생산동',
    '총무팀', '김셀트', '사원', '010-2345-6789'
  ];

  const sampleRow2 = [
    '방문자 2',
    'XYZ 서브스', '영업부', '이순신', '부장', '010-9999-8888', '567가1234', '그랜저', '정기 미팅', '',
    '2026-07-30', '10:00', '2026-07-30', '12:00',
    '본부동',
    '총무팀', '김셀트', '사원', '010-2345-6789'
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headersRow1, headersRow2, sampleRow1, sampleRow2]);

  worksheet['!merges'] = [
    { s: { r: 0, c: 1 }, e: { r: 0, c: 9 } },
    { s: { r: 0, c: 10 }, e: { r: 0, c: 13 } },
    { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } },
    { s: { r: 0, c: 15 }, e: { r: 0, c: 18 } },
  ];

  worksheet['!cols'] = [
    { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 8 },
    { wch: 15 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 18 },
    { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 16 },
    { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 15 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '방문신청_서식');
  XLSX.writeFile(workbook, '외부방문자_사전_방문신청_양식.xlsx');
}

/**
 * Parses an uploaded Excel file into structured visitor objects
 */
export async function parseExcelFile(file: File): Promise<{
  host: { deptName: string; employeeName: string; position: string; phone: string };
  period: { startDate: string; startTime: string; endDate: string; endTime: string };
  visitZone: string;
  visitors: VisitorInfo[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 3) {
          throw new Error('엑셀 파일에 유효한 데이터가 없습니다.');
        }

        // Find data row index (skip header rows)
        let startRowIdx = 2;
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const rowStr = JSON.stringify(rows[i]);
          if (rowStr.includes('업체명') || rowStr.includes('성명')) {
            startRowIdx = i + 1;
          }
        }

        const visitors: VisitorInfo[] = [];
        let defaultHost = { deptName: '', employeeName: '', position: '', phone: '' };
        let defaultPeriod = { startDate: '', startTime: '09:00', endDate: '', endTime: '18:00' };
        let defaultZone = '';

        for (let i = startRowIdx; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Checking row format (whether row[9] is remarks or startDate)
          const companyName = String(row[1] || '').trim();
          const visitorName = String(row[3] || '').trim();

          // Skip empty visitor rows
          if (!companyName && !visitorName) continue;

          const seq = visitors.length + 1;

          // Check if row has 19+ cols (new format with visitor remarks at col 9)
          let vRemarks = '';
          let startDate = '';
          let startTime = '09:00';
          let endDate = '';
          let endTime = '18:00';
          let visitZone = '';
          let hostDept = '';
          let hostName = '';
          let hostPos = '';
          let hostPhone = '';

          // If col 9 looks like YYYY-MM-DD or date string, it's legacy format where col 9 was startDate
          const col9Str = String(row[9] || '').trim();
          const isLegacy = col9Str.match(/^\d{4}-\d{2}-\d{2}$/);

          if (isLegacy) {
            vRemarks = '';
            startDate = col9Str;
            startTime = String(row[10] || '09:00').trim();
            endDate = String(row[11] || '').trim();
            endTime = String(row[12] || '18:00').trim();
            visitZone = String(row[13] || '').trim();
            hostDept = String(row[14] || '').trim();
            hostName = String(row[15] || '').trim();
            hostPos = String(row[16] || '').trim();
            hostPhone = String(row[17] || '').trim();
          } else {
            vRemarks = col9Str;
            startDate = String(row[10] || '').trim();
            startTime = String(row[11] || '09:00').trim();
            endDate = String(row[12] || '').trim();
            endTime = String(row[13] || '18:00').trim();
            visitZone = String(row[14] || '').trim();
            hostDept = String(row[15] || '').trim();
            hostName = String(row[16] || '').trim();
            hostPos = String(row[17] || '').trim();
            hostPhone = String(row[18] || '').trim();
          }

          const val6 = String(row[6] || '').trim();
          const val7 = String(row[7] || '').trim();
          let carPlate = val6;
          let carModel = val7;
          // Backwards compatibility for legacy excel templates where val6 was model and val7 was plate
          if (!/\d/.test(val6) && /\d/.test(val7)) {
            carPlate = val7;
            carModel = val6;
          }

          visitors.push({
            id: `v-import-${Date.now()}-${seq}`,
            sequence: seq,
            companyName: companyName || '미지정',
            deptName: String(row[2] || '').trim(),
            visitorName: visitorName || '성명 미입력',
            position: String(row[4] || '').trim(),
            phone: formatPhoneNumber(String(row[5] || '').trim()),
            carModel,
            carPlate,
            visitReason: String(row[8] || '').trim(),
            remarks: vRemarks,
          });

          // Set default period/host/zone from the first row if available
          if (i === startRowIdx) {
            defaultPeriod = {
              startDate: startDate || new Date().toISOString().split('T')[0],
              startTime: startTime || '09:00',
              endDate: endDate || new Date().toISOString().split('T')[0],
              endTime: endTime || '18:00',
            };
            defaultZone = visitZone;
            defaultHost = {
              deptName: hostDept,
              employeeName: hostName,
              position: hostPos,
              phone: formatPhoneNumber(hostPhone),
            };
          }
        }

        resolve({
          host: defaultHost,
          period: defaultPeriod,
          visitZone: defaultZone,
          visitors,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
