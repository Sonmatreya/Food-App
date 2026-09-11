const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const {
  googleClientId,
  googleClientSecret,
  googleCallbackUrl,
} = require("./env");

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;

        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value.toLowerCase()
            : null;

        const name =
          profile.displayName ||
          profile.name?.givenName ||
          "Google User";

        const profileImage =
          profile.photos && profile.photos.length > 0
            ? profile.photos[0].value
            : "";

        // Google account must have an email
        if (!email) {
          return done(null, false);
        }

        // Check if Google account already exists
        let user = await User.findOne({ googleId });

        if (user) {
          return done(null, user);
        }

        // Check whether this email already belongs
        // to an existing email/password account
        const existingEmailUser = await User.findOne({ email });

        if (existingEmailUser) {
          return done(null, false);
        }

        // Create a new Google user
        user = await User.create({
          name: name.trim(),
          email,
          googleId,
          profileImage,
          isVerified: true,
        });

        return done(null, user);
      } catch (error) {
        console.error("Google authentication error:", error.message);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
