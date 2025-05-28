import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import DevPanel from './components/DevPanel';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Проверяем предпочтение темной темы
    const isDarkMode =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    setDarkMode(isDarkMode);
  }, []);

  useEffect(() => {
    // Применяем/удаляем класс dark к body
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          
          <main className="container mx-auto px-4 py-8">
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </main>
          
          <DevPanel />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
