const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    }
  }],
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: String,
      required: true
    },
    document: {
      type: String,
      default: ''
    }
  }],
  hourlyRate: {
    type: Number,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  teachingMode: {
    type: String,
    enum: ['online', 'in-person', 'both'],
    default: 'both'
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
      lowercase: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationComment: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add pre-find hooks
tutorSchema.pre('find', function(next) {
  this.populate('user', 'name email profilePicture');
  next();
});

tutorSchema.pre('findOne', function(next) {
  this.populate('user', 'name email profilePicture');
  next();
});

// Add error handling for missing user references
tutorSchema.post('find', function(docs, next) {
  if (!docs) return next();
  
  docs.forEach(doc => {
    if (!doc.user) {
      doc.user = {
        name: 'Unknown User',
        email: null,
        profilePicture: null
      };
    }
  });
  next();
});

tutorSchema.post('findOne', function(doc, next) {
  if (!doc) return next();
  
  if (!doc.user) {
    doc.user = {
      name: 'Unknown User',
      email: null,
      profilePicture: null
    };
  }
  next();
});

module.exports = mongoose.model('Tutor', tutorSchema);

