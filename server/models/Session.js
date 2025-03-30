const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["online", "in-person"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    subject: {
      type: String,
      required: true,
    },
    location: String,
    notes: String,
    price: {
      type: Number,
      required: true,
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
sessionSchema.index({ student: 1, status: 1, reviewed: 1 });

// Add pre-save middleware to validate ObjectIds
sessionSchema.pre('save', function(next) {
  if (this.student && !mongoose.Types.ObjectId.isValid(this.student)) {
    next(new Error('Invalid student ID'));
    return;
  }
  if (this.tutor && !mongoose.Types.ObjectId.isValid(this.tutor)) {
    next(new Error('Invalid tutor ID'));
    return;
  }
  next();
});

// Add pre-save middleware to create notifications
sessionSchema.pre('save', async function(next) {
  try {
    if (this.isModified('status')) {
      const notification = await mongoose.model('Notification').create({
        recipient: this.status === 'pending' ? this.tutor : this.student,
        sender: this.status === 'pending' ? this.student : this.tutor,
        type: 'session-update',
        message: `Session ${this.status}`,
        relatedId: this._id,
        onModel: 'Session'
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Session", sessionSchema);

