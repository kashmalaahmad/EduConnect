const mongoose = require("mongoose")

const wishlistSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor", // Changed from User to Tutor
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Add index for better performance and to ensure uniqueness
wishlistSchema.index({ student: 1, tutor: 1 }, { unique: true })

module.exports = mongoose.model("Wishlist", wishlistSchema)

