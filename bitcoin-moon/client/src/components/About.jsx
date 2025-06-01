import React from 'react';

const About = () => {
  return (
    <div className="w-full px-2">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">О проекте «Биткоин и Луна»</h1>
          <img 
            src="/logo.png" 
            alt="Логотип Биткоин и Луна" 
            className="mb-4" 
            height="160"
            width="160"
          />
        </div>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Концепция проекта</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Проект «Биткоин и Луна» исследует взаимосвязь между движением цены биткоина и лунными фазами. 
            В основе проекта лежит идея о том, что природные циклы могут оказывать определённое влияние на 
            финансовые рынки, включая криптовалютный рынок.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Платформа предоставляет инструменты для визуализации и анализа ценовых движений биткоина 
            в контексте астрономических событий, прежде всего – фаз Луны, а также важных экономических событий.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Основные функции</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
            <li>Интерактивный график цены биткоина с наложением лунных фаз</li>
            <li>Календарь предстоящих экономических и астрономических событий</li>
            <li>Данные о корреляции между фазами Луны и движениями цены биткоина</li>
            <li>Прогнозирование потенциальных ценовых движений на основе исторических паттернов</li>
            <li>Возможность переключения между различными временными интервалами</li>
            <li>Поддержка светлой и тёмной темы для комфортного использования в любое время суток</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Технологический стек</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">Клиентская часть</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>React.js</li>
                <li>Tailwind CSS</li>
                <li>Lightweight Charts для графиков</li>
                <li>React Router для навигации</li>
                <li>Day.js для работы с датами</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">Серверная часть</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Node.js</li>
                <li>Express.js</li>
                <li>Интеграция с API CoinGecko для данных о биткоине</li>
                <li>Интеграция с астрономическими API для данных о лунных фазах</li>
                <li>Система кэширования для оптимизации запросов</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Дисклеймер</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300">
              Данный проект создан исключительно в образовательных и исследовательских целях. 
              Информация, представленная на платформе, не является финансовой консультацией и не должна 
              использоваться как основание для принятия инвестиционных решений. Торговля криптовалютой 
              сопряжена с высокими рисками. Всегда проводите собственное исследование перед совершением 
              каких-либо финансовых операций.
            </p>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Контакты и поддержка</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Если у вас есть вопросы, предложения или вы хотите сообщить о проблеме, пожалуйста, 
            свяжитесь с нами через GitHub репозиторий проекта.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>GitHub:</strong>{' '}
            <a 
              href="https://github.com/yourusername/bitcoin-moon" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              github.com/yourusername/bitcoin-moon
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default About; 