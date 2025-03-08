'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface UpdateSchedulerProps {
  onUpdate?: () => void;
}

const UpdateScheduler: React.FC<UpdateSchedulerProps> = ({ onUpdate }) => {
  const [lastUpdate, setLastUpdate] = useState<string>('Never');
  const [nextUpdate, setNextUpdate] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  // Calculate time until next update (24 hours from now or from last update)
  useEffect(() => {
    const calculateNextUpdate = () => {
      const now = new Date();
      // Set next update to be 24 hours from now
      const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setNextUpdate(next.toLocaleString());
      
      // Calculate countdown in seconds
      const timeUntilUpdate = Math.floor((next.getTime() - now.getTime()) / 1000);
      setCountdown(timeUntilUpdate);
    };

    calculateNextUpdate();
    
    // Update countdown every second
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // When countdown reaches zero, trigger update
          triggerUpdate();
          calculateNextUpdate();
          return 24 * 60 * 60; // Reset to 24 hours
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format countdown as HH:MM:SS
  const formatCountdown = () => {
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Trigger update manually or automatically
  const triggerUpdate = async () => {
    try {
      setStatus('updating');
      setMessage('Checking for updates...');
      
      // Call the update API
      const response = await axios.get('/api/update');
      
      // Update last update time
      const now = new Date();
      setLastUpdate(now.toLocaleString());
      
      // Set success message
      setStatus('success');
      setMessage(response.data.message || 'Update completed successfully');
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error updating AI model data:', error);
      setStatus('error');
      setMessage('Failed to update AI model data. Please try again later.');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
      <h2 className="text-xl font-bold mb-2">Data Update Scheduler</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Last Update</p>
          <p className="font-medium">{lastUpdate}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Next Update</p>
          <p className="font-medium">{nextUpdate}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Time Until Next Update</p>
        <p className="font-medium text-lg">{formatCountdown()}</p>
      </div>
      
      {status !== 'idle' && (
        <div className={`mb-4 p-2 rounded ${
          status === 'updating' ? 'bg-blue-100 text-blue-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          <p>{message}</p>
        </div>
      )}
      
      <button
        onClick={triggerUpdate}
        disabled={status === 'updating'}
        className={`w-full py-2 px-4 rounded-md ${
          status === 'updating'
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {status === 'updating' ? 'Updating...' : 'Update Now'}
      </button>
      
      <p className="mt-2 text-xs text-gray-500">
        The visualization automatically updates once every 24 hours to include the latest AI model information.
        You can also manually trigger an update using the button above.
      </p>
    </div>
  );
};

export default UpdateScheduler;
