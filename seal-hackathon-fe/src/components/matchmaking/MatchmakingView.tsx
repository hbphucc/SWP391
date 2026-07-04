"use client";
import { Zap, Send, Inbox } from "lucide-react";
import { Spin } from "antd";
import { useMatchmakingData } from "./useMatchmakingData";
import TeamStatusBanner from "./TeamStatusBanner";
import SuggestionsTab from "./SuggestionsTab";
import SentInvitesTab from "./SentInvitesTab";
import ReceivedInvitesTab from "./ReceivedInvitesTab";

export default function MatchmakingView() {
  const {
    currentUser, myTeam, loading,
    activeTab, setActiveTab,
    recruitingTeams, loadingRecruiting,
    suggestions, loadingSuggestions, searchQuery, setSearchQuery, skillFilter, setSkillFilter,
    sentInvites, loadingSent,
    receivedInvites, loadingReceived,
    busyAction,
    handleRequestToJoin, handleInvite, handleCancelInvite, handleAcceptInvite, handleRejectInvite,
  } = useMatchmakingData();

  if (loading) {
    return (
      <div className="empty-state">
        <Spin size="large" />
        <div className="empty-title">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">Teammate Matchmaking</h1>
        </div>
      </div>

      <TeamStatusBanner myTeam={myTeam} currentUser={currentUser} />

      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        <button className={`tab-btn ${activeTab === "suggestions" ? "active" : ""}`} onClick={() => setActiveTab("suggestions")}>
          <Zap size={14} style={{ marginRight: 6 }} /> Suggestions / Search
        </button>
        <button
          className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => setActiveTab("sent")}
        >
          <Send size={14} style={{ marginRight: 6 }} /> Sent Invitations / Requests
        </button>
        <button className={`tab-btn ${activeTab === "received" ? "active" : ""}`} onClick={() => setActiveTab("received")}>
          <Inbox size={14} style={{ marginRight: 6 }} /> Received Invitations / Requests
        </button>
      </div>

      {activeTab === "suggestions" && (
        <SuggestionsTab
          myTeam={myTeam}
          currentUser={currentUser}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          skillFilter={skillFilter}
          setSkillFilter={setSkillFilter}
          loadingSuggestions={loadingSuggestions}
          suggestions={suggestions}
          loadingRecruiting={loadingRecruiting}
          recruitingTeams={recruitingTeams}
          busyAction={busyAction}
          onInvite={handleInvite}
          onRequestToJoin={handleRequestToJoin}
        />
      )}

      {activeTab === "sent" && (
        <SentInvitesTab
          myTeam={myTeam}
          currentUser={currentUser}
          loadingSent={loadingSent}
          sentInvites={sentInvites}
          busyAction={busyAction}
          onCancelInvite={handleCancelInvite}
        />
      )}

      {activeTab === "received" && (
        <ReceivedInvitesTab
          myTeam={myTeam}
          currentUser={currentUser}
          loadingReceived={loadingReceived}
          receivedInvites={receivedInvites}
          busyAction={busyAction}
          onAcceptInvite={handleAcceptInvite}
          onRejectInvite={handleRejectInvite}
        />
      )}
    </div>
  );
}
