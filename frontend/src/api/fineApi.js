import api from './axios';

// Get all fines (Admin/Officer)
export const getAllFines = async (params = {}) => {
  const response = await api.get('/fines', { params });
  return response.data;
};

// Get student's own fines
export const getStudentFines = async () => {
  const response = await api.get('/student-fines');
  return response.data;
};

// Get fine statistics
export const getFineStatistics = async () => {
  const response = await api.get('/fines/statistics');
  return response.data;
};

// Mark fine as paid
export const markFineAsPaid = async (fineId) => {
  const response = await api.post(`/fines/${fineId}/pay`);
  return response.data;
};

// Waive a fine
export const waiveFine = async (fineId, reason) => {
  const response = await api.post(`/fines/${fineId}/waive`, { reason });
  return response.data;
};

// Get fines report
export const getFinesReport = async (params = {}) => {
  const response = await api.get('/fines/report', { params });
  return response.data;
};
