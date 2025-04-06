import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentService from '../services/DocumentService';
import './ReaderPage.css'; // We'll create this file for styles

// Constants
const MIN_WPM = 100;
const MAX_WPM = 1000;
const DEFAULT_WPM = 300;

const ReaderPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for interval and state management within interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wpmRef = useRef(wpm);
  const currentWordIndexRef = useRef(currentWordIndex);
  const wordsRef = useRef(words);

  // Update refs when state changes
  useEffect(() => { wpmRef.current = wpm; }, [wpm]);
  useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { wordsRef.current = words; }, [words]);

  // Fetch words when component mounts or documentId changes
  useEffect(() => {
    if (!documentId) {
      setError('No document ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchWords = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedWords = await DocumentService.getDocumentWords(documentId);
        if (fetchedWords.length === 0) {
            setError('Document is empty or could not be parsed.');
        } else {
            setWords(fetchedWords);
        }
      } catch (err: any) {
        console.error('Error fetching document words:', err);
        setError(err.response?.data?.message || 'Failed to load document content.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWords();

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [documentId]);

  // Function to calculate delay based on WPM
  const calculateDelay = useCallback((word: string) => {
    const baseDelay = 60000 / wpmRef.current; // ms per word
    // Add extra delay for longer words or punctuation (basic example)
    let extraDelay = 0;
    if (word.length > 8) extraDelay += baseDelay * 0.5;
    if (/[.,;!?]$/.test(word)) extraDelay += baseDelay * 0.8; // End of sentence markers

    return baseDelay + extraDelay;
  }, []);

  // Function to advance to the next word
  const advanceWord = useCallback(() => {
    if (currentWordIndexRef.current < wordsRef.current.length - 1) {
      const nextIndex = currentWordIndexRef.current + 1;
      setCurrentWordIndex(nextIndex); // Update state to trigger re-render

      // Schedule the next word advancement
      const currentWord = wordsRef.current[nextIndex] || '';
      intervalRef.current = setTimeout(advanceWord, calculateDelay(currentWord));
    } else {
      // Reached the end
      setIsPlaying(false);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [calculateDelay]);

  // Start/Stop playback logic
  useEffect(() => {
    if (isPlaying && words.length > 0) {
      // Clear any existing interval/timeout
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      // Start the timeout chain
      const currentWord = words[currentWordIndex] || '';
      intervalRef.current = setTimeout(advanceWord, calculateDelay(currentWord));
    } else {
      // Stop playback: Clear interval/timeout
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }
    // Cleanup function for when isPlaying changes or component unmounts
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, words, currentWordIndex, advanceWord, calculateDelay]); // Dependencies are important!

  // --- Handlers --- 
  const handlePlayPause = () => {
    if (words.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleWpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWpm = parseInt(event.target.value, 10);
    setWpm(newWpm);
  };

  const handlePreviousSentence = () => { /* TODO */ };
  const handleNextSentence = () => { /* TODO */ };

  // --- Rendering --- 
  if (isLoading) return <div>Loading document content...</div>;
  if (error) return <div>Error: {error} <button onClick={() => navigate('/library')}>Back to Library</button></div>;
  if (words.length === 0) return <div>Document has no content. <button onClick={() => navigate('/library')}>Back to Library</button></div>;

  const currentWord = words[currentWordIndex] || '';
  const progressPercentage = (currentWordIndex / words.length) * 100;

  return (
    <div className="reader-container">
      {/* Back Button */} 
      <button onClick={() => navigate('/library')} className="back-button">← Library</button>

      {/* Word Display Area */}
      <div className="word-display-area">
        {/* TODO: Implement focal point highlighting */}
        <span className="current-word">{currentWord}</span>
      </div>

      {/* Progress Section - Wrapped */} 
      <div className="progress-section">
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {currentWordIndex + 1} / {words.length} words ({progressPercentage.toFixed(1)}%)
        </div>
      </div>

      {/* Controls */} 
      <div className="controls-container">
        <button onClick={handlePreviousSentence} disabled>‹ Prev</button> {/* TODO */}
        <button onClick={handlePlayPause} className="play-pause-button">
          {isPlaying ? '❚❚ Pause' : '► Play'}
        </button>
        <button onClick={handleNextSentence} disabled>Next ›</button> {/* TODO */}
        
        <div className="wpm-slider-container">
          <label htmlFor="wpm">{wpm} WPM</label>
          <input 
            type="range"
            id="wpm"
            min={MIN_WPM}
            max={MAX_WPM}
            value={wpm}
            onChange={handleWpmChange}
            step="10"
          />
        </div>
      </div>
    </div>
  );
};

export default ReaderPage; 