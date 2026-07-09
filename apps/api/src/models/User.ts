import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IDeveloperProfile {
  displayName: string;
  bio?: string;
  website?: string;
  registeredAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // optional — Google OAuth users won't have one until Phase 3
  role: "user" | "developer";
  isDeveloper: boolean;
  developerStatus: "none" | "pending" | "approved" | "rejected";
  developerProfile?: IDeveloperProfile;
  googleId?: string;
  avatar?: string;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const DeveloperProfileSchema = new Schema<IDeveloperProfile>(
  {
    displayName: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    website: { type: String, trim: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ["user", "developer"],
      default: "user",
    },
    isDeveloper: {
      type: Boolean,
      default: false,
    },
    developerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    developerProfile: {
      type: DeveloperProfileSchema,
      default: undefined,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving (only if modified)
UserSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare plain password with hashed
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
