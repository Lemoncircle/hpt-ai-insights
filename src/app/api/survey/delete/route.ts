import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { auth } from '@/lib/firebase';

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
    } catch (error: any) {
      console.error('Error deleting document:', error);
      return NextResponse.json(
        { error: 'Failed to delete response', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in delete endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
} 