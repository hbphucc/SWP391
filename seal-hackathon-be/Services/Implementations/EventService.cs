using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Category;
using SEAL.NET.DTOs.Event;
using SEAL.NET.DTOs.Round;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Repositories.Interfaces;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly ApplicationDbContext _context;

        // The repository and this context resolve to the same scoped DbContext, so
        // attaching track-categories here and saving via the repository is atomic.
        public EventService(IEventRepository eventRepository, ApplicationDbContext context)
        {
            _eventRepository = eventRepository;
            _context = context;
        }

        private static bool HasValidDateChain(
            DateTime registrationStartDate,
            DateTime registrationEndDate,
            DateTime startDate,
            DateTime endDate)
        {
            return registrationStartDate < registrationEndDate &&
                   registrationEndDate <= startDate &&
                   startDate < endDate;
        }

        /// <summary>
        /// Materializes a per-event <see cref="Category"/> for each active track in
        /// <paramref name="trackIds"/> that isn't already attached to the event.
        /// Skips duplicates (by TrackId and by case-insensitive name). Does not save.
        /// </summary>
        private async Task AttachTracksAsync(Guid eventId, List<Guid> trackIds, HashSet<string> existingNames, HashSet<Guid> existingTrackIds)
        {
            var distinctIds = trackIds.Distinct().Where(id => !existingTrackIds.Contains(id)).ToList();
            if (distinctIds.Count == 0) return;

            var tracks = await _context.Tracks
                .Where(t => distinctIds.Contains(t.TrackId) && t.IsActive)
                .ToListAsync();

            foreach (var track in tracks)
            {
                // Guard against colliding with an existing category name (the per-event
                // unique (CategoryId, CategoryName) intent) and against double-adding.
                if (existingNames.Contains(track.Name.ToLower())) continue;

                _context.Categories.Add(new Category
                {
                    EventId = eventId,
                    CategoryName = track.Name,
                    Description = track.Description,
                    TrackId = track.TrackId
                });
                existingNames.Add(track.Name.ToLower());
                existingTrackIds.Add(track.TrackId);
            }
        }

        public async Task<List<EventResponseDto>> GetAllEventsAsync()
        {
            var events = await _eventRepository.GetEventsWithDetailsAsync();
            return events.Select(MapToDto).ToList();
        }


        public async Task<EventResponseDto?> GetEventByIdAsync(Guid id)
        {
            var eventItem = await _eventRepository.GetEventDetailAsync(id);
            if (eventItem == null) return null;
            return MapToDto(eventItem);
        }

        public async Task<(bool Success, string Message, Guid? Id)> CreateEventAsync(CreateEventRequest request)
        {
            if (!HasValidDateChain(
                    request.RegistrationStartDate,
                    request.RegistrationEndDate,
                    request.StartDate,
                    request.EndDate))
            {
                return (false, "Dates must satisfy RegistrationStartDate < RegistrationEndDate <= StartDate < EndDate.", null);
            }

            var newEvent = new Event
            {
                EventName = request.EventName,
                Description = request.Description,
                RegistrationStartDate = request.RegistrationStartDate,
                RegistrationEndDate = request.RegistrationEndDate,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = EventStatus.Draft
            };

            await _eventRepository.AddAsync(newEvent);

            // Attach selected catalog tracks as event categories in the same unit of work.
            if (request.TrackIds.Count > 0)
                await AttachTracksAsync(newEvent.EventId, request.TrackIds, new(), new());

            await _eventRepository.SaveChangesAsync();
            return (true, "Created successfully.", newEvent.EventId);
        }

        public async Task<(bool Success, string Message)> UpdateEventAsync(Guid id, UpdateEventRequest request)
        {
            var eventItem = await _eventRepository.GetEventDetailAsync(id);
            if (eventItem == null) return (false, "Event not found.");

            if (!HasValidDateChain(
                    request.RegistrationStartDate,
                    request.RegistrationEndDate,
                    request.StartDate,
                    request.EndDate))
            {
                return (false, "Dates must satisfy RegistrationStartDate < RegistrationEndDate <= StartDate < EndDate.");
            }

            var hasSubmissions = await _eventRepository.HasSubmissionsAsync(id);
            if (hasSubmissions && request.StartDate != eventItem.StartDate)
                return (false, "The start time cannot be changed after a submission has been made. Only the end time can be updated.");

            var hasRegisteredTeams = eventItem.Categories.Any(c => c.Teams.Any());
            if (hasRegisteredTeams &&
                request.RegistrationEndDate != eventItem.RegistrationEndDate &&
                request.RegistrationEndDate < DateTime.UtcNow)
            {
                return (false, "RegistrationEndDate cannot be moved into the past after teams have registered.");
            }

            // Once the event has actually started, the registration window is frozen — admins
            // cannot extend (or shorten) it. Lets ongoing events stay predictable for teams.
            if (request.RegistrationEndDate != eventItem.RegistrationEndDate &&
                eventItem.StartDate <= DateTime.UtcNow)
            {
                return (false, "RegistrationEndDate cannot be changed after the event has started.");
            }

            if (eventItem.Rounds.Any(r => r.SubmissionDeadline < request.StartDate || r.SubmissionDeadline > request.EndDate))
                return (false, "All round deadlines must remain within the event date range.");

            eventItem.EventName = request.EventName;
            eventItem.Description = request.Description;
            eventItem.RegistrationStartDate = request.RegistrationStartDate;
            eventItem.RegistrationEndDate = request.RegistrationEndDate;
            eventItem.StartDate = request.StartDate;
            eventItem.EndDate = request.EndDate;

            // Additively attach any newly-selected tracks (never removes categories).
            if (request.TrackIds.Count > 0)
            {
                var existingNames = eventItem.Categories
                    .Select(c => c.CategoryName.ToLower()).ToHashSet();
                var existingTrackIds = eventItem.Categories
                    .Where(c => c.TrackId.HasValue).Select(c => c.TrackId!.Value).ToHashSet();
                await AttachTracksAsync(id, request.TrackIds, existingNames, existingTrackIds);
            }

            // GetEventDetailAsync returns a tracked entity. Calling Update here would
            // mark the entire loaded Event -> Categories -> Teams/Rounds graph as
            // modified, which can make populated events fail while empty events work.
            // Changing the scalar properties above is enough for EF change tracking.
            await _eventRepository.SaveChangesAsync();
            return (true, "Updated successfully.");
        }

        public async Task<(bool Success, string Message)> DeleteEventAsync(Guid id)
        {
            var eventItem = await _eventRepository.GetEventDetailAsync(id);
            if (eventItem == null) return (false, "Event not found.");

            await _eventRepository.HardDeleteAsync(id);
            return (true, "Deleted successfully.");
        }

        public async Task<(bool Success, string Message)> PublishEventAsync(Guid id, Guid actorId)
        {
            _ = actorId;
            var eventItem = await _eventRepository.GetEventDetailAsync(id);
            if (eventItem == null) return (false, "Event not found.");

            if (eventItem.Status != EventStatus.Draft)
                return (false, "Only Draft events can be published.");

            if (eventItem.Categories.Count == 0)
                return (false, "Cannot publish an event without at least one category.");

            if (eventItem.Rounds.Count == 0)
                return (false, "Cannot publish an event without at least one round.");

            eventItem.Status = EventStatus.Published;
            await _eventRepository.SaveChangesAsync();
            return (true, "Event published successfully.");
        }

        public async Task<(bool Success, string Message)> StartEventAsync(Guid id, Guid actorId)
        {
            _ = actorId;
            var eventItem = await _eventRepository.GetEventDetailAsync(id);
            if (eventItem == null) return (false, "Event not found.");

            if (eventItem.Status != EventStatus.Published)
                return (false, "Only Published events can be started.");

            if (DateTime.UtcNow < eventItem.StartDate)
                return (false, "Event cannot be started before its StartDate.");

            eventItem.Status = EventStatus.Ongoing;
            await _eventRepository.SaveChangesAsync();
            return (true, "Event started successfully.");
        }

        public async Task<(bool Success, string Message)> CompleteEventAsync(Guid id, Guid actorId)
        {
            _ = actorId;
            var eventItem = await _eventRepository.GetEventDetailAsync(id);
            if (eventItem == null) return (false, "Event not found.");

            if (eventItem.Status != EventStatus.Ongoing)
                return (false, "Only Ongoing events can be completed.");

            eventItem.Status = EventStatus.Completed;
            await _eventRepository.SaveChangesAsync();
            return (true, "Event completed successfully.");
        }

        public async Task<(bool Success, string Message)> CancelEventAsync(Guid id, Guid actorId, string? reason)
        {
            _ = actorId;
            _ = reason;
            var eventItem = await _eventRepository.GetEventDetailAsync(id);
            if (eventItem == null) return (false, "Event not found.");

            if (eventItem.Status == EventStatus.Completed)
                return (false, "Completed events cannot be cancelled.");

            if (eventItem.Status == EventStatus.Cancelled)
                return (false, "Event is already cancelled.");

            eventItem.Status = EventStatus.Cancelled;
            await _eventRepository.SaveChangesAsync();
            return (true, "Event cancelled successfully.");
        }

        private static EventResponseDto MapToDto(Event e)
        {
            return new EventResponseDto
            {
                EventId = e.EventId,
                EventName = e.EventName,
                Description = e.Description,
                RegistrationStartDate = e.RegistrationStartDate,
                RegistrationEndDate = e.RegistrationEndDate,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                Status = e.Status.ToString(),
                HasSubmissions = e.Rounds.Any(r => r.Submissions.Any()),
                Categories = e.Categories.Select(c => new CategoryDto
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    Description = c.Description,
                    TeamCount = c.Teams.Count
                }).ToList(),
                Rounds = e.Rounds
                    .OrderBy(r => r.RoundOrder)
                    .Select(r => new RoundDto
                    {
                        RoundId = r.RoundId,
                        RoundName = r.RoundName,
                        RoundOrder = r.RoundOrder,
                        MaxTeamsAdvancing = r.MaxTeamsAdvancing,
                        SubmissionDeadline = r.SubmissionDeadline,
                        HasSubmissions = r.Submissions.Any(),
                        PromptDocumentId = r.PromptDocumentId,
                        PromptFileName = r.PromptDocument?.FileName
                    }).ToList()
            };
        }
    }
}
