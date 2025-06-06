import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import About from './components/About';
import DemoPage from './components/pages/DemoPage';
import ErrorBoundary from './components/ErrorBoundary';
import DevPanel from './components/DevPanel';

function App() {
  // Правильная инициализация темы с самого начала
  const [darkMode, setDarkMode] = useState(() => {
    // Проверяем localStorage и system preference сразу при инициализации
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    // Fallback к системным настройкам
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    console.log('🌙 Начальная инициализация темы:', darkMode ? 'темная' : 'светлая');
    
    // Применяем/удаляем класс dark к documentElement
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
          
          <main className="w-full py-4">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/about" element={<About />} />
                <Route path="/demo" element={<DemoPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
          
          <DevPanel />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
