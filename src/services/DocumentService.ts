import axios from 'axios';
import AuthService from './AuthService'; // To get the auth token

// Base API URL (same as AuthService)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Interface for Document data received from backend
// Adjust fields based on your actual backend response
interface Document {
  id: string;
  filename: string;
  filetype: 'PDF' | 'EPUB';
  title: string;
  uploaded_at: string;
  progress_percentage: number;
  last_read_at?: string | null; // Optional
  // Add other relevant fields if needed
}

// Interface for the words response
interface DocumentWordsResponse {
  words: string[];
}

// Function to get authorization headers
const getAuthHeaders = () => {
  const token = AuthService.getCurrentUserToken();
  if (!token) {
    console.error('No token found for authenticated request');
    // Optionally throw an error or handle appropriately
    return {};
  }
  return { 'x-auth-token': token };
};

// Upload a document
const uploadDocument = async (file: File, title?: string): Promise<Document> => {
  const formData = new FormData();
  formData.append('document', file); // Field name must match backend (multer expects 'document')
  if (title) {
    formData.append('title', title);
  }

  const response = await axios.post<Document>(`${API_URL}/documents/upload`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data', // Important for file uploads
    },
    // Optional: Add progress tracking
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
          // You can update UI state here
      }
    },
  });
  return response.data;
};

// Get all documents for the user
const getDocuments = async (): Promise<Document[]> => {
  const response = await axios.get<Document[]>(`${API_URL}/documents`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Delete a document by ID
const deleteDocument = async (documentId: string): Promise<{ message: string }> => {
  const response = await axios.delete<{ message: string }>(`${API_URL}/documents/${documentId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// --- NEW FUNCTION --- 
// Get parsed words for a document
const getDocumentWords = async (documentId: string): Promise<string[]> => {
  const response = await axios.get<DocumentWordsResponse>(
    `${API_URL}/documents/${documentId}/words`,
    { headers: getAuthHeaders() }
  );
  return response.data.words; // Return just the array of words
};

// --- TODO: Add functions for updating reading progress --- 
// e.g., updateProgress(documentId, position, percentage)

const DocumentService = {
  uploadDocument,
  getDocuments,
  deleteDocument,
  getDocumentWords, // Add the new function
};

export default DocumentService; 