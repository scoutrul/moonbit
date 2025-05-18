import { Component } from 'react';

/**
 * Компонент-граница ошибок для перехвата ошибок в дочерних компонентах
 * и отображения запасного UI вместо падающего компонента
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      key: 0 // Для пересоздания компонента
    };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние для отображения запасного UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Здесь можно залогировать ошибку
    console.error('Ошибка в компоненте:', error, errorInfo);
    
    // Можно добавить отправку ошибки в сервис мониторинга
    this.logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }
  
  /**
   * Отправляет ошибку в сервис мониторинга
   * @param {Error} error - Объект ошибки
   * @param {Object} errorInfo - Информация об ошибке от React
   */
  logErrorToService(error, errorInfo) {
    // Здесь можно реализовать отправку ошибки на сервер
    // Через fetch или специальный сервис вроде Sentry
    try {
      // Пример отправки ошибки (закомментирован, т.к. сервис не настроен)
      /*
      fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });
      */
    } catch (e) {
      console.error('Ошибка при отправке лога ошибки:', e);
    }
  }
  
  /**
   * Сбрасывает состояние ошибки и пересоздает компонент
   */
  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      key: this.state.key + 1
    });
  }

  render() {
    if (this.state.hasError) {
      // Кастомный UI для ошибки
      return (
        <div className="error-boundary p-4 rounded-lg bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 m-4 border border-red-300 dark:border-red-700">
          <h2 className="text-xl font-bold mb-2">Что-то пошло не так</h2>
          <p className="mb-4">Произошла ошибка при отображении этого компонента.</p>
          
          {this.props.fallback ? (
            this.props.fallback
          ) : (
            <div>
              {import.meta.env.MODE !== 'production' && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer font-bold">Технические детали ошибки</summary>
                  <p className="mt-2">{this.state.error && this.state.error.toString()}</p>
                  <pre className="mt-2 p-2 bg-red-100 dark:bg-red-800 overflow-auto rounded">
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              <button
                className="mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700"
                onClick={this.resetError}
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      );
    }

    // Отображаем дочерние компоненты как обычно
    return this.props.children;
  }
}

export default ErrorBoundary; 