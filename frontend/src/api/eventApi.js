import api from './axios';

export const getEvents = (params) => api.get('/events', { params });
export const createEvent = (data) => api.post('/events', data);
export const getEvent = (id) => api.get(`/events/${id}`);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const getActiveEvents = () => api.get('/events/active');
export const getEventAnalytics = (id) => api.get(`/events/${id}/analytics`);
export const getAllEventsAnalytics = () => api.get('/events/analytics');
