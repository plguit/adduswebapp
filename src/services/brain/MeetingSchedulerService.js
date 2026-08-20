import { storage } from '../../utils/storage.js';
import { idGeneratorService } from '../idGeneratorService.js';

const MEETINGS_KEY = 'ADDUS_MEETINGS_DB';

const MEETING_TYPES = [
  'Kickoff Meeting',
  'Strategy Meeting',
  'Shoot Planning',
  'Review Meeting',
  'Delivery Meeting'
];

/**
 * Module 3: Project Meeting Scheduler
 */
export const MeetingSchedulerService = {
  getAllMeetings() {
    return storage.get(MEETINGS_KEY, []);
  },


  scheduleMeeting({ projectId, title, type, scheduledAt, duration = 60, attendees = [], notes = '' }) {
    const meetingId = idGeneratorService.getNextId('AMT');
    const meetings = this.getAllMeetings();

    const meeting = {
      meetingId,
      projectId,
      title: title || `${type} — Project ${projectId}`,
      type: type || 'Kickoff Meeting',
      scheduledAt: scheduledAt || new Date(Date.now() + 86400000).toISOString(),
      duration,
      attendees,
      platform: 'Internal',
      status: 'scheduled',
      notes,
      createdAt: new Date().toISOString()
    };

    meetings.unshift(meeting);
    storage.set(MEETINGS_KEY, meetings);
    return meeting;
  },

  getMeetingTypesForService(service = '') {
    return MEETING_TYPES;
  },

  getMeetingsForProject(projectId) {
    return this.getAllMeetings().filter(m => m.projectId === projectId);
  },

  updateMeetingStatus(meetingId, status, notes = '') {
    const all = this.getAllMeetings();
    const updated = all.map(m => m.meetingId === meetingId ? { ...m, status, notes: notes || m.notes } : m);
    storage.set(MEETINGS_KEY, updated);
    return updated.find(m => m.meetingId === meetingId);
  }
};

export default MeetingSchedulerService;
