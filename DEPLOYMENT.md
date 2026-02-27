# Production Deployment Checklist

## Pre-Deployment
- [ ] Update `prisma/schema.prisma` datasource to PostgreSQL
- [ ] Set up production database (Neon/Supabase/Railway)
- [ ] Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- [ ] Create GitHub OAuth app (optional)
- [ ] Test all features locally with production database

## Environment Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Random secret key
- [ ] `NEXTAUTH_URL` - Production domain
- [ ] `GITHUB_ID` - GitHub OAuth client ID
- [ ] `GITHUB_SECRET` - GitHub OAuth secret
- [ ] `GEMINI_API_KEY` - Google Gemini API key (for AI analysis)

## Database Migration
```bash
# Update schema to PostgreSQL
npx prisma migrate deploy
npx prisma generate
```

## Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Then redeploy
vercel --prod
```

## Post-Deployment Testing
- [ ] Sign up with email
- [ ] Sign in with GitHub
- [ ] Add manual project
- [ ] Import from GitHub
- [ ] Generate AI Report on a project
- [ ] Re-analyze a project
- [ ] Add work experience
- [ ] Save job description
- [ ] Match projects to job
- [ ] Generate resume (all 5 templates)
- [ ] Test 1-page and 2-page modes
- [ ] Verify DOCX download works
- [ ] Test ATS scoring

## Production Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor database performance
- [ ] Check API response times
- [ ] Review user feedback
- [ ] Monitor GitHub API rate limits

## Security Checklist
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables secured
- [ ] Database connection encrypted
- [ ] User passwords hashed (bcrypt)
- [ ] CSRF protection enabled (NextAuth)
- [ ] Rate limiting on sensitive endpoints

## Performance Optimization
- [ ] Enable Vercel Analytics
- [ ] Optimize images (if any added)
- [ ] Review bundle size
- [ ] Check database query performance
- [ ] Enable caching where appropriate

## Documentation
- [ ] Update README with production URL
- [ ] Create user guide
- [ ] Document API endpoints
- [ ] Add troubleshooting guide
- [ ] Create video walkthrough (optional)

## Marketing & Launch
- [ ] Create landing page copy
- [ ] Prepare demo account
- [ ] Share on LinkedIn/Twitter
- [ ] Post on Reddit (r/resumes, r/jobs)
- [ ] Submit to Product Hunt
- [ ] Create blog post about features

---

**Deployment Status**: Ready for production ✅
**Estimated Setup Time**: 30-45 minutes
**Recommended Database**: Neon PostgreSQL (free tier)
**Recommended Hosting**: Vercel (free tier)
