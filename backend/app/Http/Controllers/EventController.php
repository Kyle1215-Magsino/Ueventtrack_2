<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventRequest;
use App\Models\AuditLog;
use App\Models\Event;
use App\Services\EventAnnouncementService;
use App\Services\EventAnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * Update event statuses based on current date/time
     */
    private function updateEventStatuses(): void
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $currentTime = $now->toTimeString();

        // Update completed events (past end time)
        Event::where('status', '!=', 'cancelled')
            ->where(function ($query) use ($today, $currentTime) {
                // Events before today
                $query->where('event_date', '<', $today)
                    // OR events today but past end time
                    ->orWhere(function ($q) use ($today, $currentTime) {
                        $q->where('event_date', '=', $today)
                            ->where('end_time', '<', $currentTime);
                    });
            })
            ->update(['status' => 'completed']);

        // Update ongoing events (between start and end time today)
        Event::where('status', 'upcoming')
            ->where('event_date', '=', $today)
            ->where('start_time', '<=', $currentTime)
            ->where('end_time', '>=', $currentTime)
            ->update(['status' => 'ongoing']);

        // Update future ongoing events back to upcoming (fix incorrect statuses)
        Event::where('status', 'ongoing')
            ->where('event_date', '>', $today)
            ->update(['status' => 'upcoming']);
    }

    public function index(Request $request): JsonResponse
    {
        // Update event statuses before fetching
        $this->updateEventStatuses();

        $query = Event::with('organizer');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('event_name', 'like', "%{$search}%")
                  ->orWhere('venue', 'like', "%{$search}%");
            });
        }

        $events = $query->orderByDesc('event_date')->paginate(10);

        return response()->json($events);
    }

    public function store(EventRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $event = Event::create($data);

        // Create announcement if event is coming soon
        EventAnnouncementService::createEventAnnouncement($event);

        AuditLog::record('created', "Created event: {$event->event_name}", 'Event', $event->id, $request->user()->id, $request->ip());

        return response()->json(['event' => $event, 'message' => 'Event created.'], 201);
    }

    public function show(int $id): JsonResponse
    {
        $event = Event::with(['organizer', 'attendances.student'])->findOrFail($id);

        $attendanceCounts = [
            'total' => $event->attendances->count(),
            'present' => $event->attendances->where('status', 'present')->count(),
            'late' => $event->attendances->where('status', 'late')->count(),
        ];

        return response()->json([
            'event' => $event,
            'attendanceCounts' => $attendanceCounts,
        ]);
    }

    public function update(EventRequest $request, int $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $event->update($request->validated());

        // Update announcement based on new event details
        EventAnnouncementService::updateEventAnnouncement($event);

        AuditLog::record('updated', "Updated event: {$event->event_name}", 'Event', $event->id, $request->user()->id, $request->ip());

        return response()->json(['event' => $event, 'message' => 'Event updated.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $name = $event->event_name;
        $event->delete();

        AuditLog::record('deleted', "Deleted event: {$name}", 'Event', $id, $request->user()->id, $request->ip());

        return response()->json(['message' => 'Event deleted.']);
    }

    public function active(): JsonResponse
    {
        // Update event statuses before fetching
        $this->updateEventStatuses();

        $today = Carbon::today()->toDateString();
        
        $events = Event::where(function ($query) use ($today) {
                // Ongoing events (any date)
                $query->where('status', 'ongoing')
                    // OR upcoming events that are TODAY
                    ->orWhere(function ($q) use ($today) {
                        $q->where('status', 'upcoming')
                            ->where('event_date', '=', $today);
                    });
            })
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->get();

        return response()->json($events);
    }

    /**
     * Get analytics for a specific event
     */
    public function analytics(int $id): JsonResponse
    {
        try {
            $analytics = EventAnalyticsService::getEventAnalytics($id);
            return response()->json($analytics);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error retrieving analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get analytics summary for all events
     */
    public function allAnalytics(): JsonResponse
    {
        try {
            $analytics = EventAnalyticsService::getAllEventsAnalytics();
            return response()->json($analytics);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error retrieving analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

