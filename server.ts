import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ApplicationRecord } from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initial Seed Data based on the user's uploaded Excel sheet ("외부방문자 사전 방문신청 양식.xlsx")
const todayStr = new Date().toISOString().split('T')[0];
const initialApplications: ApplicationRecord[] = [
  {
    id: 'APP-20260730-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visitZone: '생산동 1층',
    status: 'APPROVED',
    period: {
      startDate: '2026-07-30',
      startTime: '09:00',
      endDate: '2026-07-31',
      endTime: '18:00',
    },
    host: {
      deptName: '총무팀',
      employeeName: '김셀트',
      position: '사원',
      phone: '010-2345-6789',
    },
    visitors: [
      {
        id: 'V-001-1',
        sequence: 1,
        companyName: 'ABC 산업',
        deptName: '-',
        visitorName: '홍길동',
        position: '-',
        phone: '010-1111-1111',
        carModel: '카니발',
        carPlate: '123호4567',
        visitReason: '생산동 자동창고 점검',
        remarks: '정기 점검 업체',
      },
      {
        id: 'V-001-2',
        sequence: 2,
        companyName: 'ABC 산업',
        deptName: '기술지원부',
        visitorName: '박철수',
        position: '대리',
        phone: '010-1111-2222',
        carModel: '카니발',
        carPlate: '123호4567',
        visitReason: '생산동 자동창고 점검 동행',
        remarks: '',
      }
    ],
  },
  {
    id: 'APP-TODAY-002',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visitZone: '본부동 3층 대회의실',
    status: 'CHECKED_IN',
    actualCheckInTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    period: {
      startDate: todayStr,
      startTime: '09:30',
      endDate: todayStr,
      endTime: '17:00',
    },
    host: {
      deptName: 'IT운영팀',
      employeeName: '이강인',
      position: '선임',
      phone: '010-3333-4444',
    },
    visitors: [
      {
        id: 'V-002-1',
        sequence: 1,
        companyName: '보안테크 유니온',
        deptName: '솔루션사업부',
        visitorName: '최민수',
        position: '이사',
        phone: '010-5555-7777',
        carModel: '제네시스 G80',
        carPlate: '52가8899',
        visitReason: '네트워크 보안 장비 컨설팅',
        remarks: '사전 출입 등록 사전승인',
      }
    ],
  },
  {
    id: 'APP-TODAY-003',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visitZone: '유틸리티동 2층',
    status: 'PENDING',
    period: {
      startDate: todayStr,
      startTime: '14:00',
      endDate: todayStr,
      endTime: '16:00',
    },
    host: {
      deptName: 'R&D 센터',
      employeeName: '정수빈',
      position: '책임연구원',
      phone: '010-8888-9999',
    },
    visitors: [
      {
        id: 'V-003-1',
        sequence: 1,
        companyName: '한국케미칼',
        deptName: '품질관리팀',
        visitorName: '한지민',
        position: '팀장',
        phone: '010-7777-1234',
        carModel: '아이오닉6',
        carPlate: '349너5678',
        visitReason: '시료 전달 및 시험 성적서 전달',
        remarks: '시샘플 지참',
      }
    ],
  }
];

let applicationStore: ApplicationRecord[] = [...initialApplications];

// API Routes
app.get('/api/applications', (req, res) => {
  const { date, search, status } = req.query;

  let results = [...applicationStore];

  if (date) {
    results = results.filter((app) => app.period.startDate <= (date as string) && app.period.endDate >= (date as string));
  }

  if (status && status !== 'ALL') {
    if (status === 'PENDING') {
      results = results.filter((app) => app.status === 'PENDING' || app.status === 'APPROVED');
    } else {
      results = results.filter((app) => app.status === status);
    }
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    results = results.filter((app) => {
      const matchHost = app.host.employeeName.toLowerCase().includes(q) || app.host.deptName.toLowerCase().includes(q);
      const matchZone = app.visitZone.toLowerCase().includes(q);
      const matchVisitor = app.visitors.some(
        (v) =>
          v.visitorName.toLowerCase().includes(q) ||
          v.companyName.toLowerCase().includes(q) ||
          v.carPlate.toLowerCase().includes(q) ||
          v.phone.includes(q)
      );
      return matchHost || matchZone || matchVisitor;
    });
  }

  // Sort: primary by status priority, secondary by time (chronological)
  results.sort((a, b) => {
    const statusPriority = (st: string) => {
      if (st === 'CHECKED_IN') return 1;
      if (st === 'PENDING' || st === 'APPROVED') return 2;
      if (st === 'CHECKED_OUT') return 3;
      if (st === 'REJECTED') return 4;
      if (st === 'DELETED') return 5;
      return 6;
    };

    const pA = statusPriority(a.status);
    const pB = statusPriority(b.status);
    if (pA !== pB) return pA - pB;

    const getTime = (app: ApplicationRecord) => {
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

    return getTime(a) - getTime(b);
  });

  res.json({ success: true, data: results });
});

app.post('/api/applications', (req, res) => {
  const newApp: ApplicationRecord = {
    id: `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'PENDING',
    ...req.body,
  };

  applicationStore.unshift(newApp);
  res.json({ success: true, data: newApp });
});

app.put('/api/applications/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, securityNote } = req.body;

  const target = applicationStore.find((item) => item.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: '신청 내역을 찾을 수 없습니다.' });
  }

  target.status = status;
  target.updatedAt = new Date().toISOString();
  if (securityNote !== undefined) target.securityNote = securityNote;

  if (status === 'CHECKED_IN') {
    if (!target.actualCheckInTime) {
      target.actualCheckInTime = new Date().toISOString();
    }
    target.actualCheckOutTime = undefined;
  } else if (status === 'CHECKED_OUT') {
    if (!target.actualCheckOutTime) {
      target.actualCheckOutTime = new Date().toISOString();
    }
  } else if (status === 'APPROVED' || status === 'PENDING' || status === 'DELETED') {
    target.actualCheckInTime = undefined;
    target.actualCheckOutTime = undefined;
  }

  res.json({ success: true, data: target });
});

app.delete('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  applicationStore = applicationStore.filter((item) => item.id !== id);
  res.json({ success: true, message: '삭제되었습니다.' });
});

app.get('/api/stats/today', (req, res) => {
  const tStr = new Date().toISOString().split('T')[0];
  const todayApps = applicationStore.filter((app) => app.period.startDate <= tStr && app.period.endDate >= tStr && app.status !== 'DELETED');

  const totalToday = todayApps.reduce((sum, app) => sum + app.visitors.length, 0);
  const currentlyIn = todayApps.filter((app) => app.status === 'CHECKED_IN').reduce((sum, app) => sum + app.visitors.length, 0);
  const pendingApproval = todayApps.filter((app) => app.status === 'PENDING' || app.status === 'APPROVED').length;
  const completedToday = todayApps.filter((app) => app.status === 'CHECKED_OUT').reduce((sum, app) => sum + app.visitors.length, 0);

  const vehicleSet = new Set<string>();
  todayApps.forEach((app) => {
    app.visitors.forEach((v) => {
      if (v.carPlate && v.carPlate.trim() !== '' && v.carPlate.trim() !== '-') {
        vehicleSet.add(v.carPlate.trim());
      }
    });
  });

  res.json({
    success: true,
    data: {
      totalToday,
      currentlyIn,
      pendingApproval,
      completedToday,
      totalVehiclesToday: vehicleSet.size,
    },
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
