import React, { useState, useEffect } from 'react';
import MechanicLayout from './MechanicLayout';

function MechanicActiveJobs() {
  const [activeJobs, setActiveJobs] = useState([
    {
      id: 1,
      customer: 'Jane Smith',
      vehicle: 'Honda Civic 2019',
      plateNumber: 'XYZ 5678',
      service: 'Brake Inspection',
      startTime: '11:00 AM',
      estimatedDuration: 60, // minutes
      elapsedTime: 25, // minutes
      bay: '3',
      status: 'In Progress',
      notes: 'Customer mentioned squeaking noise when braking',
      parts: ['Brake Pads', 'Brake Fluid'],
      checklistItems: [
        { task: 'Visual inspection', completed: true },
        { task: 'Measure brake pad thickness', completed: true },
        { task: 'Check brake fluid level', completed: false },
        { task: 'Test brake performance', completed: false }
      ]
    }
  ]);

  const [selectedJob, setSelectedJob] = useState(null);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveJobs(jobs =>
        jobs.map(job => ({
          ...job,
          elapsedTime: job.elapsedTime + 1
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressPercentage = (elapsed, estimated) => {
    return Math.min((elapsed / estimated) * 100, 100);
  };

  const handleCompleteTask = (jobId, taskIndex) => {
    setActiveJobs(jobs =>
      jobs.map(job =>
        job.id === jobId
          ? {
              ...job,
              checklistItems: job.checklistItems.map((item, index) =>
                index === taskIndex ? { ...item, completed: !item.completed } : item
              )
            }
          : job
      )
    );
  };

  const handleCompleteJob = (jobId) => {
    if (window.confirm('Are you sure you want to mark this job as completed?')) {
      setActiveJobs(jobs => jobs.filter(job => job.id !== jobId));
      setSelectedJob(null);
      alert('Job completed successfully!');
    }
  };

  const handlePauseJob = (jobId) => {
    alert('Job paused. Timer stopped.');
  };

  return (
    <MechanicLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/50 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Active Jobs</h1>
          <p className="text-slate-300">Jobs currently in progress</p>
        </div>

        {activeJobs.length === 0 ? (
          /* No Active Jobs */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Active Jobs</h3>
            <p className="text-gray-600">You don't have any jobs in progress at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Jobs List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Current Jobs ({activeJobs.length})</h2>
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                        selectedJob?.id === job.id
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">{job.customer}</h3>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                          In Progress
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-600">{job.vehicle}</p>
                        <p className="text-sm text-gray-600">{job.service}</p>
                        <p className="text-xs text-gray-500">Bay {job.bay}</p>
                      </div>
                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(getProgressPercentage(job.elapsedTime, job.estimatedDuration))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(job.elapsedTime, job.estimatedDuration)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Elapsed: {formatTime(job.elapsedTime)}</span>
                        <span>Est: {formatTime(job.estimatedDuration)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="lg:col-span-2">
              {selectedJob ? (
                <div className="space-y-6">
                  {/* Job Info Card */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.customer}</h2>
                        <div className="space-y-1">
                          <p className="text-gray-700">{selectedJob.vehicle}</p>
                          <p className="text-sm text-gray-600">Plate: {selectedJob.plateNumber}</p>
                          <p className="text-sm text-gray-600">Bay {selectedJob.bay}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border-2 border-blue-200 mb-2">
                          In Progress
                        </span>
                        <p className="text-sm text-gray-600">Started: {selectedJob.startTime}</p>
                      </div>
                    </div>

                    {/* Timer Display */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 mb-2">Time Elapsed</p>
                        <p className="text-5xl font-bold text-blue-600">{formatTime(selectedJob.elapsedTime)}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          Est. Total: {formatTime(selectedJob.estimatedDuration)}
                        </p>
                      </div>
                      <div className="w-full bg-white rounded-full h-3 mb-2">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{
                            width: `${getProgressPercentage(selectedJob.elapsedTime, selectedJob.estimatedDuration)}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-center text-sm text-gray-600">
                        {Math.round(getProgressPercentage(selectedJob.elapsedTime, selectedJob.estimatedDuration))}% Complete
                      </p>
                    </div>

                    {/* Service & Notes */}
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-900 mb-3">Service Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-semibold text-gray-900 mb-2">{selectedJob.service}</p>
                        {selectedJob.notes && (
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Notes:</span> {selectedJob.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Required Parts */}
                    {selectedJob.parts && selectedJob.parts.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-3">Required Parts</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.parts.map((part, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium"
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Checklist Card */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Task Checklist</h3>
                    <div className="space-y-3">
                      {selectedJob.checklistItems.map((item, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleCompleteTask(selectedJob.id, index)}
                            className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                          />
                          <span
                            className={`flex-1 ${
                              item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}
                          >
                            {item.task}
                          </span>
                          {item.completed && (
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleCompleteJob(selectedJob.id)}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Complete Job
                      </button>
                      <button
                        onClick={() => handlePauseJob(selectedJob.id)}
                        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pause
                      </button>
                      <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-colors">
                        Report Issue
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-gray-600">Select a job to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MechanicLayout>
  );
}

export default MechanicActiveJobs;