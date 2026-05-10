const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../model/user.model");
const logger = require("../utils/logger")
const initPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                      "http://localhost:3000/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email in Google profile"), null);

          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              user.avatar   = profile.photos?.[0]?.value || user.avatar;
              await user.save({ validateBeforeSave: false });
            }
          } else {
            const userCount = await User.countDocuments();
            user = await User.create({
              googleId:   profile.id,
              name:       profile.displayName,
              email,
              avatar:     profile.photos?.[0]?.value || "",
              role:       userCount === 0 ? "admin" : "user",
              provider:   "google",
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
