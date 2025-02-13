'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FileUploadProps {
  onUploadComplete: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const processCSV = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setSuccessCount(0);

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const totalRows = results.data.length;
          let processed = 0;

          for (const row of results.data as any[]) {
            try {
              // Convert CSV data to survey response format
              const surveyResponse = {
                userId: 'csv_import',
                userEmail: row.email || 'csv_import@example.com',
                answers: {
                  1: row.reason || '',
                  2: row.role || '',
                  3: row.familiarity?.toString() || '3',
                },
                submittedAt: new Date().toISOString(),
                createdAt: serverTimestamp(),
                importedFrom: 'csv',
              };

              await addDoc(collection(db, 'survey_responses'), surveyResponse);
              processed++;
              setSuccessCount(processed);
              setUploadProgress((processed / totalRows) * 100);
            } catch (err) {
              console.error('Error uploading row:', err);
            }
          }

          setIsUploading(false);
          onUploadComplete();
        },
        error: (error) => {
          setError('Failed to parse CSV file: ' + error.message);
          setIsUploading(false);
        }
      });
    } catch (err: any) {
      setError('Failed to read file: ' + err.message);
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      processCSV(file);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className="text-gray-600">
            {isDragActive ? (
              <p className="text-blue-500 font-medium">Drop the CSV file here</p>
            ) : (
              <>
                <p className="font-medium">Drag and drop your CSV file here</p>
                <p className="text-sm mt-2">or click to select a file</p>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${uploadProgress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Uploaded {successCount} responses...
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        {!isUploading && successCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-green-50 text-green-600 rounded-lg text-sm"
          >
            Successfully uploaded {successCount} survey responses!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 