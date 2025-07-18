import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

const LOCAL_STORAGE_KEY = 'mishby.emotions.entries';

const MoodCalendar = () => {
  const savedEntries = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];

  const moodMap = {};
  savedEntries.forEach((entry) => {
    const date = format(new Date(entry.timestamp), 'yyyy-MM-dd');
    moodMap[date] = entry.mood;
  });

  const today = new Date();
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  return (
    <div className="calendar-container">
      <h3>🗓️ Mood Calendar</h3>
      <div className="calendar-grid">
        {daysInMonth.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const mood = moodMap[dateKey] || '▫️';
          return (
            <div key={dateKey} className="calendar-cell">
              <div>{format(day, 'd')}</div>
              <div>{mood}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoodCalendar;
