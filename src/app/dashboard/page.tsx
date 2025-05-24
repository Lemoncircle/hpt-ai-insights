'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import ResponsChart from '@/components/survey/ResponsChart';
import ReportGenerator from '@/components/dashboard/ReportGenerator';
import { motion } from 'framer-motion';

interface SurveyResponse {
  id: string;
  answers: Record<string, string>;
  createdAt: {
    seconds: number;
  };
  userEmail: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);

  // Fetch survey responses
  const fetchResponses = async () => {
    try {
      const q = query(collection(db, 'survey_responses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedResponses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyResponse[];
      setResponses(fetchedResponses);
      
      // Calculate metrics
      calculateMetrics(fetchedResponses);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchResponses();
    }
  }, [user]);

  // Calculate metrics from responses
  const calculateMetrics = (responses: SurveyResponse[]) => {
    // Total responses
    const totalResponses = responses.length;
    
    // Satisfaction rate
    const satisfiedResponses = responses.filter(r => 
      r.answers[1]?.includes('satisfied') || r.answers[1]?.includes('Satisfied')
    ).length;
    const satisfactionRate = totalResponses > 0 
      ? Math.round((satisfiedResponses / totalResponses) * 100) 
      : 0;

    // Work-life balance
    const goodBalanceResponses = responses.filter(r =>
      r.answers[5]?.includes('Excellent') || r.answers[5]?.includes('Good')
    ).length;
    const workLifeBalanceRate = totalResponses > 0
      ? Math.round((goodBalanceResponses / totalResponses) * 100)
      : 0;

    // Professional growth support
    const supportedResponses = responses.filter(r =>
      r.answers[4]?.includes('strong support') || r.answers[4]?.includes('guidance')
    ).length;
    const growthSupportRate = totalResponses > 0
      ? Math.round((supportedResponses / totalResponses) * 100)
      : 0;

    setMetrics([
      {
        title: 'Total Responses',
        value: totalResponses,
        change: totalResponses === 0 ? 'No survey responses yet' : '',
        trend: 'neutral',
        description: 'Total number of survey responses received'
      },
      {
        title: 'Satisfaction Rate',
        value: `${satisfactionRate}%`,
        change: totalResponses === 0 ? 'No survey responses yet' : 
          satisfactionRate > 75 ? 'Good' : satisfactionRate > 50 ? 'Fair' : 'Needs Attention',
        trend: totalResponses === 0 ? 'neutral' :
          satisfactionRate > 75 ? 'up' : satisfactionRate > 50 ? 'neutral' : 'down',
        description: 'Percentage of employees satisfied with their role'
      },
      {
        title: 'Work-Life Balance',
        value: `${workLifeBalanceRate}%`,
        change: totalResponses === 0 ? 'No survey responses yet' :
          workLifeBalanceRate > 75 ? 'Good' : workLifeBalanceRate > 50 ? 'Fair' : 'Needs Attention',
        trend: totalResponses === 0 ? 'neutral' :
          workLifeBalanceRate > 75 ? 'up' : workLifeBalanceRate > 50 ? 'neutral' : 'down',
        description: 'Employees reporting good work-life balance'
      },
      {
        title: 'Growth Support',
        value: `${growthSupportRate}%`,
        change: totalResponses === 0 ? 'No survey responses yet' :
          growthSupportRate > 75 ? 'Good' : growthSupportRate > 50 ? 'Fair' : 'Needs Attention',
        trend: totalResponses === 0 ? 'neutral' :
          growthSupportRate > 75 ? 'up' : growthSupportRate > 50 ? 'neutral' : 'down',
        description: 'Employees feeling supported in their professional growth'
      }
    ]);
  };

  const handleReportGenerated = () => {
    // Refresh the responses and metrics after a new report is generated
    fetchResponses();
  };

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || loadingResponses) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="pt-24 pb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Here's an overview of your organization's performance insights.
          </p>
        </div>

        {/* Report Generator Section */}
        <div className="mb-8">
          <ReportGenerator onReportGenerated={handleReportGenerated} />
        </div>

        {/* Metrics Grid */}
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 truncate">
                      {metric.title}
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`
                    flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                    ${metric.trend === 'up' ? 'bg-green-100 text-green-800' : 
                      metric.trend === 'down' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}
                  `}>
                    {metric.change}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {metric.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Response Analysis Section */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Role Satisfaction Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role Satisfaction</h3>
            <ResponsChart
              responses={responses.map(r => r.answers[1] || 'No response')}
              question="How satisfied are you with your current role?"
            />
          </motion.div>

          {/* Work Style Preferences Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Work Style Preferences</h3>
            <ResponsChart
              responses={responses.map(r => r.answers[7] || 'No response')}
              question="Which working style suits you best?"
            />
          </motion.div>

          {/* Team Communication Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Communication</h3>
            <ResponsChart
              responses={responses.map(r => r.answers[3] || 'No response')}
              question="How would you describe the communication within your team?"
            />
          </motion.div>

          {/* Professional Growth Support Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Growth Support</h3>
            <ResponsChart
              responses={responses.map(r => r.answers[4] || 'No response')}
              question="Do you feel supported in your professional growth and development?"
            />
          </motion.div>
        </div>

        {/* Recent Responses Section */}
        <div className="mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Responses</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {responses.slice(0, 5).map((response) => (
                <div key={response.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {response.userEmail || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted {new Date(response.createdAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {response.answers[1] || 'No satisfaction data'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 