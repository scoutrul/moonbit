import { useState } from 'react';

/**
 * Компонент с намеренной ошибкой для тестирования ErrorBoundary
 * При счетчике >= 5 компонент вызывает ошибку
 */
function BuggyCounter() {
  const [counter, setCounter] = useState(0);

  const handleClick = () => {
    setCounter((prev) => prev + 1);
  };

  if (counter >= 5) {
    // Намеренно вызываем ошибку при достижении счетчиком значения 5
    throw new Error('Я сломался при счетчике = ' + counter);
  }

  return (
    <div className="p-4 border rounded bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-lg font-bold mb-2">Тестирование Error Boundary</h3>
      <p className="mb-4">Этот компонент вызовет ошибку, когда счетчик достигнет 5.</p>
      <div className="flex items-center gap-4">
        <p className="text-xl font-bold">{counter}</p>
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Увеличить
        </button>
      </div>
    </div>
  );
}

export default BuggyCounter;
