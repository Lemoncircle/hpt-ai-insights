import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

interface DeleteError extends Error {
  code?: string;
  details?: string;
}

export async function DELETE(request: Request) {
  try {
    // Get the response ID from the request
    const { responseId } = await request.json();

    if (!responseId) {
      return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
    }

    // Get the authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Delete the document using admin SDK
      await adminDb.collection('survey_responses').doc(responseId).delete();
      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      const err = error as DeleteError;
      console.error('Error deleting document:', err);
      return NextResponse.json(
        { error: 'Failed to delete response', details: err.message || 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const err = error as DeleteError;
    console.error('Error in delete endpoint:', err);
    return NextResponse.json(
      { error: 'Failed to process request', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 