import { clerkMiddleware } from '@clerk/nextjs/server';

// this Next.js version renamed `middleware` to `proxy`, but Clerk's
// handler is just a standard request handler, so it works the same here
export const proxy = clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
