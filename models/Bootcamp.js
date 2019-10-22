const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const BootcampSchema = new mongoose.Schema({
  name: {
    required: [true, 'Name is required'],
    type: String,
    unique: true,
    trim: true,
    maxLength: [50, 'Name can not be more than 50 characters long']
  },
  slug: String,
  description: {
    required: [true, 'Description is required'],
    type: String,
    maxLength: [500, 'Name can not be more than 500 characters long']
  },
  website: {
    type: String,
    //match: [/https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)/, 'Please use valid URL']
  },
  phone: {
    type: String,
    maxLength: [20, 'Phone number can not be longer than 20 characters']
  },
  email: {
    type: String
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      //required: true
    },
    coordinates: {
      type: [Number],
      //required: true,
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  careers: {
    type: [String],
    required: true,
    enum: [
      "Mobile Development",
      "Web Development",
      "Data Science",
      "Business",
      "UI/UX",
      "Other"
    ]
  },
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating must can not be more than 10']
  },
  averageCost: Number,
  photo: {
    type: String,
    default: 'no-photo.jpg'
  },
  housing: {
    type: Boolean,
    default: false
  },
  jobAssistance: {
    type: Boolean,
    default: false
  },
  jobGuarantee: {
    type: Boolean,
    default: false
  },
  acceptGi: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

BootcampSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

BootcampSchema.pre('save', async function (next) {
  const loc = await geocoder.geocode(this.address);
  
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  };
  
  this.address = undefined;
  next();
});

// Cascade delete courses when a bootcamp is deleted
BootcampSchema.pre('remove', async function (next) {
  await this.model('Course').deleteMany({ bootcamp: this._id });
  next();
});

// Revese populate with virtuals
BootcampSchema.virtual('courses',{
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp',
  justOne: false
});

module.exports = mongoose.model('Bootcamp', BootcampSchema);

// /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i