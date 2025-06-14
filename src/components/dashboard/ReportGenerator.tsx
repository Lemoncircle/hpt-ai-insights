'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { FeedbackReport } from '@/lib/types/feedback';

interface ReportGeneratorProps {
  onReportGenerated: (report: FeedbackReport) => void;
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
      console.log('Starting file processing for:', file.name);
      const data = await readFileData(file);
      console.log('File data read successfully:', data);
      
      // Validate data structure
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid file format: No data found or incorrect structure');
      }
      
      console.log('Storing survey data...');
      await storeSurveyData(data);
      console.log('Survey data stored successfully');
      
      setUploadedFile(file);
    } catch (err) {
      console.error('Detailed error processing file:', {
        error: err,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      setError(err instanceof Error ? err.message : 'Error processing file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const readFileData = (file: File): Promise<SurveyData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log('FileReader onload triggered');
          const data = e.target?.result;
          if (!data) {
            throw new Error('No data read from file');
          }
          
          console.log('Reading workbook...');
          const workbook = XLSX.read(data, { type: 'binary' });
          console.log('Workbook sheets:', workbook.SheetNames);
          
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            throw new Error('No sheets found in the workbook');
          }
          
          const worksheet = workbook.Sheets[sheetName];
          console.log('Converting sheet to JSON...');
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as SurveyData[];
          
          if (!jsonData || jsonData.length === 0) {
            throw new Error('No data found in the sheet');
          }
          
          console.log('Successfully converted to JSON:', jsonData.length, 'rows');
          resolve(jsonData);
        } catch (err) {
          console.error('Error in readFileData:', err);
          reject(err);
        }
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Error reading file: ' + error));
      };
      
      console.log('Starting file read...');
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const storeSurveyData = async (data: SurveyData[]) => {
    try {
      console.log('Preparing to store', data.length, 'survey responses');
      const batch = data.map(item => {
        // Validate required fields
        if (!item || typeof item !== 'object') {
          throw new Error('Invalid data format: Each row must be an object');
        }
        
        return {
          answers: item,
          createdAt: new Date(),
          importedFrom: uploadedFile?.name || 'Unknown source'
        };
      });

      console.log('Storing responses in Firestore...');
      // Store each response in Firestore
      for (const item of batch) {
        await addDoc(collection(db, 'survey_responses'), item);
      }
      console.log('Successfully stored all responses');
    } catch (err) {
      console.error('Error storing survey data:', err);
      throw new Error('Failed to store survey data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const generateAIReport = async () => {
    if (!uploadedFile) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Read and format the uploaded file data for the AI prompt
      const data = await readFileData(uploadedFile);
      // Format the data as a readable string for the AI
      const reportDataForAI = data.map((row, idx) => {
        return `Response #${idx + 1}:\n` +
          Object.entries(row).map(([key, value]) => `  ${key}: ${value}`).join('\n');
      }).join('\n\n');

      // Prepare the prompt for the AI
      const prompt = `
Background:
Purpose:
To build a culture of trust, our organisation has implemented a structured, values-based peer feedback process. It's designed to ensure our people:
- Are clear on what's expected of them, both internally and externally
- Develop self-awareness through constructive trends-based feedback
- Embed values into daily behaviours that directly support stakeholder outcomes

Stakeholder Expectations:
People We Help: Pets go home safely and in good condition; clear communication; timely updates; ability to rely on us despite limited proof
Supporters: Appreciate transparency and proof of impact; want donations used responsibly
Referrers: Clear, timely comms (within 12 hrs); regular updates; smooth logistics; ability to rely on us
Theme across all stakeholders: TRUST — in our care, consistency, communication, and collaboration.

Our Team Values (with Behavioural Definitions):
Collaboration: Engage the right people, share calendars/info, create space for team thinking, contribute to visibility
Respect: Consider others' time and needs; balance work demands respectfully
Transparency: Provide timely, direct feedback; share info that affects work; avoid withholding relevant context
Communication: Be open about challenges and day-to-day experience; ensure consistent external updates

How the Feedback Process Works:
- Every two months, all team members complete an anonymous peer feedback survey, scoring themselves and each other against each value.
- Ratings focus on observed behaviours, not personality.
- Feedback is aggregated and modelled to identify trends — outliers are excluded.
- Each individual receives constructive summaries, highlighting:
  - Strengths across values
  - Opportunities for growth
  - How these behaviours align with stakeholder expectations

Strategic Value of the Process:
This approach connects internal culture with external performance:
Transparency: Timely comms and issue resolution that protect trust with referrers and clients and ensure efficient delivery of tasks with all required context
Respect: Ensures colleagues and stakeholders feel heard and supported
Collaboration: Drives joined-up care that ensures pets go home ready and safe
Communication: Delivers impact stories to donors and updates to clients without gaps

Rules for Qualitative Feedback:
1. Look for Thematic Consistency: If multiple peers mention similar behaviours or gaps, it becomes a trend.
2. Extract Quotes for Colour: Where appropriate, include anonymised excerpts.
3. Filter by Value: Group qualitative comments under value headers (Collaboration, Transparency, etc.) to match them with quantitative scores.
4. Ignore One-Off Comments: If something is only mentioned once, treat with caution unless egregious.

---

Given the following survey data for an employee, generate a report in the following format:

Name: [Employee name]
Top Value Observed: [Team Value]
Area for Growth: [Team Value]

Value         Average Rating (out of 5)
---------------------------------------
Collaboration   [Score]
Communication   [Score]
Respect         [Score]
Transparency    [Score]

Summary:
[Summary based on feedback received]

Suggested Behavioural Shift:
[Suggested behavioural shifts based on the feedback received]

Survey Data:
${reportDataForAI}

Please follow the template and rules strictly. Output only the report, no extra commentary.`;

      // Call the new API endpoint to generate the report
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json();
      if (result.report) {
        setReport(result.report);
      } else {
        setError(result.error || 'Failed to generate report.');
      }
      onReportGenerated({
        id: `report-${Date.now()}`,
        userId: 'placeholder-user-id',
        surveyId: 'placeholder-survey-id',
        generatedAt: new Date(),
        valueScores: {
          Collaboration: {
            averageScore: 0,
            trend: 'stable',
            strengths: [],
            opportunities: [],
            supportingQuotes: []
          },
          Respect: {
            averageScore: 0,
            trend: 'stable',
            strengths: [],
            opportunities: [],
            supportingQuotes: []
          },
          Transparency: {
            averageScore: 0,
            trend: 'stable',
            strengths: [],
            opportunities: [],
            supportingQuotes: []
          },
          Communication: {
            averageScore: 0,
            trend: 'stable',
            strengths: [],
            opportunities: [],
            supportingQuotes: []
          }
        },
        stakeholderAlignment: {
          PeopleWeHelp: {
            alignment: 0,
            supportingEvidence: []
          },
          Supporters: {
            alignment: 0,
            supportingEvidence: []
          },
          Referrers: {
            alignment: 0,
            supportingEvidence: []
          }
        },
        overallTrends: {
          strengths: [],
          opportunities: [],
          actionItems: []
        }
      });
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