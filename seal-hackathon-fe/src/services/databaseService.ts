// databaseService.ts
// Simulated Backend using LocalStorage to handle 1000+ users efficiently

import { 
  mockEvents, mockTeams, mockUsersPending, mockSubmissions, 
  mockAwardsConfig, mockTracks, mockScoringTeams, mockLeaderboard 
} from '../mockData';
import { User, Team, Event, Round, CriteriaTemplate, Track, Submission, AwardConfig, AuditLog, PendingApproval } from '../types/models';

const DB_KEY = 'seal_hackathon_db';

const ROLES = ['Frontend Dev', 'Backend Dev', 'Fullstack Dev', 'UI/UX Designer', 'AI Engineer', 'Data Scientist', 'Business Analyst', 'DevOps', 'QA Engineer', 'Mobile Dev'];
const SKILLS = ['React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'C#', 'MongoDB', 'PostgreSQL', 'Figma', 'AWS', 'Docker', 'TensorFlow', 'PyTorch', 'Next.js', 'Spring Boot'];

const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Thanh', 'Minh', 'Hải', 'Ngọc', 'Thành', 'Thu', 'Đức', 'Gia'];
const LAST_NAMES = ['A', 'B', 'C', 'D', 'Hùng', 'Linh', 'Khoa', 'Tâm', 'Nam', 'An', 'Bảo', 'Châu', 'Dũng', 'Giang', 'Hà', 'Khang', 'Lan', 'Mai', 'Nhi', 'Phong', 'Quang', 'Sơn', 'Trang', 'Tuấn', 'Uyên', 'Vy', 'Yến'];

function getRandomItem(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSkills(count: number): string[] {
  const shuffled = [...SKILLS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Khởi tạo 1,000 người dùng tự do (Free Agents) chưa có nhóm
function generateInitialUsers(): User[] {
  const users: User[] = [];
  for (let i = 0; i < 1000; i++) {
    const fullName = `${getRandomItem(FIRST_NAMES)} ${getRandomItem(MIDDLE_NAMES)} ${getRandomItem(LAST_NAMES)}`;
    users.push({
      id: `USR-${10000 + i}`,
      name: fullName,
      email: `user${i}@student.edu.vn`,
      role: getRandomItem(ROLES),
      skills: getRandomSkills(Math.floor(Math.random() * 3) + 2), // 2-4 skills
      xp: Math.floor(Math.random() * 5000),
      teamId: null, // Chưa có nhóm
      recentActiveMs: Date.now() - Math.random() * 1000000000,
      achievements: []
    });
  }
  return users;
}

interface DatabaseStructure {
  users: User[];
  teams: Team[];
  events: Event[];
  tracks: Track[];
  submissions: Submission[];
  awards: AwardConfig[];
  pendingUsers: User[];
  scoringTeams: any[];
  pendingApprovals: PendingApproval[];
  criteriaTemplates: CriteriaTemplate[];
  auditLogs: AuditLog[];
}

// Khởi tạo dữ liệu
function initDB() {
  if (typeof window === 'undefined') return;
  
  const storedDB = localStorage.getItem(DB_KEY);
  if (!storedDB) {
    const db: DatabaseStructure = {
      users: generateInitialUsers(),
      teams: mockTeams as any,
      events: mockEvents as any,
      tracks: mockTracks as any,
      submissions: mockSubmissions as any,
      awards: mockAwardsConfig as any,
      pendingUsers: mockUsersPending as any,
      scoringTeams: mockScoringTeams as any,
      pendingApprovals: [
        { id: 'APP-1', type: 'TEAM', name: 'CyberNinjas', members: 4, track: 'Cybersecurity', date: new Date().toISOString(), status: 'Pending' },
        { id: 'APP-2', type: 'USER', name: 'Phạm Văn Hùng', role: 'Fullstack Dev', track: 'Web', date: new Date().toISOString(), status: 'Pending' },
      ],
      criteriaTemplates: [
        { id: '1', name: 'Standard Software Engineering', totalWeight: 100, usageCount: 5, status: 'Active', 
          items: [
            { key: '1', name: 'Technical Execution', weight: 40, desc: 'Code quality, architecture, and functional completeness.' },
            { key: '2', name: 'Innovation', weight: 30, desc: 'Originality of the idea and approach.' },
            { key: '3', name: 'Presentation', weight: 30, desc: 'Clarity and effectiveness of the pitch and demo.' }
          ]
        },
        { id: '2', name: 'AI/ML Focus', totalWeight: 100, usageCount: 2, status: 'Active', 
          items: [
            { key: '1', name: 'Model Accuracy', weight: 35, desc: 'Performance and reliability of the ML model.' },
            { key: '2', name: 'Data Processing', weight: 25, desc: 'Quality of data pipeline and preprocessing.' },
            { key: '3', name: 'Business Value', weight: 20, desc: 'Applicability to real-world problems.' },
            { key: '4', name: 'Presentation', weight: 20, desc: 'Clarity of the pitch.' }
          ]
        }
      ],
      auditLogs: [
        { id: 'LOG-1', user: 'System', action: 'System initialized with 1000 users', time: new Date().toISOString(), icon: 'info' }
      ]
    };
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } else {
    // Migration: Đảm bảo các bảng mới được thêm vào DB cũ nếu chưa có
    let db = JSON.parse(storedDB);
    let updated = false;
    if (!db.teams) { db.teams = mockTeams; updated = true; }
    if (!db.events) { db.events = mockEvents; updated = true; }
    if (!db.tracks) { db.tracks = mockTracks; updated = true; }
    if (!db.submissions) { db.submissions = mockSubmissions; updated = true; }
    if (!db.awards) { db.awards = mockAwardsConfig; updated = true; }
    if (!db.pendingUsers) { db.pendingUsers = mockUsersPending; updated = true; }
    if (!db.scoringTeams) { db.scoringTeams = mockScoringTeams; updated = true; }
    if (!db.criteriaTemplates) {
      db.criteriaTemplates = [
        { id: '1', name: 'Standard Software Engineering', totalWeight: 100, usageCount: 5, status: 'Active', 
          items: [
            { key: '1', name: 'Technical Execution', weight: 40, desc: 'Code quality, architecture, and functional completeness.' },
            { key: '2', name: 'Innovation', weight: 30, desc: 'Originality of the idea and approach.' },
            { key: '3', name: 'Presentation', weight: 30, desc: 'Clarity and effectiveness of the pitch and demo.' }
          ]
        },
        { id: '2', name: 'AI/ML Focus', totalWeight: 100, usageCount: 2, status: 'Active', 
          items: [
            { key: '1', name: 'Model Accuracy', weight: 35, desc: 'Performance and reliability of the ML model.' },
            { key: '2', name: 'Data Processing', weight: 25, desc: 'Quality of data pipeline and preprocessing.' },
            { key: '3', name: 'Business Value', weight: 20, desc: 'Applicability to real-world problems.' },
            { key: '4', name: 'Presentation', weight: 20, desc: 'Clarity of the pitch.' }
          ]
        }
      ];
      updated = true;
    }
    
    if (updated) {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  }
}

// Gọi ngay khi file được import
initDB();

const getFallbackDB = (): DatabaseStructure => ({
  users: [],
  teams: mockTeams as any,
  events: mockEvents as any,
  tracks: mockTracks as any,
  submissions: mockSubmissions as any,
  awards: mockAwardsConfig as any,
  pendingUsers: mockUsersPending as any,
  scoringTeams: mockScoringTeams as any,
  pendingApprovals: [],
  criteriaTemplates: [],
  auditLogs: []
});

export const databaseService = {
  getDB: (): DatabaseStructure => {
    if (typeof window === 'undefined') return getFallbackDB();
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) as DatabaseStructure : getFallbackDB();
  },
  
  saveDB: (db: DatabaseStructure) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  },
  
  // ================= METRICS & ADMIN =================
  getDashboardMetrics: () => {
    const db = databaseService.getDB();
    return {
      activeEvents: 1,
      totalTeams: db.teams.length + 24, // Giả lập có 24 nhóm đã cứng
      pendingApprovals: db.pendingApprovals.length,
      upcomingEvent: 'Grand Finale - Hackathon 2026'
    };
  },

  getPendingApprovals: (): PendingApproval[] => databaseService.getDB().pendingApprovals,

  approveRequest: (id: string) => {
    const db = databaseService.getDB();
    db.pendingApprovals = db.pendingApprovals.filter(app => app.id !== id);
    db.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      user: 'Admin',
      action: `Approved request ${id}`,
      time: new Date().toISOString(),
      icon: 'check'
    });
    databaseService.saveDB(db);
  },

  rejectRequest: (id: string) => {
    const db = databaseService.getDB();
    db.pendingApprovals = db.pendingApprovals.filter(app => app.id !== id);
    db.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      user: 'Admin',
      action: `Rejected request ${id}`,
      time: new Date().toISOString(),
      icon: 'info'
    });
    databaseService.saveDB(db);
  },

  // ================= ADMIN ENTITIES CRUD =================
  // Teams
  getTeams: (): Team[] => databaseService.getDB().teams || [],
  updateTeam: (updatedTeam: Team) => {
    const db = databaseService.getDB();
    db.teams = db.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
    databaseService.saveDB(db);
  },
  
  // Events
  getEvents: (): Event[] => databaseService.getDB().events || [],
  addEvent: (event: Event) => {
    const db = databaseService.getDB();
    db.events.push(event);
    databaseService.saveDB(db);
  },
  updateEvent: (updatedEvent: Event) => {
    const db = databaseService.getDB();
    db.events = db.events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    databaseService.saveDB(db);
  },
  deleteEvent: (id: string) => {
    const db = databaseService.getDB();
    db.events = db.events.filter(e => e.id !== id);
    databaseService.saveDB(db);
  },

  // Submissions
  getSubmissions: (): Submission[] => databaseService.getDB().submissions || [],
  updateSubmission: (updatedSub: Submission) => {
    const db = databaseService.getDB();
    db.submissions = db.submissions.map(s => s.id === updatedSub.id ? updatedSub : s);
    databaseService.saveDB(db);
  },

  // Tracks
  getTracks: (): Track[] => databaseService.getDB().tracks || [],
  addTrack: (track: Track) => {
    const db = databaseService.getDB();
    db.tracks.push(track);
    databaseService.saveDB(db);
  },
  updateTrack: (updatedTrack: Track) => {
    const db = databaseService.getDB();
    db.tracks = db.tracks.map(t => t.id === updatedTrack.id ? updatedTrack : t);
    databaseService.saveDB(db);
  },
  deleteTrack: (id: string) => {
    const db = databaseService.getDB();
    db.tracks = db.tracks.filter(t => t.id !== id);
    databaseService.saveDB(db);
  },

  // Awards
  getAwards: (): AwardConfig[] => databaseService.getDB().awards || [],
  updateAward: (updatedAward: AwardConfig) => {
    const db = databaseService.getDB();
    db.awards = db.awards.map(a => a.id === updatedAward.id ? updatedAward : a);
    databaseService.saveDB(db);
  },
  
  // Pending Users
  getPendingUsers: (): User[] => databaseService.getDB().pendingUsers || [],
  removePendingUser: (id: string) => {
    const db = databaseService.getDB();
    db.pendingUsers = db.pendingUsers.filter(u => u.id !== id);
    databaseService.saveDB(db);
  },

  // Criteria Templates
  getCriteriaTemplates: (): CriteriaTemplate[] => databaseService.getDB().criteriaTemplates || [],
  addCriteriaTemplate: (template: CriteriaTemplate) => {
    const db = databaseService.getDB();
    db.criteriaTemplates.push(template);
    databaseService.saveDB(db);
  },
  updateCriteriaTemplate: (updatedTemplate: CriteriaTemplate) => {
    const db = databaseService.getDB();
    db.criteriaTemplates = db.criteriaTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    databaseService.saveDB(db);
  },
  deleteCriteriaTemplate: (id: string) => {
    const db = databaseService.getDB();
    db.criteriaTemplates = db.criteriaTemplates.filter(t => t.id !== id);
    databaseService.saveDB(db);
  },

  // Scoring Teams
  getScoringTeams: (): any[] => databaseService.getDB().scoringTeams || [],
  updateScoringTeam: (updatedTeam: any) => {
    const db = databaseService.getDB();
    db.scoringTeams = db.scoringTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
    databaseService.saveDB(db);
  },

  // ================= AUDIT LOG =================
  getAuditLogs: (): AuditLog[] => databaseService.getDB().auditLogs,

  logAction: (user: string, action: string, icon = 'info') => {
    const db = databaseService.getDB();
    db.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      user,
      action,
      time: new Date().toISOString(),
      icon
    });
    databaseService.saveDB(db);
  },

  // ================= MATCHMAKING ALGORITHM =================
  getTop10BestMatches: (teamRoles: string[] = [], searchTerm: string = '') => {
    const db = databaseService.getDB();
    let freeAgents = db.users.filter((u: User) => !u.teamId);

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      freeAgents = freeAgents.filter((user: User) => {
        const hasRole = user.role.toLowerCase().includes(lowerSearch);
        const hasSkill = user.skills.some(s => s.toLowerCase().includes(lowerSearch));
        const hasName = user.name.toLowerCase().includes(lowerSearch);
        return hasRole || hasSkill || hasName;
      });
    }

    const allRoles = ROLES;
    const missingRoles = allRoles.filter(r => !teamRoles.includes(r));

    const scoredUsers = freeAgents.map((user: User) => {
      let score = 0;
      let matchReasons: string[] = [];

      if (missingRoles.includes(user.role)) {
        score += 5000;
        matchReasons.push('Fills Missing Role');
      } else {
        score += 1000;
      }

      if (searchTerm) {
        score += 10000;
        matchReasons.push('Matches Search');
      }

      score += user.xp;

      const matchPercentage = Math.min(99, Math.max(40, Math.floor((score / 15000) * 100)));

      return { ...user, matchScore: score, matchPercentage, matchReasons };
    });

    scoredUsers.sort((a, b) => b.matchScore - a.matchScore);

    const limit = searchTerm ? 3 : 10;
    return scoredUsers.slice(0, limit);
  },

  getUserXP: (email: string) => {
    const db = databaseService.getDB();
    const user = db.users.find(u => u.email === email) || { xp: 2400, achievements: ['First Commit', 'Bug Hunter'] };
    return user;
  }
};
