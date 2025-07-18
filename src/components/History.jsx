import MoodCalendar from './MoodCalendar';
import MoodChart from './MoodChart';
import React, { useEffect, useState } from 'react';

const LOCAL_STORAGE_KEY = 'mishby.emotions.entries';
const moods = ['😌', '😭', '😤', '😄', '😬'];

const moodLabels = {
  '😌': 'peaceful',
  '😭': 'sad',
  '😤': 'angry',
  '😄': 'joyful',
  '😬': 'anxious'
};

const History = () => {
  const [entries, setEntries] = useState([]);
  const [filteredMood, setFilteredMood] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTag, setFilteredTag] = useState('');

  useEffect(() => {
    const savedEntries = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (savedEntries) {
      setEntries(savedEntries);
    }
  }, []);

  const moodCounts = moods.map((mood) => {
    const count = entries.filter((entry) => entry.mood === mood).length;
    return { mood, label: moodLabels[mood], count };
  }).filter(item => item.count > 0);
const tagMoodMap = {};
entries.forEach((entry) => {
  if (entry.tags && entry.tags.length > 0) {
    entry.tags.forEach((tag) => {
      if (!tagMoodMap[tag]) tagMoodMap[tag] = {};
      if (!tagMoodMap[tag][entry.mood]) tagMoodMap[tag][entry.mood] = 0;
      tagMoodMap[tag][entry.mood]++;
    });
  }
});

