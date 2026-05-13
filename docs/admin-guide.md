# Admin Guide — Suzanne Ravenall Platform

This guide is for Suzanne and her team. No technical knowledge is required.
If something goes wrong that isn't covered here, contact Johan at Ai Dynamic Advisory.

---

## Contents

1. [Getting Started — Where to Find Everything](#1-getting-started)
2. [Managing Blog Posts (Payload CMS)](#2-managing-blog-posts)
3. [Managing Products (Medusa Admin)](#3-managing-products)
4. [Managing Members (Supabase)](#4-managing-members)
5. [Managing Bookings (Cal.com)](#5-managing-bookings)
6. [Email & Marketing](#6-email--marketing)
7. [Viewing Automation Logs (n8n)](#7-viewing-automation-logs)
8. [Common Issues & Solutions](#8-common-issues--solutions)
9. [Who to Contact for Help](#9-who-to-contact-for-help)

---

## 1. Getting Started

These are the four dashboards you'll use day-to-day. Bookmark them all.

| Dashboard | What it's for | URL |
|-----------|--------------|-----|
| **CMS (Payload)** | Write and publish blog posts, manage programmes and content | http://169.239.180.49/cms/admin |
| **Store Admin (Medusa)** | Manage products, view orders, process refunds | http://169.239.180.49/medusa |
| **Member Portal** | The site your members log in to | http://169.239.180.49/portal |
| **Automation (n8n)** | View and manage email and workflow automations | http://169.239.180.49:5678 |

**Logging in:**
- Each dashboard has its own login screen.
- Your login details were set up during the initial platform build.
- If you've forgotten a password, contact Johan — do not try to reset it yourself as some dashboards are linked.

---

## 2. Managing Blog Posts

Blog posts are written and managed in the **Payload CMS** (http://169.239.180.49/cms/admin).

### Creating a new blog post

1. Open the CMS and log in.
2. In the left sidebar, click **Blog Posts**.
3. Click the **Create New** button (top right).
4. Fill in the fields:

| Field | What to put here |
|-------|-----------------|
| **Title** | The headline of your post (e.g. "How to Break a Trauma Pattern in 5 Steps") |
| **Slug** | The URL-friendly version — the system fills this in automatically from your title. You can leave it as is or edit it (e.g. `how-to-break-trauma-pattern`). Only use lowercase letters, numbers, and hyphens. |
| **Author** | Select your name from the dropdown. |
| **Published Date** | Choose the date you want displayed on the post. |
| **Category** | Choose the most relevant category (e.g. Mindset, Trauma, Relationships). |
| **Excerpt** | 1–2 sentence summary shown in the blog listing. Keep it compelling. |
| **Featured Image** | The main image shown at the top of the post and in the listing. See below. |
| **Content** | The full body of your post. Use the rich text editor — it works like a Word document. |
| **Meta Description** | A 1–2 sentence summary for Google (different from the excerpt — write it as if you're explaining the post to a search engine). |

5. When you're ready, see **Publishing vs Draft** below.

### Adding images to a blog post

**Featured image (the main hero image):**
1. In the Featured Image field, click **Choose Image** or **Upload New**.
2. If uploading, click **Upload**, select your file, and click **Save**.
3. The image must be at least 1200px wide. JPG or PNG are both fine.

**Images within the post body:**
1. In the Content editor, place your cursor where you want the image.
2. Click the image icon in the editor toolbar.
3. Upload a new image or choose one from the library.

### Publishing vs saving as draft

- **Save as Draft** — The post is saved but not visible on the website yet. Use this to work in progress.
- **Publish** — The post goes live on the website immediately.

To set the status:
1. Look for the **Status** dropdown near the top right of the editing screen.
2. Select **Draft** or **Published**.
3. Click **Save** (or **Save & Publish** if prompted).

### Editing an existing post

1. In the CMS, click **Blog Posts** in the sidebar.
2. Find your post in the list and click its title.
3. Make your changes.
4. Click **Save** at the top right.

The updated post appears on the website immediately (or remains as draft if status is Draft).

### Deleting a post

1. Go to **Blog Posts** in the sidebar.
2. Hover over the post row — a checkbox appears on the left.
3. Tick the checkbox.
4. Click the **Delete** button that appears at the top of the list.
5. Confirm the deletion.

> **Caution:** Deleting a post is permanent. If you're unsure, save it as a Draft instead of deleting.

---

## 3. Managing Products

Products (programmes, courses, coaching packages) are managed in the **Medusa Admin** (http://169.239.180.49/medusa).

### Updating a product price

1. In Medusa Admin, click **Products** in the left sidebar.
2. Search for or scroll to find the product.
3. Click the product name to open it.
4. Scroll down to **Variants**.
5. Click the **Edit** (pencil) icon next to the variant whose price you want to change.
6. Update the **Price** field (enter the amount in Rands, e.g. `2500`).
7. Click **Save**.

The new price appears on the website immediately.

### Adding a new product variant

A "variant" is a version of a product (e.g. different payment plans, or live vs. recording).

1. Open the product in Medusa Admin.
2. Scroll to **Variants** and click **Add Variant**.
3. Fill in the variant title (e.g. "3-Month Payment Plan"), SKU, and price.
4. Click **Save**.

> If you need a completely new product added (not just a variant), contact Johan — new products need to be set up correctly in the system.

### Unpublishing a product

"Unpublishing" hides a product from the shop without deleting it.

1. Open the product in Medusa Admin.
2. Look for the **Status** field near the top of the product details.
3. Change it from **Published** to **Draft**.
4. Click **Save**.

The product disappears from the shop. You can re-publish it the same way.

### Viewing orders

1. Click **Orders** in the left sidebar of Medusa Admin.
2. You'll see a list of all orders with the customer name, date, amount, and status.
3. Click any order to see the full details (products ordered, delivery status, payment details).
4. Use the search bar at the top to find a specific customer by name or email.

### Processing a refund

1. Find the order in **Orders** (see above).
2. Open the order details.
3. Scroll to **Payment** and click **Refund**.
4. Enter the refund amount (or leave it at the full amount for a full refund).
5. Add a note explaining the reason.
6. Click **Confirm Refund**.

> The refund goes back to the customer via PayFast (for South African payments) or PayPal (for international payments). It typically takes 3–5 business days to appear in the customer's account.

---

## 4. Managing Members

Member accounts are managed through **Supabase**, which is the database and login system behind the member portal.

Supabase dashboard: https://supabase.com/dashboard/project/mjhwonoekokxyisfljtj

> **Note:** Supabase is more technical than the other dashboards. For most member management tasks, ask Johan to assist. The steps below cover the most common day-to-day tasks.

### Finding a member's account

1. Open the Supabase dashboard and log in.
2. Click **Authentication** in the left sidebar.
3. Click **Users**.
4. Use the search box to search by email address.
5. Click the user to see their account details.

### Manually upgrading a member's tier

If a member has paid but their portal access hasn't updated:

1. In Supabase, click **Table Editor** in the left sidebar.
2. Select the `member_subscriptions` table.
3. Use the search/filter to find the row for the member's user ID (you can get their user ID from the Users list under Authentication).
4. In their row, update the `tier` column to the correct value:
   - `free` — Free tier
   - `silver` — Silver membership
   - `gold` — Gold membership
   - `practitioner` — Practitioner tier
5. Also update `status` to `active` and set `expires_at` to the correct expiry date.
6. Click **Save**.

> For payment issues, always check with PayFast or PayPal first to confirm payment was received before upgrading access.

### Resetting a member's password

1. Go to Supabase → **Authentication** → **Users**.
2. Find the member by email.
3. Click their account.
4. Click **Send Password Recovery Email**.
5. The member will receive a password reset link in their inbox.

Alternatively, tell the member to go to http://169.239.180.49/portal/forgot-password and enter their email address — this sends the reset email automatically.

### Viewing a member's subscription status

1. In Supabase, go to **Table Editor** → `member_subscriptions`.
2. Filter by `user_id` (from the Authentication → Users list).
3. You'll see their current tier, status (active/expired), and expiry date.

---

## 5. Managing Bookings

Bookings (discovery calls, coaching sessions) are managed in **Cal.com**.

Cal.com dashboard: http://169.239.180.49:3002

### Viewing upcoming bookings

1. Log in to Cal.com.
2. The **Bookings** tab in the top navigation shows all upcoming bookings.
3. Click any booking to see the details — the client's name, email, the time, and any notes they submitted.

### Blocking time in the calendar

If you want to block off time so clients can't book:

1. In Cal.com, click **Availability** in the left sidebar.
2. You can either:
   - Edit your regular working hours (for ongoing changes), or
   - Click **Add a date override** to block specific days or times.
3. Save your changes.

### Adding a new event type

An "event type" is a type of booking (e.g. "30-min Discovery Call" or "90-min Coaching Session").

1. In Cal.com, click **Event Types** in the left sidebar.
2. Click **New Event Type**.
3. Fill in the title, duration, description, and any questions you want to ask clients.
4. Set the availability (which hours clients can book this type of session).
5. Click **Create**.

The new booking type will appear on your public booking page automatically.

---

## 6. Email & Marketing

### Viewing email sending history in Resend

All transactional emails (order confirmations, welcome emails, cart reminders) are sent via **Resend**.

1. Log in to [Resend](https://resend.com) using the Ai Dynamic Advisory account.
2. Click **Emails** in the sidebar.
3. You'll see a list of all sent emails with the status: **Delivered**, **Bounced**, or **Opened**.

### Checking if an email was delivered

1. In Resend → Emails, search by the recipient's email address.
2. If the status shows **Delivered**, the email reached their inbox.
3. If it shows **Bounced**, the email address may be invalid — contact the client to confirm their email.
4. If the email isn't listed at all, it may not have been triggered yet (e.g. the cart hasn't been abandoned for long enough).

### Pausing cart abandonment emails (n8n)

If you need to pause cart abandonment emails temporarily (e.g. during a sale or system maintenance):

1. Open n8n at http://169.239.180.49:5678.
2. Find the **Cart Abandonment Recovery** workflow in the list.
3. Click the toggle switch next to the workflow name to turn it off (it will turn grey when inactive).
4. Turn it back on the same way when you're ready.

> Let Johan know any time you pause a workflow, so he can confirm it's back on when you're done.

### How Vibe Marketing connects

Vibe Marketing is the AI-powered marketing system built by Ai Dynamic Advisory. It receives data from your platform in two ways:

1. **Lead magnet signups** — When someone downloads a free resource from your website, their email and first name are automatically sent to Vibe Marketing, which triggers a nurture sequence.
2. **New customers** — When someone completes their first purchase, their details are sent to Vibe Marketing to trigger a customer welcome sequence.

You don't need to manage this manually — it runs automatically. If you want to change the nurture sequences or add new ones, contact Johan.

---

## 7. Viewing Automation Logs (n8n)

n8n is the automation engine that runs all background workflows (emails, CRM updates, Sage sync, etc.).

Dashboard: http://169.239.180.49:5678

### Checking if workflows are running

1. Log in to n8n.
2. Click **Workflows** in the left sidebar.
3. Each workflow shows a status indicator:
   - **Green toggle** = Active (running automatically on its schedule)
   - **Grey toggle** = Inactive (paused)
4. Check that all the workflows in the table below are active.

### Manually triggering a workflow

Some workflows can be triggered manually (useful for testing or re-running after a failure):

1. Open the workflow by clicking its name.
2. Click the **Execute Workflow** button (top right).
3. The workflow runs immediately — you can watch each step turn green or red.

### Investigating a failed workflow

1. Click **Executions** in the left sidebar.
2. Look for executions with a **red X** (failed) status.
3. Click the failed execution to see which step failed and why.
4. If the error message mentions a credential or connection issue, contact Johan.

### Workflows that run automatically

| Workflow | What it does | When it runs |
|----------|-------------|--------------|
| **Cart Abandonment Recovery** | Sends 3 follow-up emails to customers who left items in their cart | Triggered immediately when a cart is abandoned; emails go out at 1h, 24h, and 72h |
| **Membership Renewal Check** | Sends a reminder email to members whose membership expires in 7 days | Every day at 9:00 AM (South African time) |
| **Membership Expiry Check** | Marks memberships as expired and sends the expiry email | Every day at 9:00 AM (South African time) |
| **Medusa Order → Vtiger** | Creates a contact and activity in the CRM when a new order is placed | Triggered on every new order |
| **Cal.com Booking → Vtiger** | Logs a discovery call booking in the CRM | Triggered when a booking is made via Cal.com |
| **Lead Magnet → Vtiger** | Adds a new lead to the CRM when someone downloads a free resource | Triggered on each lead magnet submission |
| **Medusa Order → Sage** | Creates a tax invoice in Sage Business Cloud for each new order | Triggered on every new order |
| **Sage Invoice Sync** | Checks for orders that didn't get a Sage invoice and alerts the admin | Every morning at 6:00 AM (South African time) |
| **Weekly Report** | Sends a weekly summary of new members, revenue, and video views | Every Monday at 10:00 AM (South African time) |
| **Bunny Video Access Log** | Records which member watched which video | Triggered each time a member plays a video |
| **Vibe Marketing Sync Monitor** | Monitors the connection to Vibe Marketing and alerts if it fails | Triggered on each Vibe Marketing sync attempt |

---

## 8. Common Issues & Solutions

### "A member can't log in"

1. Ask the member to check their spam folder for the confirmation email (sent when they first signed up).
2. Ask them to try the **Forgot Password** link at http://169.239.180.49/portal/forgot-password.
3. If they still can't log in, go to Supabase → Authentication → Users and check:
   - Is their email address listed? (If not, they may not have completed signup.)
   - Is their account status **Active**?
4. If their account exists but is locked or inactive, contact Johan.

### "A payment didn't go through"

1. Ask the member which payment method they used (PayFast = South African card, PayPal = international).
2. For PayFast issues: log in to the PayFast merchant account at https://www.payfast.co.za and check the transaction history.
3. For PayPal issues: log in to the PayPal Business account and check recent transactions.
4. If the payment shows as successful in PayFast/PayPal but the order doesn't appear in Medusa Admin, contact Johan — there may be a webhook delivery issue.
5. If the payment failed at the gateway, the member will need to try again. They can go back to the shop and attempt checkout again.

### "A blog post isn't showing"

1. Log in to the CMS at http://169.239.180.49/cms/admin.
2. Find the post and check its **Status** field:
   - Is it set to **Published**? (Draft posts don't appear on the website.)
3. Check the **Published Date** — posts dated in the future won't show until that date arrives.
4. If the status is Published and the date is correct but the post still isn't visible, contact Johan.

### "An email wasn't received"

1. Ask the member to check their spam/junk folder.
2. Go to Resend (https://resend.com) and search for their email address in the **Emails** section.
3. Check the delivery status:
   - **Delivered** = it reached their inbox — they should check spam.
   - **Bounced** = invalid email address — ask the member to confirm their email.
   - Not listed at all = the email may not have been triggered. Contact Johan to investigate.
4. If the member is a Gmail user and the email went to spam, ask them to mark it as "not spam" — this trains Gmail to accept future emails.

### "Site seems slow"

If the website feels significantly slower than usual:

1. First check if it's your internet connection — try loading a different website.
2. If other sites are fine, note what time it happened and contact Johan.
3. Do not restart any Docker containers yourself — this can cause data issues.

---

## 9. Who to Contact for Help

### Technical issues

**Johan Dercksen — Ai Dynamic Advisory**

- Email: [placeholder — Johan to add contact details]
- Phone: [placeholder — Johan to add contact details]
- Response time: Within 1 business day for normal issues; same day for critical issues (site down, payment failures)

**What counts as a critical issue:**
- The website is completely down or showing an error page
- Members cannot log in at all
- Payments are failing for all customers
- A security concern (suspected hacking, data breach)

**What can wait:**
- Blog post formatting questions
- Minor display issues
- Feature requests

### Content questions

For questions about what content to add to the website (copy, images, programmes):
- This is Suzanne's team — handle internally.

### Payment disputes

- **PayFast (South African payments):** https://www.payfast.co.za/support — or call their support line.
- **PayPal (international payments):** https://www.paypal.com/za/smarthelp/home

> For chargebacks and disputes, always refer to your PayFast/PayPal merchant agreement. Contact Johan if you need help pulling transaction records from the system.

---

*Document version: Phase 4 complete — May 2026*
*Prepared by Ai Dynamic Advisory for Dr. Suzanne Ravenall*
