import React, { useState, useEffect } from 'react';
import './UnifiedEmotionEntry.css';

const moodOptions = [
  { label: 'Peaceful 😌', emoji: '😌' },
  { label: 'Sad 😭', emoji: '😭' },
  { label: 'Angry 😤', emoji: '😤' },
  { label: 'Joyful 😄', emoji: '😄' },
  { label: 'Anxious 😬', emoji: '😬' },
];

const LOCAL_STORAGE_KEY = 'mishby.emotions.entries';

const UnifiedEmotionEntry = () => {
  const [emotion, setEmotion] = useState('');
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [entries, setEntries] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const savedEntries = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (savedEntries) {
      setEntries(savedEntries);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const tagList = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const newEntry = {
      emotion: emotion.trim(),
      note: note.trim(),
      mood,
      tags: tagList,
      timestamp: new Date().toLocaleString()
    };

    setEntries([newEntry, ...entries]);
    setEmotion('');
    setNote('');
    setMood('');
    setTags('');
    setSubmitted(true);
  };

  return (
    <div className="emotion-entry-container">
      <h2>Reflect & Release</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Your emotion right now:
          <input
            type="text"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            placeholder="e.g. peaceful, anxious, glowing..."
            required
          />
        </label>

        <label>
          Pick a mood emoji:
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            required
          >
            <option value="">-- select mood --</option>
            {moodOptions.map((option, index) => (
              <option key={index} value={option.emoji}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Would you like to say more?
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write freely, without judgment..."
          />
        </label>

        <label>
          Add emotion tags (comma-separated):
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. #grateful, #burnout, #sunlight"
          />
        </label>

        <button type="submit">Save Entry</button>

        {submitted && (
          <p className="confirmation">🌿 Your emotion has been gently saved.</p>
        )}
      </form>

      <div className="entry-log">
        <h3>🪷 Emotional Reflections</h3>
        {entries.length === 0 && <p>No entries yet — Mishby is listening.</p>}
        {entries.map((entry, index) => (
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
    </div>
  );
};

export default UnifiedEmotionEntry;
