import { useState } from 'react';
import api from '../services/api';

export default function LinkedInScraper() {
  const [jobUrl, setJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');

  const handleScrape = async (e) => {
    e.preventDefault();
    setError('');
    setJobData(null);
    setPdfUrl('');

    if (!jobUrl.trim()) {
      setError('Please enter a LinkedIn job URL');
      return;
    }

    if (!jobUrl.toLowerCase().includes('linkedin.com')) {
      setError('Please enter a valid LinkedIn job URL');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/job/scrape-linkedin', { jobUrl });
      setJobData(response.data.jobData);
      setPdfUrl(response.data.pdfUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scrape LinkedIn job');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      window.open(`http://localhost:5000${pdfUrl}`, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">LinkedIn Job Scraper</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          <strong>Note:</strong> LinkedIn jobs cannot be auto-applied. This tool will scrape the job details 
          and generate a PDF report with skill analysis to help you prepare your application.
        </p>
      </div>

      <form onSubmit={handleScrape} className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            LinkedIn Job URL
          </label>
          <input
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://www.linkedin.com/jobs/view/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Scraping Job...' : 'Scrape Job & Generate Report'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {jobData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{jobData.title}</h2>
            <p className="text-lg text-gray-600">{jobData.company}</p>
            {jobData.location && (
              <p className="text-sm text-gray-500">{jobData.location}</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Job Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{jobData.description}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {jobData.requiredSkills && jobData.requiredSkills.length > 0 ? (
                jobData.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No specific skills extracted</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Skills You're Missing</h3>
            <div className="flex flex-wrap gap-2">
              {jobData.missingSkills && jobData.missingSkills.length > 0 ? (
                jobData.missingSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-green-600 font-medium">
                  ✓ You have all the required skills!
                </p>
              )}
            </div>
          </div>

          {pdfUrl && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleDownloadPDF}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
