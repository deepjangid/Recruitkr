import mongoose from 'mongoose';

const clientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    companyName: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    companyWebsite: { type: String, trim: true },
    companySize: { type: String, required: true },
    companyType: { type: String, required: true },
    spoc: {
      name: { type: String, required: true, trim: true },
      designation: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
    },
    commercial: {
      recruitmentModel: { type: String, required: true },
      replacementPeriod: { type: String, required: true },
      paymentTerms: { type: String, required: true },
    },
    billing: {
      billingCompanyName: { type: String, required: true, trim: true },
      gstNumber: { type: String, required: true, trim: true, uppercase: true },
      billingAddress: { type: String, required: true, trim: true },
      billingEmail: { type: String, required: true, lowercase: true, trim: true },
    },
    profileImage: {
      fileName: { type: String, trim: true, default: '' },
      mimeType: { type: String, trim: true, default: '' },
      size: { type: Number, default: 0 },
      data: { type: Buffer, select: false },
    },
    city: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    contactName: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    location: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    requirements: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    declarationAccepted: { type: Boolean, required: true },
  },
  { timestamps: true },
);

clientProfileSchema.index({ userId: 1 });
clientProfileSchema.index({ companyName: 1 });

export const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);

