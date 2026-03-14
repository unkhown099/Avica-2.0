import React, { useState, useEffect } from "react";
import MechanicLayout from "./MechanicLayout";

function MechanicActiveJobs() {
  const [activeJobs, setActiveJobs] = useState([
    {
      id: 1,
      customer: "Jane Smith",
      vehicle: "Honda Civic 2019",
      plateNumber: "XYZ 5678",
      service: "Brake Inspection",
      startTime: "11:00 AM",
      estimatedDuration: 60, // minutes
      elapsedTime: 25, // minutes
      bay: "3",
      status: "In Progress",
      notes: "Customer mentioned squeaking noise when braking",
      parts: ["Brake Pads", "Brake Fluid"],
      checklistItems: [
        { task: "Visual inspection", completed: true },
        { task: "Measure brake pad thickness", completed: true },
        { task: "Check brake fluid level", completed: false },
        { task: "Test brake performance", completed: false },
      ],
    },
  ]);

  const [selectedJob, setSelectedJob] = useState(null);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveJobs((jobs) =>
        jobs.map((job) => ({
          ...job,
          elapsedTime: job.elapsedTime + 1,
        })),
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
    setActiveJobs((jobs) =>
      jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              checklistItems: job.checklistItems.map((item, index) =>
                index === taskIndex
                  ? { ...item, completed: !item.completed }
                  : item,
              ),
            }
          : job,
      ),
    );
  };

  const handleCompleteJob = (jobId) => {
    if (
      window.confirm("Are you sure you want to mark this job as completed?")
    ) {
      setActiveJobs((jobs) => jobs.filter((job) => job.id !== jobId));
      setSelectedJob(null);
      alert("Job completed successfully!");
    }
  };

  const handlePauseJob = (jobId) => {
    alert("Job paused. Timer stopped.");
  };

  return (
    <MechanicLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Active Jobs
          </h1>
          <p className="text-gray-400 mt-1">Jobs currently in progress</p>
        </div>

        {activeJobs.length === 0 ? (
          /* No Active Jobs */
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-12 text-center backdrop-blur-sm">
            <svg
              className="w-20 h-20 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Active Jobs
            </h3>
            <p className="text-gray-400">
              You don't have any jobs in progress at the moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Jobs List */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white mb-4">
                  Current Jobs ({activeJobs.length})
                </h2>
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`w-full text-left border rounded-xl p-4 transition-all ${
                        selectedJob?.id === job.id
                          ? "border-red-500/50 bg-red-500/10"
                          : "border-white/5 hover:border-red-500/20 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-white">{job.customer}</h3>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          In Progress
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-400">{job.vehicle}</p>
                        <p className="text-sm text-gray-400">{job.service}</p>
                        <p className="text-xs text-gray-500">Bay {job.bay}</p>
                      </div>
                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>
                            {Math.round(
                              getProgressPercentage(
                                job.elapsedTime,
                                job.estimatedDuration,
                              ),
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${getProgressPercentage(job.elapsedTime, job.estimatedDuration)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
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
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-white mb-2">
                          {selectedJob.customer}
                        </h2>
                        <div className="space-y-1">
                          <p className="text-gray-300">{selectedJob.vehicle}</p>
                          <p className="text-sm text-gray-500">
                            Plate: {selectedJob.plateNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            Bay {selectedJob.bay}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-2">
                          In Progress
                        </span>
                        <p className="text-sm text-gray-500">
                          Started: {selectedJob.startTime}
                        </p>
                      </div>
                    </div>

                    {/* Timer Display */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Time Elapsed
                        </p>
                        <p className="text-5xl font-black text-blue-400">
                          {formatTime(selectedJob.elapsedTime)}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Est. Total:{" "}
                          {formatTime(selectedJob.estimatedDuration)}
                        </p>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{
                            width: `${getProgressPercentage(selectedJob.elapsedTime, selectedJob.estimatedDuration)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-center text-sm text-gray-500">
                        {Math.round(
                          getProgressPercentage(
                            selectedJob.elapsedTime,
                            selectedJob.estimatedDuration,
                          ),
                        )}
                        % Complete
                      </p>
                    </div>

                    {/* Service & Notes */}
                    <div className="mb-6">
                      <h3 className="font-bold text-white mb-3">
                        Service Details
                      </h3>
                      <div className="bg-white/5 border border-white/5 rounded-lg p-4">
                        <p className="font-semibold text-white mb-2">
                          {selectedJob.service}
                        </p>
                        {selectedJob.notes && (
                          <p className="text-sm text-gray-400">
                            <span className="font-semibold text-gray-300">
                              Notes:
                            </span>{" "}
                            {selectedJob.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Required Parts */}
                    {selectedJob.parts && selectedJob.parts.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-white mb-3">
                          Required Parts
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.parts.map((part, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium"
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Checklist Card */}
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="font-bold text-white mb-4">
                      Task Checklist
                    </h3>
                    <div className="space-y-3">
                      {selectedJob.checklistItems.map((item, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 p-3 border border-white/5 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() =>
                              handleCompleteTask(selectedJob.id, index)
                            }
                            className="w-5 h-5 bg-gray-800 border-gray-600 rounded text-red-500 focus:ring-red-500/30 focus:ring-offset-0"
                          />
                          <span
                            className={`flex-1 ${
                              item.completed
                                ? "line-through text-gray-500"
                                : "text-gray-300"
                            }`}
                          >
                            {item.task}
                          </span>
                          {item.completed && (
                            <svg
                              className="w-5 h-5 text-emerald-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => handleCompleteJob(selectedJob.id)}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Complete Job
                      </button>
                      <button
                        onClick={() => handlePauseJob(selectedJob.id)}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Pause
                      </button>
                      <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold transition-colors border border-white/5">
                        Report Issue
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-12 text-center backdrop-blur-sm">
                  <svg
                    className="w-16 h-16 text-gray-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                  <p className="text-gray-400">Select a job to view details</p>
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