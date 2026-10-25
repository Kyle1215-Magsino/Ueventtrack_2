import api from './axios';

export const getAllOfficerRegistrations = (params = {}) => {
  return api.get('/officer-registrations', { params }).then(res => res.data);
};

export const getPendingOfficerRegistrations = () => {
  return api.get('/officer-registrations/pending').then(res => res.data);
};

export const approveOfficerRegistration = (id, data) => {
  return api.post(`/officer-registrations/${id}/approve`, data).then(res => res.data);
};

export const rejectOfficerRegistration = (id, data) => {
  return api.post(`/officer-registrations/${id}/reject`, data).then(res => res.data);
};
