import ErrorBoundary from './ErrorBoundary';

/**
 * Компонент-обёртка для обработки ошибок с возможностью показа заглушки
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние элементы
 * @param {string} props.fallbackText - Текст заглушки в случае ошибки
 * @param {React.ReactNode} props.fallbackComponent - Кастомный компонент заглушки
 * @param {Function} props.onError - Колбэк, вызываемый при ошибке
 * @returns {React.ReactElement} - Компонент с обработкой ошибок
 */
const ErrorWrapper = ({ 
  children, 
  fallbackText = 'Произошла ошибка при загрузке компонента', 
  fallbackComponent,
  onError
}) => {
  // Обработчик ошибок для ErrorBoundary
  const handleError = (error, errorInfo) => {
    console.error('Ошибка в компоненте:', error, errorInfo);
    if (onError) {
      onError(error, errorInfo);
    }
  };

  // Заглушка для отображения при ошибке
  const ErrorFallback = ({ error }) => {
    if (fallbackComponent) {
      return fallbackComponent;
    }

    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">
          {fallbackText}
        </h3>
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
            <details>
              <summary className="cursor-pointer">Подробнее об ошибке</summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-auto">
                {error.toString()}
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={ErrorFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorWrapper; 