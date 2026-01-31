# MongoDB Migration Guide

This guide will help you migrate from PostgreSQL to MongoDB and set up the new Profile Maker feature.

## Prerequisites

- MongoDB instance (MongoDB Atlas or self-hosted)
- Your MongoDB connection URI
- Existing PostgreSQL data (optional, for migration)

## Step 1: Update Environment Variables

1. Add your MongoDB URI to `/backend/.env`:

```bash
# Add this line with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/randy?retryWrites=true&w=majority

# Keep your PostgreSQL URL temporarily for migration (if you have existing data)
DATABASE_URL_POSTGRES=postgresql://localhost:5432/randy
```

2. Get your MongoDB URI:
   - **MongoDB Atlas**: Login → Select Cluster → Connect → Connect your application → Copy connection string
   - **Self-hosted**: `mongodb://localhost:27017/randy`

## Step 2: Run the Migration (Optional)

If you have existing PostgreSQL data to migrate:

```bash
cd backend
node scripts/migrate-to-mongodb.js
```

This will migrate:
- Calls → `calls` collection
- Transcripts → `transcripts` collection
- Settings → `settings` collection
- Profile files (`.txt`) → `profiles` collection

## Step 3: Start the Application

```bash
# Backend (from /backend directory)
npm start

# Frontend (from /frontend directory)
npm start
```

The application will now use MongoDB instead of PostgreSQL.

## Step 4: Verify Migration

1. **Check MongoDB data:**
   - Use MongoDB Compass or Atlas web UI
   - Connect to your database
   - Verify collections: `calls`, `transcripts`, `settings`, `profiles`

2. **Test the application:**
   - Visit the dashboard
   - Check that old calls are visible
   - Make a test call to verify new calls are saved

## Using Profile Maker

### Creating a Profile via UI

1. Navigate to **🔖 Profile Maker** tab
2. Enter phone number (any format):
   - `(510) 301-5242`
   - `510-301-5242`
   - `+15103015242`
3. Choose source type:
   - **📎 URL**: Paste a LinkedIn profile, website, etc.
   - **📝 Text**: Paste information about the caller
4. Click **✨ Generate Profile**
5. AI will create a structured profile automatically

### Creating a Profile via MongoDB

**Option 1: MongoDB Compass (GUI)**
1. Open MongoDB Compass
2. Connect to your database
3. Select `profiles` collection
4. Click "Add Data" → "Insert Document"
5. Paste:

```json
{
  "phoneNumber": "+15103015242",
  "profileContent": "Caller: John Doe\nContext:\n- Software engineer\n- Previous caller about car warranty\n\nStrategy:\n- Engage with technical discussion\n- Waste their time",
  "sourceType": "manual",
  "sourceData": null,
  "createdAt": { "$date": "2024-01-30T12:00:00.000Z" },
  "updatedAt": { "$date": "2024-01-30T12:00:00.000Z" }
}
```

**Option 2: MongoDB Shell (mongosh)**
```bash
mongosh "mongodb+srv://cluster.mongodb.net/randy"

db.profiles.insertOne({
  phoneNumber: "+15103015242",
  profileContent: "Caller: John Doe\nContext:\n- Spam caller\n\nStrategy:\n- Waste time",
  sourceType: "manual",
  sourceData: null,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Option 3: Node.js Script**
```javascript
const { connectDB, Profile } = require('./backend/db/mongodb');

async function addProfile() {
  await connectDB();

  await Profile.create({
    phoneNumber: '+15103015242',
    profileContent: 'Caller: John Doe...',
    sourceType: 'manual',
    sourceData: null
  });

  console.log('Profile added!');
  process.exit(0);
}

addProfile();
```

### Viewing Profiles

**MongoDB Compass:**
```
1. Connect to database
2. Click "profiles" collection
3. Browse/search documents
```

**MongoDB Shell:**
```bash
# View all profiles
db.profiles.find()

# View specific profile
db.profiles.findOne({ phoneNumber: "+15103015242" })

# Search by partial number
db.profiles.find({ phoneNumber: /5103015242/ })
```

**Profile Maker UI:**
- Navigate to 🔖 Profile Maker tab
- View list of all profiles
- Click "👁️ View" to see full profile

## Phone Number Format

The system normalizes all phone numbers to E.164 format (+1XXXXXXXXXX):

**Accepted Input Formats:**
- `5103015242` → `+15103015242`
- `(510) 301-5242` → `+15103015242`
- `510-301-5242` → `+15103015242`
- `+15103015242` → `+15103015242`
- `15103015242` → `+15103015242`

**Important:** All profiles are stored and queried using +1 prefix for US numbers.

## API Endpoints

### Get all profiles
```bash
GET /api/profiles
```

### Get specific profile
```bash
GET /api/profiles/:phoneNumber
# Example: GET /api/profiles/+15103015242
```

### Create profile
```bash
POST /api/profiles
Content-Type: application/json

{
  "phoneNumber": "510-301-5242",
  "source": "https://linkedin.com/in/...",
  "sourceType": "url"
}
```

### Update profile
```bash
PUT /api/profiles/:phoneNumber
Content-Type: application/json

{
  "source": "Updated info...",
  "sourceType": "text"
}
```

### Delete profile
```bash
DELETE /api/profiles/:phoneNumber
```

## Troubleshooting

### Connection Error
```
Error: MONGODB_URI is not defined
```
**Solution:** Add `MONGODB_URI` to your `.env` file

### Migration Fails
```
Error connecting to PostgreSQL
```
**Solution:**
- Check `DATABASE_URL_POSTGRES` in `.env`
- If no existing data, skip migration step

### Profile Not Loading During Call
**Solution:**
- Verify phone number format matches exactly (+1XXXXXXXXXX)
- Check MongoDB `profiles` collection
- Review server logs for errors

## Cleanup (After Successful Migration)

Once everything works with MongoDB:

1. **Remove PostgreSQL dependency:**
```bash
cd backend
npm uninstall pg
```

2. **Archive old database file:**
```bash
# The old PostgreSQL version is backed up as:
# backend/db/index.postgres.backup.js
```

3. **Update Heroku config:**
```bash
heroku config:set MONGODB_URI="your-mongodb-uri" -a your-app-name
heroku config:unset DATABASE_URL -a your-app-name
```

## MongoDB Management Tools

**Recommended Tools:**
1. **MongoDB Compass** (GUI) - https://www.mongodb.com/products/compass
2. **MongoDB Atlas** (Web UI) - https://cloud.mongodb.com
3. **mongosh** (CLI) - `brew install mongosh`
4. **Studio 3T** (Advanced GUI) - https://studio3t.com

## Profile Generation Features

### URL Scraping
- Supports LinkedIn, personal websites, company pages
- Automatically extracts text content
- Removes navigation, scripts, ads

### AI Profile Generation
- Uses OpenAI GPT to create structured profiles
- Formats: Caller, Context, Known Details, Strategy, Notes
- Maintains consistency across all profiles

### Manual Profiles
- Create directly via UI or database
- Full control over content
- Useful for quick additions

## Next Steps

1. ✅ Migration complete
2. 🧪 Test Profile Maker with a URL
3. 📞 Make a test call to verify profile loading
4. 🎯 Create profiles for common spam callers
5. 🚀 Deploy to Heroku with new MongoDB config

## Support

For issues or questions:
1. Check server logs: `heroku logs --tail`
2. Verify MongoDB connection in Compass
3. Review migration script output
