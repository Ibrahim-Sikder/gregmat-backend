import { SubscriptionType } from '@subscription/interfaces/subscription.interface';
import * as z from 'zod';

export const createSubscriptionRequestSchema = z.object({
    type: z.enum([SubscriptionType.GREGMAT, SubscriptionType.GREGMAT_PREPSWIFT]),
    message: z.string().max(1000, { message: 'Message cannot exceed 1000 characters.' }).optional(),
});

export const createSubscriptionSchema = z.object({
    userId: z.string().nonempty({ message: 'User ID is required.' }),
    type: z.enum([SubscriptionType.GREGMAT, SubscriptionType.GREGMAT_PREPSWIFT]),
    price: z.number().nonnegative({ message: 'Price must be non-negative.' }),
    startDate: z.coerce.date().optional(),
});

export const approveSubscriptionRequestSchema = z.object({
    price: z.number().nonnegative({ message: 'Price must be non-negative.' }),
});

export const renewSubscriptionSchema = z.object({
    price: z.number().nonnegative({ message: 'Price must be non-negative.' }).optional(),
});

export const updateSubscriptionStatusSchema = z.object({
    status: z.enum(['active', 'expired', 'cancelled']),
});

export const updateSubscriptionPriceSchema = z.object({
    price: z.number().nonnegative({ message: 'Price must be non-negative.' }),
});

export const updateSubscriptionTypeSchema = z.object({
    type: z.enum([SubscriptionType.GREGMAT, SubscriptionType.GREGMAT_PREPSWIFT]),
});

export type CreateSubscriptionRequestInput = z.infer<typeof createSubscriptionRequestSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type ApproveSubscriptionRequestInput = z.infer<typeof approveSubscriptionRequestSchema>;
export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>;
export type UpdateSubscriptionStatusInput = z.infer<typeof updateSubscriptionStatusSchema>;
export type UpdateSubscriptionPriceInput = z.infer<typeof updateSubscriptionPriceSchema>;
export type UpdateSubscriptionTypeInput = z.infer<typeof updateSubscriptionTypeSchema>;
