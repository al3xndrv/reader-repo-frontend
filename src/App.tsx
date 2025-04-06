import React, { useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link // Import Link for navigation
} from 'react-router-dom';
import LoginPage from './pages/LoginPage'; // Corrected path
import SignupPage from './pages/SignupPage'; // Corrected path
import AuthService from './services/AuthService'; // Corrected path
import DocumentService from './services/DocumentService'; // Import DocumentService
import FileUpload from './components/FileUpload'; // Import FileUpload
import ReaderPage from './pages/ReaderPage'; // Import ReaderPage
import './App.css'; // Keep or replace with your styles

// Interface for Document (can be shared or defined here/in service)
interface Document {
  id: string;
  filename: string;
  filetype: 'PDF' | 'EPUB';
  title: string;
  uploaded_at: string;
  progress_percentage: number;
}

// Main Application View (Library Page)
const LibraryPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await DocumentService.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.response?.data?.message || 'Failed to load documents.');
      if (err.response?.status === 401) {
        // Handle unauthorized access, e.g., logout
        handleLogout(true); 
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleLogout = (forceReload = false) => {
    AuthService.logout();
    if (forceReload || !window.location.pathname.includes('/login')) {
       window.location.reload(); // Simple way to force redirect/state clear
    }
  };

  const handleUploadSuccess = (uploadedDocument: Omit<Document, 'progress_percentage'>) => {
    // Add the newly uploaded document to the list,
    // providing a default for progress_percentage
    const documentWithProgress: Document = {
      ...uploadedDocument,
      progress_percentage: 0.0 // Default to 0% on initial upload
    };
    setDocuments(prevDocs => [documentWithProgress, ...prevDocs]);
    // Optionally show a success message
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await DocumentService.deleteDocument(documentId);
        // Remove the document from the state
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      } catch (err: any) {
        console.error('Error deleting document:', err);
        alert(err.response?.data?.message || 'Failed to delete document.');
      }
    }
  };

  return (
    <div className="library-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Library</h1>
        <button onClick={() => handleLogout()}>Logout</button>
      </header>

      <div className="upload-section">
        <h2>Upload New Document</h2>
        <FileUpload onUploadSuccess={handleUploadSuccess} />
      </div>

      <h2>Your Documents</h2>
      {isLoading && <p>Loading documents...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isLoading && !error && (
        <ul className="document-list">
          {documents.length > 0 ? (
            documents.map(doc => (
              <li key={doc.id} className="document-item">
                <div className="document-info">
                  <strong>{doc.title || doc.filename}</strong>
                  <div>
                    <small>Type: {doc.filetype}</small>
                    <small>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</small>
                    <small>Progress: {doc.progress_percentage.toFixed(1)}%</small>
                  </div>
                </div>
                <div className="document-actions">
                  <Link to={`/reader/${doc.id}`}>Read</Link>
                  <button onClick={() => handleDelete(doc.id)}>Delete</button>
                </div>
              </li>
            ))
          ) : (
            <p>No documents uploaded yet.</p>
          )}
        </ul>
      )}
    </div>
  );
};

// A simple protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = !!AuthService.getCurrentUserToken();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected.
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main App Router Setup
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <LibraryPage />
              </ProtectedRoute>
            }
          />
          {/* Redirect root path to library if logged in, otherwise to login */}
          <Route
            path="/"
            element={
              AuthService.getCurrentUserToken() ? (
                <Navigate to="/library" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Actual route for the Reader page */}
          <Route 
            path="/reader/:documentId" 
            element={
              <ProtectedRoute>
                <ReaderPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
