import { SubscriptionType } from '@subscription/interfaces/subscription.interface';
import * as z from 'zod';

export const updateSubscriptionPriceSchema = z.object({
    type: z.enum([SubscriptionType.GREGMAT, SubscriptionType.GREGMAT_PREPSWIFT]),
    price: z.number().nonnegative({ message: 'Price must be non-negative.' }),
});

export type UpdateSubscriptionPriceInput = z.infer<typeof updateSubscriptionPriceSchema>;
