const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../model/user.model");
const logger = require("../utils/logger");

/**
 * Configure Passport with Google OAuth 2.0 strategy.
 * Call initPassport() once from server.js before routes are registered.
 *
 * Flow:
 *  1. User clicks "Continue with Google" → GET /api/auth/google
 *  2. Google redirects to /api/auth/google/callback with a `code`
 *  3. Passport exchanges code for profile, verify() runs
 *  4. We upsert the User document and call done(null, user)
 *  5. The auth.controller googleCallback() issues a JWT and
 *     redirects the browser back to the frontend with the token
 *     in the query string (frontend reads it once and stores it).
 */
const initPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                      "http://localhost:5000/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email in Google profile"), null);

          // Check if user already exists by googleId OR email
          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (user) {
            // Attach / update googleId if they previously registered with email
            if (!user.googleId) {
              user.googleId = profile.id;
              user.avatar   = profile.photos?.[0]?.value || user.avatar;
              await user.save({ validateBeforeSave: false });
            }
          } else {
            // New user — register via Google
            // First-ever user in the DB becomes admin
            const userCount = await User.countDocuments();
            user = await User.create({
              googleId:   profile.id,
              name:       profile.displayName,
              email,
              avatar:     profile.photos?.[0]?.value || "",
              role:       userCount === 0 ? "admin" : "user",
              provider:   "google",
              // password is not set for OAuth users
            });
            logger.info(`New Google user registered: ${email}`);
          }

          user.lastLogin = new Date();
          await user.save({ validateBeforeSave: false });

          return done(null, user);
        } catch (err) {
          logger.error(`Google OAuth verify error: ${err.message}`);
          return done(err, null);
        }
      }
    )
  );

  // We use JWT (stateless) so we only need minimal session serialization
  // Sessions are used only for the OAuth redirect round-trip
  passport.serializeUser((user, done) => done(null, user._id.toString()));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

module.exports = { initPassport };