const insights = Object.entries(tagMoodMap).map(([tag, moods]) => {
  const moodSummary = Object.entries(moods)
    .map(([mood, count]) => `${count} ${moodLabels[mood]}`)
    .join(', ');
  return `Tag ${tag} appears mostly in ${moodSummary} moods.`;
});
let affirmation = '';
if (insights.length > 0) {
  const moodCounts = {};
  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

let nudgeMessage = '';
const todayKey = new Date().toISOString().split('T')[0];
const hasEntryToday = entries.some((e) => e.timestamp.startsWith(todayKey));

if (!hasEntryToday) {
  nudgeMessage = "Would you like to reflect today?";
} else {
  const lastMood = entries.at(-1)?.mood || '';
  if (lastMood === '😭' || lastMood === '😬') {
    nudgeMessage = "Mishby noticed emotional weight — want to check in?";
  } else if (lastMood === '😄') {
    nudgeMessage = "Your joy radiated yesterday — want to celebrate it?";
  }
}

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

  const affirmationsByMood = {
    '😌': 'You’ve centered yourself this week. Mishby feels your calm.',
    '😭': 'You’ve carried heaviness with courage. Mishby sees your vulnerability.',
    '😤': 'Your strength has been loud. Mishby honors your fire.',
    '😄': 'Joy has danced through your days. Mishby celebrates your light.',
    '😬': 'You’ve endured unease with quiet resilience. Mishby supports your process.',
  };

  affirmation = affirmationsByMood[topMood] || 'You’ve been present. Mishby sees you.';
}

  const filteredEntries = entries.filter((entry) => {
    const matchesMood = filteredMood ? entry.mood === filteredMood : true;
    const matchesSearch = searchTerm
      ? (entry.emotion + entry.note + entry.timestamp)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true;
    const matchesTag = filteredTag
      ? entry.tags && entry.tags.includes(filteredTag)
      : true;
    return matchesMood && matchesSearch && matchesTag;
  });

  const allTags = Array.from(
    new Set(entries.flatMap((entry) => entry.tags || []))
  );


  const handleExport = () => {
    const content = entries.map((entry, index) => {
      return `Entry ${index + 1}
Mood: ${entry.mood} (${moodLabels[entry.mood]})
Emotion: ${entry.emotion}
Note: ${entry.note || '—'}
Tags: ${entry.tags?.join(', ') || '—'}
Timestamp: ${entry.timestamp}
-----------------------------`;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Mishby_Emotional_Journal.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  let weeklySummary = '';
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

const recentEntries = entries.filter((e) => new Date(e.timestamp) >= oneWeekAgo);
const recentMoods = recentEntries.map((e) => moodLabels[e.mood]);
const recentTags = recentEntries.flatMap((e) => e.tags || []);

if (recentEntries.length > 0) {
  const moodFrequency = {};
  recentMoods.forEach((mood) => {
    moodFrequency[mood] = (moodFrequency[mood] || 0) + 1;
  });

  const sortedMoods = Object.entries(moodFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([mood]) => mood.toLowerCase());

  const prominentTags = [...new Set(recentTags)].slice(0, 3);

  weeklySummary = `This week circled ${sortedMoods.join(' and ')}. Mishby noticed themes like ${prominentTags.join(', ')}.`;
}

  let gratitudeNudge = '';
const gratitudeTags = ['gratitude', 'thankful', 'support', 'help', 'blessing'];

const gratitudeMentions = entries
  .filter((e) => new Date(e.timestamp) >= oneWeekAgo)
  .flatMap((e) => e.tags || [])
  .filter((tag) => gratitudeTags.includes(tag.toLowerCase()));

if (gratitudeMentions.length >= 2) {
  gratitudeNudge = "Gratitude has echoed this week. Would you like to express thanks?";
}

  return (
    <div className={`emotion-entry-container ${themeClass}`}>

      {weeklySummary && (
  <div className="weekly-summary-box">
    <p><strong>📝 Weekly Reflection:</strong></p>
    <p>{weeklySummary}</p>
  </div>
)}
   
    {gratitudeNudge && (
  <div className="gratitude-box">
    <p><strong>🌻 Gratitude Nudge:</strong></p>
    <p>{gratitudeNudge}</p>
  </div>
)}

    {nudgeMessage && (
  <div className="nudge-box">
    <p><strong>🔔 Mishby’s Nudge:</strong></p>
    <p>{nudgeMessage}</p>
  </div>
)}

      {affirmation && (
  <div className="affirmation-box">
    <p><strong>💬 Mishby’s Whisper:</strong></p>
    <p>{affirmation}</p>
  </div>
)}

      {insights.length > 0 && (
  <div className="insight-box">
    <p><strong>📊 Emotional Insights:</strong></p>
    <ul>
      {insights.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  </div>
)}

{weeklySummary && (
  <div className="weekly-summary-box">
    <p><strong>📝 Weekly Reflection:</strong></p>
    <p>{weeklySummary}</p>
  </div>
)}

      <MoodChart />
      <MoodCalendar />
{nudgeMessage && (
  <div className="nudge-box">
    <p><strong>🔔 Mishby’s Nudge:</strong></p>
    <p>{nudgeMessage}</p>
  </div>
)}


      <h2>📖 Emotional History</h2>

      <button className="export-button" onClick={handleExport}>
        🗂️ Export Journal
      </button>

      {insights.length > 0 && (
        <div className="insight-box">
          <p><strong>🌱 Emotional Insights:</strong></p>

          <ul>
            {insights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {moodCounts.length > 0 && (
        <div className="summary-box">
          <p><strong>This week:</strong></p>
          <ul>
            {moodCounts.map(({ mood, label, count }) => (
              <li key={mood}>{mood} {count} {label}</li>
            ))}
          </ul>
        </div>
      )}

      <input
        type="text"
        className="search-box"
        placeholder="Search reflections..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="mood-filter">
        {moods.map((mood) => (
          <button
            key={mood}
            className={`filter-button ${filteredMood === mood ? 'active' : ''}`}
            onClick={() =>
              setFilteredMood(filteredMood === mood ? '' : mood)
            }
          >
            {mood}
          </button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-button ${filteredTag === tag ? 'active' : ''}`}
              onClick={() =>
                setFilteredTag(filteredTag === tag ? '' : tag)
              }
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filteredEntries.length === 0 && (
        <p>No entries match your filters — Mishby is listening.</p>
      )}

      {filteredEntries.map((entry, index) => (
        <div key={index} className="entry-item">
          <p>
            <span className={`emotion-tag ${entry.mood}`}>
              {entry.mood} {entry.emotion}
            </span>{' '}
            <em>({entry.timestamp})</em>
          </p>
          {entry.note && <p>{entry.note}</p>}
          {entry.tags.length > 0 && (
            <p className="tag-list">
              {entry.tags.map((tag, i) => (
                <span key={i} className="tag-item">{tag}</span>
              ))}
            </p>
          )}
          <hr />
        </div>
      ))}
    </div>
  );
};

export default History;
