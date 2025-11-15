import { useState, useEffect } from 'react'
import { uploadAPI } from '../services/api'

function UploadResume() {
  // Resume upload state
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeSuccess, setResumeSuccess] = useState('')
  const [resumeError, setResumeError] = useState('')

  // Document upload state
  const [documentFile, setDocumentFile] = useState(null)
  const [documentType, setDocumentType] = useState('certificate')
  const [documentUploading, setDocumentUploading] = useState(false)
  const [documentSuccess, setDocumentSuccess] = useState('')
  const [documentError, setDocumentError] = useState('')

  // Documents list state
  const [documents, setDocuments] = useState([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoadingDocuments(true)
    try {
      const response = await uploadAPI.getDocuments()
      setDocuments(response.data.documents)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Validate file type for resume (only DOCX)
  const validateResumeFile = (file) => {
    const allowedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    
    if (file.type !== allowedType && fileExtension !== '.docx') {
      return 'Only DOCX (Word Document) files are allowed for resumes'
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB'
    }
    
    return null
  }

  // Validate file type for document
  const validateDocumentFile = (file) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const allowedExtensions = ['.pdf', '.docx']
    
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return 'Only PDF and DOCX files are allowed'
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB'
    }
    
    return null
  }

  // Handle resume file selection
  const handleResumeFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const error = validateResumeFile(file)
      if (error) {
        setResumeError(error)
        setResumeFile(null)
      } else {
        setResumeFile(file)
        setResumeError('')
        setResumeSuccess('')
      }
    }
  }

  // Handle resume upload
  const handleResumeUpload = async (e) => {
    e.preventDefault()
    
    if (!resumeFile) {
      setResumeError('Please select a file to upload')
      return
    }

    setResumeUploading(true)
    setResumeError('')
    setResumeSuccess('')

    try {
      const response = await uploadAPI.uploadResume(resumeFile)
      setResumeSuccess(`Resume uploaded successfully: ${response.data.file.originalName}`)
      setResumeFile(null)
      // Reset file input
      document.getElementById('resume-input').value = ''
    } catch (error) {
      setResumeError(error.response?.data?.message || 'Failed to upload resume')
    } finally {
      setResumeUploading(false)
    }
  }

  // Handle document file selection
  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const error = validateDocumentFile(file)
      if (error) {
        setDocumentError(error)
        setDocumentFile(null)
      } else {
        setDocumentFile(file)
        setDocumentError('')
        setDocumentSuccess('')
      }
    }
  }

  // Handle document upload
  const handleDocumentUpload = async (e) => {
    e.preventDefault()
    
    if (!documentFile) {
      setDocumentError('Please select a file to upload')
      return
    }

    setDocumentUploading(true)
    setDocumentError('')
    setDocumentSuccess('')

    try {
      const response = await uploadAPI.uploadDocument(documentFile, documentType)
      setDocumentSuccess(`Document uploaded successfully: ${response.data.document.originalName}`)
      setDocumentFile(null)
      setDocumentType('certificate')
      // Reset file input
      document.getElementById('document-input').value = ''
      // Refresh documents list
      fetchDocuments()
    } catch (error) {
      setDocumentError(error.response?.data?.message || 'Failed to upload document')
    } finally {
      setDocumentUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Upload Files</h1>

      {/* Resume Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Upload Resume</h2>
        <p className="text-gray-600 mb-4">
          Upload your resume in DOCX (Word Document) format. This will be used as the base for tailored applications.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Only .docx files are accepted. The system will edit your resume directly to save space.
          </p>
        </div>

        <form onSubmit={handleResumeUpload}>
          <div className="mb-4">
            <label htmlFor="resume-input" className="block text-sm font-medium text-gray-700 mb-2">
              Select Resume File
            </label>
            <input
              id="resume-input"
              type="file"
              accept=".docx"
              onChange={handleResumeFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
            {resumeFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {resumeError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{resumeError}</p>
            </div>
          )}

          {resumeSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{resumeSuccess}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!resumeFile || resumeUploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
              disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {resumeUploading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>
      </div>

      {/* Document Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Upload Documents</h2>
        <p className="text-gray-600 mb-4">
          Upload certificates, cover letters, or other supporting documents.
        </p>

        <form onSubmit={handleDocumentUpload}>
          <div className="mb-4">
            <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              id="document-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="certificate">Certificate</option>
              <option value="cover-letter">Cover Letter</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="document-input" className="block text-sm font-medium text-gray-700 mb-2">
              Select Document File
            </label>
            <input
              id="document-input"
              type="file"
              accept=".pdf,.docx"
              onChange={handleDocumentFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100
                cursor-pointer"
            />
            {documentFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {documentFile.name} ({(documentFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {documentError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{documentError}</p>
            </div>
          )}

          {documentSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{documentSuccess}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!documentFile || documentUploading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 
              disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {documentUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
        
        {loadingDocuments ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        bg-blue-100 text-blue-800">
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadResume