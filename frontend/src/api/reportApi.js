import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

/**
 * Download event attendance report as PDF
 */
export const downloadEventPDF = async (eventId) => {
  const response = await axios.get(`${API_BASE}/reports/event/${eventId}/pdf`, {
    responseType: 'blob',
    withCredentials: true,
    headers: {
      'Accept': 'application/pdf',
    },
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `attendance-report-${eventId}-${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Download event attendance report as Excel
 */
export const downloadEventExcel = async (eventId) => {
  const response = await axios.get(`${API_BASE}/reports/event/${eventId}/excel`, {
    responseType: 'blob',
    withCredentials: true,
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `attendance-report-${eventId}-${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Download student attendance report as PDF
 */
export const downloadStudentPDF = async (studentId) => {
  const response = await axios.get(`${API_BASE}/reports/student/${studentId}/pdf`, {
    responseType: 'blob',
    withCredentials: true,
    headers: {
      'Accept': 'application/pdf',
    },
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `student-attendance-${studentId}-${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Download summary report as PDF
 */
export const downloadSummaryPDF = async (startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await axios.get(`${API_BASE}/reports/summary/pdf`, {
    params,
    responseType: 'blob',
    withCredentials: true,
    headers: {
      'Accept': 'application/pdf',
    },
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `events-summary-${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
