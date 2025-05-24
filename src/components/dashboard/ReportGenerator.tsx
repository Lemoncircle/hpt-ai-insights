'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

interface ReportGeneratorProps {
  onReportGenerated: () => void;
}

interface SurveyData {
  [key: string]: string;
}

export default function ReportGenerator({ onReportGenerated }: ReportGeneratorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setError(null);
    setUploadedFile(file);
    setIsUploading(true);

    try {
      const data = await readFileData(file);
      // Store the data in Firestore
      await storeSurveyData(data);
      setUploadedFile(file);
    } catch (err) {
      setError('Error processing file. Please try again.');
      console.error('Error processing file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const readFileData = (file: File): Promise<SurveyData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as SurveyData[];
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Error reading file'));
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const storeSurveyData = async (data: SurveyData[]) => {
    try {
      const batch = data.map(item => ({
        answers: item,
        createdAt: new Date(),
        importedFrom: uploadedFile?.name || 'Unknown source'
      }));

      // Store each response in Firestore
      for (const item of batch) {
        await addDoc(collection(db, 'survey_responses'), item);
      }
    } catch (err) {
      console.error('Error storing survey data:', err);
      throw err;
    }
  };

  const generateAIReport = async () => {
    if (!uploadedFile) return;

    setIsGenerating(true);
    setError(null);

    try {
      // TODO: Implement AI report generation
      // This is a placeholder for the AI analysis
      const mockReport = `Based on the analysis of ${uploadedFile.name}, here are the key insights:

1. Overall Satisfaction: The majority of respondents (75%) reported high satisfaction with their roles.
2. Work-Life Balance: 60% of employees feel they have a good work-life balance.
3. Professional Growth: 70% of respondents feel supported in their professional development.
4. Team Communication: Communication effectiveness is rated as "Good" by 65% of the team.

Recommendations:
- Consider implementing more flexible work arrangements
- Strengthen the mentorship program
- Regular team-building activities
- Quarterly feedback sessions`;

      setReport(mockReport);
      onReportGenerated();
    } catch (err) {
      setError('Error generating report. Please try again.');
      console.error('Error generating report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate AI Report</h2>
      
      {/* File Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Survey Results
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isUploading || isGenerating}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              Excel (.xlsx, .xls) or CSV files only
            </p>
          </div>
        </div>
        {uploadedFile && (
          <p className="mt-2 text-sm text-gray-600">
            Uploaded: {uploadedFile.name}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Generate Report Button */}
      <button
        onClick={generateAIReport}
        disabled={!uploadedFile || isUploading || isGenerating}
        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${!uploadedFile || isUploading || isGenerating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            Generating Report...
          </>
        ) : (
          'Generate AI Report'
        )}
      </button>

      {/* Report Display */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-3">AI Analysis Report</h3>
          <div className="prose prose-sm max-w-none">
            {report.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-gray-600 mb-2">
                {paragraph}
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
} 