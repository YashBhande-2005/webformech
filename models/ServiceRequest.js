const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  customer: {
    name: {
      type: String,
      required: [true, 'Please add customer name']
    },
    email: {
      type: String,
      required: [true, 'Please add customer email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Please add customer phone']
    }
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please add service address']
    },
    city: {
      type: String,
      required: [true, 'Please add city']
    },
    state: {
      type: String,
      required: [true, 'Please add state']
    },
    zipCode: {
      type: String,
      required: [true, 'Please add zip code']
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  serviceType: {
    type: String,
    required: [true, 'Please add service type'],
    enum: [
      'engine-repair',
      'brake-service',
      'oil-change',
      'tire-repair',
      'battery-service',
      'transmission',
      'electrical',
      'ac-heating',
      'other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Please add service description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  vehicleInfo: {
    make: {
      type: String,
      required: [true, 'Please add vehicle make']
    },
    model: {
      type: String,
      required: [true, 'Please add vehicle model']
    },
    year: {
      type: Number,
      required: [true, 'Please add vehicle year']
    },
    licensePlate: String,
    vin: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  acceptedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Mechanic'
  },
  estimatedCost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  actualCost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  scheduledDate: Date,
  completedDate: Date,
  notes: [{
    message: String,
    addedBy: {
      type: String,
      enum: ['customer', 'mechanic']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  review: {
    type: String,
    maxlength: [500, 'Review cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);



