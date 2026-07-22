using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Judge;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class JudgeDashboardService : IJudgeDashboardService
    {
        private readonly ApplicationDbContext _context;

        public JudgeDashboardService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetDashboardAsync(Guid judgeId)
        {
            var teams = await BuildAssignedTeamsAsync(judgeId);

            var stats = new JudgeDashboardStats
            {
                TotalAssignedTeams = teams.Count,
                SubmittedTeams = teams.Count(t => t.SubmissionStatus == JudgingStatuses.Submitted),
                NotSubmittedTeams = teams.Count(t => t.SubmissionStatus == JudgingStatuses.NotSubmitted),
                JudgedTeams = teams.Count(t => t.JudgingStatus == JudgingStatuses.Judged || t.JudgingStatus == JudgingStatuses.InProgress),
                NotJudgedTeams = teams.Count(t => t.JudgingStatus == JudgingStatuses.NotJudged),
                OngoingEvents = teams
                    .Where(t => t.EventStatus == nameof(EventStatus.Ongoing))
                    .Select(t => t.EventId)
                    .Distinct()
                    .Count(),
                OpenRounds = teams
                    .Where(t => t.EventStatus == nameof(EventStatus.Ongoing))
                    .Select(t => t.RoundId)
                    .Distinct()
                    .Count(),
            };

            // Completion is judged-out-of-submitted: a judge can only act on
            // submissions, so unsubmitted teams must not drag the bar down.
            stats.CompletionPercentage = stats.SubmittedTeams == 0
                ? 0
                : Math.Round(stats.JudgedTeams * 100.0 / stats.SubmittedTeams, 1);

            stats.NearestDeadline = teams
                .Where(t => t.RoundDeadline.HasValue && t.RoundDeadline.Value >= DateTime.UtcNow)
                .Select(t => t.RoundDeadline!.Value)
                .DefaultIfEmpty()
                .Min();
            if (stats.NearestDeadline == default) stats.NearestDeadline = null;

            var events = teams
                .GroupBy(t => new { t.EventId, t.EventName, t.EventStatus })
                .Select(g =>
                {
                    var submitted = g.Count(t => t.SubmissionStatus == JudgingStatuses.Submitted);
                    var judged = g.Count(t => t.JudgingStatus == JudgingStatuses.Judged || t.JudgingStatus == JudgingStatuses.InProgress);

                    // "Current round" = the round with the nearest upcoming deadline,
                    // falling back to any round the judge is assigned to in this event.
                    var currentRound = g
                        .Where(t => t.RoundDeadline.HasValue && t.RoundDeadline.Value >= DateTime.UtcNow)
                        .OrderBy(t => t.RoundDeadline)
                        .FirstOrDefault()
                        ?? g.OrderByDescending(t => t.RoundDeadline ?? DateTime.MinValue).First();

                    return new JudgeEventProgressDto
                    {
                        EventId = g.Key.EventId,
                        EventName = g.Key.EventName,
                        EventStatus = g.Key.EventStatus,
                        EventStartDate = _eventDates.TryGetValue(g.Key.EventId, out var d) ? d.start : default,
                        EventEndDate = _eventDates.TryGetValue(g.Key.EventId, out var d2) ? d2.end : default,
                        CurrentRoundId = currentRound.RoundId,
                        CurrentRoundName = currentRound.RoundName,
                        JudgingDeadline = currentRound.RoundDeadline,
                        AssignedTeams = g.Count(),
                        JudgedTeams = judged,
                        NotJudgedTeams = g.Count(t => t.JudgingStatus == JudgingStatuses.NotJudged),
                        NotSubmittedTeams = g.Count(t => t.SubmissionStatus == JudgingStatuses.NotSubmitted),
                        ProgressPercentage = submitted == 0 ? 0 : Math.Round(judged * 100.0 / submitted, 1),
                    };
                })
                // Show ongoing events first, then by start date.
                .OrderByDescending(e => e.EventStatus == nameof(EventStatus.Ongoing))
                .ThenBy(e => e.EventStartDate)
                .ToList();

            return ServiceResult.Ok(new JudgeDashboardResponse { Stats = stats, Events = events });
        }

        public async Task<ServiceResult> GetAssignedTeamsAsync(
            Guid judgeId, Guid? eventId, Guid? roundId, string? status, string? search)
        {
            var teams = await BuildAssignedTeamsAsync(judgeId);

            if (eventId.HasValue)
                teams = teams.Where(t => t.EventId == eventId.Value).ToList();

            if (roundId.HasValue)
                teams = teams.Where(t => t.RoundId == roundId.Value).ToList();

            if (!string.IsNullOrWhiteSpace(status) &&
                !status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                teams = status.ToLowerInvariant() switch
                {
                    "judged" => teams.Where(t => t.JudgingStatus == JudgingStatuses.Judged || t.JudgingStatus == JudgingStatuses.InProgress).ToList(),
                    "notjudged" => teams.Where(t => t.JudgingStatus == JudgingStatuses.NotJudged).ToList(),
                    "inprogress" => teams.Where(t => t.JudgingStatus == JudgingStatuses.InProgress).ToList(),
                    "submitted" => teams.Where(t => t.SubmissionStatus == JudgingStatuses.Submitted).ToList(),
                    "notsubmitted" => teams.Where(t => t.SubmissionStatus == JudgingStatuses.NotSubmitted).ToList(),
                    _ => teams,
                };
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLowerInvariant();
                teams = teams.Where(t =>
                    t.TeamName.ToLowerInvariant().Contains(q) ||
                    (t.ProjectName ?? "").ToLowerInvariant().Contains(q)).ToList();
            }

            return ServiceResult.Ok(teams);
        }

        // Cache of event date ranges populated by BuildAssignedTeamsAsync, keyed by
        // EventId — avoids re-querying when projecting per-event progress.
        private Dictionary<Guid, (DateTime start, DateTime end)> _eventDates = new();

        /// <summary>
        /// Builds the flat list of (round × team) the judge is responsible for,
        /// joined with submission + this judge's scoring state. Uses a handful of
        /// set-based queries (no per-team round-trips).
        /// </summary>
        private async Task<List<JudgeAssignedTeamDto>> BuildAssignedTeamsAsync(Guid judgeId)
        {
            var assignments = await _context.JudgeAssignments
                .Where(a => a.JudgeId == judgeId)
                .Include(a => a.Round).ThenInclude(r => r.Event)
                .Include(a => a.Category)
                .ToListAsync();

            if (assignments.Count == 0)
            {
                _eventDates = new();
                return [];
            }

            _eventDates = assignments
                .Where(a => a.Round?.Event != null)
                .GroupBy(a => a.Round!.EventId)
                .ToDictionary(g => g.Key, g => (g.First().Round!.Event!.StartDate, g.First().Round!.Event!.EndDate));

            // Category-wide assignments (TeamId == null) expand to every team in
            // that category; team-specific assignments target a single team.
            var wideCategoryIds = assignments
                .Where(a => a.TeamId == null)
                .Select(a => a.CategoryId)
                .Distinct()
                .ToList();

            var specificTeamIds = assignments
                .Where(a => a.TeamId != null)
                .Select(a => a.TeamId!.Value)
                .Distinct()
                .ToList();

            // Teams excluded from active competition shouldn't appear in the queue.
            var excluded = new[] { TeamStatus.Rejected, TeamStatus.Withdrawn };

            var teamsInCategories = await _context.Teams
                .Where(t => wideCategoryIds.Contains(t.CategoryId) && !excluded.Contains(t.Status))
                .Select(t => new TeamRow(t.TeamId, t.TeamName, t.CategoryId))
                .ToListAsync();

            var specificTeams = await _context.Teams
                .Where(t => specificTeamIds.Contains(t.TeamId) && !excluded.Contains(t.Status))
                .Select(t => new TeamRow(t.TeamId, t.TeamName, t.CategoryId))
                .ToListAsync();
            var specificTeamMap = specificTeams.ToDictionary(t => t.TeamId);

            // Build unique (roundId, teamId) entries.
            var entries = new Dictionary<(Guid, Guid), Entry>();
            foreach (var a in assignments)
            {
                if (a.Round == null) continue;
                var roundTeams = a.TeamId != null
                    ? (specificTeamMap.TryGetValue(a.TeamId.Value, out var st) ? new[] { st } : [])
                    : teamsInCategories.Where(t => t.CategoryId == a.CategoryId).ToArray();

                foreach (var team in roundTeams)
                {
                    var key = (a.RoundId, team.TeamId);
                    if (entries.ContainsKey(key)) continue;
                    entries[key] = new Entry(a.Round, a.Category?.CategoryName ?? "", team);
                }
            }

            if (entries.Count == 0) return [];

            var roundIds = entries.Keys.Select(k => k.Item1).Distinct().ToList();
            var teamIds = entries.Keys.Select(k => k.Item2).Distinct().ToList();

            var submissions = await _context.Submissions
                .Where(s => roundIds.Contains(s.RoundId) && teamIds.Contains(s.TeamId))
                .Select(s => new
                {
                    s.SubmissionId,
                    s.RoundId,
                    s.TeamId,
                    s.Title,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                })
                .ToListAsync();
            var submissionByKey = submissions.ToDictionary(s => (s.RoundId, s.TeamId));

            var submissionIds = submissions.Select(s => s.SubmissionId).ToList();
            var myScores = await _context.Scores
                .Where(s => s.JudgeId == judgeId && submissionIds.Contains(s.SubmissionId))
                .Select(s => new
                {
                    s.SubmissionId,
                    s.ScoreValue,
                    s.IsLocked,
                    s.CreatedAt,
                    Weight = s.Criteria != null ? s.Criteria.Weight : 0m,
                    MaxScore = s.Criteria != null ? s.Criteria.MaxScore : 0m,
                })
                .ToListAsync();
            var scoresBySubmission = myScores
                .GroupBy(s => s.SubmissionId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var result = new List<JudgeAssignedTeamDto>(entries.Count);
            foreach (var ((roundId, teamId), e) in entries)
            {
                var dto = new JudgeAssignedTeamDto
                {
                    TeamId = teamId,
                    TeamName = e.Team.TeamName,
                    Category = e.Category,
                    EventId = e.Round.EventId,
                    EventName = e.Round.Event?.EventName ?? "",
                    EventStatus = e.Round.Event?.Status.ToString() ?? "",
                    RoundId = roundId,
                    RoundName = e.Round.RoundName,
                    RoundDeadline = e.Round.SubmissionDeadline,
                };

                if (submissionByKey.TryGetValue((roundId, teamId), out var sub))
                {
                    dto.SubmissionId = sub.SubmissionId;
                    dto.ProjectName = sub.Title;
                    dto.SubmittedAt = sub.SubmittedAt;
                    dto.RepositoryUrl = sub.RepositoryUrl;
                    dto.DemoUrl = sub.DemoUrl;
                    dto.SlideUrl = sub.SlideUrl;
                    dto.SubmissionStatus = JudgingStatuses.Submitted;

                    if (scoresBySubmission.TryGetValue(sub.SubmissionId, out var scores) && scores.Count > 0)
                    {
                        var allLocked = scores.All(s => s.IsLocked);
                        dto.IsLocked = allLocked;
                        dto.JudgingStatus = allLocked ? JudgingStatuses.Judged : JudgingStatuses.InProgress;
                        dto.ScoreState = allLocked ? JudgingStatuses.ScoreLocked : JudgingStatuses.ScoreDraft;
                        dto.LastJudgedAt = scores.Max(s => s.CreatedAt);
                        dto.MyScore = Math.Round(
                            scores.Sum(s => s.MaxScore == 0 ? 0 : (s.ScoreValue / s.MaxScore) * s.Weight), 2);
                    }
                    else
                    {
                        dto.JudgingStatus = JudgingStatuses.NotJudged;
                        dto.ScoreState = JudgingStatuses.ScoreNone;
                    }
                }
                else
                {
                    dto.SubmissionStatus = JudgingStatuses.NotSubmitted;
                    dto.JudgingStatus = JudgingStatuses.NotSubmitted;
                    dto.ScoreState = JudgingStatuses.ScoreNone;
                }

                result.Add(dto);
            }

            return result
                .OrderBy(t => t.EventName)
                .ThenBy(t => t.RoundName)
                .ThenBy(t => t.TeamName)
                .ToList();
        }

        private readonly record struct TeamRow(Guid TeamId, string TeamName, Guid CategoryId);
        private readonly record struct Entry(Models.Entities.Round Round, string Category, TeamRow Team);
    }
}
