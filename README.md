# Beef Boys Register

Cash register for Beef Boys, built with Next.js and Supabase.

- `/` Register: add items, enter the customer and payment method, then complete the order
- `/orders` All orders, with total, cash and online sums
- `/serving` Kitchen queue (first in, first served) with live item counts

## Setup

1. In the Supabase dashboard, open **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.
2. Set the prices in `lib/menu.ts` (`price` for each item and `MEAL_PRICE`).
3. `npm install` then `npm run dev`, and open http://localhost:3000.

## Deploy to Vercel

Import the project into Vercel and add these environment variables (they come from `.env`, which is not committed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Menu images are served from `public/menu_items/`.
