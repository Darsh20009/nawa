const transform = (_doc: unknown, ret: any) => {
  ret.id = ret._id?.toString();
  delete ret._id;
  return ret;
};

export const baseOptions = {
  timestamps: true as const,
  toJSON: { virtuals: true, versionKey: false, transform },
  toObject: { virtuals: true, versionKey: false, transform },
};
