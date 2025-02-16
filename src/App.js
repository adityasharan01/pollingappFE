import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5001/api/polls';

const App = () => {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch polls on component mount and refresh every 5 seconds
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        setPolls(data.polls);
        console.log(data.polls)
        setError(null);
      } catch (err) {
        setError('Failed to fetch polls');
        console.error('Error fetching polls:', err);
      }
    };

    fetchPolls();
    const interval = setInterval(fetchPolls, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleQuestionChange = (e) => {
    setNewPoll(prev => ({
      ...prev,
      question: e.target.value
    }));
  };

  const handleOptionChange = (index, value) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const addOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const createPoll = async () => {
    if (!newPoll.question || newPoll.options.some(opt => !opt)) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newPoll.question,
          options: newPoll.options
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const createdPoll = await response.json();
      setPolls(prev => [createdPoll, ...prev]);
      setNewPoll({
        question: '',
        options: ['', '']
      });
      setError(null);
    } catch (err) {
      setError('Failed to create poll');
      console.error('Error creating poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (pollId, optionIndex) => {
    console.log(pollId)
    try {
      const response = await fetch(`${API_BASE_URL}/${pollId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId,
          optionIndex
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const updatedPoll = await response.json();

      console.log(updatedPoll)
      setPolls(prev => prev.map(poll =>
        poll?._id === updatedPoll?._id ? updatedPoll : poll
      ));
      setError(null);
    } catch (err) {
      setError('Failed to vote');
      console.error('Error voting:', err);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Create New Poll</h2>
        <input
          type="text"
          value={newPoll.question}
          onChange={handleQuestionChange}
          placeholder="Enter your question"
          className="w-full p-2 mb-4 border rounded"
          disabled={loading}
        />

        {newPoll.options.map((option, index) => (
          <input
            key={index}
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="w-full p-2 mb-2 border rounded"
            disabled={loading}
          />
        ))}

        <div className="flex gap-2">
          <button
            onClick={addOption}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Add Option
          </button>
          <button
            onClick={createPoll}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {polls.map(poll => (
          
          <div key={poll._id} className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-bold mb-4">{poll.question}</h3>
            <div className="space-y-2">
              {poll.options.map((option, index) => (
                <div key={index} className="relative">
                  <button
                    onClick={() => vote(poll?._id, index)}
                    className="w-full p-2 text-left border rounded hover:bg-gray-50 relative z-10"
                  >
                    <span>{option.text}</span>
                  </button>
                  {poll.totalVotes > 0 && (
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-100 z-0"
                      style={{
                        width: `${(option.votes / poll.totalVotes) * 100}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  )}
                  <span className="absolute right-2 top-2 z-10">
                    {poll.totalVotes > 0
                      ? `${((option.votes / poll.totalVotes) * 100).toFixed(1)}%`
                      : '0%'}
                    ({option.votes} votes)
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Total votes: {poll.totalVotes} | Created: {new Date(poll.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;