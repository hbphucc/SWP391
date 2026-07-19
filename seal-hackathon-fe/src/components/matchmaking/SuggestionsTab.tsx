import { Search, Filter, UserPlus, GraduationCap, Zap, Clock } from "lucide-react";
import { Spin, Empty } from "antd";
import type { TeamData, UserData, FreeAgentOrSuggestion, RecruitingTeam } from "./useMatchmakingData";

interface SuggestionsTabProps {
  myTeam: TeamData | null;
  currentUser: UserData | null;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  skillFilter: string;
  setSkillFilter: (v: string) => void;
  loadingSuggestions: boolean;
  suggestions: FreeAgentOrSuggestion[];
  loadingRecruiting: boolean;
  recruitingTeams: RecruitingTeam[];
  busyAction: string | null;
  onInvite: (targetUser: FreeAgentOrSuggestion) => void;
  onRequestToJoin: (teamId: string, teamName: string) => void;
}

export default function SuggestionsTab({
  myTeam, currentUser, searchQuery, setSearchQuery, skillFilter, setSkillFilter,
  loadingSuggestions, suggestions, loadingRecruiting, recruitingTeams, busyAction,
  onInvite, onRequestToJoin,
}: SuggestionsTabProps) {
  if (myTeam) {
    return (
      <>
        <div className="glass-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-bar" style={{ flex: "1 1 300px", maxWidth: "500px" }}>
              <Search size={16} style={{ color: "var(--color-text-3)" }} />
              <input
                className="search-input"
                placeholder="Search by skill or name (e.g. React, Designer)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 200px" }}>
              <Filter size={16} style={{ color: "var(--color-text-3)" }} />
              <select
                className="form-input"
                style={{ width: "100%", cursor: "pointer" }}
                value={skillFilter}
                onChange={e => setSkillFilter(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="AI Engineer">AI Engineer</option>
                <option value="Web3 Developer">Web3 Developer</option>
                <option value="Fullstack Developer">Fullstack Developer</option>
              </select>
            </div>
          </div>
        </div>

        {loadingSuggestions ? (
          <div className="empty-state">
            <Spin />
            <div className="empty-title" style={{ marginTop: 10 }}>Loading candidates...</div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <Empty description="No matching free agents found." />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
            {suggestions.map((user) => (
              <div key={user.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", transition: "transform 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: "1.2rem", flexShrink: 0, background: 'var(--color-surface-2)' }}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.1rem" }}>{user.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--color-text-3)", fontSize: "0.8rem" }}>
                        <GraduationCap size={12} /> XP: {user.xp}
                      </div>
                    </div>
                  </div>
                  {user.matchPercentage !== undefined && (
                    <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={12} /> {user.matchPercentage}% Match
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, marginTop: '0.5rem' }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-1)", marginBottom: "0.5rem", fontWeight: 600 }}>
                    Role: <span style={{ fontWeight: 400, color: 'var(--color-text-2)' }}>{user.role}</span>
                  </div>

                  {user.matchReasons && user.matchReasons.length > 0 && (
                    <div style={{ fontSize: "0.8rem", color: "var(--color-amber)", marginBottom: "1rem" }}>
                      Match reasons: {user.matchReasons.join(", ")}
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "auto" }}>
                    {(user.skills || []).map((skill: string, sIdx: number) => (
                      <span key={sIdx} style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", background: "rgba(99,102,241,0.1)", color: "var(--color-primary-2)", borderRadius: "99px", border: "1px solid rgba(99,102,241,0.2)" }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: "0.6rem" }}
                    onClick={() => onInvite(user)}
                    disabled={!myTeam || myTeam.leaderId !== currentUser?.id || busyAction !== null}
                  >
                    {busyAction === `invite-${user.id}` ? <span className="spinner" /> : <><UserPlus size={16} /> Invite to Team</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  const filteredRecruitingTeams = recruitingTeams.filter(team =>
    team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.leaderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* User search recruiting teams logic */}
      <div className="glass-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-bar" style={{ flex: "1 1 300px", maxWidth: "500px" }}>
            <Search size={16} style={{ color: "var(--color-text-3)" }} />
            <input
              className="search-input"
              placeholder="Search teams by name, category, or leader..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loadingRecruiting ? (
        <div className="empty-state">
          <Spin />
          <div className="empty-title" style={{ marginTop: 10 }}>Loading recruiting teams...</div>
        </div>
      ) : filteredRecruitingTeams.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <Empty description="No recruiting teams found." />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {filteredRecruitingTeams.map((team) => (
            <div key={team.teamId} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.10rem", color: "var(--color-text-1)" }}>
                  {team.teamName}
                </h3>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>
                  Category: <strong>{team.categoryName}</strong>
                </span>
              </div>

              <div style={{ fontSize: "0.9rem", color: "var(--color-text-2)" }}>
                <div>Leader: <strong>{team.leaderName}</strong></div>
                <div style={{ marginTop: "0.25rem" }}>Members ({team.memberCount}/5):</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                  {team.members.map((member, idx) => (
                    <span key={idx} className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
                      {member}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                {team.hasPendingRequest ? (
                  <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} disabled>
                    <Clock size={16} style={{ marginRight: 4 }} /> Request Pending
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => onRequestToJoin(team.teamId, team.teamName)}
                  >
                    <UserPlus size={16} style={{ marginRight: 4 }} /> Request to Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
