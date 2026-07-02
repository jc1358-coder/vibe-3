import { useState } from 'react';
import { SchedulePage } from '../features/schedules/SchedulePage';
import { NewsPage } from '../features/news/NewsPage';

type View = 'schedule' | 'news';

export function App() {
  const [view, setView] = useState<View>('news');

  return (
    <>
      <header className="app-nav">
        <button className={view === 'news' ? 'active' : ''} onClick={() => setView('news')} type="button">
          News
        </button>
        <button className={view === 'schedule' ? 'active' : ''} onClick={() => setView('schedule')} type="button">
          Schedule
        </button>
      </header>
      {view === 'news' ? <NewsPage /> : <SchedulePage />}
    </>
  );
}
