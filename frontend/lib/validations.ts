import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  businessName: z.string().min(2),
  businessType: z.string().min(2),
  address: z.string().min(5),
  gstNumber: z.string().optional(),
  upiId: z.string().optional(),
});
