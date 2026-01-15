import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Allowed emails for the developer team
const ALLOWED_EMAILS = [
  'leomcmillion@gmail.com',
  'vincent@lefevre.se',
];

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/orders(.*)',
  '/schedule(.*)',
  '/settings(.*)',
  '/api/((?!webhooks|health).*)',
]);

const isUnauthorizedPage = createRouteMatcher(['/unauthorized']);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  
  // Allow access to unauthorized page
  if (isUnauthorizedPage(request)) {
    return NextResponse.next();
  }
  
  // If user is signed in, check if their email is allowed
  if (userId) {
    // Clerk stores email in different places depending on configuration
    // Check common locations: email, primaryEmail, or nested in metadata
    const userEmail = (
      sessionClaims?.email ||
      sessionClaims?.primaryEmail ||
      sessionClaims?.unsafe_metadata?.email ||
      ''
    ).toLowerCase();
    
    // If we have an email, validate it
    if (userEmail) {
      const isAllowed = ALLOWED_EMAILS.some(
        email => email.toLowerCase() === userEmail
      );
      
      if (!isAllowed) {
        // Redirect unauthorized users
        const unauthorizedUrl = new URL('/unauthorized', request.url);
        return NextResponse.redirect(unauthorizedUrl);
      }
    }
  }
  
  // Protect routes that require authentication
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
